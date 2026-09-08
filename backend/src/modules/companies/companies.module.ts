import { Module } from "@nestjs/common";
import { CompanyModulesService } from "../company-modules/company-modules.service";
import { ModuleRegistryService } from "../module-registry/module-registry.service";
import { CompaniesController } from "./companies.controller";
import { CompaniesService } from "./companies.service";

@Module({
  controllers: [CompaniesController],
  providers: [CompaniesService, CompanyModulesService, ModuleRegistryService],
})
export class CompaniesModule {}
