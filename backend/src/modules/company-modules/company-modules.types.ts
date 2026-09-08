import type { ModuleKey } from "../module-registry/module-registry.types";

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
