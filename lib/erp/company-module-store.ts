import {
  canDisableModule,
  demoCompany,
  getEnabledModuleKeys,
  resolveAtomicEnableKeys,
  type Company,
} from "./company-modules";
import type { ModuleKey } from "./module-registry";

let company: Company = demoCompany;

export function getCompanyModuleState() {
  return company;
}

export function enableCompanyModule(moduleKey: ModuleKey) {
  const enabledKeys = getEnabledModuleKeys(company);
  const nextEnabled = new Set(resolveAtomicEnableKeys(moduleKey, enabledKeys));

  company = {
    ...company,
    moduleStates: company.moduleStates.map((state) => ({
      ...state,
      enabled: nextEnabled.has(state.moduleKey),
    })),
  };

  return company;
}

export function disableCompanyModule(moduleKey: ModuleKey) {
  const disableState = canDisableModule(moduleKey, company);

  if (!disableState.canDisable) {
    return {
      company,
      error: "MODULE_HAS_ENABLED_DEPENDENTS",
      blockingDependents: disableState.blockingDependents,
    };
  }

  company = {
    ...company,
    moduleStates: company.moduleStates.map((state) =>
      state.moduleKey === moduleKey ? { ...state, enabled: false } : state,
    ),
  };

  return { company };
}
