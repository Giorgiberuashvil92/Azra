import { Body, Controller, Get, Headers, Param, Patch, Post } from "@nestjs/common";
import { PurchasesService } from "./purchases.service";

@Controller("purchases")
export class PurchasesController {
  constructor(private readonly purchases: PurchasesService) {}

  @Get()
  findAll(@Headers("authorization") authorization?: string) {
    return this.purchases.findAll(authorization);
  }

  @Post("import")
  importDocument(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: {
      supplierName: string;
      supplierTaxId?: string;
      documentNumber: string;
      documentDate?: string;
      warehouseId?: string;
      lines: Array<{
        externalName: string;
        externalSku?: string;
        quantity: number;
        unitCost: number;
        vatRate?: number;
      }>;
    },
  ) {
    return this.purchases.importDocument(authorization, body);
  }

  @Patch(":id/map-lines")
  mapLines(
    @Headers("authorization") authorization: string | undefined,
    @Param("id") id: string,
    @Body() body: { mappings: Array<{ lineId: string; productId: string }> },
  ) {
    return this.purchases.mapLines(authorization, id, body.mappings);
  }

  @Post(":id/receive")
  receive(
    @Headers("authorization") authorization: string | undefined,
    @Param("id") id: string,
    @Body() body: { warehouseId?: string },
  ) {
    return this.purchases.receive(authorization, id, body.warehouseId);
  }
}
