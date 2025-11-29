const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Prisma PuzzleRecord 모델 수정 시작 ===\n');

// 1. Prisma 클라이언트 폴더 삭제
const prismaClientPath = path.join(process.cwd(), 'node_modules', '.prisma');
if (fs.existsSync(prismaClientPath)) {
  console.log('1. 기존 Prisma 클라이언트 삭제 중...');
  try {
    fs.rmSync(prismaClientPath, { recursive: true, force: true });
    console.log('   ✓ 삭제 완료\n');
  } catch (err) {
    console.log('   ⚠️ 삭제 실패 (무시 가능):', err.message, '\n');
  }
} else {
  console.log('1. Prisma 클라이언트 폴더가 없습니다.\n');
}

// 2. Prisma 스키마 검증
console.log('2. Prisma 스키마 검증 중...');
try {
  execSync('npx prisma validate', { stdio: 'inherit' });
  console.log('   ✓ 스키마 검증 완료\n');
} catch (err) {
  console.log('   ❌ 스키마 검증 실패\n');
  process.exit(1);
}

// 3. Prisma 클라이언트 생성
console.log('3. Prisma 클라이언트 생성 중...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('   ✓ 클라이언트 생성 완료\n');
} catch (err) {
  console.log('   ❌ 클라이언트 생성 실패\n');
  process.exit(1);
}

// 4. 데이터베이스에 스키마 적용
console.log('4. 데이터베이스에 스키마 적용 중...');
try {
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  console.log('   ✓ 데이터베이스 스키마 적용 완료\n');
} catch (err) {
  console.log('   ⚠️ 데이터베이스 스키마 적용 실패 (무시 가능):', err.message, '\n');
}

// 5. 확인
console.log('5. PuzzleRecord 모델 확인 중...');
try {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  if (prisma.puzzleRecord) {
    console.log('   ✅ PuzzleRecord 모델이 존재합니다!\n');
    prisma.$disconnect();
  } else {
    console.log('   ❌ PuzzleRecord 모델을 찾을 수 없습니다!\n');
    console.log('   ⚠️ Next.js 개발 서버를 재시작해주세요.\n');
    prisma.$disconnect();
  }
} catch (err) {
  console.log('   ⚠️ 확인 실패:', err.message, '\n');
  console.log('   ⚠️ Next.js 개발 서버를 재시작해주세요.\n');
}

console.log('=== 완료 ===');
console.log('\n다음 단계:');
console.log('1. Next.js 개발 서버를 재시작하세요 (Ctrl+C 후 npm run dev)');
console.log('2. 브라우저에서 /puzzle-home/rankings 페이지를 새로고침하세요');

