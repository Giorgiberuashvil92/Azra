import { Body, Controller, Get, Headers, Post } from "@nestjs/common";
import { CreateSaleDto } from "./dto/create-sale.dto";
import { SalesService } from "./sales.service";

@Controller("retail/sales")
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  findAll(@Headers("authorization") authorization?: string) {
    return this.salesService.findAll(authorization);
  }

  @Post()
  create(@Headers("authorization") authorization: string | undefined, @Body() dto: CreateSaleDto) {
    return this.salesService.create(authorization, dto);
  }
}
