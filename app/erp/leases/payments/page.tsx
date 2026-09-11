"use client";

import { Fragment, FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, ChevronDown, CircleAlert, CreditCard, Eye, Filter, ReceiptText, Search, WalletCards } from "lucide-react";
import { getAuthHeaders } from "@/components/erp/CoreModuleShell";
import { LeaseModuleShell } from "../_components/lease-module-shell";

type LeaseCharge = {
  id: string;
  dueDate: string;
  title: string;
  amount: string | number;
  paidAmount: string | number;
  currency: string;
  status: "open" | "partially_paid" | "paid" | "overdue" | "cancelled";
  contract?: {
    id: string;
    contractNumber: string;
    asset?: { name: string; address?: string | null } | null;
    tenant?: { name: string } | null;
  } | null;
};

type LeasePayment = {
  id: string;
  chargeId?: string | null;
  paidAt: string;
  amount: string | number;
  currency: string;
  method: string;
  reference?: string | null;
  note?: string | null;
};

type LeaseData = {
  charges: LeaseCharge[];
  payments: LeasePayment[];
};

const statusOptions = [
  { label: "ყველა სტატუსი", value: "all" },
  { label: "გადასახდელია", value: "open" },
  { label: "ნაწილობრივ", value: "partially_paid" },
  { label: "გადახდილია", value: "paid" },
  { label: "ვადაგადაცილებულია", value: "overdue" },
];

export default function LeasePaymentsPage() {
  return <Suspense fallback={null}><LeasePaymentsContent /></Suspense>;
}

