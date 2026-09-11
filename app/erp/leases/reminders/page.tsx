"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, CalendarDays, CheckCircle2, CircleAlert, Clock3, CreditCard, FileText, Filter, Search, UserRound } from "lucide-react";
import { getAuthHeaders } from "@/components/erp/CoreModuleShell";
import { LeaseModuleShell } from "../_components/lease-module-shell";

type LeaseCharge = {
  id: string;
  dueDate: string;
  amount: string | number;
  paidAmount: string | number;
  currency: string;
  status: "open" | "partially_paid" | "paid" | "overdue" | "cancelled";
  contract?: LeaseContract | null;
};

type LeaseContract = {
  id: string;
  contractNumber: string;
  startsAt: string;
  endsAt?: string | null;
  monthlyRent: string | number;
  currency: string;
  status: "draft" | "active" | "expired" | "terminated";
  asset?: { name: string; address?: string | null } | null;
  tenant?: { id: string; name: string } | null;
};

type LeaseData = {
  charges: LeaseCharge[];
  contracts: LeaseContract[];
};

type ReminderItem = {
  id: string;
  amount?: number;
  contractId: string;
  date: Date;
  object: string;
  status: "planned" | "today" | "overdue" | "done";
  tenant: string;
  tenantId?: string;
  title: string;
  type: "payment" | "contract_end";
};

const typeOptions = [
  { label: "ყველა ტიპი", value: "all" },
  { label: "გადახდის ვადა", value: "payment" },
  { label: "ხელშეკრულების დასრულება", value: "contract_end" },
];

const statusOptions = [
  { label: "ყველა სტატუსი", value: "all" },
  { label: "დაგეგმილი", value: "planned" },
  { label: "დღეს", value: "today" },
  { label: "ვადაგადაცილებული", value: "overdue" },
  { label: "შესრულებული", value: "done" },
];

