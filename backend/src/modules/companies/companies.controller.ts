import { Body, Controller, Get, Param, Patch } from "@nestjs/common";
import { CompanyModulesService } from "../company-modules/company-modules.service";
import { CompaniesService } from "./companies.service";

@Controller("companies")
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly companyModulesService: CompanyModulesService,
  ) {}

  @Get()
  findAll() {
    return this.companiesService.findAll();
  }

  @Patch(":id/modules/:moduleKey")
  updateModule(
    @Param("id") companyId: string,
    @Param("moduleKey") moduleKey: string,
    @Body() body: { enabled?: boolean },
  ) {
    return this.companyModulesService.updateForCompany(companyId, moduleKey, body.enabled === true);
  }
}
