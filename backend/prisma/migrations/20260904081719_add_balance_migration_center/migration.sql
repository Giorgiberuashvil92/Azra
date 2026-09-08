-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "externalUid" TEXT,
ADD COLUMN     "importBatchId" TEXT,
ADD COLUMN     "lastImportedAt" TIMESTAMP(3),
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN     "syncStatus" TEXT NOT NULL DEFAULT 'local';

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "totals" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalReference" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "externalUid" TEXT NOT NULL,
    "externalCode" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalReference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImportBatch_companyId_provider_entityType_idx" ON "ImportBatch"("companyId", "provider", "entityType");

-- CreateIndex
CREATE INDEX "ExternalReference_companyId_entityType_entityId_idx" ON "ExternalReference"("companyId", "entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalReference_companyId_provider_entityType_externalUid_key" ON "ExternalReference"("companyId", "provider", "entityType", "externalUid");

-- CreateIndex
CREATE INDEX "Product_companyId_source_idx" ON "Product"("companyId", "source");

-- CreateIndex
CREATE INDEX "Product_companyId_externalUid_idx" ON "Product"("companyId", "externalUid");

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalReference" ADD CONSTRAINT "ExternalReference_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
