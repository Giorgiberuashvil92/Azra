import type { ModuleDefinition, ModuleKey } from "./module-registry.types";

export const moduleRegistry: ModuleDefinition[] = [
  { id: "mod_products", key: "products", name: "პროდუქტები", description: "პროდუქტის კატალოგი, SKU, შტრიხკოდი და სტატუსები.", icon: "Package", category: "operations", route: "/erp/products", sortOrder: 10, status: "active" },
  { id: "mod_warehouses", key: "warehouses", name: "საწყობები", description: "კომპანიის საწყობები, კოდები და მისამართები.", icon: "Building", category: "operations", route: "/erp/warehouses", sortOrder: 20, status: "active" },
  { id: "mod_inventory", key: "inventory", name: "ინვენტარი", description: "მარაგი პროდუქტისა და საწყობის მიხედვით.", icon: "Boxes", category: "operations", route: "/erp/inventory", sortOrder: 30, status: "active" },
  { id: "mod_purchases", key: "purchases", name: "შესყიდვები", description: "მომწოდებლები, შეკვეთები და მიღებები.", icon: "Truck", category: "operations", route: "/erp/purchases", sortOrder: 40, status: "active" },
  { id: "mod_discounts", key: "discounts", name: "ფასდაკლებები", description: "ფასდაკლების წესები პროდუქტებზე, კატეგორიებზე და კალათაზე.", icon: "BadgePercent", category: "operations", route: "/erp/discounts", sortOrder: 45, status: "active" },
  { id: "mod_retail", key: "retail", name: "მაღაზია", description: "მარტივი POS სივრცე გაყიდვებისთვის, ფილიალებისთვის, მარაგისა და დღიური რეპორტებისთვის.", icon: "Store", category: "operations", route: "/erp/retail", sortOrder: 48, status: "active" },
  { id: "mod_sales", key: "sales", name: "გაყიდვები", description: "მომხმარებლები, შეკვეთები და მიწოდებები.", icon: "ShoppingCart", category: "operations", route: "/erp/sales", sortOrder: 50, status: "planned" },
  { id: "mod_finance", key: "finance", name: "ფინანსები", description: "შემოსავლები, ხარჯები და გადახდები.", icon: "WalletCards", category: "finance", route: "/erp/finance", sortOrder: 10, status: "planned" },
  { id: "mod_accounting", key: "accounting", name: "ბუღალტერია", description: "აღრიცხვის პროცესები და საბუღალტრო რეპორტები.", icon: "ReceiptText", category: "finance", route: "/erp/accounting", sortOrder: 20, status: "planned" },
  { id: "mod_hr", key: "hr", name: "თანამშრომლები", description: "თანამშრომლების პროფილები და დასწრება.", icon: "Users", category: "team", route: "/erp/hr", sortOrder: 10, status: "planned" },
  { id: "mod_payroll", key: "payroll", name: "ხელფასები", description: "ხელფასების და ბონუსების მართვა.", icon: "CreditCard", category: "team", route: "/erp/payroll", sortOrder: 20, status: "planned" },
  { id: "mod_crm", key: "crm", name: "CRM", description: "კონტაქტები, ლიდები და ურთიერთობები.", icon: "Handshake", category: "relationships", route: "/erp/crm", sortOrder: 10, status: "planned" },
  { id: "mod_projects", key: "projects", name: "პროექტები", description: "დავალებები, ვადები და სამუშაო ნაკადები.", icon: "FolderKanban", category: "relationships", route: "/erp/projects", sortOrder: 20, status: "planned" },
  { id: "mod_reports", key: "reports", name: "ანგარიშები", description: "ანალიტიკა და მენეჯერული რეპორტები.", icon: "BarChart3", category: "analytics", route: "/erp/reports", sortOrder: 10, status: "planned" },
  { id: "mod_integrations", key: "integrations", name: "ინტეგრაციები", description: "RS.ge, ბანკები, API და სხვა კავშირები.", icon: "Settings", category: "system", route: "/erp/integrations", sortOrder: 10, status: "active" },
  { id: "mod_ai", key: "ai", name: "AZLA AI", description: "AI ასისტენტი ბიზნეს მონაცემებისთვის.", icon: "Bot", category: "system", route: "/erp/ai", sortOrder: 20, status: "active" },
];

export const moduleDependencies: Partial<Record<ModuleKey, ModuleKey[]>> = {
  inventory: ["products", "warehouses"],
  purchases: ["products", "warehouses", "inventory"],
  discounts: ["products"],
  retail: ["products", "warehouses", "inventory"],
  sales: ["products", "inventory"],
  payroll: ["hr"],
};
