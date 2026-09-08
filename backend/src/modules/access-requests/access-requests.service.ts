import { Injectable } from "@nestjs/common";
import { hashPassword } from "../../common/password";
import { PrismaService } from "../../prisma/prisma.service";
import {
  moduleDependencies,
  moduleRegistry,
} from "../module-registry/module-registry.data";
import type { ModuleKey } from "../module-registry/module-registry.types";
import {
  CreateAccessRequestDto,
  UpdateAccessRequestStatusDto,
} from "./dto/create-access-request.dto";

@Injectable()
export class AccessRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const [requests, counts, companies] = await Promise.all([
      this.prisma.accessRequest.findMany({
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.accessRequest.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      this.prisma.company.count({
        where: { status: "active" },
      }),
    ]);

    return {
      requests,
      stats: {
        totalRequests: requests.length,
        activeCompanies: companies,
        byStatus: Object.fromEntries(
          counts.map((count) => [count.status, count._count.status]),
        ),
      },
    };
  }

  create(dto: CreateAccessRequestDto) {
    return this.prisma.accessRequest.create({
      data: {
        companyName: dto.companyName.trim(),
        legalName: dto.legalName?.trim(),
        taxId: dto.taxId?.trim(),
        industry: dto.industry?.trim(),
        employeeCount: dto.employeeCount,
        contactName: dto.contactName.trim(),
        contactEmail: dto.contactEmail.toLowerCase().trim(),
        contactPhone: dto.contactPhone?.trim(),
        selectedModules: dto.selectedModules ?? [],
        note: dto.note?.trim(),
        status: "new",
      },
    });
  }

  async updateStatus(id: string, dto: UpdateAccessRequestStatusDto) {
    if (dto.status === "approved") {
      return this.approve(id);
    }

    return this.prisma.accessRequest.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  private async approve(id: string) {
    const request = await this.prisma.accessRequest.findUniqueOrThrow({
      where: { id },
    });

    if (request.status === "approved") {
      return { request, account: null };
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: request.contactEmail },
    });
    const temporaryPassword = existingUser ? null : this.createTemporaryPassword();
    const enabledModuleKeys = this.resolveRequestedModuleKeys(request.selectedModules);

    const result = await this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: request.companyName,
          legalName: request.legalName,
          taxId: request.taxId,
          status: "active",
        },
      });

      const user = existingUser
        ? existingUser
        : await tx.user.create({
            data: {
              email: request.contactEmail,
              name: request.contactName,
              passwordHash: hashPassword(temporaryPassword ?? ""),
              mustChangePassword: true,
            },
          });

      const role = await tx.role.create({
        data: {
          companyId: company.id,
          name: "Owner",
          description: "Tenant owner with full access to selected modules.",
        },
      });

      const permissionKeys = [
        "dashboard.view",
        "company.modules.manage",
        ...enabledModuleKeys.flatMap((moduleKey) => [
          `${moduleKey}.view`,
          `${moduleKey}.manage`,
        ]),
      ];

      for (const key of permissionKeys) {
        const permission = await tx.permission.upsert({
          where: { key },
          create: { key, description: key },
          update: {},
        });

        await tx.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }

      await tx.companyUser.create({
        data: {
          companyId: company.id,
          userId: user.id,
          roleId: role.id,
          status: "active",
        },
      });

      for (const module of moduleRegistry) {
        const enabled = enabledModuleKeys.includes(module.key);

        await tx.companyModule.create({
          data: {
            companyId: company.id,
            moduleId: module.id,
            status: enabled ? "enabled" : "disabled",
            enabledAt: enabled ? new Date() : null,
          },
        });
      }

      const approvedRequest = await tx.accessRequest.update({
        where: { id },
        data: { status: "approved" },
      });

      return { company, request: approvedRequest, user };
    });

    return {
      request: result.request,
      account: {
        companyId: result.company.id,
        companyName: result.company.name,
        email: result.user.email,
        temporaryPassword,
      },
    };
  }

  private createTemporaryPassword() {
    return "12345678";
  }

  private resolveRequestedModuleKeys(selectedModules: string[]) {
    const moduleKeys = new Set(moduleRegistry.map((module) => module.key));
    const enabled = new Set<ModuleKey>();

    const visit = (key: ModuleKey) => {
      for (const dependency of moduleDependencies[key] ?? []) {
        visit(dependency);
      }
      enabled.add(key);
    };

    for (const key of selectedModules) {
      if (moduleKeys.has(key as ModuleKey)) {
        visit(key as ModuleKey);
      }
    }

    return Array.from(enabled);
  }
}
