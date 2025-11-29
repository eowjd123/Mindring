const { PrismaClient } = require("@prisma/client");

async function checkTables() {
  const prisma = new PrismaClient();
  
  try {
    // MySQL에서 테이블 목록 조회
    const tables = await prisma.$queryRaw`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME IN ('AcademyCourse', 'ActivityResource')
    `;
    
    console.log("Existing tables:", tables);
    
    // AcademyCourse 테이블이 없으면 생성
    if (!tables.find(t => t.TABLE_NAME === 'AcademyCourse')) {
      console.log("Creating AcademyCourse table...");
      await prisma.$executeRaw`
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
        )
      `;
      console.log("AcademyCourse table created!");
    }
    
    // ActivityResource 테이블이 없으면 생성
    if (!tables.find(t => t.TABLE_NAME === 'ActivityResource')) {
      console.log("Creating ActivityResource table...");
      await prisma.$executeRaw`
        CREATE TABLE ActivityResource (
          resourceId CHAR(25) PRIMARY KEY,
          title VARCHAR(191) NOT NULL,
          subtitle VARCHAR(191),
          thumbnail VARCHAR(512),
          fileUrl VARCHAR(512),
          category VARCHAR(50) NOT NULL,
          tags JSON DEFAULT ('[]'),
          popularScore INT DEFAULT 0,
          visible BOOLEAN DEFAULT TRUE,
          createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
          updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
          INDEX idx_category_visible (category, visible),
          INDEX idx_visible_createdAt (visible, createdAt),
          INDEX idx_popularScore (popularScore)
        )
      `;
      console.log("ActivityResource table created!");
    }
    
    console.log("All tables checked!");
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();

