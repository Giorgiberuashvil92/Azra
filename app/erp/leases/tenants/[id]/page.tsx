"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, CalendarDays, CheckCircle2, CircleDollarSign, FileText, Mail, Phone, Plus, ReceiptText, ShieldCheck, SquarePen, UserRound, WalletCards } from "lucide-react";
import { useParams } from "next/navigation";
import { getAuthHeaders } from "@/components/erp/CoreModuleShell";
import { LeaseModuleShell } from "../../_components/lease-module-shell";

type Charge = {
  id: string;
  dueDate: string;
  amount: string | number;
  paidAmount: string | number;
  status: "open" | "partially_paid" | "paid" | "overdue" | "cancelled";
};

type Payment = {
  id: string;
  paidAt: string;
  amount: string | number;
  currency: string;
  method: string;
};

type Contract = {
  id: string;
  contractNumber: string;
  startsAt: string;
  endsAt?: string | null;
  monthlyRent: string | number;
  currency: string;
  status: "draft" | "active" | "expired" | "terminated";
  contractUnits?: Array<{ rentalUnit?: { name: string; code?: string | null; property?: { name: string } | null } | null }>;
  charges?: Charge[];
  payments?: Payment[];
};

type Tenant = {
  id: string;
  name: string;
  type: "individual" | "company";
  taxId?: string | null;
  personalId?: string | null;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  status?: string | null;
  notes?: string | null;
  contracts?: Contract[];
};

export default function LeaseTenantProfilePage() {
  return <Suspense fallback={null}><LeaseTenantProfileContent /></Suspense>;
}

