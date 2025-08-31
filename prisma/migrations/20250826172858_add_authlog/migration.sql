-- CreateTable
CREATE TABLE `AuthLog` (
    `id` CHAR(25) NOT NULL,
    `userId` CHAR(25) NULL,
    `emailHash` VARCHAR(191) NULL,
    `ip` VARCHAR(64) NULL,
    `ua` VARCHAR(512) NULL,
    `provider` VARCHAR(32) NOT NULL,
    `result` VARCHAR(16) NOT NULL,
    `reason` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuthLog_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `AuthLog_result_createdAt_idx`(`result`, `createdAt`),
    INDEX `AuthLog_emailHash_idx`(`emailHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
