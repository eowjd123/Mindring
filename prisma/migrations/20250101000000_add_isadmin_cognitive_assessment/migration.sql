-- AlterTable: Add isAdmin field to User table
-- Note: If this fails with "Duplicate column name 'isAdmin'", 
-- the column already exists. Use: npx prisma migrate resolve --applied 20250101000000_add_isadmin_cognitive_assessment
ALTER TABLE `User` ADD COLUMN `isAdmin` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: CognitiveAssessment
CREATE TABLE `CognitiveAssessment` (
    `assessmentId` CHAR(25) NOT NULL,
    `userId` CHAR(25) NOT NULL,
    `assessmentType` VARCHAR(50) NOT NULL,
    `age` INTEGER NULL,
    `gender` VARCHAR(20) NULL,
    `testDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `answers` JSON NOT NULL,
    `totalScore` DOUBLE NULL,
    `averageScore` DOUBLE NULL,
    `percentage` DOUBLE NULL,
    `riskLevel` VARCHAR(50) NULL,
    `interpretation` VARCHAR(100) NULL,
    `message` VARCHAR(200) NULL,
    `description` TEXT NULL,
    `recommendations` JSON NULL,
    `categoryScores` JSON NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`assessmentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `CognitiveAssessment_userId_assessmentType_testDate_idx` ON `CognitiveAssessment`(`userId`, `assessmentType`, `testDate`);
CREATE INDEX `CognitiveAssessment_userId_createdAt_idx` ON `CognitiveAssessment`(`userId`, `createdAt`);
CREATE INDEX `CognitiveAssessment_assessmentType_testDate_idx` ON `CognitiveAssessment`(`assessmentType`, `testDate`);

-- AddForeignKey
ALTER TABLE `CognitiveAssessment` ADD CONSTRAINT `CognitiveAssessment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

