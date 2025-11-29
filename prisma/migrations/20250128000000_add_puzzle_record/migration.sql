-- CreateTable
CREATE TABLE `PuzzleRecord` (
    `recordId` CHAR(25) NOT NULL,
    `userId` CHAR(25) NOT NULL,
    `puzzleId` VARCHAR(191) NOT NULL,
    `difficulty` INTEGER NOT NULL,
    `completionTime` INTEGER NULL,
    `moves` INTEGER NULL,
    `score` INTEGER NOT NULL,
    `completed` BOOLEAN NOT NULL DEFAULT false,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`recordId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `idx_userId_completedAt` ON `PuzzleRecord`(`userId`, `completedAt`);

-- CreateIndex
CREATE INDEX `idx_puzzleId_difficulty_score` ON `PuzzleRecord`(`puzzleId`, `difficulty`, `score`);

-- CreateIndex
CREATE INDEX `idx_score_completedAt` ON `PuzzleRecord`(`score`, `completedAt`);

-- CreateIndex
CREATE INDEX `idx_completed_score` ON `PuzzleRecord`(`completed`, `score`);

-- AddForeignKey
ALTER TABLE `PuzzleRecord` ADD CONSTRAINT `PuzzleRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

