/*
  Warnings:

  - You are about to drop the column `emotion` on the `LifeGraph` table. All the data in the column will be lost.
  - You are about to drop the column `memoryText` on the `LifeGraph` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `LifeGraph` table. All the data in the column will be lost.
  - The primary key for the `Session` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[shareToken]` on the table `LifeGraph` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `startDate` to the `LifeGraph` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `LifeGraph` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `LifeGraph` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `LifeGraph` DROP FOREIGN KEY `LifeGraph_userId_fkey`;

-- DropIndex
DROP INDEX `LifeGraph_userId_year_idx` ON `LifeGraph`;

-- AlterTable
ALTER TABLE `LifeGraph` DROP COLUMN `emotion`,
    DROP COLUMN `memoryText`,
    DROP COLUMN `year`,
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `endDate` DATETIME(3) NULL,
    ADD COLUMN `isPublic` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `maxScore` INTEGER NOT NULL DEFAULT 5,
    ADD COLUMN `minScore` INTEGER NOT NULL DEFAULT -5,
    ADD COLUMN `shareToken` CHAR(32) NULL,
    ADD COLUMN `startDate` DATETIME(3) NOT NULL,
    ADD COLUMN `title` VARCHAR(191) NOT NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `Session` DROP PRIMARY KEY,
    MODIFY `sessionId` VARCHAR(32) NOT NULL,
    ADD PRIMARY KEY (`sessionId`);

-- CreateTable
CREATE TABLE `LifeGraphPoint` (
    `pointId` CHAR(25) NOT NULL,
    `graphId` CHAR(25) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `score` DOUBLE NOT NULL,
    `title` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `emotion` ENUM('joy', 'sadness', 'anger', 'fear', 'surprise', 'neutral') NULL,
    `attachments` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LifeGraphPoint_graphId_date_idx`(`graphId`, `date`),
    PRIMARY KEY (`pointId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LifeGraphTag` (
    `tagId` CHAR(25) NOT NULL,
    `userId` CHAR(25) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `color` CHAR(7) NOT NULL DEFAULT '#3B82F6',
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LifeGraphTag_userId_idx`(`userId`),
    UNIQUE INDEX `LifeGraphTag_userId_name_key`(`userId`, `name`),
    PRIMARY KEY (`tagId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LifeGraphPointTag` (
    `pointId` VARCHAR(191) NOT NULL,
    `tagId` VARCHAR(191) NOT NULL,
    `intensity` DOUBLE NULL DEFAULT 1.0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`pointId`, `tagId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LifeGraphShare` (
    `shareId` CHAR(25) NOT NULL,
    `graphId` CHAR(25) NOT NULL,
    `email` VARCHAR(191) NULL,
    `shareToken` CHAR(32) NOT NULL,
    `permissions` ENUM('read', 'comment', 'edit') NOT NULL DEFAULT 'read',
    `expiresAt` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LifeGraphShare_shareToken_key`(`shareToken`),
    INDEX `LifeGraphShare_graphId_idx`(`graphId`),
    INDEX `LifeGraphShare_shareToken_idx`(`shareToken`),
    PRIMARY KEY (`shareId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LifeGraphComment` (
    `commentId` CHAR(25) NOT NULL,
    `graphId` CHAR(25) NOT NULL,
    `pointId` CHAR(25) NULL,
    `authorName` VARCHAR(100) NOT NULL,
    `authorEmail` VARCHAR(191) NULL,
    `content` TEXT NOT NULL,
    `isPrivate` BOOLEAN NOT NULL DEFAULT false,
    `parentId` CHAR(25) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LifeGraphComment_graphId_createdAt_idx`(`graphId`, `createdAt`),
    INDEX `LifeGraphComment_pointId_idx`(`pointId`),
    INDEX `LifeGraphComment_parentId_idx`(`parentId`),
    PRIMARY KEY (`commentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `LifeGraph_shareToken_key` ON `LifeGraph`(`shareToken`);

-- CreateIndex
CREATE INDEX `LifeGraph_userId_idx` ON `LifeGraph`(`userId`);

-- CreateIndex
CREATE INDEX `LifeGraph_shareToken_idx` ON `LifeGraph`(`shareToken`);

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeGraphPoint` ADD CONSTRAINT `LifeGraphPoint_graphId_fkey` FOREIGN KEY (`graphId`) REFERENCES `LifeGraph`(`graphId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeGraphTag` ADD CONSTRAINT `LifeGraphTag_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeGraphPointTag` ADD CONSTRAINT `LifeGraphPointTag_pointId_fkey` FOREIGN KEY (`pointId`) REFERENCES `LifeGraphPoint`(`pointId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeGraphPointTag` ADD CONSTRAINT `LifeGraphPointTag_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `LifeGraphTag`(`tagId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeGraphShare` ADD CONSTRAINT `LifeGraphShare_graphId_fkey` FOREIGN KEY (`graphId`) REFERENCES `LifeGraph`(`graphId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeGraphComment` ADD CONSTRAINT `LifeGraphComment_graphId_fkey` FOREIGN KEY (`graphId`) REFERENCES `LifeGraph`(`graphId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeGraphComment` ADD CONSTRAINT `LifeGraphComment_pointId_fkey` FOREIGN KEY (`pointId`) REFERENCES `LifeGraphPoint`(`pointId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeGraphComment` ADD CONSTRAINT `LifeGraphComment_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `LifeGraphComment`(`commentId`) ON DELETE CASCADE ON UPDATE CASCADE;
