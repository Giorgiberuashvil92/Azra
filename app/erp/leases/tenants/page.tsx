"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Building2, ChevronRight, CircleDollarSign, Filter, Plus, Search, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { getAuthHeaders } from "@/components/erp/CoreModuleShell";
import { LeaseModuleShell } from "../_components/lease-module-shell";

type Charge = { amount: string | number; paidAmount: string | number; status: string };
type Contract = { status: string; monthlyRent: string | number; contractUnits?: Array<{ rentalUnit?: { name: string; property?: { name: string } | null } | null }> ; charges?: Charge[] };
type Tenant = {
  id: string;
  name: string;
  type: "individual" | "company";
  taxId?: string | null;
  personalId?: string | null;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: string | null;
  contracts?: Contract[];
};

export default function LeaseTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    let ignore = false;
    void fetch("/api/erp/leases/tenants", { headers: getAuthHeaders(), cache: "no-store" })
      .then(async (response) => {
        if (!ignore) setTenants(response.ok ? await response.json() : []);
      })
      .catch(() => undefined);

    return () => {
      ignore = true;
    };
  }, []);

  const filteredTenants = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tenants.filter((tenant) => {
      const matchesType = typeFilter ? tenant.type === typeFilter : true;
      const haystack = [tenant.name, tenant.taxId, tenant.personalId, tenant.contactName, tenant.phone, tenant.email].filter(Boolean).join(" ").toLowerCase();
      return matchesType && (!needle || haystack.includes(needle));
    });
  }, [query, tenants, typeFilter]);

  const summary = {
    total: tenants.length,
    companies: tenants.filter((tenant) => tenant.type === "company").length,
    active: tenants.filter((tenant) => tenant.contracts?.some((contract) => contract.status === "active")).length,
    debt: tenants.reduce((sum, tenant) => sum + tenantDebt(tenant), 0),
  };

  return (
    <LeaseModuleShell
      activeRoute="/erp/leases/tenants"
      actions={<Link className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#6849F5] px-6 text-[14px] font-black text-white shadow-lg shadow-violet-500/25" href="/erp/leases/tenants/new"><Plus size={18} /> ახალი მოიჯარე</Link>}
      subtitle="მართეთ ფიზიკური პირები და კომპანიები, მათი აქტიური იჯარები, კონტაქტები და დავალიანებები."
      title="მოიჯარეები"
    >
      <section className="grid grid-cols-4 gap-4">
        <Metric icon={<UsersRound size={22} />} label="სულ მოიჯარე" value={summary.total} />
        <Metric icon={<Building2 size={22} />} label="კომპანიები" tone="purple" value={summary.companies} />
        <Metric icon={<ShieldCheck size={22} />} label="აქტიური იჯარით" tone="green" value={summary.active} />
        <Metric icon={<CircleDollarSign size={22} />} label="დავალიანება" tone={summary.debt > 0 ? "red" : "green"} value={`${formatMoney(summary.debt)} ₾`} />
      </section>

      <section className="mt-5 overflow-hidden rounded-2xl border border-[#E1E5EF] bg-white shadow-sm shadow-slate-200/70">
        <div className="flex h-[72px] items-center justify-between border-b border-[#E6EAF2] px-5">
          <div>
            <h2 className="text-[22px] font-black">მოიჯარეების სია</h2>
            <p className="mt-0.5 text-[12px] font-semibold text-[#8A94AA]">კონტაქტები, იჯარები და გადახდის სანდოობა</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex h-11 w-[280px] items-center gap-3 rounded-xl border border-[#DDE3EE] px-4 text-[#53617D]">
              <Search size={18} />
              <input className="w-full bg-transparent text-[14px] font-semibold outline-none placeholder:text-[#9AA4B8]" onChange={(event) => setQuery(event.target.value)} placeholder="ძებნა..." value={query} />
            </label>
            <select className="h-11 rounded-xl border border-[#DDE3EE] bg-white px-4 text-[13px] font-bold text-[#3D4665]" onChange={(event) => setTypeFilter(event.target.value)} value={typeFilter}>
              <option value="">ყველა ტიპი</option>
              <option value="company">კომპანია</option>
              <option value="individual">ფიზიკური პირი</option>
            </select>
            <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#DDE3EE] px-4 text-[13px] font-bold text-[#3D4665]" type="button"><Filter size={17} /> ფილტრები</button>
          </div>
        </div>

        <table className="w-full table-fixed text-left">
          <thead className="bg-[#F7F8FC] text-[13px] font-black text-[#4C5875]">
            <tr>
              <th className="w-[28%] px-5 py-4">მოიჯარე</th>
              <th className="w-[18%] px-5 py-4">საკონტაქტო</th>
              <th className="w-[18%] px-5 py-4">მიმდინარე ობიექტი</th>
              <th className="w-[12%] px-5 py-4">აქტიური იჯარები</th>
              <th className="w-[12%] px-5 py-4">დავალიანება</th>
              <th className="w-[8%] px-5 py-4">სტატუსი</th>
              <th className="w-[9%] px-5 py-4">ქმედება</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF1F6]">
            {filteredTenants.map((tenant) => (
              <tr className="h-[68px] transition hover:bg-[#FBFCFF]" key={tenant.id}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`grid size-10 place-items-center rounded-xl ${tenant.type === "company" ? "bg-[#F0ECFF] text-[#6849F5]" : "bg-[#ECFBF4] text-[#159961]"}`}>
                      {tenant.type === "company" ? <Building2 size={19} /> : <UserRound size={19} />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-black text-[#111A3A]">{tenant.name}</p>
                      <p className="mt-0.5 truncate text-[12px] font-semibold text-[#8A94AA]">{tenant.type === "company" ? tenant.taxId ?? "ს/ნ არ არის" : tenant.personalId ?? "პ/ნ არ არის"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <p className="truncate text-[13px] font-bold text-[#4C5875]">{tenant.phone ?? "ტელეფონი არ არის"}</p>
                  <p className="mt-0.5 truncate text-[12px] font-semibold text-[#8A94AA]">{tenant.email ?? tenant.contactName ?? "კონტაქტი არ არის"}</p>
                </td>
                <td className="px-5 py-3 text-[13px] font-bold text-[#4C5875]">{activeUnitLabel(tenant)}</td>
                <td className="px-5 py-3 text-[14px] font-black text-[#111A3A]">{activeContracts(tenant)}</td>
                <td className="px-5 py-3 text-[14px] font-black text-[#111A3A]">{formatMoney(tenantDebt(tenant))} ₾</td>
                <td className="px-5 py-3"><StatusPill status={tenant.status ?? "active"} /></td>
                <td className="px-5 py-3">
                  <Link className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#F0ECFF] px-3 text-[12px] font-semibold text-[#6849F5] hover:bg-[#E7DFFF]" href={`/erp/leases/tenants/${tenant.id}`}>
                    პროფილი
                    <ChevronRight size={16} />
                  </Link>
                </td>
              </tr>
            ))}
            {!filteredTenants.length ? (
              <tr>
                <td className="px-5 py-16 text-center" colSpan={7}>
                  <div className="mx-auto grid max-w-[360px] justify-items-center">
                    <span className="grid size-14 place-items-center rounded-2xl bg-[#F0ECFF] text-[#6849F5]"><UsersRound size={26} /></span>
                    <p className="mt-4 text-[16px] font-black text-[#111A3A]">მოიჯარეები ჯერ არ არის დამატებული</p>
                    <p className="mt-1 text-[13px] font-semibold leading-6 text-[#7D88A2]">დაამატეთ კომპანია ან ფიზიკური პირი, ან შექმენით ახალი მოიჯარე იჯარის დამატებისას.</p>
                    <Link className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#6849F5] px-4 text-[13px] font-black text-white" href="/erp/leases/tenants/new"><Plus size={16} /> ახალი მოიჯარე</Link>
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </LeaseModuleShell>
  );
}

function activeContracts(tenant: Tenant) {
  return tenant.contracts?.filter((contract) => contract.status === "active").length ?? 0;
}

function tenantDebt(tenant: Tenant) {
  return tenant.contracts?.flatMap((contract) => contract.charges ?? []).filter((charge) => ["open", "partially_paid", "overdue"].includes(charge.status)).reduce((sum, charge) => sum + Number(charge.amount || 0) - Number(charge.paidAmount || 0), 0) ?? 0;
}

function activeUnitLabel(tenant: Tenant) {
  const unit = tenant.contracts?.find((contract) => contract.status === "active")?.contractUnits?.[0]?.rentalUnit;
  if (!unit) return "აქტიური ობიექტი არ არის";
  return `${unit.property?.name ?? "ობიექტი"} · ${unit.name}`;
}

function Metric({ icon, label, tone = "purple", value }: { icon: React.ReactNode; label: string; tone?: "purple" | "green" | "red"; value: string | number }) {
  const classes = tone === "green" ? "bg-[#ECFBF4] text-[#159961]" : tone === "red" ? "bg-[#FFF1F3] text-[#E34E5B]" : "bg-[#F0ECFF] text-[#6849F5]";
  return <article className="flex h-[86px] items-center gap-4 rounded-2xl border border-[#E1E5EF] bg-white px-5 shadow-sm shadow-slate-200/70"><span className={`grid size-11 place-items-center rounded-xl ${classes}`}>{icon}</span><div><p className="text-[12px] font-black text-[#6F7B96]">{label}</p><p className="mt-1 text-[24px] font-black text-[#111A3A]">{typeof value === "number" ? value.toLocaleString("ka-GE") : value}</p></div></article>;
}

function StatusPill({ status }: { status: string }) {
  const active = status === "active";
  return <span className={`inline-flex h-7 items-center rounded-full px-3 text-[12px] font-black ${active ? "bg-[#DDF7EB] text-[#159961]" : "bg-[#EEF1F6] text-[#68748D]"}`}>{active ? "აქტიური" : "არააქტიური"}</span>;
}

function formatMoney(value: string | number) {
  return Number(value || 0).toLocaleString("ka-GE", { maximumFractionDigits: 2 });
}
