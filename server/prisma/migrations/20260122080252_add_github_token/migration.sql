/*
  Warnings:

  - You are about to drop the `CostTracking` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DeadLetterJob` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ErrorLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ReviewAnalytics` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `DeadLetterJob` DROP FOREIGN KEY `DeadLetterJob_ibfk_1`;

-- DropForeignKey
ALTER TABLE `ErrorLog` DROP FOREIGN KEY `ErrorLog_ibfk_1`;

-- DropForeignKey
ALTER TABLE `ReviewAnalytics` DROP FOREIGN KEY `ReviewAnalytics_ibfk_1`;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `githubToken` TEXT NULL;

-- DropTable
DROP TABLE `CostTracking`;

-- DropTable
DROP TABLE `DeadLetterJob`;

-- DropTable
DROP TABLE `ErrorLog`;

-- DropTable
DROP TABLE `ReviewAnalytics`;
