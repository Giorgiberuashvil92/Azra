-- Add structured product categories while keeping the legacy Product.category text path.
CREATE TABLE "ProductCategory" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "parentId" TEXT,
  "name" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "level" INTEGER NOT NULL DEFAULT 1,
  "source" TEXT NOT NULL DEFAULT 'manual',
  "externalUid" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Product" ADD COLUMN "categoryId" TEXT;

CREATE UNIQUE INDEX "ProductCategory_companyId_parentId_name_key" ON "ProductCategory"("companyId", "parentId", "name");
CREATE UNIQUE INDEX "ProductCategory_companyId_path_key" ON "ProductCategory"("companyId", "path");
CREATE INDEX "ProductCategory_companyId_idx" ON "ProductCategory"("companyId");
CREATE INDEX "ProductCategory_parentId_idx" ON "ProductCategory"("parentId");
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ProductCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
