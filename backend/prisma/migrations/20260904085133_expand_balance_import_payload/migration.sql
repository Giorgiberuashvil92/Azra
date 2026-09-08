-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "discountAmount" DECIMAL(65,30),
ADD COLUMN     "discountName" TEXT,
ADD COLUMN     "discountPercent" DECIMAL(65,30),
ADD COLUMN     "externalData" JSONB;

-- AlterTable
ALTER TABLE "Warehouse" ADD COLUMN     "externalData" JSONB,
ADD COLUMN     "externalUid" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'manual';

-- CreateIndex
CREATE INDEX "Warehouse_companyId_externalUid_idx" ON "Warehouse"("companyId", "externalUid");
