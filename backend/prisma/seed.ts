import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../src/common/password";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  moduleDependencies,
  moduleRegistry,
} from "../src/modules/module-registry/module-registry.data";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed AZLA API.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  for (const module of moduleRegistry) {
    await prisma.moduleDefinition.upsert({
      where: { key: module.key },
      create: module,
      update: module,
    });
  }

  for (const [moduleKey, dependencyKeys] of Object.entries(moduleDependencies)) {
    const module = await prisma.moduleDefinition.findUniqueOrThrow({
      where: { key: moduleKey },
    });

    for (const dependencyKey of dependencyKeys) {
      const requiredModule = await prisma.moduleDefinition.findUniqueOrThrow({
        where: { key: dependencyKey },
      });

      await prisma.moduleDependency.upsert({
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

  const company = await prisma.company.upsert({
    where: { id: "cmp_demo_azla" },
    create: {
      id: "cmp_demo_azla",
      name: "შპს ჩემი კომპანია",
      legalName: "შპს ჩემი კომპანია",
    },
    update: {
      name: "შპს ჩემი კომპანია",
      legalName: "შპს ჩემი კომპანია",
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "admin@azla.ge" },
    create: {
      email: "admin@azla.ge",
      name: "გიორგი",
      passwordHash: hashPassword("admin123"),
    },
    update: {
      name: "გიორგი",
      passwordHash: hashPassword("admin123"),
    },
  });

  const role = await prisma.role.upsert({
    where: {
      companyId_name: {
        companyId: company.id,
        name: "Admin",
      },
    },
    create: {
      companyId: company.id,
      name: "Admin",
      description: "სრული წვდომა demo კომპანიაზე.",
    },
    update: {},
  });

  const permissionKeys = [
    "dashboard.view",
    "company.modules.manage",
    ...moduleRegistry.flatMap((module) => [
      `${module.key}.view`,
      `${module.key}.manage`,
    ]),
  ];

  for (const key of permissionKeys) {
    const permission = await prisma.permission.upsert({
      where: { key },
      create: {
        key,
        description: key,
      },
      update: {},
    });

    await prisma.rolePermission.upsert({
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

  await prisma.companyUser.upsert({
    where: {
      companyId_userId: {
        companyId: company.id,
        userId: user.id,
      },
    },
    create: {
      companyId: company.id,
      userId: user.id,
      roleId: role.id,
    },
    update: {
      roleId: role.id,
    },
  });

  const enabledKeys = new Set([
    "products",
    "warehouses",
    "inventory",
    "purchases",
    "discounts",
    "retail",
    "integrations",
    "ai",
  ]);

  for (const module of moduleRegistry) {
    await prisma.companyModule.upsert({
      where: {
        companyId_moduleId: {
          companyId: company.id,
          moduleId: module.id,
        },
      },
      create: {
        companyId: company.id,
        moduleId: module.id,
        status: enabledKeys.has(module.key) ? "enabled" : "disabled",
        enabledAt: enabledKeys.has(module.key) ? new Date() : null,
      },
      update: {
        status: enabledKeys.has(module.key) ? "enabled" : "disabled",
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
