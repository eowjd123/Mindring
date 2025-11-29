const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

console.log("Checking Prisma client models...");
console.log("Available models:", Object.keys(prisma).filter(key => !key.startsWith('_') && !key.startsWith('$')));

if (prisma.academyCourse) {
  console.log("✓ academyCourse model is available");
} else {
  console.log("✗ academyCourse model is NOT available");
  console.log("Available models:", Object.keys(prisma).filter(key => !key.startsWith('_') && !key.startsWith('$')));
}

prisma.$disconnect();

