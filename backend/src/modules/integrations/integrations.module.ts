import { Module } from "@nestjs/common";
import { IntegrationsController } from "./integrations.controller";
import { BalanceIntegrationService } from "./balance-integration.service";

@Module({
  controllers: [IntegrationsController],
  providers: [BalanceIntegrationService],
})
export class IntegrationsModule {}
