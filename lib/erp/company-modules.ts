import {
  getModuleDefinition,
  moduleDependencies,
  moduleRegistry,
  type ModuleKey,
} from "./module-registry";

export type CompanyModuleState = {
  companyId: string;
  moduleKey: ModuleKey;
  enabled: boolean;
};

export type Company = {
  id: string;
  name: string;
  moduleStates: CompanyModuleState[];
};

export const demoCompany: Company = {
  id: "cmp_demo_azla",
  name: "შპს ჩემი კომპანია",
  moduleStates: moduleRegistry.map((module) => ({
    companyId: "cmp_demo_azla",
    moduleKey: module.key,
    enabled: [
      "products",
      "warehouses",
      "inventory",
      "purchases",
      "retail",
      "integrations",
      "ai",
    ].includes(module.key),
  })),
};

export const demoUserPermissions = [
  "dashboard.view",
  "products.view",
  "warehouses.view",
  "inventory.view",
  "purchases.view",
  "retail.view",
  "integrations.view",
  "ai.view",
  "company.modules.manage",
];

export function getEnabledModuleKeys(company: Company) {
  return (company.moduleStates ?? [])
    .filter((state) => state.enabled)
    .map((state) => state.moduleKey);
}

export function getMissingDependencies(
  moduleKey: ModuleKey,
  enabledKeys: ModuleKey[],
) {
  const enabled = new Set(enabledKeys);
  return (moduleDependencies[moduleKey] ?? []).filter((key) => !enabled.has(key));
}

export function getBlockingDependents(
  moduleKey: ModuleKey,
  enabledKeys: ModuleKey[],
) {
  const enabled = new Set(enabledKeys);
  return moduleRegistry
    .filter((module) => enabled.has(module.key))
    .filter((module) => (moduleDependencies[module.key] ?? []).includes(moduleKey))
    .map((module) => module.key);
}

export function getActivationPreview(moduleKey: ModuleKey, company: Company) {
  const enabledKeys = getEnabledModuleKeys(company);
  const missingDependencies = getMissingDependencies(moduleKey, enabledKeys);

  return {
    module: getModuleDefinition(moduleKey),
    missingDependencies: missingDependencies
      .map(getModuleDefinition)
      .filter(Boolean),
    canEnableDirectly: missingDependencies.length === 0,
  };
}

export function resolveAtomicEnableKeys(
  moduleKey: ModuleKey,
  enabledKeys: ModuleKey[],
) {
  const next = new Set(enabledKeys);
  const visit = (key: ModuleKey) => {
    for (const dependency of moduleDependencies[key] ?? []) {
      visit(dependency);
    }
    next.add(key);
  };

  visit(moduleKey);
  return Array.from(next);
}

export function canDisableModule(moduleKey: ModuleKey, company: Company) {
  const enabledKeys = getEnabledModuleKeys(company);
  const blockingDependents = getBlockingDependents(moduleKey, enabledKeys);

  return {
    canDisable: blockingDependents.length === 0,
    blockingDependents: blockingDependents
      .map(getModuleDefinition)
      .filter(Boolean),
  };
}
