-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SystemAdmin', 'SiteAdmin', 'DataEntryUser');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED', 'RETURNED');

-- CreateEnum
CREATE TYPE "WasteType" AS ENUM ('HAZARDOUS', 'NON_HAZARDOUS', 'RECYCLABLE');

-- CreateEnum
CREATE TYPE "WaterSource" AS ENUM ('MAINS', 'BOREHOLE', 'RAINWATER', 'SURFACE_WATER', 'RECYCLED', 'OTHER');

-- CreateEnum
CREATE TYPE "MeasurementMethod" AS ENUM ('CONTINUOUS', 'PERIODIC', 'CALCULATED', 'ESTIMATED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'RETURNED', 'EDITED', 'DELETED', 'IMPORTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'DataEntryUser',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'United Kingdom',
    "operationalType" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AirEmissionRecord" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "stackId" TEXT NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL,
    "pollutantType" TEXT NOT NULL,
    "concentration" DOUBLE PRECISION NOT NULL,
    "concentrationUnit" TEXT NOT NULL,
    "flowRate" DOUBLE PRECISION,
    "totalEmissions" DOUBLE PRECISION,
    "measurementMethod" "MeasurementMethod" NOT NULL,
    "equipmentReference" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submittedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AirEmissionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WasteRecord" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "wasteType" "WasteType" NOT NULL,
    "streamCategory" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "disposalMethod" TEXT NOT NULL,
    "contractor" TEXT NOT NULL,
    "wtnReference" TEXT NOT NULL,
    "transferDate" TIMESTAMP(3) NOT NULL,
    "wtnDocumentR2Key" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submittedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WasteRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaterUsageRecord" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "meterId" TEXT NOT NULL,
    "readingStart" DOUBLE PRECISION NOT NULL,
    "readingEnd" DOUBLE PRECISION NOT NULL,
    "consumptionM3" DOUBLE PRECISION NOT NULL,
    "source" "WaterSource" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submittedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaterUsageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectricityRecord" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "meterId" TEXT NOT NULL,
    "consumptionKwh" DOUBLE PRECISION NOT NULL,
    "peakKwh" DOUBLE PRECISION,
    "offPeakKwh" DOUBLE PRECISION,
    "renewablePercent" DOUBLE PRECISION,
    "supplier" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submittedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectricityRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "notes" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Site_siteId_key" ON "Site"("siteId");

-- CreateIndex
CREATE INDEX "SiteAssignment_siteId_idx" ON "SiteAssignment"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteAssignment_userId_siteId_key" ON "SiteAssignment"("userId", "siteId");

-- CreateIndex
CREATE INDEX "AirEmissionRecord_siteId_idx" ON "AirEmissionRecord"("siteId");

-- CreateIndex
CREATE INDEX "AirEmissionRecord_status_idx" ON "AirEmissionRecord"("status");

-- CreateIndex
CREATE INDEX "AirEmissionRecord_measuredAt_idx" ON "AirEmissionRecord"("measuredAt");

-- CreateIndex
CREATE INDEX "WasteRecord_siteId_idx" ON "WasteRecord"("siteId");

-- CreateIndex
CREATE INDEX "WasteRecord_status_idx" ON "WasteRecord"("status");

-- CreateIndex
CREATE INDEX "WasteRecord_transferDate_idx" ON "WasteRecord"("transferDate");

-- CreateIndex
CREATE INDEX "WaterUsageRecord_siteId_idx" ON "WaterUsageRecord"("siteId");

-- CreateIndex
CREATE INDEX "WaterUsageRecord_status_idx" ON "WaterUsageRecord"("status");

-- CreateIndex
CREATE INDEX "WaterUsageRecord_periodStart_idx" ON "WaterUsageRecord"("periodStart");

-- CreateIndex
CREATE INDEX "ElectricityRecord_siteId_idx" ON "ElectricityRecord"("siteId");

-- CreateIndex
CREATE INDEX "ElectricityRecord_status_idx" ON "ElectricityRecord"("status");

-- CreateIndex
CREATE INDEX "ElectricityRecord_periodStart_idx" ON "ElectricityRecord"("periodStart");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- AddForeignKey
ALTER TABLE "SiteAssignment" ADD CONSTRAINT "SiteAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteAssignment" ADD CONSTRAINT "SiteAssignment_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AirEmissionRecord" ADD CONSTRAINT "AirEmissionRecord_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AirEmissionRecord" ADD CONSTRAINT "AirEmissionRecord_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AirEmissionRecord" ADD CONSTRAINT "AirEmissionRecord_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteRecord" ADD CONSTRAINT "WasteRecord_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteRecord" ADD CONSTRAINT "WasteRecord_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteRecord" ADD CONSTRAINT "WasteRecord_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterUsageRecord" ADD CONSTRAINT "WaterUsageRecord_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterUsageRecord" ADD CONSTRAINT "WaterUsageRecord_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterUsageRecord" ADD CONSTRAINT "WaterUsageRecord_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectricityRecord" ADD CONSTRAINT "ElectricityRecord_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectricityRecord" ADD CONSTRAINT "ElectricityRecord_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectricityRecord" ADD CONSTRAINT "ElectricityRecord_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
