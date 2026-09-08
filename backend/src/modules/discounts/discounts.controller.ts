import { Body, Controller, Delete, Get, Headers, Param, Patch, Post } from "@nestjs/common";
import { DiscountsService, type DiscountInput } from "./discounts.service";

@Controller("discounts")
export class DiscountsController {
  constructor(private readonly discounts: DiscountsService) {}

  @Get()
  findAll(@Headers("authorization") authorization?: string) {
    return this.discounts.findAll(authorization);
  }

  @Get("customers")
  findCustomers(@Headers("authorization") authorization?: string) {
    return this.discounts.findCustomers(authorization);
  }

  @Post()
  create(@Headers("authorization") authorization: string | undefined, @Body() body: DiscountInput) {
    return this.discounts.create(authorization, body);
  }

  @Patch(":id")
  update(
    @Headers("authorization") authorization: string | undefined,
    @Param("id") id: string,
    @Body() body: Partial<DiscountInput>,
  ) {
    return this.discounts.update(authorization, id, body);
  }

  @Delete(":id")
  delete(@Headers("authorization") authorization: string | undefined, @Param("id") id: string) {
    return this.discounts.delete(authorization, id);
  }
}
