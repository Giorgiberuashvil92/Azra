"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Eye, FileText, Plus, Search, WalletCards } from "lucide-react";
import { getAuthHeaders } from "@/components/erp/CoreModuleShell";
import { LeaseModuleShell } from "../_components/lease-module-shell";

type LeaseContract = {
  id: string;
  contractNumber: string;
  startsAt: string;
  endsAt?: string | null;
  monthlyRent: string | number;
  currency: string;
  status: "draft" | "active" | "expired" | "terminated";
  tenant?: { name: string } | null;
  contractUnits?: Array<{ rentalUnit?: { name: string; property?: { name: string } | null } | null }>;
};

export default function LeaseContractsPage() {
  const [contracts, setContracts] = useState<LeaseContract[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let ignore = false;
    void fetch("/api/erp/leases/contracts", { headers: getAuthHeaders(), cache: "no-store" })
      .then(async (response) => {
        if (!ignore) setContracts(response.ok ? await response.json() : []);
      })
      .catch(() => undefined);

    return () => {
      ignore = true;
    };
  }, []);

  const filteredContracts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return contracts;
    return contracts.filter((contract) => [
      contract.contractNumber,
      contract.tenant?.name,
      unitSummary(contract),
    ].filter(Boolean).join(" ").toLowerCase().includes(needle));
  }, [contracts, query]);

  return (
    <LeaseModuleShell
      activeRoute="/erp/leases/contracts"
      actions={<Link className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#6849F5] px-6 text-[14px] font-black text-white shadow-lg shadow-violet-500/25" href="/erp/leases/contracts/new"><Plus size={18} /> ახალი იჯარა</Link>}
      subtitle="შექმენით და აკონტროლეთ იჯარები კონკრეტულ გასაქირავებელ ერთეულებზე."
      title="ხელშეკრულებები"
    >
      <section className="overflow-hidden rounded-2xl border border-[#E1E5EF] bg-white shadow-sm shadow-slate-200/70">
        <div className="flex h-[76px] items-center justify-between gap-4 border-b border-[#E6EAF2] px-5">
          <div>
            <h2 className="text-[22px] font-black">იჯარების სია</h2>
            <p className="mt-0.5 text-[12px] font-semibold text-[#8A94AA]">პროფილი, გადახდის გრაფიკი და მიბმული ობიექტები</p>
          </div>
          <label className="flex h-11 w-[280px] items-center gap-3 rounded-xl border border-[#DDE3EE] px-4 text-[#53617D]">
            <Search size={18} />
            <input className="w-full bg-transparent text-[14px] font-semibold outline-none placeholder:text-[#9AA4B8]" onChange={(event) => setQuery(event.target.value)} placeholder="ძებნა..." value={query} />
          </label>
        </div>
        <table className="w-full table-fixed text-left">
          <thead className="bg-[#F7F8FC] text-[13px] font-black text-[#4C5875]">
            <tr>
              <th className="w-[22%] px-5 py-4">ხელშეკრულება</th>
              <th className="w-[17%] px-5 py-4">მოიჯარე</th>
              <th className="w-[21%] px-5 py-4">ობიექტები</th>
              <th className="w-[16%] px-5 py-4">პერიოდი</th>
              <th className="w-[11%] px-5 py-4">თვიური თანხა</th>
              <th className="w-[9%] px-5 py-4">სტატუსი</th>
              <th className="w-[14%] px-5 py-4 text-right">ქმედება</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF1F6]">
            {filteredContracts.map((contract) => (
              <tr className="h-[72px] transition hover:bg-[#FBFCFF]" key={contract.id}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-[#F0ECFF] text-[#6849F5]"><FileText size={19} /></span>
                    <div className="min-w-0">
                      <Link className="text-[14px] font-black text-[#111A3A] hover:text-[#6849F5]" href={`/erp/leases/contracts/${contract.id}`}>{contract.contractNumber}</Link>
                      <p className="mt-0.5 text-[12px] font-semibold text-[#7D88A2]">იჯარის ხელშეკრულება</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-[14px] font-bold text-[#4C5875]"><span className="block truncate">{contract.tenant?.name ?? "მოიჯარე არ არის"}</span></td>
                <td className="px-5 py-3 text-[14px] font-bold text-[#4C5875]"><span className="block truncate">{unitSummary(contract)}</span></td>
                <td className="px-5 py-3 text-[13px] font-bold text-[#4C5875]">
                  <span className="inline-flex items-center gap-2"><CalendarDays size={16} /> {formatDate(contract.startsAt)} - {contract.endsAt ? formatDate(contract.endsAt) : "უვადო"}</span>
                </td>
                <td className="px-5 py-3 text-[14px] font-black text-[#111A3A]">{formatMoney(contract.monthlyRent)} {contract.currency}</td>
                <td className="px-5 py-3"><StatusPill status={contract.status} /></td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    <Link className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#6849F5] px-3 text-[12px] font-black text-white shadow-md shadow-violet-500/20" href={`/erp/leases/contracts/${contract.id}`}>
                      <Eye size={15} />
                      პროფილის ნახვა
                    </Link>
                    <Link className="grid size-9 place-items-center rounded-xl border border-[#DDE3EE] text-[#4C5875] hover:bg-[#F7F4FF] hover:text-[#6849F5]" href={`/erp/leases/contracts/${contract.id}`} title="გადახდის გრაფიკი">
                      <WalletCards size={16} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {!filteredContracts.length ? <tr><td className="px-5 py-12 text-center text-[14px] font-bold text-[#7D88A2]" colSpan={7}>იჯარები ჯერ არ არის დამატებული.</td></tr> : null}
          </tbody>
        </table>
      </section>
    </LeaseModuleShell>
  );
}

function unitSummary(contract: LeaseContract) {
  const units = contract.contractUnits?.map((item) => item.rentalUnit).filter(Boolean) ?? [];
  if (!units.length) return "ობიექტი არ არის მიბმული";
  if (units.length === 1) return `${units[0]?.property?.name ?? ""} · ${units[0]?.name}`.trim();
  return `${units[0]?.property?.name ?? "რამდენიმე ობიექტი"} · ${units.length} ერთეული`;
}

function StatusPill({ status }: { status: LeaseContract["status"] }) {
  const labels = { draft: "დრაფტი", active: "აქტიური", expired: "დასრულებული", terminated: "გაუქმებული" };
  const classes = { draft: "bg-[#EEF1F6] text-[#68748D]", active: "bg-[#DDF7EB] text-[#159961]", expired: "bg-[#FFF0D3] text-[#E48700]", terminated: "bg-[#FDE1E3] text-[#E34E5B]" };
  return <span className={`inline-flex h-7 items-center rounded-full px-3 text-[12px] font-black ${classes[status]}`}>{labels[status]}</span>;
}

function formatMoney(value: string | number) {
  return Number(value || 0).toLocaleString("ka-GE", { maximumFractionDigits: 2 });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ka-GE");
}
