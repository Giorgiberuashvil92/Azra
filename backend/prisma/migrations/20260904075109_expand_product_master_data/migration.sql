-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'GEL',
ADD COLUMN     "defaultWarehouseId" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "minStock" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "reorderPoint" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "rsName" TEXT,
ADD COLUMN     "supplierSku" TEXT,
ADD COLUMN     "tracksExpiry" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tracksLots" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Product_defaultWarehouseId_idx" ON "Product"("defaultWarehouseId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_defaultWarehouseId_fkey" FOREIGN KEY ("defaultWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
