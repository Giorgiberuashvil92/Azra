export type AccessRequestStatus = "new" | "contacted" | "approved" | "rejected";

export type AccessRequest = {
  id: string;
  companyName: string;
  legalName?: string | null;
  taxId?: string | null;
  industry?: string | null;
  employeeCount?: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
  selectedModules: string[];
  note?: string | null;
  status: AccessRequestStatus;
  createdAt: string;
};

export type Company = {
  id: string;
  name: string;
  taxId?: string | null;
  status: string;
  users: unknown[];
  modules: { status: string; module: { key: string; name: string } }[];
};

export type RequestPayload = {
  requests: AccessRequest[];
  stats: {
    totalRequests: number;
    activeCompanies: number;
    byStatus: Partial<Record<AccessRequestStatus, number>>;
  };
};

export type ProvisionedAccount = {
  companyId: string;
  companyName: string;
  email: string;
  temporaryPassword: string | null;
};

export const statusLabels: Record<AccessRequestStatus, string> = {
  new: "ახალი",
  contacted: "დაკავშირებული",
  approved: "დამტკიცებული",
  rejected: "უარყოფილი",
};

export const statusStyles: Record<AccessRequestStatus, string> = {
  new: "bg-[#f0edff] text-[#5e5bff]",
  contacted: "bg-sky-50 text-sky-600",
  approved: "bg-emerald-50 text-emerald-600",
  rejected: "bg-rose-50 text-rose-600",
};
