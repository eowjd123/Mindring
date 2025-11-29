const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

async function applyMigration() {
  const prisma = new PrismaClient();
  
  try {
    const migrationPath = path.join(__dirname, "../prisma/migrations/20250127120000_add_academy_course_activity_resource/migration.sql");
    const sql = fs.readFileSync(migrationPath, "utf8");
    
    console.log("Applying migration...");
    console.log("SQL length:", sql.length);
    
    // SQL을 세미콜론으로 분리하여 각각 실행
    const statements = sql
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith("--"));
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await prisma.$executeRawUnsafe(statement);
          console.log("✓ Executed:", statement.substring(0, 50) + "...");
        } catch (error) {
          if (error.message.includes("already exists") || error.message.includes("Duplicate")) {
            console.log("⚠ Skipped (already exists):", statement.substring(0, 50) + "...");
          } else {
            console.error("✗ Error:", error.message);
            console.error("Statement:", statement.substring(0, 100));
          }
        }
      }
    }
    
    console.log("\nMigration applied!");
  } catch (error) {
    console.error("Error:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();

