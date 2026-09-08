import { AdminRequestsPage } from "@/components/admin/AdminRequestsPage";
import { AdminShell } from "@/components/admin/AdminShell";

export default function RequestsPage() {
  return (
    <AdminShell title="წვდომის მოთხოვნები">
      <AdminRequestsPage />
    </AdminShell>
  );
}
