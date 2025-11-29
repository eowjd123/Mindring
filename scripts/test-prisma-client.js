const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Testing Prisma Client...');
    console.log('Available properties:', Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')));
    
    // PuzzleRecord 모델 확인
    if (prisma.puzzleRecord) {
      console.log('✅ puzzleRecord found!');
      const count = await prisma.puzzleRecord.count();
      console.log(`Total puzzle records: ${count}`);
    } else {
      console.log('❌ puzzleRecord NOT found!');
      console.log('Available models:', Object.keys(prisma).filter(k => typeof prisma[k] === 'object' && prisma[k] !== null && 'findMany' in prisma[k]));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();

