import { Body, Controller, Get, Headers, Post } from "@nestjs/common";
import { BalanceIntegrationService, BalanceImportRequest } from "./balance-integration.service";

@Controller("integrations")
export class IntegrationsController {
  constructor(private readonly balance: BalanceIntegrationService) {}

  @Get("balance/settings")
  getBalanceSettings(@Headers("authorization") authorization: string | undefined) {
    return this.balance.getSettings(authorization);
  }

  @Post("balance/test")
  testBalanceConnection(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: BalanceImportRequest,
  ) {
    return this.balance.testConnection(authorization, body);
  }

  @Post("balance/preview")
  previewBalanceImport(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: BalanceImportRequest,
  ) {
    return this.balance.previewProducts(authorization, body);
  }

  @Post("balance/import")
  importBalanceProducts(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: BalanceImportRequest,
  ) {
    return this.balance.importProducts(authorization, body);
  }
}
