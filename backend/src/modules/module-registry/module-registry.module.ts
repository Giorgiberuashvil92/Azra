import { Module } from "@nestjs/common";
import { ModuleRegistryController } from "./module-registry.controller";
import { ModuleRegistryService } from "./module-registry.service";

@Module({
  controllers: [ModuleRegistryController],
  exports: [ModuleRegistryService],
  providers: [ModuleRegistryService],
})
export class ModuleRegistryModule {}
