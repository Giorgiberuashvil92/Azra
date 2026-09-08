import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { moduleDependencies, moduleRegistry } from "./module-registry.data";
import type { ModuleKey } from "./module-registry.types";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ModuleRegistryService implements OnModuleInit {
  private readonly logger = new Logger(ModuleRegistryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.syncModuleDefinitions();
    } catch (error) {
      this.logger.warn(`Module registry DB sync skipped: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async syncModuleDefinitions() {
    for (const module of moduleRegistry) {
      await this.prisma.moduleDefinition.upsert({
        where: { key: module.key },
        create: module,
        update: module,
      });
    }

    for (const [moduleKey, dependencyKeys] of Object.entries(moduleDependencies)) {
      const module = await this.prisma.moduleDefinition.findUniqueOrThrow({ where: { key: moduleKey } });

      for (const dependencyKey of dependencyKeys) {
        const requiredModule = await this.prisma.moduleDefinition.findUniqueOrThrow({ where: { key: dependencyKey } });

        await this.prisma.moduleDependency.upsert({
          where: {
            moduleId_requiredModuleId: {
              moduleId: module.id,
              requiredModuleId: requiredModule.id,
            },
          },
          create: {
            moduleId: module.id,
            requiredModuleId: requiredModule.id,
          },
          update: {},
        });
      }
    }
  }

  findAll() {
    return moduleRegistry;
  }

  findOne(key: ModuleKey) {
    return moduleRegistry.find((module) => module.key === key);
  }

  getDependencies(key: ModuleKey) {
    return moduleDependencies[key] ?? [];
  }

  isValidModuleKey(key: string): key is ModuleKey {
    return moduleRegistry.some((module) => module.key === key);
  }
}
