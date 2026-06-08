-- CreateTable
CREATE TABLE "ConnectorSync" (
    "id" TEXT NOT NULL,
    "connectorKey" TEXT NOT NULL,
    "metricKey" TEXT NOT NULL,
    "lastSyncAt" TIMESTAMP(3) NOT NULL,
    "lastCreated" INTEGER NOT NULL DEFAULT 0,
    "lastResultJson" JSONB,

    CONSTRAINT "ConnectorSync_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConnectorSync_connectorKey_metricKey_key" ON "ConnectorSync"("connectorKey", "metricKey");
