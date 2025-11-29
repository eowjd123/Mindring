const { PrismaClient } = require("@prisma/client");

async function createTables() {
  const prisma = new PrismaClient();
  
  try {
    console.log("Creating tables...");
    
    // AcademyCourse 테이블 생성
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS AcademyCourse (
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
    console.log("✓ AcademyCourse table created");
    
    // ActivityResource 테이블 생성
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS ActivityResource (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✓ ActivityResource table created");
    
    console.log("\nAll tables created successfully!");
  } catch (error) {
    console.error("Error creating tables:", error.message);
    if (error.message.includes("already exists")) {
      console.log("Tables already exist, skipping...");
    } else {
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTables();

