import { Module } from "@nestjs/common";
import { AccessRequestsModule } from "./modules/access-requests/access-requests.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CompaniesModule } from "./modules/companies/companies.module";
import { CompanyModulesModule } from "./modules/company-modules/company-modules.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { DiscountsModule } from "./modules/discounts/discounts.module";
import { HealthModule } from "./modules/health/health.module";
import { IntegrationsModule } from "./modules/integrations/integrations.module";
import { ModuleRegistryModule } from "./modules/module-registry/module-registry.module";
import { ProductsModule } from "./modules/products/products.module";
import { PurchasesModule } from "./modules/purchases/purchases.module";
import { SalesModule } from "./modules/sales/sales.module";
import { WarehousesModule } from "./modules/warehouses/warehouses.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AccessRequestsModule,
    CompaniesModule,
    DashboardModule,
    ModuleRegistryModule,
    CompanyModulesModule,
    IntegrationsModule,
    DiscountsModule,
    HealthModule,
    ProductsModule,
    WarehousesModule,
    PurchasesModule,
    SalesModule,
  ],
})
export class AppModule {}
