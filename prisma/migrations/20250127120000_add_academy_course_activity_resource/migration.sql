-- CreateTable
CREATE TABLE `ActivityResource` (
    `resourceId` CHAR(25) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `subtitle` VARCHAR(191) NULL,
    `thumbnail` VARCHAR(512) NULL,
    `fileUrl` VARCHAR(512) NULL,
    `category` VARCHAR(50) NOT NULL,
    `tags` JSON NOT NULL DEFAULT ('[]'),
    `popularScore` INTEGER NOT NULL DEFAULT 0,
    `visible` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`resourceId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AcademyCourse` (
    `courseId` CHAR(25) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `subtitle` VARCHAR(191) NULL,
    `thumbnail` VARCHAR(512) NULL,
    `category` VARCHAR(50) NOT NULL,
    `instructor` VARCHAR(100) NULL,
    `courseUrl` VARCHAR(512) NULL,
    `price` DECIMAL(10, 2) NULL,
    `duration` VARCHAR(50) NULL,
    `tags` JSON NOT NULL DEFAULT ('[]'),
    `level` VARCHAR(20) NULL,
    `popularScore` INTEGER NOT NULL DEFAULT 0,
    `visible` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`courseId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `ActivityResource_category_visible_idx` ON `ActivityResource`(`category`, `visible`);

-- CreateIndex
CREATE INDEX `ActivityResource_visible_createdAt_idx` ON `ActivityResource`(`visible`, `createdAt`);

-- CreateIndex
CREATE INDEX `ActivityResource_popularScore_idx` ON `ActivityResource`(`popularScore`);

-- CreateIndex
CREATE INDEX `AcademyCourse_category_visible_idx` ON `AcademyCourse`(`category`, `visible`);

-- CreateIndex
CREATE INDEX `AcademyCourse_visible_createdAt_idx` ON `AcademyCourse`(`visible`, `createdAt`);

-- CreateIndex
CREATE INDEX `AcademyCourse_popularScore_idx` ON `AcademyCourse`(`popularScore`);

-- CreateIndex
CREATE INDEX `AcademyCourse_level_idx` ON `AcademyCourse`(`level`);

