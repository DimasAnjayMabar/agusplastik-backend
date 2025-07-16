/*
  Warnings:

  - You are about to alter the column `buyPrice` on the `product` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(65,30)`.
  - You are about to alter the column `sellPrice` on the `product` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(65,30)`.
  - Added the required column `imagePath` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nik` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Made the column `address` on table `customer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phone` on table `customer` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `transaction` DROP FOREIGN KEY `Transaction_customerId_fkey`;

-- DropForeignKey
ALTER TABLE `transaction` DROP FOREIGN KEY `Transaction_discountId_fkey`;

-- DropForeignKey
ALTER TABLE `transactiondetail` DROP FOREIGN KEY `TransactionDetail_discountId_fkey`;

-- DropIndex
DROP INDEX `Transaction_customerId_fkey` ON `transaction`;

-- DropIndex
DROP INDEX `Transaction_discountId_fkey` ON `transaction`;

-- DropIndex
DROP INDEX `TransactionDetail_discountId_fkey` ON `transactiondetail`;

-- AlterTable
ALTER TABLE `customer` ADD COLUMN `imagePath` VARCHAR(191) NOT NULL,
    ADD COLUMN `nik` VARCHAR(191) NOT NULL,
    MODIFY `address` VARCHAR(191) NOT NULL,
    MODIFY `phone` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `discount` ADD COLUMN `endAt` DATETIME(3) NULL,
    ADD COLUMN `startAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `product` MODIFY `buyPrice` DECIMAL(65, 30) NOT NULL,
    MODIFY `sellPrice` DECIMAL(65, 30) NOT NULL;

-- AlterTable
ALTER TABLE `transaction` ADD COLUMN `paidAmount` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    MODIFY `customerId` INTEGER NULL,
    MODIFY `discountId` INTEGER NULL;

-- AlterTable
ALTER TABLE `transactiondetail` MODIFY `discountId` INTEGER NULL;

-- CreateTable
CREATE TABLE `Installment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transactionId` INTEGER NOT NULL,
    `amountPaid` DECIMAL(65, 30) NOT NULL,
    `paidAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `method` VARCHAR(191) NOT NULL,
    `note` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_discountId_fkey` FOREIGN KEY (`discountId`) REFERENCES `Discount`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Installment` ADD CONSTRAINT `Installment_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `Transaction`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransactionDetail` ADD CONSTRAINT `TransactionDetail_discountId_fkey` FOREIGN KEY (`discountId`) REFERENCES `Discount`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
