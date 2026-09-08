import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { hashPassword, verifyPassword } from "../../common/password";
import { PrismaService } from "../../prisma/prisma.service";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(dto: LoginDto) {
    const user = await this.withDatabaseAvailabilityCheck(() =>
      this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase().trim() },
        include: {
          companies: {
            where: dto.companyId ? { companyId: dto.companyId } : undefined,
            include: {
              company: {
                include: {
                  modules: {
                    include: { module: true },
                  },
                },
              },
              role: {
                include: {
                  permissions: {
                    include: { permission: true },
                  },
                },
              },
            },
          },
        },
      }),
    );

    if (!user || !verifyPassword(dto.password, user.passwordHash)) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    const activeMembership = user.companies.find(
      (membership) => membership.status === "active",
    );

    if (!activeMembership) {
      throw new UnauthorizedException("User has no active company access.");
    }

    if (!activeMembership.role) {
      throw new UnauthorizedException("User has no assigned role.");
    }

    const permissions = this.resolvePermissions(activeMembership);

    return {
      accessToken: this.createDemoToken(user.id, activeMembership.companyId),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        mustChangePassword: user.mustChangePassword,
      },
      activeCompany: {
        id: activeMembership.company.id,
        name: activeMembership.company.name,
        legalName: activeMembership.company.legalName,
      },
      role: {
        id: activeMembership.role.id,
        name: activeMembership.role.name,
      },
      permissions,
    };
  }

  async me(authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, "");
    const parsed = this.parseDemoToken(token);

    if (!parsed) {
      throw new UnauthorizedException("Missing or invalid token.");
    }

    const user = await this.withDatabaseAvailabilityCheck(() =>
      this.prisma.user.findUnique({
        where: { id: parsed.userId },
        include: {
          companies: {
            where: { companyId: parsed.companyId },
            include: {
              company: {
                include: {
                  modules: {
                    include: { module: true },
                  },
                },
              },
              role: {
                include: {
                  permissions: {
                    include: { permission: true },
                  },
                },
              },
            },
          },
        },
      }),
    );

    if (!user || user.companies.length === 0) {
      throw new UnauthorizedException("Session is no longer valid.");
    }

    const membership = user.companies[0];

    if (!membership.role) {
      throw new UnauthorizedException("User has no assigned role.");
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        mustChangePassword: user.mustChangePassword,
      },
      activeCompany: {
        id: membership.company.id,
        name: membership.company.name,
        legalName: membership.company.legalName,
      },
      role: {
        id: membership.role.id,
        name: membership.role.name,
      },
      permissions: this.resolvePermissions(membership),
    };
  }

  private resolvePermissions(membership: {
    role: {
      name: string;
      permissions: { permission: { key: string } }[];
    } | null;
    company: {
      modules: {
        status: string;
        module: { key: string };
      }[];
    };
  }) {
    const permissions = new Set(
      membership.role?.permissions.map(({ permission }) => permission.key) ?? [],
    );

    if (membership.role?.name === "Owner") {
      permissions.add("dashboard.view");
      permissions.add("company.modules.manage");

      for (const state of membership.company.modules) {
        if (state.status !== "enabled") continue;
        permissions.add(`${state.module.key}.view`);
        permissions.add(`${state.module.key}.manage`);
      }
    }

    return Array.from(permissions);
  }

  async changePassword(authorization: string | undefined, dto: ChangePasswordDto) {
    const token = authorization?.replace(/^Bearer\s+/i, "");
    const parsed = this.parseDemoToken(token);

    if (!parsed) {
      throw new UnauthorizedException("Missing or invalid token.");
    }

    const user = await this.withDatabaseAvailabilityCheck(() =>
      this.prisma.user.findUnique({
        where: { id: parsed.userId },
      }),
    );

    if (!user || !verifyPassword(dto.currentPassword, user.passwordHash)) {
      throw new UnauthorizedException("Current password is invalid.");
    }

    await this.withDatabaseAvailabilityCheck(() =>
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: hashPassword(dto.newPassword),
          mustChangePassword: false,
        },
      }),
    );

    return { success: true };
  }

  private createDemoToken(userId: string, companyId: string) {
    return Buffer.from(JSON.stringify({ userId, companyId })).toString("base64url");
  }

  private parseDemoToken(token?: string) {
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

  private async withDatabaseAvailabilityCheck<T>(operation: () => Promise<T>) {
    try {
      return await operation();
    } catch (error) {
      if (this.isDatabaseAvailabilityError(error)) {
        throw new ServiceUnavailableException(
          "Database is not available. Check DATABASE_URL and PostgreSQL access.",
        );
      }

      throw error;
    }
  }

  private isDatabaseAvailabilityError(error: unknown) {
    if (!error || typeof error !== "object") {
      return false;
    }

    const code = "code" in error ? error.code : undefined;
    return (
      code === "P1000" ||
      code === "P1001" ||
      code === "P1002" ||
      code === "P1010"
    );
  }
}
