/*
  Warnings:

  - You are about to drop the column `userId` on the `InterviewRequest` table. All the data in the column will be lost.
  - You are about to drop the column `projectsJson` on the `Portfolio` table. All the data in the column will be lost.
  - You are about to drop the column `scoreJson` on the `Portfolio` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[submissionId]` on the table `Portfolio` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[scoreId]` on the table `Portfolio` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `developerId` to the `InterviewRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `position` to the `InterviewRequest` table without a default value. This is not possible if the table is not empty.
  - Made the column `status` on table `InterviewRequest` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `submissionId` to the `Portfolio` table without a default value. This is not possible if the table is not empty.
  - Made the column `slug` on table `Portfolio` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey (InterviewRequest) - Only drop if exists
-- Check if foreign key exists before dropping
SET @fk_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'InterviewRequest' 
  AND CONSTRAINT_NAME = 'InterviewRequest_userId_fkey'
  AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @sql = IF(@fk_exists > 0,
  'ALTER TABLE `InterviewRequest` DROP FOREIGN KEY `InterviewRequest_userId_fkey`',
  'SELECT "Foreign key does not exist, skipping drop" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- DropForeignKey (Portfolio - must drop before dropping index)
ALTER TABLE `Portfolio` DROP FOREIGN KEY `Portfolio_userId_fkey`;

-- DropIndex (now safe to drop since foreign key is removed)
DROP INDEX `Portfolio_userId_key` ON `Portfolio`;

-- AlterTable
ALTER TABLE `Company` ADD COLUMN `about` TEXT NULL,
    ADD COLUMN `hiringNeeds` JSON NULL,
    ADD COLUMN `industry` VARCHAR(191) NULL,
    ADD COLUMN `location` VARCHAR(191) NULL,
    ADD COLUMN `teamSize` INTEGER NULL;

-- AlterTable
ALTER TABLE `InterviewRequest` DROP COLUMN `userId`,
    ADD COLUMN `developerId` VARCHAR(191) NOT NULL,
    ADD COLUMN `position` VARCHAR(191) NOT NULL,
    ADD COLUMN `submissionId` VARCHAR(191) NULL,
    MODIFY `message` TEXT NULL,
    MODIFY `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `Portfolio` DROP COLUMN `projectsJson`,
    DROP COLUMN `scoreJson`,
    ADD COLUMN `portfolioJson` JSON NULL,
    ADD COLUMN `scoreId` VARCHAR(191) NULL,
    ADD COLUMN `submissionId` VARCHAR(191) NOT NULL,
    MODIFY `slug` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `Project` ADD COLUMN `tags` JSON NULL;

-- AlterTable
ALTER TABLE `Score` ADD COLUMN `badge` ENUM('RED', 'YELLOW', 'GREEN') NOT NULL DEFAULT 'RED',
    ADD COLUMN `bugRisk` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `detailsJson` JSON NULL,
    ADD COLUMN `documentation` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `gitMaturity` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `optimization` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `problemSolving` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `security` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `location` VARCHAR(191) NULL,
    ADD COLUMN `password` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `data` JSON NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `emailSent` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_userId_read_idx`(`userId`, `read`),
    INDEX `Notification_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserNotificationPreferences` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `emailEnabled` BOOLEAN NOT NULL DEFAULT true,
    `emailScoreReady` BOOLEAN NOT NULL DEFAULT true,
    `emailPortfolioReady` BOOLEAN NOT NULL DEFAULT true,
    `emailInterviewRequest` BOOLEAN NOT NULL DEFAULT true,
    `emailInterviewUpdate` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UserNotificationPreferences_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Portfolio_submissionId_key` ON `Portfolio`(`submissionId`);

-- CreateIndex
CREATE UNIQUE INDEX `Portfolio_scoreId_key` ON `Portfolio`(`scoreId`);

-- AddForeignKey
ALTER TABLE `Portfolio` ADD CONSTRAINT `Portfolio_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `Submission`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Portfolio` ADD CONSTRAINT `Portfolio_scoreId_fkey` FOREIGN KEY (`scoreId`) REFERENCES `Score`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InterviewRequest` ADD CONSTRAINT `InterviewRequest_developerId_fkey` FOREIGN KEY (`developerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InterviewRequest` ADD CONSTRAINT `InterviewRequest_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `Submission`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserNotificationPreferences` ADD CONSTRAINT `UserNotificationPreferences_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey (recreate Portfolio userId foreign key)
ALTER TABLE `Portfolio` ADD CONSTRAINT `Portfolio_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
