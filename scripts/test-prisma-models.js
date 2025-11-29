const { PrismaClient } = require("@prisma/client");

async function test() {
  const prisma = new PrismaClient();
  
  try {
    console.log("=== Prisma Client Models ===");
    const models = Object.keys(prisma).filter(
      key => !key.startsWith('_') && !key.startsWith('$') && typeof prisma[key] === 'object'
    );
    console.log("Available models:", models);
    
    console.log("\n=== Checking specific models ===");
    console.log("prisma.user:", !!prisma.user);
    console.log("prisma.activityResource:", !!prisma.activityResource);
    console.log("prisma.academyCourse:", !!prisma.academyCourse);
    
    if (prisma.academyCourse) {
      console.log("\n✓ academyCourse model is available!");
      // 테스트 쿼리
      const count = await prisma.academyCourse.count();
      console.log(`Total courses in database: ${count}`);
    } else {
      console.log("\n✗ academyCourse model is NOT available!");
      console.log("This means Prisma client was not generated correctly.");
      console.log("Please run: npx prisma generate");
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();

