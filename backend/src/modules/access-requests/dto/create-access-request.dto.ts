import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateAccessRequestDto {
  @IsString()
  @MaxLength(160)
  companyName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  legalName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  taxId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  industry?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  employeeCount?: string;

  @IsString()
  @MaxLength(120)
  contactName!: string;

  @IsEmail()
  contactEmail!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  contactPhone?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  selectedModules?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(800)
  note?: string;
}

export class UpdateAccessRequestStatusDto {
  @IsIn(["new", "contacted", "approved", "rejected"])
  status!: "new" | "contacted" | "approved" | "rejected";
}
