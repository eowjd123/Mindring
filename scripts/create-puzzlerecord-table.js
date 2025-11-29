const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTable() {
  try {
    console.log('=== PuzzleRecord 테이블 생성 시작 ===\n');
    
    // 먼저 테이블이 존재하는지 확인
    try {
      const result = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_schema = DATABASE() AND table_name = 'PuzzleRecord'
      `;
      const exists = result[0]?.count > 0;
      
      if (exists) {
        console.log('⚠️ PuzzleRecord 테이블이 이미 존재합니다.\n');
        const count = await prisma.puzzleRecord.count();
        console.log(`현재 레코드 수: ${count}개\n`);
        return;
      }
    } catch (err) {
      console.log('테이블 존재 여부 확인 중 오류 (무시 가능):', err.message);
    }
    
    console.log('1. PuzzleRecord 테이블 생성 중...');
    
    // MySQL에 직접 테이블 생성 (IF NOT EXISTS 제거 - 더 명확한 에러 메시지를 위해)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE PuzzleRecord (
        recordId CHAR(25) PRIMARY KEY,
        userId CHAR(25) NOT NULL,
        puzzleId VARCHAR(191) NOT NULL,
        difficulty INT NOT NULL,
        completionTime INT,
        moves INT,
        score INT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        completedAt DATETIME(3),
        createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        FOREIGN KEY (userId) REFERENCES User(userId) ON DELETE CASCADE ON UPDATE CASCADE,
        INDEX idx_userId_completedAt (userId, completedAt),
        INDEX idx_puzzleId_difficulty_score (puzzleId, difficulty, score),
        INDEX idx_score_completedAt (score, completedAt),
        INDEX idx_completed_score (completed, score)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    
    console.log('   ✅ 테이블 생성 완료!\n');
    
    // 테이블 확인
    console.log('2. 테이블 확인 중...');
    const count = await prisma.puzzleRecord.count();
    console.log(`   ✅ 현재 레코드 수: ${count}개\n`);
    
    console.log('=== 완료 ===\n');
    console.log('다음 단계:');
    console.log('1. Next.js 개발 서버를 재시작하세요 (Ctrl+C 후 npm run dev)');
    console.log('2. 브라우저에서 /puzzle-home/rankings 페이지를 새로고침하세요\n');
    
  } catch (error) {
    console.error('\n❌ 테이블 생성 실패:', error.message);
    console.error('에러 코드:', error.code);
    
    // 테이블이 이미 존재하는 경우
    if (error.code === 'P2010' || error.message.includes('already exists') || error.message.includes('Duplicate')) {
      console.log('\n⚠️ 테이블이 이미 존재하는 것 같습니다.');
      console.log('다음 명령어로 확인해보세요: npx prisma db push\n');
    } else {
      console.log('\n해결 방법:');
      console.log('1. 데이터베이스 연결을 확인하세요');
      console.log('2. .env 파일의 DATABASE_URL을 확인하세요');
      console.log('3. 데이터베이스 권한을 확인하세요');
      console.log('\n또는 다음 명령어를 시도해보세요:');
      console.log('  npx prisma db push --accept-data-loss\n');
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTable();
