import { Controller, Get } from "@nestjs/common";
import { ModuleRegistryService } from "./module-registry.service";

@Controller("module-registry")
export class ModuleRegistryController {
  constructor(private readonly moduleRegistry: ModuleRegistryService) {}

  @Get()
  findAll() {
    return { modules: this.moduleRegistry.findAll() };
  }
}
