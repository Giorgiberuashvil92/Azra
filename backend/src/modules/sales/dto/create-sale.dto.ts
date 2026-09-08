import { Type } from "class-transformer";
import { IsArray, IsIn, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";

class CreateSaleLineDto {
  @IsString()
  productId!: string;

  @IsNumber()
  @Min(0.001)
  quantity!: number;
}

export class CreateSaleDto {
  @IsIn(["cash", "card", "other"])
  paymentMethod!: "cash" | "card" | "other";

  @IsNumber()
  @Min(0)
  @IsOptional()
  discountPercent?: number;

  @IsString()
  @IsOptional()
  warehouseId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleLineDto)
  items!: CreateSaleLineDto[];
}
