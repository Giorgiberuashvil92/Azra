import { Module } from "@nestjs/common";
import { ModuleRegistryModule } from "../module-registry/module-registry.module";
import { CompanyModulesController } from "./company-modules.controller";
import { CompanyModulesService } from "./company-modules.service";

@Module({
  controllers: [CompanyModulesController],
  imports: [ModuleRegistryModule],
  providers: [CompanyModulesService],
})
export class CompanyModulesModule {}
