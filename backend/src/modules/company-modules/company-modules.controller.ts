import { Body, Controller, Get, Headers, Patch } from "@nestjs/common";
import { CompanyModulesService } from "./company-modules.service";
import { UpdateCompanyModuleDto } from "./dto/update-company-module.dto";

@Controller("company-modules")
export class CompanyModulesController {
  constructor(private readonly companyModules: CompanyModulesService) {}

  @Get()
  async getCompanyModules(@Headers("authorization") authorization?: string) {
    return { company: await this.companyModules.getCompany(authorization) };
  }

  @Patch()
  async updateCompanyModule(
    @Body() body: UpdateCompanyModuleDto,
    @Headers("authorization") authorization?: string,
  ) {
    return {
      company: await this.companyModules.update(
        body.moduleKey,
        body.enabled,
        authorization,
      ),
    };
  }
}
