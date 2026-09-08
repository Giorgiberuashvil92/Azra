import {
  homeModule,
  moduleCategoryLabels,
  moduleRegistry,
  type ModuleCategory,
} from "./module-registry";
import type { Company } from "./company-modules";
import { getEnabledModuleKeys } from "./company-modules";

export type SidebarItem = {
  label: string;
  route: string;
  icon: typeof homeModule.icon;
  active?: boolean;
};

export type SidebarGroup = {
  label?: string;
  items: SidebarItem[];
};

export function buildErpSidebar({
  company,
  permissions,
  activeRoute,
}: {
  company: Company;
  permissions: string[];
  activeRoute: string;
}) {
  const enabledKeys = new Set(getEnabledModuleKeys(company));
  const allowed = new Set(permissions);
  const groups: SidebarGroup[] = [
    {
      items: [
        {
          label: homeModule.name,
          route: homeModule.route,
          icon: homeModule.icon,
          active: activeRoute === homeModule.route,
        },
      ],
    },
  ];

  const categories: ModuleCategory[] = [
    "operations",
    "finance",
    "team",
    "relationships",
    "analytics",
  ];

  for (const category of categories) {
    const items = moduleRegistry
      .filter((module) => module.category === category)
      .filter((module) => enabledKeys.has(module.key))
      .filter((module) => allowed.has(`${module.key}.view`))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((module) => ({
        label: module.name,
        route: module.route,
        icon: module.icon,
        active: activeRoute === module.route || activeRoute.startsWith(`${module.route}/`),
      }));

    if (items.length > 0) {
      groups.push({ label: moduleCategoryLabels[category], items });
    }
  }

  const systemItems = moduleRegistry
    .filter((module) => module.category === "system")
    .filter((module) => enabledKeys.has(module.key))
    .filter((module) => allowed.has(`${module.key}.view`))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((module) => ({
      label: module.name,
      route: module.route,
      icon: module.icon,
      active: activeRoute === module.route,
    }));

  groups.push({
    label: moduleCategoryLabels.system,
    items: [
      ...systemItems,
      ...(allowed.has("company.modules.manage")
        ? [
            {
              label: "პარამეტრები",
              route: "/erp/settings",
              icon: homeModule.icon,
              active: activeRoute === "/erp/settings",
            },
          ]
        : []),
    ],
  });

  return groups;
}
