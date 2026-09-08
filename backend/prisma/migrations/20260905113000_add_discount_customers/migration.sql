CREATE TABLE "Customer" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "taxId" TEXT,
  "personalId" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "source" TEXT NOT NULL DEFAULT 'manual',
  "externalUid" TEXT,
  "externalData" JSONB,
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DiscountCustomer" (
  "id" TEXT NOT NULL,
  "discountId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DiscountCustomer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Customer_companyId_code_key" ON "Customer"("companyId", "code");
CREATE UNIQUE INDEX "Customer_companyId_taxId_key" ON "Customer"("companyId", "taxId");
CREATE UNIQUE INDEX "Customer_companyId_personalId_key" ON "Customer"("companyId", "personalId");
CREATE INDEX "Customer_companyId_idx" ON "Customer"("companyId");
CREATE INDEX "Customer_companyId_source_idx" ON "Customer"("companyId", "source");
CREATE INDEX "Customer_companyId_externalUid_idx" ON "Customer"("companyId", "externalUid");
CREATE UNIQUE INDEX "DiscountCustomer_discountId_customerId_key" ON "DiscountCustomer"("discountId", "customerId");
CREATE INDEX "DiscountCustomer_customerId_idx" ON "DiscountCustomer"("customerId");

ALTER TABLE "Customer" ADD CONSTRAINT "Customer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiscountCustomer" ADD CONSTRAINT "DiscountCustomer_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiscountCustomer" ADD CONSTRAINT "DiscountCustomer_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
