import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, "");
    const parsed = this.parseToken(token);

    if (!parsed) {
      throw new UnauthorizedException("Missing or invalid token.");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: parsed.userId },
      include: {
        companies: {
          where: { companyId: parsed.companyId, status: "active" },
          include: {
            company: {
              include: {
                modules: { include: { module: true } },
                notifications: { where: { readAt: null } },
                users: true,
              },
            },
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    const membership = user?.companies[0];

    if (!user || !membership?.role) {
      throw new UnauthorizedException("Session is no longer valid.");
    }

    const enabledModules = membership.company.modules
      .filter((state) => state.status === "enabled")
      .map((state) => ({
        key: state.module.key,
        name: state.module.name,
        category: state.module.category,
        route: state.module.route,
      }));

    const plannedModules = membership.company.modules
      .filter((state) => state.status === "disabled")
      .map((state) => ({
        key: state.module.key,
        name: state.module.name,
        category: state.module.category,
        route: state.module.route,
      }));

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      company: {
        id: membership.company.id,
        name: membership.company.name,
        legalName: membership.company.legalName,
        taxId: membership.company.taxId,
      },
      role: {
        id: membership.role.id,
        name: membership.role.name,
      },
      permissions: membership.role.permissions.map(({ permission }) => permission.key),
      metrics: {
        enabledModules: enabledModules.length,
        availableModules: membership.company.modules.length,
        teamMembers: membership.company.users.length,
        unreadNotifications: membership.company.notifications.length,
      },
      enabledModules,
      plannedModules,
    };
  }

  private parseToken(token?: string) {
    if (!token) {
      return null;
    }

    try {
      const parsed = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
      if (typeof parsed.userId !== "string" || typeof parsed.companyId !== "string") {
        return null;
      }

      return parsed as { userId: string; companyId: string };
    } catch {
      return null;
    }
  }
}
