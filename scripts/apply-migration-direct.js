const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log("=== 데이터베이스 마이그레이션 적용 ===\n");

    // 1. User 테이블에 isAdmin 컬럼 추가
    console.log("1. User 테이블에 isAdmin 컬럼 추가 중...");
    try {
      await prisma.$executeRaw`
        ALTER TABLE \`User\` 
        ADD COLUMN \`isAdmin\` BOOLEAN NOT NULL DEFAULT false
      `;
      console.log("✅ isAdmin 컬럼 추가 완료");
    } catch (error) {
      if (error.message.includes("Duplicate column name") || error.message.includes("already exists")) {
        console.log("⚠️  isAdmin 컬럼이 이미 존재합니다.");
      } else {
        throw error;
      }
    }

    // 2. CognitiveAssessment 테이블 생성
    console.log("\n2. CognitiveAssessment 테이블 생성 중...");
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS \`CognitiveAssessment\` (
          \`assessmentId\` CHAR(25) NOT NULL,
          \`userId\` CHAR(25) NOT NULL,
          \`assessmentType\` VARCHAR(50) NOT NULL,
          \`age\` INTEGER NULL,
          \`gender\` VARCHAR(20) NULL,
          \`testDate\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          \`answers\` JSON NOT NULL,
          \`totalScore\` DOUBLE NULL,
          \`averageScore\` DOUBLE NULL,
          \`percentage\` DOUBLE NULL,
          \`riskLevel\` VARCHAR(50) NULL,
          \`interpretation\` VARCHAR(100) NULL,
          \`message\` VARCHAR(200) NULL,
          \`description\` TEXT NULL,
          \`recommendations\` JSON NULL,
          \`categoryScores\` JSON NULL,
          \`metadata\` JSON NULL,
          \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          \`updatedAt\` DATETIME(3) NOT NULL,
          PRIMARY KEY (\`assessmentId\`)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
      `;
      console.log("✅ CognitiveAssessment 테이블 생성 완료");
    } catch (error) {
      if (error.message.includes("already exists") || error.message.includes("Table") && error.message.includes("exists")) {
        console.log("⚠️  CognitiveAssessment 테이블이 이미 존재합니다.");
      } else {
        throw error;
      }
    }

    // 3. 인덱스 생성
    console.log("\n3. 인덱스 생성 중...");
    try {
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS \`CognitiveAssessment_userId_assessmentType_testDate_idx\` 
        ON \`CognitiveAssessment\`(\`userId\`, \`assessmentType\`, \`testDate\`)
      `;
      console.log("✅ 인덱스 1 생성 완료");
    } catch (error) {
      console.log("⚠️  인덱스 1이 이미 존재하거나 생성 실패:", error.message);
    }

    try {
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS \`CognitiveAssessment_userId_createdAt_idx\` 
        ON \`CognitiveAssessment\`(\`userId\`, \`createdAt\`)
      `;
      console.log("✅ 인덱스 2 생성 완료");
    } catch (error) {
      console.log("⚠️  인덱스 2가 이미 존재하거나 생성 실패:", error.message);
    }

    try {
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS \`CognitiveAssessment_assessmentType_testDate_idx\` 
        ON \`CognitiveAssessment\`(\`assessmentType\`, \`testDate\`)
      `;
      console.log("✅ 인덱스 3 생성 완료");
    } catch (error) {
      console.log("⚠️  인덱스 3이 이미 존재하거나 생성 실패:", error.message);
    }

    // 4. 외래키 추가
    console.log("\n4. 외래키 추가 중...");
    try {
      await prisma.$executeRaw`
        ALTER TABLE \`CognitiveAssessment\` 
        ADD CONSTRAINT \`CognitiveAssessment_userId_fkey\` 
        FOREIGN KEY (\`userId\`) REFERENCES \`User\`(\`userId\`) 
        ON DELETE CASCADE ON UPDATE CASCADE
      `;
      console.log("✅ 외래키 추가 완료");
    } catch (error) {
      if (error.message.includes("Duplicate key name") || error.message.includes("already exists")) {
        console.log("⚠️  외래키가 이미 존재합니다.");
      } else {
        console.log("⚠️  외래키 추가 실패:", error.message);
      }
    }

    console.log("\n=== 마이그레이션 완료 ===\n");

    // 확인
    console.log("데이터베이스 상태 확인 중...");
    const userInfo = await prisma.$queryRaw`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'User' 
      AND COLUMN_NAME = 'isAdmin'
    `;
    console.log("isAdmin 컬럼:", userInfo.length > 0 ? "✅ 존재" : "❌ 없음");

    const tableInfo = await prisma.$queryRaw`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'CognitiveAssessment'
    `;
    console.log("CognitiveAssessment 테이블:", tableInfo.length > 0 ? "✅ 존재" : "❌ 없음");

  } catch (error) {
    console.error("\n❌ 오류 발생:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();