export default function LeaseRemindersPage() {
  const [data, setData] = useState<LeaseData>({ charges: [], contracts: [] });
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    let ignore = false;
    void fetch("/api/erp/leases", { headers: getAuthHeaders(), cache: "no-store" })
      .then(async (response) => {
        if (!ignore) setData(response.ok ? await response.json() : { charges: [], contracts: [] });
      })
      .catch(() => undefined);

    return () => {
      ignore = true;
    };
  }, []);

  const reminders = useMemo(() => {
    const today = startOfDay(new Date());
    const criticalUntil = addDays(today, 30);
    const paymentItems = data.charges
      .filter((charge) => ["open", "partially_paid", "overdue"].includes(charge.status))
      .map<ReminderItem | null>((charge) => {
        const contract = charge.contract;
        if (!contract) return null;
        const date = startOfDay(new Date(charge.dueDate));
        const amount = Math.max(Number(charge.amount || 0) - Number(charge.paidAmount || 0), 0);
        return {
          id: `payment-${charge.id}`,
          amount,
          contractId: contract.id,
          date,
          object: contract.asset?.name ?? "ობიექტი არ არის",
          status: reminderStatus(date, today, charge.status === "paid"),
          tenant: contract.tenant?.name ?? "მოიჯარე არ არის",
          tenantId: contract.tenant?.id,
          title: "გადახდის ვადა",
          type: "payment",
        };
      })
      .filter((item): item is ReminderItem => Boolean(item))
      .filter((item) => item.status === "overdue" || (item.date >= today && item.date <= criticalUntil));

    const contractEndItems = data.contracts
      .filter((contract) => contract.status === "active" && contract.endsAt)
      .map<ReminderItem>((contract) => {
        const date = startOfDay(new Date(contract.endsAt as string));
        return {
          id: `contract-${contract.id}`,
          contractId: contract.id,
          date,
          object: contract.asset?.name ?? "ობიექტი არ არის",
          status: reminderStatus(date, today, false),
          tenant: contract.tenant?.name ?? "მოიჯარე არ არის",
          tenantId: contract.tenant?.id,
          title: "ხელშეკრულების დასრულება",
          type: "contract_end",
        };
      })
      .filter((item) => item.status === "overdue" || (item.date >= today && item.date <= criticalUntil));

    return [...paymentItems, ...contractEndItems].sort((a, b) => {
      const statusWeight = { overdue: 0, today: 1, planned: 2, done: 3 };
      return statusWeight[a.status] - statusWeight[b.status] || a.date.getTime() - b.date.getTime();
    });
  }, [data.charges, data.contracts]);

  const filteredReminders = useMemo(() => {
    const text = query.trim().toLowerCase();
    return reminders.filter((item) => {
      const matchesType = typeFilter === "all" || item.type === typeFilter;
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const haystack = [item.title, item.object, item.tenant].join(" ").toLowerCase();
      return matchesType && matchesStatus && (!text || haystack.includes(text));
    });
  }, [query, reminders, statusFilter, typeFilter]);

  const summary = {
    overdue: reminders.filter((item) => item.status === "overdue").length,
    today: reminders.filter((item) => item.status === "today").length,
    planned: reminders.filter((item) => item.status === "planned").length,
    debt: reminders.filter((item) => item.type === "payment").reduce((sum, item) => sum + (item.amount ?? 0), 0),
  };

  return (
    <LeaseModuleShell
      activeRoute="/erp/leases/reminders"
      subtitle="აკონტროლეთ გადახდის ვადები და ხელშეკრულების დასრულებები მომდევნო 30 დღის კრიტიკულ ფანჯარაში."
      title="ვადები და შეხსენებები"
    >
      <div className="grid gap-5 pb-12">
        <section className="grid grid-cols-4 gap-4">
          <Metric icon={<CircleAlert size={20} />} label="ვადაგადაცილებული" tone="red" value={summary.overdue.toLocaleString("ka-GE")} />
          <Metric icon={<Clock3 size={20} />} label="დღეს" tone="amber" value={summary.today.toLocaleString("ka-GE")} />
          <Metric icon={<CalendarDays size={20} />} label="30 დღეში" value={summary.planned.toLocaleString("ka-GE")} />
          <Metric icon={<CreditCard size={20} />} label="კრიტიკული ნაშთი" tone={summary.debt > 0 ? "red" : "green"} value={`${formatMoney(summary.debt)} ₾`} />
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#E1E5EF] bg-white shadow-sm shadow-slate-200/70">
          <div className="flex h-[74px] items-center justify-between gap-4 border-b border-[#E6EAF2] px-5">
            <div>
              <h2 className="text-[21px] font-semibold text-[#111A3A]">კრიტიკული ვადები</h2>
              <p className="mt-0.5 text-[13px] font-semibold text-[#8A94AA]">ჩანს ვადაგადაცილებული და მომდევნო 30 დღის ჩანაწერები.</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex h-10 w-[250px] items-center gap-2 rounded-xl border border-[#DDE3EE] px-3 text-[#53617D]">
                <Search size={18} />
                <input className="w-full bg-transparent text-[14px] font-semibold outline-none placeholder:text-[#9AA4B8]" onChange={(event) => setQuery(event.target.value)} placeholder="ძებნა..." value={query} />
              </label>
              <label className="flex h-10 items-center gap-2 rounded-xl border border-[#DDE3EE] px-3 text-[#53617D]">
                <Filter size={17} />
                <select className="bg-transparent text-[13px] font-semibold outline-none" onChange={(event) => setTypeFilter(event.target.value)} value={typeFilter}>
                  {typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <select className="h-10 rounded-xl border border-[#DDE3EE] bg-white px-3 text-[13px] font-semibold text-[#3D4665] outline-none" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
                {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          </div>

          <table className="w-full table-fixed text-left">
            <thead className="bg-[#F7F8FC] text-[12px] font-semibold text-[#4C5875]">
              <tr>
                <th className="w-[18%] px-5 py-3">ტიპი</th>
                <th className="w-[25%] px-5 py-3">ობიექტი</th>
                <th className="w-[18%] px-5 py-3">მოიჯარე</th>
                <th className="w-[12%] px-5 py-3">თარიღი</th>
                <th className="w-[12%] px-5 py-3">თანხა</th>
                <th className="w-[10%] px-5 py-3">სტატუსი</th>
                <th className="w-[5%] px-5 py-3">ქმედება</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF1F6]">
              {filteredReminders.map((item) => (
                <tr className="h-[66px] hover:bg-[#FBFCFF]" key={item.id}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`grid size-10 place-items-center rounded-xl ${item.type === "payment" ? "bg-[#FFF7E8] text-[#D98200]" : "bg-[#F0ECFF] text-[#6849F5]"}`}>
                        {item.type === "payment" ? <CreditCard size={18} /> : <FileText size={18} />}
                      </span>
                      <span className="text-[13px] font-semibold text-[#111A3A]">{item.title}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[13px] font-semibold text-[#4C5875]">{item.object}</td>
                  <td className="px-5 py-3">
                    {item.tenantId ? (
                      <Link className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#4C5875] hover:text-[#6849F5]" href={`/erp/leases/tenants/${item.tenantId}`}>
                        <UserRound size={15} />
                        {item.tenant}
                      </Link>
                    ) : <span className="text-[13px] font-semibold text-[#4C5875]">{item.tenant}</span>}
                  </td>
                  <td className="px-5 py-3 text-[13px] font-semibold text-[#111A3A]">{formatDate(item.date)}</td>
                  <td className="px-5 py-3 text-[13px] font-semibold text-[#111A3A]">{item.amount !== undefined ? `${formatMoney(item.amount)} ₾` : "-"}</td>
                  <td className="px-5 py-3"><StatusPill status={item.status} /></td>
                  <td className="px-5 py-3">
                    <Link className="inline-flex h-8 items-center rounded-lg bg-[#F0ECFF] px-3 text-[12px] font-semibold text-[#6849F5] hover:bg-[#E7DFFF]" href={`/erp/leases/contracts/${item.contractId}`}>
                      იჯარა
                    </Link>
                  </td>
                </tr>
              ))}
              {!filteredReminders.length ? (
                <tr>
                  <td className="px-5 py-16 text-center" colSpan={7}>
                    <CalendarClock className="mx-auto text-[#8A94AA]" size={34} />
                    <p className="mt-3 text-[15px] font-semibold text-[#111A3A]">კრიტიკული ვადები არ არის</p>
                    <p className="mt-1 text-[13px] font-semibold text-[#8A94AA]">ვადაგადაცილებული ან მომდევნო 30 დღის ჩანაწერები აქ გამოჩნდება.</p>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>
      </div>
    </LeaseModuleShell>
  );
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

function StatusPill({ status }: { status: ReminderItem["status"] }) {
  const labels = { done: "შესრულებული", overdue: "ვადაგადაცილებული", planned: "დაგეგმილი", today: "დღეს" };
  const classes = {
    done: "bg-[#DDF7EB] text-[#159961]",
    overdue: "bg-[#FDE1E3] text-[#E34E5B]",
    planned: "bg-[#F0ECFF] text-[#6849F5]",
    today: "bg-[#FFF0D3] text-[#E48700]",
  };
  return <span className={`inline-flex h-7 items-center rounded-full px-3 text-[12px] font-semibold ${classes[status]}`}>{labels[status]}</span>;
}

function reminderStatus(date: Date, today: Date, isDone: boolean): ReminderItem["status"] {
  if (isDone) return "done";
  if (date.getTime() < today.getTime()) return "overdue";
  if (date.getTime() === today.getTime()) return "today";
  return "planned";
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(value: Date) {
  return value.toLocaleDateString("ka-GE");
}

function formatMoney(value: string | number) {
  return Number(value || 0).toLocaleString("ka-GE", { maximumFractionDigits: 2 });
}
