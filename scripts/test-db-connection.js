const { PrismaClient } = require("@prisma/client");

async function test() {
  const prisma = new PrismaClient();
  
  try {
    console.log("Testing database connection...");
    
    // 데이터베이스 이름 확인
    const dbName = await prisma.$queryRaw`SELECT DATABASE() as db`;
    console.log("Current database:", dbName);
    
    // 테이블 목록 확인
    const tables = await prisma.$queryRaw`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    `;
    console.log("\nExisting tables:");
    console.log(JSON.stringify(tables, null, 2));
    
    // AcademyCourse 테이블 존재 확인
    const academyTable = await prisma.$queryRaw`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'AcademyCourse'
    `;
    
    if (academyTable.length === 0) {
      console.log("\n❌ AcademyCourse table does NOT exist");
      console.log("Creating table...");
      
      await prisma.$executeRawUnsafe(`
        CREATE TABLE AcademyCourse (
          courseId CHAR(25) PRIMARY KEY,
          title VARCHAR(191) NOT NULL,
          description TEXT,
          subtitle VARCHAR(191),
          thumbnail VARCHAR(512),
          category VARCHAR(50) NOT NULL,
          instructor VARCHAR(100),
          courseUrl VARCHAR(512),
          price DECIMAL(10,2),
          duration VARCHAR(50),
          tags JSON DEFAULT ('[]'),
          level VARCHAR(20),
          popularScore INT DEFAULT 0,
          visible BOOLEAN DEFAULT TRUE,
          createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
          updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
          INDEX idx_category_visible (category, visible),
          INDEX idx_visible_createdAt (visible, createdAt),
          INDEX idx_popularScore (popularScore),
          INDEX idx_level (level)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      console.log("✅ AcademyCourse table created!");
    } else {
      console.log("\n✅ AcademyCourse table exists");
    }
    
  } catch (error) {
    console.error("Error:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

test();

