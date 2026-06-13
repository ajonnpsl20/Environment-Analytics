-- Provenance + identity for connector reconciliation. NULL sourceRef ⇒ manually
-- entered (a sync never touches it); a non-NULL sourceRef is connector-owned.
-- Nullable-unique: Postgres treats NULLs as distinct, so unlimited manual rows.

-- AlterTable
ALTER TABLE "AirEmissionRecord" ADD COLUMN "sourceRef" TEXT,
ADD COLUMN "sourceHash" TEXT;

ALTER TABLE "WasteRecord" ADD COLUMN "sourceRef" TEXT,
ADD COLUMN "sourceHash" TEXT;

ALTER TABLE "WaterUsageRecord" ADD COLUMN "sourceRef" TEXT,
ADD COLUMN "sourceHash" TEXT;

ALTER TABLE "ElectricityRecord" ADD COLUMN "sourceRef" TEXT,
ADD COLUMN "sourceHash" TEXT;

ALTER TABLE "GasRecord" ADD COLUMN "sourceRef" TEXT,
ADD COLUMN "sourceHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AirEmissionRecord_sourceRef_key" ON "AirEmissionRecord"("sourceRef");

CREATE UNIQUE INDEX "WasteRecord_sourceRef_key" ON "WasteRecord"("sourceRef");

CREATE UNIQUE INDEX "WaterUsageRecord_sourceRef_key" ON "WaterUsageRecord"("sourceRef");

CREATE UNIQUE INDEX "ElectricityRecord_sourceRef_key" ON "ElectricityRecord"("sourceRef");

CREATE UNIQUE INDEX "GasRecord_sourceRef_key" ON "GasRecord"("sourceRef");
