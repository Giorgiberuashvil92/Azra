export type ModuleCategory =
  | "operations"
  | "finance"
  | "team"
  | "relationships"
  | "analytics"
  | "system";

export type ModuleStatus = "active" | "planned";

export type ModuleKey =
  | "products"
  | "warehouses"
  | "inventory"
  | "purchases"
  | "discounts"
  | "retail"
  | "sales"
  | "finance"
  | "accounting"
  | "hr"
  | "payroll"
  | "crm"
  | "projects"
  | "reports"
  | "integrations"
  | "ai";

export type ModuleDefinition = {
  id: string;
  key: ModuleKey;
  name: string;
  description: string;
  icon: string;
  category: ModuleCategory;
  route: string;
  sortOrder: number;
  status: ModuleStatus;
};
