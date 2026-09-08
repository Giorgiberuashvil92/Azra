import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ModuleRegistryService } from "../module-registry/module-registry.service";
import type { ModuleKey } from "../module-registry/module-registry.types";

@Injectable()
export class CompanyModulesService {
  private readonly demoCompanyId = "cmp_demo_azla";

  constructor(
    private readonly moduleRegistryService: ModuleRegistryService,
    private readonly prisma: PrismaService,
  ) {}

  async getCompany(authorization?: string) {
    return this.getCompanyState(this.getCompanyId(authorization));
  }

  async update(moduleKeyInput: string, enabled: boolean, authorization?: string) {
    if (!this.moduleRegistryService.isValidModuleKey(moduleKeyInput)) {
      throw new NotFoundException("Module does not exist.");
    }

    const moduleKey = moduleKeyInput;
    const companyId = this.getCompanyId(authorization);

    if (enabled) {
      return this.enable(moduleKey, companyId);
    }

    return this.disable(moduleKey, companyId);
  }

  async updateForCompany(companyId: string, moduleKeyInput: string, enabled: boolean) {
    if (!this.moduleRegistryService.isValidModuleKey(moduleKeyInput)) {
      throw new NotFoundException("Module does not exist.");
    }

    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException("Company does not exist.");
    }

    const updatedCompany = enabled
      ? await this.enableModule(moduleKeyInput, companyId)
      : await this.disable(moduleKeyInput, companyId);

    if (enabled) {
      await this.grantModulePermissionsToOwners(companyId, moduleKeyInput);
    }

    return updatedCompany;
  }

  private enable(moduleKey: ModuleKey, companyId: string) {
    return this.enableModule(moduleKey, companyId);
  }

  private async enableModule(moduleKey: ModuleKey, companyId: string) {
    const enabledKeys = await this.getEnabledKeys(companyId);
    const nextEnabled = new Set(this.resolveAtomicEnableKeys(moduleKey, enabledKeys));

    await this.syncEnabledModules(companyId, nextEnabled);

    return this.getCompanyState(companyId);
  }

  private async disable(moduleKey: ModuleKey, companyId: string) {
    const blockingDependents = await this.getBlockingDependents(moduleKey, companyId);

    if (blockingDependents.length > 0) {
      throw new ConflictException({
        error: "MODULE_HAS_ENABLED_DEPENDENTS",
        blockingDependents,
      });
    }

    const enabledKeys = new Set(await this.getEnabledKeys(companyId));
    enabledKeys.delete(moduleKey);

    await this.syncEnabledModules(companyId, enabledKeys);

    return this.getCompanyState(companyId);
  }

  private async getEnabledKeys(companyId: string) {
    const company = await this.getCompanyState(companyId);

    return company.moduleStates
      .filter((state) => state.enabled)
      .map((state) => state.moduleKey as ModuleKey);
  }

  private resolveAtomicEnableKeys(moduleKey: ModuleKey, enabledKeys: ModuleKey[]) {
    const next = new Set(enabledKeys);
    const visit = (key: ModuleKey) => {
      for (const dependency of this.moduleRegistryService.getDependencies(key)) {
        visit(dependency);
      }
      next.add(key);
    };

    visit(moduleKey);
    return Array.from(next);
  }

  private async getBlockingDependents(moduleKey: ModuleKey, companyId: string) {
    const enabled = new Set(await this.getEnabledKeys(companyId));

    return this.moduleRegistryService
      .findAll()
      .filter((module) => enabled.has(module.key))
      .filter((module) =>
        this.moduleRegistryService.getDependencies(module.key).includes(moduleKey),
      );
  }

  private async getCompanyState(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        modules: {
          include: {
            module: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException("Company is not available.");
    }

    const stateByKey = new Map(
      company.modules.map((state) => [state.module.key, state.status === "enabled"]),
    );

    return {
      id: company.id,
      name: company.name,
      moduleStates: this.moduleRegistryService.findAll().map((module) => ({
        companyId: company.id,
        moduleKey: module.key,
        enabled: stateByKey.get(module.key) ?? false,
      })),
    };
  }

  private async syncEnabledModules(companyId: string, enabledKeys: Set<ModuleKey>) {
    await this.prisma.$transaction(
      this.moduleRegistryService.findAll().map((module) =>
        this.prisma.companyModule.upsert({
          where: {
            companyId_moduleId: {
              companyId,
              moduleId: module.id,
            },
          },
          create: {
            companyId,
            moduleId: module.id,
            status: enabledKeys.has(module.key) ? "enabled" : "disabled",
            enabledAt: enabledKeys.has(module.key) ? new Date() : null,
          },
          update: {
            status: enabledKeys.has(module.key) ? "enabled" : "disabled",
            enabledAt: enabledKeys.has(module.key) ? new Date() : null,
          },
        }),
      ),
    );
  }

  private async grantModulePermissionsToOwners(companyId: string, moduleKey: ModuleKey) {
    const ownerRoles = await this.prisma.role.findMany({
      where: { companyId, name: "Owner" },
      select: { id: true },
    });

    const keys = [`${moduleKey}.view`, `${moduleKey}.manage`];

    for (const key of keys) {
      const permission = await this.prisma.permission.upsert({
        where: { key },
        create: { key, description: key },
        update: {},
      });

      for (const role of ownerRoles) {
        await this.prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          create: {
            roleId: role.id,
            permissionId: permission.id,
          },
          update: {},
        });
      }
    }
  }

  private getCompanyId(authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, "");

    if (!token) {
      return this.demoCompanyId;
    }

    try {
      const parsed = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
      if (typeof parsed.companyId === "string") {
        return parsed.companyId;
      }
    } catch {
      throw new UnauthorizedException("Missing or invalid token.");
    }

    throw new UnauthorizedException("Missing or invalid token.");
  }
}