function LeaseTenantProfileContent() {
  const params = useParams<{ id: string }>();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    void fetch(`/api/erp/leases/tenants/${params.id}`, { headers: getAuthHeaders(), cache: "no-store" })
      .then(async (response) => {
        if (!ignore) setTenant(response.ok ? await response.json() : null);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [params.id]);

  const metrics = useMemo(() => {
    const contracts = tenant?.contracts ?? [];
    const active = contracts.filter((contract) => contract.status === "active");
    const closed = contracts.filter((contract) => ["expired", "terminated"].includes(contract.status));
    const charges = contracts.flatMap((contract) => contract.charges ?? []);
    const payments = contracts.flatMap((contract) => contract.payments ?? []);
    const charged = charges.reduce((sum, charge) => sum + Number(charge.amount || 0), 0);
    const paid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const debt = charges
      .filter((charge) => ["open", "partially_paid", "overdue"].includes(charge.status))
      .reduce((sum, charge) => sum + Math.max(Number(charge.amount || 0) - Number(charge.paidAmount || 0), 0), 0);
    const overdue = charges.filter((charge) => charge.status === "overdue").length;
    const paidCharges = charges.filter((charge) => charge.status === "paid").length;
    const reliability = charges.length ? Math.max(0, Math.round((paidCharges / charges.length) * 100) - overdue * 8) : 100;
    return {
      active: active.length,
      charged,
      closed: closed.length,
      debt,
      monthly: active.reduce((sum, contract) => sum + Number(contract.monthlyRent || 0), 0),
      paid,
      reliability,
    };
  }, [tenant]);

  const activeContracts = tenant?.contracts?.filter((contract) => contract.status === "active") ?? [];
  const closedContracts = tenant?.contracts?.filter((contract) => ["expired", "terminated"].includes(contract.status)) ?? [];
  const lastPayments = (tenant?.contracts ?? []).flatMap((contract) => contract.payments ?? []).sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()).slice(0, 5);

  return (
    <LeaseModuleShell
      activeRoute="/erp/leases/tenants"
      actions={<Link className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#DDE3EE] bg-white px-5 text-[14px] font-bold text-[#4C5875]" href="/erp/leases/tenants"><ArrowLeft size={16} /> უკან</Link>}
      subtitle="მოიჯარის იჯარები, გადახდები, დავალიანება, სანდოობა და კონტაქტები."
      title={tenant?.name ?? "მოიჯარის პროფილი"}
    >
      {isLoading ? <div className="rounded-2xl border border-[#E1E5EF] bg-white p-6 text-[14px] font-semibold text-[#7D88A2]">იტვირთება...</div> : null}
      {!isLoading && !tenant ? <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-[14px] font-semibold text-rose-700">მოიჯარე ვერ მოიძებნა.</div> : null}
      {tenant ? (
        <div className="grid gap-5 pb-12">
          <section className="rounded-2xl border border-[#E1E5EF] bg-white p-5 shadow-sm shadow-slate-200/70">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="flex min-w-0 items-start gap-4">
                <span className={`grid size-14 shrink-0 place-items-center rounded-2xl ${tenant.type === "company" ? "bg-[#F0ECFF] text-[#6849F5]" : "bg-[#ECFBF4] text-[#159961]"}`}>
                  {tenant.type === "company" ? <Building2 size={25} /> : <UserRound size={25} />}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex h-8 items-center rounded-full bg-[#F7F8FC] px-3 text-[12px] font-semibold text-[#64708A]">{tenant.type === "company" ? "კომპანია" : "ფიზიკური პირი"}</span>
                    <span className="inline-flex h-8 items-center rounded-full bg-[#ECFBF4] px-3 text-[12px] font-semibold text-[#159961]">{tenant.status === "inactive" ? "არააქტიური" : "აქტიური"}</span>
                  </div>
                  <h2 className="mt-3 text-[24px] font-semibold leading-tight text-[#111A3A]">{tenant.name}</h2>
                  <p className="mt-2 text-[13px] font-semibold text-[#7D88A2]">{tenant.type === "company" ? tenant.taxId ?? "ს/ნ არ არის" : tenant.personalId ?? "პ/ნ არ არის"}</p>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <Link className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#DDE3EE] bg-white px-4 text-[13px] font-semibold text-[#4C5875]" href={`/erp/leases/tenants/${tenant.id}/edit`}>
                  <SquarePen size={16} />
                  რედაქტირება
                </Link>
                <Link className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#6849F5] px-4 text-[13px] font-bold text-white shadow-lg shadow-violet-500/20" href="/erp/leases/contracts/new">
                  <Plus size={16} />
                  ახალი იჯარა
                </Link>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-4 gap-4">
            <Metric icon={<ReceiptText size={20} />} label="აქტიური იჯარები" value={metrics.active.toLocaleString("ka-GE")} />
            <Metric icon={<CircleDollarSign size={20} />} label="თვიური ვალდებულება" tone="green" value={`${formatMoney(metrics.monthly)} ₾`} />
            <Metric icon={<WalletCards size={20} />} label="დავალიანება" tone={metrics.debt > 0 ? "red" : "green"} value={`${formatMoney(metrics.debt)} ₾`} />
            <Metric icon={<ShieldCheck size={20} />} label="სანდოობა" tone={metrics.reliability >= 80 ? "green" : metrics.reliability >= 55 ? "amber" : "red"} value={`${metrics.reliability}%`} />
          </section>

          <section className="grid grid-cols-[minmax(0,1fr)_360px] gap-5">
            <div className="grid gap-5">
              <ContractsCard contracts={activeContracts} title="მიმდინარე იჯარები" />
              <ContractsCard contracts={closedContracts} title="დასრულებული იჯარები" />
            </div>

            <aside className="grid content-start gap-5">
              <Card title="კონტაქტები">
                <InfoLine icon={<Phone size={16} />} label="ტელეფონი" value={tenant.phone ?? "არ არის მითითებული"} />
                <InfoLine icon={<Mail size={16} />} label="ელფოსტა" value={tenant.email ?? "არ არის მითითებული"} />
                <InfoLine icon={<UserRound size={16} />} label="საკონტაქტო პირი" value={tenant.contactName ?? "არ არის მითითებული"} />
                <InfoLine icon={<Building2 size={16} />} label="მისამართი" value={tenant.address ?? "არ არის მითითებული"} />
              </Card>

              <Card title="ფინანსური ისტორია">
                <SummaryLine label="დარიცხული" value={`${formatMoney(metrics.charged)} ₾`} />
                <SummaryLine label="გადახდილი" value={`${formatMoney(metrics.paid)} ₾`} />
                <SummaryLine label="დავალიანება" tone={metrics.debt > 0 ? "red" : "green"} value={`${formatMoney(metrics.debt)} ₾`} />
              </Card>

              <Card title="ბოლო გადახდები">
                <div className="grid gap-2">
                  {lastPayments.map((payment) => (
                    <div className="flex items-center justify-between rounded-xl border border-[#EEF1F6] px-3 py-2.5" key={payment.id}>
                      <div>
                        <p className="text-[13px] font-semibold text-[#111A3A]">{formatMoney(payment.amount)} {payment.currency}</p>
                        <p className="mt-0.5 text-[12px] font-semibold text-[#8A94AA]">{formatDate(payment.paidAt)}</p>
                      </div>
                      <span className="text-[12px] font-semibold text-[#4C5875]">{methodLabel(payment.method)}</span>
                    </div>
                  ))}
                  {!lastPayments.length ? <div className="rounded-xl border border-dashed border-[#DDE3EE] bg-[#F8FAFD] p-5 text-center text-[13px] font-semibold text-[#7D88A2]">გადახდა ჯერ არ არის.</div> : null}
                </div>
              </Card>

              <Card title="დოკუმენტები">
                <div className="rounded-xl border border-dashed border-[#DDE3EE] bg-[#F8FAFD] p-5 text-center">
                  <FileText className="mx-auto text-[#8A94AA]" size={28} />
                  <p className="mt-3 text-[13px] font-semibold text-[#111A3A]">დოკუმენტები შემდეგ ეტაპზე დაემატება.</p>
                </div>
              </Card>
            </aside>
          </section>
        </div>
      ) : null}
    </LeaseModuleShell>
  );
}

function ContractsCard({ contracts, title }: { contracts: Contract[]; title: string }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#E1E5EF] bg-white shadow-sm shadow-slate-200/70">
      <div className="flex h-[68px] items-center justify-between border-b border-[#E6EAF2] px-5">
        <h2 className="text-[20px] font-semibold text-[#111A3A]">{title}</h2>
        <span className="text-[13px] font-semibold text-[#8A94AA]">{contracts.length} ჩანაწერი</span>
      </div>
      <table className="w-full table-fixed text-left">
        <thead className="bg-[#F7F8FC] text-[12px] font-semibold text-[#4C5875]">
          <tr>
            <th className="w-[28%] px-5 py-3">ხელშეკრულება</th>
            <th className="w-[26%] px-5 py-3">ობიექტი</th>
            <th className="w-[16%] px-5 py-3">პერიოდი</th>
            <th className="w-[14%] px-5 py-3">თვიური</th>
            <th className="w-[12%] px-5 py-3">სტატუსი</th>
            <th className="w-[4%] px-5 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EEF1F6]">
          {contracts.map((contract) => (
            <tr className="h-[64px] hover:bg-[#FBFCFF]" key={contract.id}>
              <td className="px-5 py-3">
                <Link className="text-[14px] font-semibold text-[#111A3A] hover:text-[#6849F5]" href={`/erp/leases/contracts/${contract.id}`}>{contract.contractNumber}</Link>
              </td>
              <td className="px-5 py-3 text-[13px] font-semibold text-[#4C5875]">{contractUnitLabel(contract)}</td>
              <td className="px-5 py-3 text-[12px] font-semibold text-[#4C5875]">{formatDate(contract.startsAt)} - {contract.endsAt ? formatDate(contract.endsAt) : "უვადო"}</td>
              <td className="px-5 py-3 text-[13px] font-semibold text-[#111A3A]">{formatMoney(contract.monthlyRent)} {contract.currency}</td>
              <td className="px-5 py-3"><ContractStatus status={contract.status} /></td>
              <td className="px-5 py-3 text-right">
                <Link className="inline-flex h-8 items-center rounded-lg border border-[#E1E5EF] px-3 text-[12px] font-semibold text-[#6849F5] hover:bg-[#F7F4FF]" href={`/erp/leases/contracts/${contract.id}`}>ნახვა</Link>
              </td>
            </tr>
          ))}
          {!contracts.length ? <tr><td className="px-5 py-10 text-center text-[13px] font-semibold text-[#7D88A2]" colSpan={6}>ჩანაწერები არ არის.</td></tr> : null}
        </tbody>
      </table>
    </section>
  );
}

function Card({ children, title }: { children: React.ReactNode; title: string }) {
  return <section className="rounded-2xl border border-[#E1E5EF] bg-white p-5 shadow-sm shadow-slate-200/70"><h2 className="text-[18px] font-semibold text-[#111A3A]">{title}</h2><div className="mt-4">{children}</div></section>;
}

function Metric({ icon, label, tone = "purple", value }: { icon: React.ReactNode; label: string; tone?: "purple" | "green" | "amber" | "red"; value: string }) {
  const classes = {
    amber: "bg-[#FFF7E8] text-[#D98200]",
    green: "bg-[#ECFBF4] text-[#159961]",
    purple: "bg-[#F0ECFF] text-[#6849F5]",
    red: "bg-[#FFF1F3] text-[#E34E5B]",
  }[tone];
  return <article className="flex h-[84px] items-center gap-4 rounded-2xl border border-[#E1E5EF] bg-white px-5 shadow-sm shadow-slate-200/70"><span className={`grid size-11 place-items-center rounded-xl ${classes}`}>{icon}</span><div className="min-w-0"><p className="text-[12px] font-semibold text-[#6F7B96]">{label}</p><p className="mt-1 truncate text-[21px] font-semibold text-[#111A3A]">{value}</p></div></article>;
}

function InfoLine({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-start gap-3 border-b border-[#EEF1F6] py-3 first:pt-0 last:border-0 last:pb-0"><span className="mt-0.5 text-[#6849F5]">{icon}</span><div className="min-w-0"><p className="text-[12px] font-semibold text-[#8A94AA]">{label}</p><p className="mt-0.5 break-words text-[13px] font-semibold text-[#111A3A]">{value}</p></div></div>;
}

function SummaryLine({ label, tone, value }: { label: string; tone?: "green" | "red"; value: string }) {
  return <div className="flex items-center justify-between border-b border-[#EEF1F6] py-3 last:border-0"><span className="text-[13px] font-semibold text-[#6F7B96]">{label}</span><strong className={tone === "red" ? "text-[14px] text-[#E34E5B]" : tone === "green" ? "text-[14px] text-[#159961]" : "text-[14px] text-[#111A3A]"}>{value}</strong></div>;
}

function ContractStatus({ status }: { status: Contract["status"] }) {
  const labels = { active: "აქტიური", draft: "დრაფტი", expired: "დასრულებული", terminated: "გაუქმებული" };
  const classes = { active: "bg-[#DDF7EB] text-[#159961]", draft: "bg-[#F0ECFF] text-[#6849F5]", expired: "bg-[#EEF1F6] text-[#68748D]", terminated: "bg-[#FDE1E3] text-[#E34E5B]" };
  return <span className={`inline-flex h-7 items-center rounded-full px-3 text-[12px] font-semibold ${classes[status]}`}>{labels[status]}</span>;
}

function contractUnitLabel(contract: Contract) {
  const units = contract.contractUnits?.map((item) => item.rentalUnit).filter(Boolean) ?? [];
  if (!units.length) return "ობიექტი არ არის";
  if (units.length === 1) return `${units[0]?.property?.name ?? "ობიექტი"} · ${units[0]?.name}`;
  return `${units[0]?.property?.name ?? "ობიექტი"} · ${units.length} ერთეული`;
}

function methodLabel(method: string) {
  return ({ bank_transfer: "ბანკი", card: "ბარათი", cash: "ნაღდი", other: "სხვა" } as Record<string, string>)[method] ?? method;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ka-GE");
}

function formatMoney(value: string | number) {
  return Number(value || 0).toLocaleString("ka-GE", { maximumFractionDigits: 2 });
}
