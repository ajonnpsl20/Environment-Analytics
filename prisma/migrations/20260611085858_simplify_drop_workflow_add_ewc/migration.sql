/*
  Warnings:

  - You are about to drop the column `approvedAt` on the `AirEmissionRecord` table. All the data in the column will be lost.
  - You are about to drop the column `approvedById` on the `AirEmissionRecord` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `AirEmissionRecord` table. All the data in the column will be lost.
  - You are about to drop the column `submittedById` on the `AirEmissionRecord` table. All the data in the column will be lost.
  - You are about to drop the column `approvedAt` on the `ElectricityRecord` table. All the data in the column will be lost.
  - You are about to drop the column `approvedById` on the `ElectricityRecord` table. All the data in the column will be lost.
  - You are about to drop the column `offPeakKwh` on the `ElectricityRecord` table. All the data in the column will be lost.
  - You are about to drop the column `peakKwh` on the `ElectricityRecord` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `ElectricityRecord` table. All the data in the column will be lost.
  - You are about to drop the column `submittedById` on the `ElectricityRecord` table. All the data in the column will be lost.
  - You are about to drop the column `approvedAt` on the `WasteRecord` table. All the data in the column will be lost.
  - You are about to drop the column `approvedById` on the `WasteRecord` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `WasteRecord` table. All the data in the column will be lost.
  - You are about to drop the column `submittedById` on the `WasteRecord` table. All the data in the column will be lost.
  - You are about to drop the column `approvedAt` on the `WaterUsageRecord` table. All the data in the column will be lost.
  - You are about to drop the column `approvedById` on the `WaterUsageRecord` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `WaterUsageRecord` table. All the data in the column will be lost.
  - You are about to drop the column `submittedById` on the `WaterUsageRecord` table. All the data in the column will be lost.
  - Added the required column `ewcCode` to the `WasteRecord` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AirEmissionRecord" DROP CONSTRAINT "AirEmissionRecord_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "AirEmissionRecord" DROP CONSTRAINT "AirEmissionRecord_submittedById_fkey";

-- DropForeignKey
ALTER TABLE "ElectricityRecord" DROP CONSTRAINT "ElectricityRecord_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "ElectricityRecord" DROP CONSTRAINT "ElectricityRecord_submittedById_fkey";

-- DropForeignKey
ALTER TABLE "WasteRecord" DROP CONSTRAINT "WasteRecord_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "WasteRecord" DROP CONSTRAINT "WasteRecord_submittedById_fkey";

-- DropForeignKey
ALTER TABLE "WaterUsageRecord" DROP CONSTRAINT "WaterUsageRecord_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "WaterUsageRecord" DROP CONSTRAINT "WaterUsageRecord_submittedById_fkey";

-- DropIndex
DROP INDEX "AirEmissionRecord_status_idx";

-- DropIndex
DROP INDEX "ElectricityRecord_status_idx";

-- DropIndex
DROP INDEX "WasteRecord_status_idx";

-- DropIndex
DROP INDEX "WaterUsageRecord_status_idx";

-- AlterTable
ALTER TABLE "AirEmissionRecord" DROP COLUMN "approvedAt",
DROP COLUMN "approvedById",
DROP COLUMN "status",
DROP COLUMN "submittedById";

-- AlterTable
ALTER TABLE "ElectricityRecord" DROP COLUMN "approvedAt",
DROP COLUMN "approvedById",
DROP COLUMN "offPeakKwh",
DROP COLUMN "peakKwh",
DROP COLUMN "status",
DROP COLUMN "submittedById";

-- AlterTable
ALTER TABLE "WasteRecord" DROP COLUMN "approvedAt",
DROP COLUMN "approvedById",
DROP COLUMN "status",
DROP COLUMN "submittedById",
ADD COLUMN     "ewcCode" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "WaterUsageRecord" DROP COLUMN "approvedAt",
DROP COLUMN "approvedById",
DROP COLUMN "status",
DROP COLUMN "submittedById";

-- DropEnum
DROP TYPE "RecordStatus";
