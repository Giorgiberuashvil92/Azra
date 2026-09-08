import { IsBoolean, IsString } from "class-validator";

export class UpdateCompanyModuleDto {
  @IsString()
  moduleKey!: string;

  @IsBoolean()
  enabled!: boolean;
}
