const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const prisma = new PrismaClient();

async function checkSchema() {
  try {
    console.log("데이터베이스 스키마 확인 중...\n");

    // User 테이블 확인
    try {
      const userColumns = await prisma.$queryRaw`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'User'
        ORDER BY ORDINAL_POSITION
      `;
      console.log("=== User 테이블 컬럼 ===");
      console.log(JSON.stringify(userColumns, null, 2));
      
      const hasIsAdmin = userColumns.some((col) => col.COLUMN_NAME === "isAdmin");
      console.log(`\nisAdmin 컬럼 존재: ${hasIsAdmin ? "✅ 있음" : "❌ 없음"}\n`);
    } catch (error) {
      console.error("User 테이블 확인 오류:", error.message);
    }

    // CognitiveAssessment 테이블 확인
    try {
      const tables = await prisma.$queryRaw`
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'CognitiveAssessment'
      `;
      console.log("=== CognitiveAssessment 테이블 ===");
      console.log(JSON.stringify(tables, null, 2));
      
      const exists = tables.length > 0;
      console.log(`\nCognitiveAssessment 테이블 존재: ${exists ? "✅ 있음" : "❌ 없음"}\n`);
      
      if (exists) {
        const columns = await prisma.$queryRaw`
          SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'CognitiveAssessment'
          ORDER BY ORDINAL_POSITION
        `;
        console.log("=== CognitiveAssessment 테이블 컬럼 ===");
        console.log(JSON.stringify(columns, null, 2));
      }
    } catch (error) {
      console.error("CognitiveAssessment 테이블 확인 오류:", error.message);
    }
  } catch (error) {
    console.error("오류:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();

