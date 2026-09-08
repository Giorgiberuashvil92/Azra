CREATE TYPE "DiscountType" AS ENUM (
  'percent',
  'amount',
  'fixed_price',
  'quantity_tier',
  'buy_x_get_y',
  'cart_total',
  'expiry_based',
  'stock_based'
);

CREATE TYPE "DiscountStatus" AS ENUM ('draft', 'active', 'paused', 'expired');

CREATE TYPE "DiscountScope" AS ENUM ('all_products', 'products', 'categories', 'cart');

CREATE TABLE "Discount" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "DiscountType" NOT NULL,
  "scope" "DiscountScope" NOT NULL DEFAULT 'products',
  "value" DECIMAL(65,30),
  "currency" TEXT NOT NULL DEFAULT 'GEL',
  "priority" INTEGER NOT NULL DEFAULT 100,
  "stackable" BOOLEAN NOT NULL DEFAULT false,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "minQuantity" DECIMAL(65,30),
  "minAmount" DECIMAL(65,30),
  "buyQuantity" INTEGER,
  "getQuantity" INTEGER,
  "channel" TEXT NOT NULL DEFAULT 'all',
  "status" "DiscountStatus" NOT NULL DEFAULT 'draft',
  "notes" TEXT,
  "ruleConfig" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DiscountProduct" (
  "id" TEXT NOT NULL,
  "discountId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DiscountProduct_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DiscountCategory" (
  "id" TEXT NOT NULL,
  "discountId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DiscountCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Discount_companyId_name_key" ON "Discount"("companyId", "name");
CREATE INDEX "Discount_companyId_status_idx" ON "Discount"("companyId", "status");
CREATE INDEX "Discount_companyId_type_idx" ON "Discount"("companyId", "type");
CREATE UNIQUE INDEX "DiscountProduct_discountId_productId_key" ON "DiscountProduct"("discountId", "productId");
CREATE INDEX "DiscountProduct_productId_idx" ON "DiscountProduct"("productId");
CREATE UNIQUE INDEX "DiscountCategory_discountId_categoryId_key" ON "DiscountCategory"("discountId", "categoryId");
CREATE INDEX "DiscountCategory_categoryId_idx" ON "DiscountCategory"("categoryId");

ALTER TABLE "Discount" ADD CONSTRAINT "Discount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiscountProduct" ADD CONSTRAINT "DiscountProduct_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiscountProduct" ADD CONSTRAINT "DiscountProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiscountCategory" ADD CONSTRAINT "DiscountCategory_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiscountCategory" ADD CONSTRAINT "DiscountCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
