-- CreateTable
CREATE TABLE `User` (
    `userId` CHAR(25) NOT NULL,
    `email` VARCHAR(191) NULL,
    `passwordHash` VARCHAR(191) NULL,
    `name` VARCHAR(191) NULL,
    `avatarUrl` VARCHAR(512) NULL,
    `emailSavedFlag` BOOLEAN NOT NULL DEFAULT false,
    `passwordSavedFlag` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_email_idx`(`email`),
    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SocialAccount` (
    `socialId` CHAR(25) NOT NULL,
    `userId` CHAR(25) NOT NULL,
    `provider` VARCHAR(32) NOT NULL,
    `providerUserId` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `displayName` VARCHAR(191) NULL,
    `avatarUrl` VARCHAR(512) NULL,
    `refreshTokenEnc` TEXT NULL,
    `linkedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SocialAccount_userId_provider_idx`(`userId`, `provider`),
    UNIQUE INDEX `SocialAccount_provider_providerUserId_key`(`provider`, `providerUserId`),
    PRIMARY KEY (`socialId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `sessionId` CHAR(25) NOT NULL,
    `userId` CHAR(25) NOT NULL,
    `uaFingerprint` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `revokedAt` DATETIME(3) NULL,

    INDEX `Session_userId_idx`(`userId`),
    INDEX `Session_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`sessionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Work` (
    `workId` CHAR(25) NOT NULL,
    `userId` CHAR(25) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `coverImage` VARCHAR(512) NULL,
    `status` ENUM('draft', 'completed') NOT NULL DEFAULT 'draft',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Work_userId_status_idx`(`userId`, `status`),
    INDEX `Work_updatedAt_idx`(`updatedAt`),
    PRIMARY KEY (`workId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Page` (
    `pageId` CHAR(25) NOT NULL,
    `workId` CHAR(25) NOT NULL,
    `orderIndex` INTEGER NOT NULL,
    `contentType` ENUM('text', 'image', 'mixed') NOT NULL,
    `contentJson` JSON NOT NULL,

    INDEX `Page_workId_orderIndex_idx`(`workId`, `orderIndex`),
    UNIQUE INDEX `Page_workId_orderIndex_key`(`workId`, `orderIndex`),
    PRIMARY KEY (`pageId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LifeGraph` (
    `graphId` CHAR(25) NOT NULL,
    `userId` CHAR(25) NOT NULL,
    `year` INTEGER NOT NULL,
    `memoryText` TEXT NOT NULL,
    `emotion` ENUM('joy', 'sadness', 'anger', 'fear', 'surprise', 'neutral') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LifeGraph_userId_year_idx`(`userId`, `year`),
    PRIMARY KEY (`graphId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Export` (
    `exportId` CHAR(25) NOT NULL,
    `workId` CHAR(25) NOT NULL,
    `fileType` VARCHAR(16) NOT NULL,
    `filePath` VARCHAR(512) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Export_workId_fileType_idx`(`workId`, `fileType`),
    PRIMARY KEY (`exportId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SocialAccount` ADD CONSTRAINT `SocialAccount_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Work` ADD CONSTRAINT `Work_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Page` ADD CONSTRAINT `Page_workId_fkey` FOREIGN KEY (`workId`) REFERENCES `Work`(`workId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeGraph` ADD CONSTRAINT `LifeGraph_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Export` ADD CONSTRAINT `Export_workId_fkey` FOREIGN KEY (`workId`) REFERENCES `Work`(`workId`) ON DELETE CASCADE ON UPDATE CASCADE;
