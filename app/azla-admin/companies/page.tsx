import { AdminCompaniesPage } from "@/components/admin/AdminCompaniesPage";
import { AdminShell } from "@/components/admin/AdminShell";

export default function CompaniesPage() {
  return (
    <AdminShell title="კომპანიები">
      <AdminCompaniesPage />
    </AdminShell>
  );
}
