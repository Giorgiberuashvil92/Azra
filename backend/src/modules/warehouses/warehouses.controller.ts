import { Body, Controller, Get, Headers, Param, Patch, Post } from "@nestjs/common";
import { WarehousesService } from "./warehouses.service";

@Controller("warehouses")
export class WarehousesController {
  constructor(private readonly warehouses: WarehousesService) {}

  @Get()
  findAll(@Headers("authorization") authorization?: string) {
    return this.warehouses.findAll(authorization);
  }

  @Get(":id")
  findOne(@Headers("authorization") authorization: string | undefined, @Param("id") id: string) {
    return this.warehouses.findOne(authorization, id);
  }

  @Post()
  create(@Headers("authorization") authorization: string | undefined, @Body() body: {
    name: string;
    code?: string;
    address?: string;
  }) {
    return this.warehouses.create(authorization, body);
  }

  @Patch(":id")
  update(@Headers("authorization") authorization: string | undefined, @Param("id") id: string, @Body() body: {
    name?: string;
    code?: string;
    address?: string;
    status?: string;
  }) {
    return this.warehouses.update(authorization, id, body);
  }
}
