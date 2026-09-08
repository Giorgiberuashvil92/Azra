import { Body, Controller, Delete, Get, Headers, Param, Patch, Post } from "@nestjs/common";
import { ProductsService } from "./products.service";

@Controller("products")
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  findAll(@Headers("authorization") authorization?: string) {
    return this.products.findAll(authorization);
  }

  @Post()
  create(@Headers("authorization") authorization: string | undefined, @Body() body: {
    name: string;
    sku?: string;
    barcode?: string;
    category?: string;
    categoryId?: string;
    brand?: string;
    description?: string;
    unit?: string;
    type?: "stocked" | "service" | "expense";
    isPurchasable?: boolean;
    isSellable?: boolean;
    tracksInventory?: boolean;
    tracksLots?: boolean;
    tracksExpiry?: boolean;
    costPrice?: number;
    salePrice?: number;
    currency?: string;
    vatRate?: number;
    discountPercent?: number | null;
    discountAmount?: number | null;
    discountName?: string;
    minStock?: number;
    reorderPoint?: number;
    supplierSku?: string;
    rsName?: string;
    defaultWarehouseId?: string;
  }) {
    return this.products.create(authorization, body);
  }

  @Get("categories")
  findCategories(@Headers("authorization") authorization?: string) {
    return this.products.findCategories(authorization);
  }

  @Post("categories")
  createCategory(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: { name: string; parentId?: string | null },
  ) {
    return this.products.createCategory(authorization, body);
  }

  @Patch("categories/:id")
  updateCategory(
    @Headers("authorization") authorization: string | undefined,
    @Param("id") id: string,
    @Body() body: { name: string },
  ) {
    return this.products.updateCategory(authorization, id, body);
  }

  @Delete("categories/:id")
  deleteCategory(@Headers("authorization") authorization: string | undefined, @Param("id") id: string) {
    return this.products.deleteCategory(authorization, id);
  }

  @Get(":id")
  findOne(@Headers("authorization") authorization: string | undefined, @Param("id") id: string) {
    return this.products.findOne(authorization, id);
  }

  @Patch(":id")
  update(@Headers("authorization") authorization: string | undefined, @Param("id") id: string, @Body() body: {
    name?: string;
    sku?: string;
    barcode?: string;
    category?: string;
    categoryId?: string;
    brand?: string;
    description?: string;
    unit?: string;
    type?: "stocked" | "service" | "expense";
    isPurchasable?: boolean;
    isSellable?: boolean;
    tracksInventory?: boolean;
    tracksLots?: boolean;
    tracksExpiry?: boolean;
    costPrice?: number;
    salePrice?: number;
    currency?: string;
    vatRate?: number;
    discountPercent?: number | null;
    discountAmount?: number | null;
    discountName?: string;
    minStock?: number;
    reorderPoint?: number;
    supplierSku?: string;
    rsName?: string;
    defaultWarehouseId?: string;
    status?: string;
  }) {
    return this.products.update(authorization, id, body);
  }

  @Delete(":id")
  delete(@Headers("authorization") authorization: string | undefined, @Param("id") id: string) {
    return this.products.delete(authorization, id);
  }
}