function LeasePaymentsContent() {
  const [data, setData] = useState<LeaseData>({ charges: [], payments: [] });
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [method, setMethod] = useState("bank_transfer");
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");
  const [expandedChargeId, setExpandedChargeId] = useState<string | null>(null);

  async function loadData() {
    const response = await fetch("/api/erp/leases", { headers: getAuthHeaders(), cache: "no-store" });
    setData(response.ok ? await response.json() : { charges: [], payments: [] });
  }

  useEffect(() => {
    void loadData().catch(() => undefined);
  }, []);

  const filteredCharges = useMemo(() => {
    const text = query.trim().toLowerCase();
    return data.charges.filter((charge) => {
      const matchesStatus = status === "all" || charge.status === status;
      const haystack = [
        charge.title,
        charge.contract?.contractNumber,
        charge.contract?.asset?.name,
        charge.contract?.asset?.address,
        charge.contract?.tenant?.name,
      ].filter(Boolean).join(" ").toLowerCase();
      return matchesStatus && (!text || haystack.includes(text));
    });
  }, [data.charges, query, status]);

  const totals = useMemo(() => {
    return data.charges.reduce((acc, charge) => {
      const amount = Number(charge.amount || 0);
      const paid = Number(charge.paidAmount || 0);
      const balance = Math.max(amount - paid, 0);
      if (charge.status === "paid") acc.paid += paid;
      if (charge.status === "overdue") acc.overdue += balance;
      if (["open", "partially_paid"].includes(charge.status)) acc.due += balance;
      if (charge.status === "partially_paid") acc.partial += balance;
      return acc;
    }, { due: 0, overdue: 0, paid: data.payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0), partial: 0 });
  }, [data.charges, data.payments]);

  const paymentsByChargeId = useMemo(() => {
    const map = new Map<string, LeasePayment[]>();
    for (const payment of data.payments) {
      if (!payment.chargeId) continue;
      const payments = map.get(payment.chargeId) ?? [];
      payments.push(payment);
      map.set(payment.chargeId, payments);
    }

    return map;
  }, [data.payments]);

  async function receivePayment(event: FormEvent<HTMLFormElement>, charge: LeaseCharge) {
    event.preventDefault();
    const contractId = charge.contract?.id;
    if (!contractId) return;

    setError("");
    setSavingId(charge.id);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/erp/leases/payments", {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        contractId,
        chargeId: charge.id,
        amount: form.get("amount"),
        paidAt: form.get("paidAt"),
        method: form.get("method"),
        reference: form.get("reference"),
        currency: charge.currency,
      }),
    });
    setSavingId("");

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.message ?? "გადახდის დაფიქსირება ვერ მოხერხდა.");
      return;
    }

    await loadData();
  }

  return (
    <LeaseModuleShell
      activeRoute="/erp/leases/payments"
      subtitle="აკონტროლეთ დარიცხვები, დავალიანებები და მიღებული თანხები ერთ სამუშაო გვერდზე."
      title="გადახდები"
    >
      <div className="grid gap-5 pb-12">
        {error ? <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-700">{error}</div> : null}

        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-[#DCE7F5] bg-[#F8FBFF] p-5 shadow-sm shadow-slate-200/70">
            <div className="flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white text-[#3178C6] shadow-sm shadow-slate-200/80">
                <ReceiptText size={23} />
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-bold uppercase text-[#6F7B96]">გადახდების კონტროლი</p>
                <h2 className="mt-1 text-[24px] font-semibold leading-tight text-[#111A3A]">დარიცხვები, ნაშთები და მიღებული თანხები ერთ ხედში</h2>
                <p className="mt-2 max-w-2xl text-[13px] font-semibold leading-6 text-[#64708A]">ღია დარიცხვებზე გადახდა პირდაპირ რიგიდან ფიქსირდება, დახურულ ჩანაწერებზე კი დეტალების ღილაკით ჩანს გადახდის სრული ისტორია.</p>
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <MiniStat label="ჩანაწერი" value={`${data.charges.length}`} />
            <MiniStat label="გადახდა" tone="green" value={`${data.payments.length}`} />
            <MiniStat label="ფილტრში ჩანს" value={`${filteredCharges.length}`} />
            <MiniStat label="ღია ნაშთი" tone={totals.due + totals.overdue > 0 ? "amber" : "green"} value={`${formatMoney(totals.due + totals.overdue)} ₾`} />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric icon={<WalletCards size={20} />} label="გადასახდელი" value={`${formatMoney(totals.due)} ₾`} tone="amber" />
          <Metric icon={<CheckCircle2 size={20} />} label="გადახდილი" value={`${formatMoney(totals.paid)} ₾`} tone="green" />
          <Metric icon={<CircleAlert size={20} />} label="ვადაგადაცილებული" value={`${formatMoney(totals.overdue)} ₾`} tone="red" />
          <Metric icon={<CreditCard size={20} />} label="ნაწილობრივი ნაშთი" value={`${formatMoney(totals.partial)} ₾`} tone="purple" />
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#E1E5EF] bg-white shadow-sm shadow-slate-200/70">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E6EAF2] bg-white px-5 py-4">
            <div>
              <h2 className="text-[21px] font-semibold text-[#111A3A]">დარიცხვების სია</h2>
              <p className="mt-0.5 text-[13px] font-semibold text-[#8A94AA]">გადახდის მიღება შესაძლებელია პირდაპირ რიგიდან.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex h-11 w-[280px] items-center gap-2 rounded-xl border border-[#DDE3EE] bg-[#FBFCFF] px-3 text-[#53617D] transition focus-within:border-[#6849F5] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#6849F5]/10">
                <Search size={18} />
                <input className="w-full bg-transparent text-[14px] font-semibold outline-none placeholder:text-[#9AA4B8]" onChange={(event) => setQuery(event.target.value)} placeholder="ძებნა..." value={query} />
              </label>
              <label className="flex h-11 items-center gap-2 rounded-xl border border-[#DDE3EE] bg-[#FBFCFF] px-3 text-[#53617D] transition focus-within:border-[#6849F5] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#6849F5]/10">
                <Filter size={17} />
                <select className="bg-transparent text-[13px] font-semibold outline-none" onChange={(event) => setStatus(event.target.value)} value={status}>
                  {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1240px] table-fixed text-left">
              <thead className="bg-[#F7F8FC] text-[11px] font-bold uppercase text-[#6F7B96]">
                <tr>
                  <th className="w-[24%] px-4 py-3">იჯარა</th>
                  <th className="w-[15%] px-4 py-3">მოიჯარე</th>
                  <th className="w-[11%] px-4 py-3">ვადა</th>
                  <th className="w-[10%] px-4 py-3 text-right">დარიცხული</th>
                  <th className="w-[10%] px-4 py-3 text-right">ნაშთი</th>
                  <th className="w-[10%] px-4 py-3">სტატუსი</th>
                  <th className="w-[18%] px-4 py-3">გადახდის მიღება</th>
                  <th className="w-[12%] px-4 py-3 text-right">დეტალები</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1F6]">
                {filteredCharges.map((charge) => {
                  const balance = Math.max(Number(charge.amount || 0) - Number(charge.paidAmount || 0), 0);
                  const chargePayments = paymentsByChargeId.get(charge.id) ?? [];
                  const isExpanded = expandedChargeId === charge.id;
                  return (
                    <Fragment key={charge.id}>
                      <tr className={`h-[78px] transition ${isExpanded ? "bg-[#FBFCFF]" : "hover:bg-[#FBFCFF]"}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#EEF7FF] text-[#3178C6]"><CalendarDays size={18} /></span>
                            <div className="min-w-0">
                              <Link className="block truncate text-[14px] font-bold text-[#111A3A] hover:text-[#6849F5]" href={`/erp/leases/contracts/${charge.contract?.id ?? ""}`}>
                                {charge.contract?.asset?.name ?? "ობიექტი არ არის"}
                              </Link>
                              <p className="mt-0.5 truncate text-[12px] font-semibold text-[#8A94AA]">{charge.contract?.contractNumber ?? "ხელშეკრულება არ არის"} · {charge.title}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[13px] font-semibold text-[#111A3A]">{charge.contract?.tenant?.name ?? "მოიჯარე არ არის"}</td>
                        <td className="px-4 py-3 text-[13px] font-semibold text-[#111A3A]">{formatDate(charge.dueDate)}</td>
                        <td className="px-4 py-3 text-right text-[13px] font-bold text-[#111A3A]">{formatMoney(charge.amount)} {charge.currency}</td>
                        <td className={balance > 0 ? "px-4 py-3 text-right text-[13px] font-bold text-[#E48700]" : "px-4 py-3 text-right text-[13px] font-bold text-[#159961]"}>{formatMoney(balance)} {charge.currency}</td>
                        <td className="px-4 py-3"><StatusPill status={charge.status} /></td>
                        <td className="px-4 py-3">
                          {balance > 0 ? (
                            <form className="grid gap-2" onSubmit={(event) => receivePayment(event, charge)}>
                              <div className="flex items-center gap-2">
                                <input className="h-9 w-24 rounded-lg border border-[#DDE3EE] bg-white px-2 text-right text-[12px] font-bold text-[#111A3A] outline-none transition focus:border-[#6849F5] focus:ring-2 focus:ring-[#6849F5]/10" defaultValue={String(balance)} min="0.01" name="amount" step="0.01" type="number" />
                                <input className="h-9 w-[116px] rounded-lg border border-[#DDE3EE] bg-white px-2 text-[12px] font-semibold outline-none transition focus:border-[#6849F5] focus:ring-2 focus:ring-[#6849F5]/10" defaultValue={todayInput()} name="paidAt" type="date" />
                                <button className="h-9 rounded-lg bg-[#6849F5] px-3 text-[12px] font-bold text-white shadow-sm shadow-violet-500/20 transition hover:bg-[#5A3FE0] disabled:opacity-60" disabled={savingId === charge.id} type="submit">
                                  მიღება
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <select className="h-9 w-[128px] rounded-lg border border-[#DDE3EE] bg-white px-2 text-[12px] font-semibold outline-none transition focus:border-[#6849F5] focus:ring-2 focus:ring-[#6849F5]/10" defaultValue={method} name="method" onChange={(event) => setMethod(event.target.value)}>
                                  <option value="bank_transfer">ბანკი</option>
                                  <option value="cash">ნაღდი</option>
                                  <option value="card">ბარათი</option>
                                  <option value="other">სხვა</option>
                                </select>
                                <input className="h-9 min-w-0 flex-1 rounded-lg border border-[#DDE3EE] bg-white px-2 text-[12px] font-semibold outline-none transition placeholder:text-[#9AA4B8] focus:border-[#6849F5] focus:ring-2 focus:ring-[#6849F5]/10" name="reference" placeholder="დანიშნულება" />
                              </div>
                            </form>
                          ) : (
                            <span className="inline-flex h-9 items-center rounded-lg bg-[#ECFBF4] px-3 text-[12px] font-semibold text-[#159961]">დახურულია</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-[12px] font-bold shadow-sm transition ${isExpanded ? "bg-[#111A3A] text-white shadow-slate-400/30" : "border border-[#DDE3EE] bg-white text-[#4C5875] shadow-slate-200/70 hover:border-[#3178C6] hover:bg-[#EEF7FF] hover:text-[#3178C6]"}`} onClick={() => setExpandedChargeId(isExpanded ? null : charge.id)} type="button">
                            <Eye size={15} />
                            დეტალები
                            <ChevronDown className={`transition ${isExpanded ? "rotate-180" : ""}`} size={14} />
                          </button>
                        </td>
                      </tr>
                      {isExpanded ? (
                        <tr className="bg-[#FBFCFF]">
                          <td className="px-4 pb-5 pt-0" colSpan={8}>
                            <ChargeDetails balance={balance} charge={charge} payments={chargePayments} />
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
                {!filteredCharges.length ? (
                  <tr>
                    <td className="px-5 py-16 text-center" colSpan={8}>
                      <ReceiptText className="mx-auto text-[#8A94AA]" size={34} />
                      <p className="mt-3 text-[15px] font-semibold text-[#111A3A]">დარიცხვები ჯერ არ არის</p>
                      <p className="mt-1 text-[13px] font-semibold text-[#8A94AA]">იჯარის პროფილიდან დააგენერირეთ გადახდის გრაფიკი.</p>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </LeaseModuleShell>
  );
}

function Metric({ icon, label, tone, value }: { icon: React.ReactNode; label: string; tone: "green" | "red" | "amber" | "purple"; value: string }) {
  const classes = {
    amber: "bg-[#FFF7E8] text-[#D98200]",
    green: "bg-[#ECFBF4] text-[#159961]",
    purple: "bg-[#F0ECFF] text-[#6849F5]",
    red: "bg-[#FFF1F3] text-[#E34E5B]",
  }[tone];
  return (
    <article className="flex h-[88px] items-center gap-4 rounded-2xl border border-[#E1E5EF] bg-white px-5 shadow-sm shadow-slate-200/70">
      <span className={`grid size-11 place-items-center rounded-xl ${classes}`}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[12px] font-semibold text-[#6F7B96]">{label}</p>
        <p className="mt-1 truncate text-[22px] font-semibold text-[#111A3A]">{value}</p>
      </div>
    </article>
  );
}

function MiniStat({ label, tone = "blue", value }: { label: string; tone?: "amber" | "blue" | "green"; value: string }) {
  const dotClass = tone === "green" ? "bg-[#22C55E]" : tone === "amber" ? "bg-[#F59E0B]" : "bg-[#3178C6]";

  return (
    <div className="flex h-[74px] items-center justify-between rounded-2xl border border-[#E1E5EF] bg-white px-4 shadow-sm shadow-slate-200/70">
      <div className="min-w-0">
        <p className="text-[12px] font-bold uppercase text-[#8A94AA]">{label}</p>
        <p className="mt-1 truncate text-[20px] font-semibold text-[#111A3A]">{value}</p>
      </div>
      <span className={`size-2.5 rounded-full ${dotClass}`} />
    </div>
  );
}

function ChargeDetails({ balance, charge, payments }: { balance: number; charge: LeaseCharge; payments: LeasePayment[] }) {
  const paidTotal = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  return (
    <div className="rounded-2xl border border-[#DCE7F5] bg-white p-4 shadow-sm shadow-slate-200/60">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[12px] font-bold uppercase text-[#6F7B96]">გადახდის დეტალები</p>
          <p className="mt-1 text-[14px] font-semibold text-[#111A3A]">{charge.contract?.contractNumber ?? "ხელშეკრულება არ არის"} · {charge.title}</p>
        </div>
        <StatusPill status={charge.status} />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <DetailStat label="დარიცხული" value={`${formatMoney(charge.amount)} ${charge.currency}`} />
        <DetailStat label="გადახდილი ჩანაწერებით" tone="green" value={`${formatMoney(paidTotal)} ${charge.currency}`} />
        <DetailStat label="ნაშთი" tone={balance > 0 ? "amber" : "green"} value={`${formatMoney(balance)} ${charge.currency}`} />
        <DetailStat label="ვადა" value={formatDate(charge.dueDate)} />
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-[#EEF1F6]">
        <div className="grid grid-cols-[120px_120px_1fr_1fr] bg-[#F7F8FC] px-4 py-2 text-[11px] font-bold uppercase text-[#6F7B96]">
          <span>თარიღი</span>
          <span>თანხა</span>
          <span>მეთოდი</span>
          <span>დანიშნულება</span>
        </div>
        {payments.length ? payments.map((payment) => (
          <div className="grid grid-cols-[120px_120px_1fr_1fr] items-center border-t border-[#EEF1F6] px-4 py-3 text-[12px] font-semibold text-[#4C5875]" key={payment.id}>
            <span className="text-[#111A3A]">{formatDate(payment.paidAt)}</span>
            <span className="font-bold text-[#159961]">{formatMoney(payment.amount)} {payment.currency}</span>
            <span>{methodLabel(payment.method)}</span>
            <span className="truncate">{payment.reference || payment.note || "-"}</span>
          </div>
        )) : (
          <div className="border-t border-[#EEF1F6] px-4 py-5 text-center text-[13px] font-semibold text-[#8A94AA]">
            ამ დარიცხვაზე გადახდის დეტალი ჯერ არ ჩანს.
          </div>
        )}
      </div>
    </div>
  );
}

function DetailStat({ label, tone, value }: { label: string; tone?: "amber" | "green"; value: string }) {
  const valueClass = tone === "green" ? "text-[#159961]" : tone === "amber" ? "text-[#E48700]" : "text-[#111A3A]";

  return (
    <div className="rounded-xl border border-[#EEF1F6] bg-[#FBFCFF] px-4 py-3">
      <p className="text-[11px] font-bold uppercase text-[#8A94AA]">{label}</p>
      <p className={`mt-1 truncate text-[14px] font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: LeaseCharge["status"] }) {
  const labels = { cancelled: "გაუქმებულია", open: "გადასახდელია", overdue: "ვადაგადაცილებულია", paid: "გადახდილია", partially_paid: "ნაწილობრივ" };
  const classes = {
    cancelled: "bg-[#EEF1F6] text-[#68748D]",
    open: "bg-[#FFF0D3] text-[#E48700]",
    overdue: "bg-[#FDE1E3] text-[#E34E5B]",
    paid: "bg-[#DDF7EB] text-[#159961]",
    partially_paid: "bg-[#F0ECFF] text-[#6849F5]",
  };
  return <span className={`inline-flex h-7 items-center rounded-full px-3 text-[12px] font-semibold ${classes[status]}`}>{labels[status]}</span>;
}

function methodLabel(method: string) {
  return ({ bank_transfer: "ბანკი", card: "ბარათი", cash: "ნაღდი", other: "სხვა" } as Record<string, string>)[method] ?? method;
}

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ka-GE");
}

function formatMoney(value: string | number) {
  return Number(value || 0).toLocaleString("ka-GE", { maximumFractionDigits: 2 });
}
