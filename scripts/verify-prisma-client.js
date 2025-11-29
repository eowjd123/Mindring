const { PrismaClient } = require('@prisma/client');

async function verify() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== Prisma 클라이언트 확인 ===\n');
    
    // 모든 모델 확인
    const models = Object.keys(prisma).filter(
      key => !key.startsWith('_') && 
             !key.startsWith('$') && 
             typeof prisma[key] === 'object' &&
             prisma[key] !== null &&
             'findMany' in prisma[key]
    );
    
    console.log('발견된 모델들:');
    models.forEach(model => {
      console.log(`  ✓ ${model}`);
    });
    
    console.log(`\n총 ${models.length}개 모델 발견\n`);
    
    // PuzzleRecord 모델 확인
    if (prisma.puzzleRecord) {
      console.log('✅ PuzzleRecord 모델이 존재합니다!');
      
      // 테이블 존재 확인
      try {
        const count = await prisma.puzzleRecord.count();
        console.log(`✅ PuzzleRecord 테이블에 ${count}개의 레코드가 있습니다.`);
      } catch (err) {
        console.log('⚠️ PuzzleRecord 테이블에 접근할 수 없습니다:', err.message);
      }
    } else {
      console.log('❌ PuzzleRecord 모델을 찾을 수 없습니다!');
      console.log('\n해결 방법:');
      console.log('1. npx prisma generate 실행');
      console.log('2. Next.js 개발 서버 재시작');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('오류 발생:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

verify();

