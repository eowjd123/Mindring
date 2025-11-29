const { PrismaClient } = require("@prisma/client");

async function createTables() {
  const prisma = new PrismaClient();
  
  try {
    console.log("Creating AcademyCourse and ActivityResource tables...");
    
    // AcademyCourse 테이블 생성
    const createAcademyCourse = `
      CREATE TABLE IF NOT EXISTS \`note\`.\`AcademyCourse\` (
        \`courseId\` CHAR(25) NOT NULL,
        \`title\` VARCHAR(191) NOT NULL,
        \`description\` TEXT NULL,
        \`subtitle\` VARCHAR(191) NULL,
        \`thumbnail\` VARCHAR(512) NULL,
        \`category\` VARCHAR(50) NOT NULL,
        \`instructor\` VARCHAR(100) NULL,
        \`courseUrl\` VARCHAR(512) NULL,
        \`price\` DECIMAL(10, 2) NULL,
        \`duration\` VARCHAR(50) NULL,
        \`tags\` JSON NOT NULL DEFAULT ('[]'),
        \`level\` VARCHAR(20) NULL,
        \`popularScore\` INTEGER NOT NULL DEFAULT 0,
        \`visible\` BOOLEAN NOT NULL DEFAULT true,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`courseId\`),
        INDEX \`AcademyCourse_category_visible_idx\` (\`category\`, \`visible\`),
        INDEX \`AcademyCourse_visible_createdAt_idx\` (\`visible\`, \`createdAt\`),
        INDEX \`AcademyCourse_popularScore_idx\` (\`popularScore\`),
        INDEX \`AcademyCourse_level_idx\` (\`level\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    await prisma.$executeRawUnsafe(createAcademyCourse);
    console.log("✓ AcademyCourse table created successfully");
    
    // ActivityResource 테이블 생성
    const createActivityResource = `
      CREATE TABLE IF NOT EXISTS \`note\`.\`ActivityResource\` (
        \`resourceId\` CHAR(25) NOT NULL,
        \`title\` VARCHAR(191) NOT NULL,
        \`subtitle\` VARCHAR(191) NULL,
        \`thumbnail\` VARCHAR(512) NULL,
        \`fileUrl\` VARCHAR(512) NULL,
        \`category\` VARCHAR(50) NOT NULL,
        \`tags\` JSON NOT NULL DEFAULT ('[]'),
        \`popularScore\` INTEGER NOT NULL DEFAULT 0,
        \`visible\` BOOLEAN NOT NULL DEFAULT true,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`resourceId\`),
        INDEX \`ActivityResource_category_visible_idx\` (\`category\`, \`visible\`),
        INDEX \`ActivityResource_visible_createdAt_idx\` (\`visible\`, \`createdAt\`),
        INDEX \`ActivityResource_popularScore_idx\` (\`popularScore\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    await prisma.$executeRawUnsafe(createActivityResource);
    console.log("✓ ActivityResource table created successfully");
    
    console.log("\n✅ All tables created successfully!");
    
    // 테이블 존재 확인
    const tables = await prisma.$queryRaw`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'note'
      AND TABLE_NAME IN ('AcademyCourse', 'ActivityResource')
    `;
    
    console.log("\nVerified tables:", tables);
    
  } catch (error) {
    console.error("❌ Error creating tables:", error.message);
    if (error.message.includes("already exists")) {
      console.log("⚠ Tables may already exist. Checking...");
    } else {
      console.error("Full error:", error);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTables().catch(console.error);

