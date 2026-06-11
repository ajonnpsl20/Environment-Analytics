-- CreateTable
CREATE TABLE "GasRecord" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "meterId" TEXT NOT NULL,
    "consumptionM3" DOUBLE PRECISION NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GasRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GasRecord_siteId_idx" ON "GasRecord"("siteId");

-- CreateIndex
CREATE INDEX "GasRecord_periodStart_idx" ON "GasRecord"("periodStart");

-- AddForeignKey
ALTER TABLE "GasRecord" ADD CONSTRAINT "GasRecord_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
