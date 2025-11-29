const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log("마이그레이션 적용 시작...");

    const migrationFile = path.join(
      __dirname,
      "../prisma/migrations/20250101000000_add_isadmin_cognitive_assessment/migration.sql"
    );

    if (!fs.existsSync(migrationFile)) {
      console.error("마이그레이션 파일을 찾을 수 없습니다:", migrationFile);
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationFile, "utf8");

    // SQL 문을 세미콜론으로 분리
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    console.log(`총 ${statements.length}개의 SQL 문을 실행합니다.`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        try {
          console.log(`\n[${i + 1}/${statements.length}] 실행 중...`);
          console.log(statement.substring(0, 100) + "...");
          
          await prisma.$executeRawUnsafe(statement);
          console.log("✅ 성공");
        } catch (error) {
          // 이미 존재하는 경우 무시
          if (
            error.message.includes("Duplicate column name") ||
            error.message.includes("already exists") ||
            error.message.includes("Table") && error.message.includes("already exists")
          ) {
            console.log("⚠️  이미 적용된 항목입니다. 건너뜁니다.");
          } else {
            console.error("❌ 오류:", error.message);
            throw error;
          }
        }
      }
    }

    console.log("\n✅ 마이그레이션이 성공적으로 적용되었습니다!");
  } catch (error) {
    console.error("❌ 마이그레이션 적용 실패:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();

