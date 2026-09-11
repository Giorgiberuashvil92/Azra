"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, CalendarDays, CircleDollarSign, CreditCard, Download, Landmark, Mail, Phone, ReceiptText, RefreshCw, Trash2, UserRound } from "lucide-react";
import { useParams } from "next/navigation";
import { getAuthHeaders } from "@/components/erp/CoreModuleShell";
import { LeaseModuleShell } from "../../_components/lease-module-shell";

type Charge = { id: string; dueDate: string; title: string; amount: string | number; paidAmount: string | number; currency: string; status: "open" | "partially_paid" | "paid" | "overdue" | "cancelled" };
type Payment = { id: string; paidAt: string; amount: string | number; currency: string; method: string; reference?: string | null };
type Contract = {
  id: string;
  contractNumber: string;
  startsAt: string;
  endsAt?: string | null;
  paymentDay: number;
  monthlyRent: string | number;
  depositAmount: string | number;
  currency: string;
  status: "draft" | "active" | "expired" | "terminated";
  notes?: string | null;
  tenant: { name: string; type: string; phone?: string | null; email?: string | null; taxId?: string | null; personalId?: string | null };
  contractUnits: Array<{ rentalUnit: { id: string; name: string; code?: string | null; area?: string | number | null; monthlyRent: string | number; property?: { name: string; address?: string | null } | null } }>;
  charges: Charge[];
  payments: Payment[];
};

export default function LeaseContractProfilePage() {
  return <Suspense fallback={null}><LeaseContractProfileContent /></Suspense>;
}

function LeaseContractProfileContent() {
  const params = useParams<{ id: string }>();
  const [contract, setContract] = useState<Contract | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingCharges, setIsGeneratingCharges] = useState(false);
  const [deletingChargeId, setDeletingChargeId] = useState<string | null>(null);
  const [isDeletingSchedule, setIsDeletingSchedule] = useState(false);

  async function loadContract() {
    setIsLoading(true);
    const response = await fetch(`/api/erp/leases/contracts/${params.id}`, { headers: getAuthHeaders(), cache: "no-store" });
    setContract(response.ok ? await response.json() : null);
    setIsLoading(false);
  }

  useEffect(() => {
    void loadContract().catch(() => setIsLoading(false));
  }, [params.id]);

  const totals = useMemo(() => {
    const charged = contract?.charges.reduce((sum, charge) => sum + Number(charge.amount || 0), 0) ?? 0;
    const paid = contract?.charges.reduce((sum, charge) => sum + Number(charge.paidAmount || 0), 0) ?? 0;
    return { charged, paid, debt: charged - paid };
  }, [contract]);

  const scheduleStats = useMemo(() => {
    const charges = contract?.charges ?? [];
    const openCharges = charges.filter((charge) => ["open", "partially_paid", "overdue"].includes(charge.status));
    const nextCharge = openCharges.sort((first, second) => new Date(first.dueDate).getTime() - new Date(second.dueDate).getTime())[0];

    return {
      count: charges.length,
      openCount: openCharges.length,
      nextDueDate: nextCharge ? formatDate(nextCharge.dueDate) : "-",
    };
  }, [contract]);

  async function generateCharges() {
    if (isGeneratingCharges) return;
    setError("");
    setIsGeneratingCharges(true);
    try {
      const response = await fetch(`/api/erp/leases/contracts/${params.id}/generate-charges`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ months: 12 }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.message ?? "გადახდის გრაფიკის გენერირება ვერ მოხერხდა.");
        return;
      }
      await loadContract();
    } finally {
      setIsGeneratingCharges(false);
    }
  }

  async function createPayment(event: React.FormEvent<HTMLFormElement>, charge: Charge) {
    event.preventDefault();
    if (!contract) return;
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/erp/leases/payments", {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ ...Object.fromEntries(form.entries()), contractId: contract.id, chargeId: charge.id, currency: charge.currency }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.message ?? "გადახდის მიღება ვერ მოხერხდა.");
      return;
    }
    await loadContract();
  }

  async function deleteCharge(charge: Charge) {
    if (deletingChargeId || isDeletingSchedule) return;
    const confirmed = window.confirm(`წაიშალოს დარიცხვა ${formatDate(charge.dueDate)}?`);
    if (!confirmed) return;

    setError("");
    setDeletingChargeId(charge.id);
    try {
      const response = await fetch(`/api/erp/leases/contracts/${params.id}/charges/${charge.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.message ?? "დარიცხვის წაშლა ვერ მოხერხდა.");
        return;
      }
      await loadContract();
    } finally {
      setDeletingChargeId(null);
    }
  }

  async function deleteSchedule() {
    if (!contract?.charges.length || isDeletingSchedule || deletingChargeId) return;
    const confirmed = window.confirm("წაიშალოს გადახდის გრაფიკის ყველა დარიცხვა?");
    if (!confirmed) return;

    setError("");
    setIsDeletingSchedule(true);
    try {
      const response = await fetch(`/api/erp/leases/contracts/${params.id}/charges`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.message ?? "გრაფიკის წაშლა ვერ მოხერხდა.");
        return;
      }
      await loadContract();
    } finally {
      setIsDeletingSchedule(false);
    }
  }

  return (
    <LeaseModuleShell
      activeRoute="/erp/leases/contracts"
      actions={<Link className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#DDE3EE] bg-white px-5 text-[14px] font-bold text-[#4C5875]" href="/erp/leases/contracts"><ArrowLeft size={16} /> უკან</Link>}
      subtitle="ხელშეკრულების დეტალები, მიბმული ობიექტები, გადახდის გრაფიკი და დავალიანება."
      title={contract ? `იჯარა ${contract.contractNumber}` : "იჯარის პროფილი"}
    >
      {isLoading ? <div className="rounded-2xl border border-[#E1E5EF] bg-white p-6 text-[14px] font-bold text-[#7D88A2]">იტვირთება...</div> : null}
      {!isLoading && !contract ? <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-[14px] font-bold text-rose-700">იჯარა ვერ მოიძებნა.</div> : null}
      {contract ? (
        <div className="grid gap-5 pb-12">
          {error ? <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-[13px] font-bold text-rose-700">{error}</div> : null}

          <section className="rounded-2xl border border-[#E1E5EF] bg-white p-5 shadow-sm shadow-slate-200/70">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex h-8 items-center rounded-full bg-[#F0ECFF] px-3 text-[12px] font-semibold text-[#6849F5]">{statusLabel(contract.status)}</span>
                  <span className="inline-flex h-8 items-center rounded-full bg-[#F7F8FC] px-3 text-[12px] font-semibold text-[#64708A]">{contract.contractNumber}</span>
                </div>
                <h2 className="mt-3 text-[24px] font-semibold leading-tight text-[#111A3A]">
                  {contract.tenant.name} · {contract.contractUnits.length ? contract.contractUnits[0].rentalUnit.property?.name ?? contract.contractUnits[0].rentalUnit.name : "ობიექტი"}
                </h2>
                <p className="mt-2 text-[13px] font-semibold text-[#7D88A2]">
                  {formatDate(contract.startsAt)} - {contract.endsAt ? formatDate(contract.endsAt) : "უვადო"} · გადახდის დღე ყოველი თვის {contract.paymentDay}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#DDE3EE] bg-white px-4 text-[13px] font-semibold text-[#4C5875]" type="button">
                  <Download size={16} />
                  დოკუმენტი
                </button>
                <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#DDE3EE] bg-white px-4 text-[13px] font-semibold text-[#4C5875] disabled:cursor-not-allowed disabled:opacity-60" disabled={isGeneratingCharges} onClick={generateCharges} type="button">
                  <RefreshCw size={16} />
                  {isGeneratingCharges ? "გენერირდება..." : "გრაფიკი"}
                </button>
                <Link className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#6849F5] px-4 text-[13px] font-bold text-white shadow-lg shadow-violet-500/20" href="#payment-schedule">
                  <CreditCard size={16} />
                  გადახდის მიღება
                </Link>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-4 gap-3">
              <Metric icon={<CircleDollarSign size={20} />} label="თვიური თანხა" value={`${formatMoney(contract.monthlyRent)} ${contract.currency}`} />
              <Metric icon={<CreditCard size={20} />} label="დავალიანება" tone={totals.debt > 0 ? "red" : "green"} value={`${formatMoney(totals.debt)} ${contract.currency}`} />
              <Metric icon={<ReceiptText size={20} />} label="დარიცხული" value={`${formatMoney(totals.charged)} ${contract.currency}`} />
              <Metric icon={<Landmark size={20} />} label="დეპოზიტი" value={`${formatMoney(contract.depositAmount)} ${contract.currency}`} />
            </div>
          </section>

          <section className="grid grid-cols-[minmax(0,1fr)_360px] gap-5">
            <div className="grid gap-5">
              <Card title="ხელშეკრულების პირობები">
                <div className="grid grid-cols-4 gap-3">
                  <InfoTile label="დაწყება" value={formatDate(contract.startsAt)} />
                  <InfoTile label="დასრულება" value={contract.endsAt ? formatDate(contract.endsAt) : "უვადო"} />
                  <InfoTile label="გადახდის დღე" value={`${contract.paymentDay}`} />
                  <InfoTile label="ვალუტა" value={contract.currency} />
                </div>
                {contract.notes ? <p className="mt-4 rounded-xl bg-[#F8FAFD] px-4 py-3 text-[13px] font-semibold leading-6 text-[#64708A]">{contract.notes}</p> : null}
              </Card>

              <Card title="მიბმული ობიექტები">
                <div className="grid gap-3">
                  {contract.contractUnits.map((item) => (
                    <div className="flex items-center gap-3 rounded-xl border border-[#EEF1F6] px-4 py-3" key={item.rentalUnit.id}>
                      <span className="grid size-10 place-items-center rounded-xl bg-[#F0ECFF] text-[#6849F5]"><Building2 size={19} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold text-[#111A3A]">{item.rentalUnit.property?.name ?? "ობიექტი"} · {item.rentalUnit.name}</p>
                        <p className="mt-0.5 text-[12px] font-semibold text-[#8A94AA]">{item.rentalUnit.code ?? "კოდის გარეშე"} · {item.rentalUnit.area ? `${item.rentalUnit.area} მ²` : "ფართობი არ არის"}</p>
                      </div>
                      <strong className="text-[14px] text-[#111A3A]">{formatMoney(item.rentalUnit.monthlyRent)} {contract.currency}</strong>
                    </div>
                  ))}
                </div>
              </Card>

              <Card
                action={
                  <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#6849F5] px-4 text-[13px] font-bold text-white shadow-lg shadow-violet-500/20 transition hover:bg-[#5A3FE0] disabled:cursor-not-allowed disabled:opacity-60" disabled={isGeneratingCharges} onClick={generateCharges} type="button">
                    <RefreshCw className={isGeneratingCharges ? "animate-spin" : ""} size={16} />
                    {isGeneratingCharges ? "გენერირდება..." : "გრაფიკის გენერირება"}
                  </button>
                }
                title="გადახდის გრაფიკი"
              >
                <div className="mb-4 grid gap-3 rounded-2xl border border-[#EEF1F6] bg-[#FBFCFF] p-4 md:grid-cols-[1fr_auto]">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <ScheduleStat icon={<ReceiptText size={17} />} label="ჩანაწერი" value={`${scheduleStats.count}`} />
                    <ScheduleStat icon={<CreditCard size={17} />} label="ღიაა" tone={scheduleStats.openCount ? "amber" : "green"} value={`${scheduleStats.openCount}`} />
                    <ScheduleStat icon={<CalendarDays size={17} />} label="შემდეგი ვადა" value={scheduleStats.nextDueDate} />
                  </div>
                  <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-rose-100 bg-white px-4 text-[13px] font-bold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60" disabled={!contract.charges.length || isDeletingSchedule || Boolean(deletingChargeId)} onClick={deleteSchedule} type="button">
                    <Trash2 size={16} />
                    {isDeletingSchedule ? "იშლება..." : "ყველას წაშლა"}
                  </button>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-[#E6EAF2]" id="payment-schedule">
                  <table className="w-full min-w-[920px] text-left">
                    <thead className="bg-[#F7F8FC] text-[11px] font-bold uppercase text-[#6F7B96]">
                      <tr>
                        <th className="px-4 py-3">ვადა</th>
                        <th className="px-4 py-3 text-right">დარიცხული</th>
                        <th className="px-4 py-3 text-right">გადახდილი</th>
                        <th className="px-4 py-3 text-right">ნაშთი</th>
                        <th className="px-4 py-3">სტატუსი</th>
                        <th className="px-4 py-3">გადახდის მიღება</th>
                        <th className="px-4 py-3 text-right">ქმედება</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEF1F6]">
                      {contract.charges.map((charge) => {
                        const balance = Math.max(Number(charge.amount) - Number(charge.paidAmount), 0);
                        return (
                          <tr className="h-[64px] bg-white transition hover:bg-[#FBFCFF]" key={charge.id}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <span className="grid size-9 place-items-center rounded-xl bg-[#EEF7FF] text-[#3178C6]"><CalendarDays size={16} /></span>
                                <div>
                                  <p className="text-[13px] font-bold text-[#111A3A]">{formatDate(charge.dueDate)}</p>
                                  <p className="mt-0.5 text-[11px] font-semibold text-[#8A94AA]">{charge.title}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-[13px] font-bold text-[#111A3A]">{formatMoney(charge.amount)} {charge.currency}</td>
                            <td className="px-4 py-3 text-right text-[13px] font-semibold text-[#64708A]">{formatMoney(charge.paidAmount)} {charge.currency}</td>
                            <td className={`px-4 py-3 text-right text-[13px] font-bold ${balance > 0 ? "text-[#E34E5B]" : "text-[#159961]"}`}>{formatMoney(balance)} {charge.currency}</td>
                            <td className="px-4 py-3"><ChargeStatus status={charge.status} /></td>
                            <td className="px-4 py-3">
                              {balance > 0 ? (
                                <form className="flex items-center gap-2" onSubmit={(event) => createPayment(event, charge)}>
                                  <input className="h-9 w-28 rounded-lg border border-[#DDE3EE] bg-white px-3 text-right text-[12px] font-bold text-[#111A3A] outline-none transition focus:border-[#6849F5] focus:ring-2 focus:ring-[#6849F5]/10" defaultValue={String(balance)} name="amount" step="0.01" type="number" />
                                  <button className="h-9 rounded-lg bg-[#111A3A] px-3 text-[12px] font-bold text-white transition hover:bg-[#263154]" type="submit">მიღება</button>
                                </form>
                              ) : <span className="inline-flex h-8 items-center rounded-lg bg-[#ECFBF4] px-3 text-[12px] font-bold text-[#159961]">დახურულია</span>}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button aria-label="დარიცხვის წაშლა" className="inline-grid size-9 place-items-center rounded-lg border border-transparent text-[#8A94AA] transition hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60" disabled={isDeletingSchedule || deletingChargeId === charge.id} onClick={() => deleteCharge(charge)} title="დარიცხვის წაშლა" type="button">
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {!contract.charges.length ? <tr><td className="px-4 py-12 text-center text-[13px] font-bold text-[#7D88A2]" colSpan={7}>გადახდის გრაფიკი ჯერ არ არის გენერირებული.</td></tr> : null}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            <aside className="grid content-start gap-5">
              <Card title="მოიჯარე">
                <div className="flex items-start gap-3">
                  <span className="grid size-11 place-items-center rounded-xl bg-[#ECFBF4] text-[#159961]"><UserRound size={20} /></span>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-[#111A3A]">{contract.tenant.name}</p>
                    <p className="mt-1 text-[12px] font-semibold text-[#8A94AA]">{contract.tenant.type === "company" ? contract.tenant.taxId ?? "ს/ნ არ არის" : contract.tenant.personalId ?? "პ/ნ არ არის"}</p>
                    <p className="mt-3 flex items-center gap-2 text-[13px] font-semibold text-[#4C5875]"><Phone size={15} /> {contract.tenant.phone ?? "ტელეფონი არ არის"}</p>
                    <p className="mt-1 flex items-center gap-2 text-[13px] font-semibold text-[#4C5875]"><Mail size={15} /> {contract.tenant.email ?? "ელფოსტა არ არის"}</p>
                  </div>
                </div>
              </Card>

              <Card title="ფინანსური შეჯამება">
                <SummaryLine label="დარიცხული" value={`${formatMoney(totals.charged)} ${contract.currency}`} />
                <SummaryLine label="გადახდილი" value={`${formatMoney(totals.paid)} ${contract.currency}`} />
                <SummaryLine label="დავალიანება" tone={totals.debt > 0 ? "red" : "green"} value={`${formatMoney(totals.debt)} ${contract.currency}`} />
                <SummaryLine label="დეპოზიტი" value={`${formatMoney(contract.depositAmount)} ${contract.currency}`} />
              </Card>

              <Card title="ბოლო გადახდები">
                <div className="grid gap-3">
                  {contract.payments.slice(0, 5).map((payment) => (
                    <div className="flex items-center justify-between rounded-xl border border-[#EEF1F6] px-3 py-2.5" key={payment.id}>
                      <div>
                        <p className="text-[13px] font-semibold text-[#111A3A]">{formatMoney(payment.amount)} {payment.currency}</p>
                        <p className="mt-0.5 text-[12px] font-semibold text-[#8A94AA]">{formatDate(payment.paidAt)}</p>
                      </div>
                      <span className="text-[12px] font-bold text-[#4C5875]">{methodLabel(payment.method)}</span>
                    </div>
                  ))}
                  {!contract.payments.length ? <div className="rounded-xl border border-dashed border-[#DDE3EE] bg-[#F8FAFD] p-5 text-center text-[13px] font-bold text-[#7D88A2]">გადახდა ჯერ არ არის.</div> : null}
                </div>
              </Card>
            </aside>
          </section>
        </div>
      ) : null}
    </LeaseModuleShell>
  );
}

function Card({ action, children, title }: { action?: React.ReactNode; children: React.ReactNode; title: string }) {
  return <section className="rounded-2xl border border-[#E1E5EF] bg-white p-5 shadow-sm shadow-slate-200/70"><div className="mb-5 flex items-center justify-between gap-4"><h2 className="text-[20px] font-semibold text-[#111A3A]">{title}</h2>{action}</div>{children}</section>;
}

function Metric({ icon, label, tone = "purple", value }: { icon: React.ReactNode; label: string; tone?: "purple" | "green" | "red"; value: string }) {
  const classes = tone === "green" ? "bg-[#ECFBF4] text-[#159961]" : tone === "red" ? "bg-[#FFF1F3] text-[#E34E5B]" : "bg-[#F0ECFF] text-[#6849F5]";
  return <article className="flex h-[82px] items-center gap-4 rounded-2xl border border-[#E1E5EF] bg-white px-5"><span className={`grid size-11 place-items-center rounded-xl ${classes}`}>{icon}</span><div className="min-w-0"><p className="text-[12px] font-semibold text-[#6F7B96]">{label}</p><p className="mt-1 truncate text-[21px] font-semibold text-[#111A3A]">{value}</p></div></article>;
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#EEF1F6] bg-[#FBFCFF] px-4 py-3">
      <p className="text-[12px] font-semibold text-[#7D88A2]">{label}</p>
      <p className="mt-1 truncate text-[14px] font-semibold text-[#111A3A]">{value}</p>
    </div>
  );
}

function ScheduleStat({ icon, label, tone = "blue", value }: { icon: React.ReactNode; label: string; tone?: "amber" | "blue" | "green"; value: string }) {
  const classes = tone === "green" ? "bg-[#ECFBF4] text-[#159961]" : tone === "amber" ? "bg-[#FFF7E8] text-[#D97706]" : "bg-[#EEF7FF] text-[#3178C6]";
  return (
    <div className="flex h-14 items-center gap-3 rounded-xl border border-[#EEF1F6] bg-white px-3">
      <span className={`grid size-9 place-items-center rounded-lg ${classes}`}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase text-[#8A94AA]">{label}</p>
        <p className="mt-0.5 truncate text-[14px] font-bold text-[#111A3A]">{value}</p>
      </div>
    </div>
  );
}

function SummaryLine({ label, tone, value }: { label: string; tone?: "green" | "red"; value: string }) {
  return <div className="flex items-center justify-between border-b border-[#EEF1F6] py-3 last:border-0"><span className="text-[13px] font-bold text-[#6F7B96]">{label}</span><strong className={tone === "red" ? "text-[14px] text-[#E34E5B]" : tone === "green" ? "text-[14px] text-[#159961]" : "text-[14px] text-[#111A3A]"}>{value}</strong></div>;
}

function ChargeStatus({ status }: { status: Charge["status"] }) {
  const labels = { open: "გადასახდელია", partially_paid: "ნაწილობრივ", paid: "გადახდილია", overdue: "ვადაგადაცილებულია", cancelled: "გაუქმებულია" };
  const classes = { open: "bg-[#FFF0D3] text-[#E48700]", partially_paid: "bg-[#F0ECFF] text-[#6849F5]", paid: "bg-[#DDF7EB] text-[#159961]", overdue: "bg-[#FDE1E3] text-[#E34E5B]", cancelled: "bg-[#EEF1F6] text-[#68748D]" };
  return <span className={`inline-flex h-7 items-center rounded-full px-3 text-[12px] font-semibold ${classes[status]}`}>{labels[status]}</span>;
}

function statusLabel(status: Contract["status"]) {
  return ({ draft: "დრაფტი", active: "აქტიური", expired: "დასრულებული", terminated: "გაუქმებული" } as const)[status];
}

function methodLabel(method: string) {
  return ({ cash: "ნაღდი", bank_transfer: "ბანკი", card: "ბარათი", other: "სხვა" } as Record<string, string>)[method] ?? method;
}

function formatMoney(value: string | number) {
  return Number(value || 0).toLocaleString("ka-GE", { maximumFractionDigits: 2 });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ka-GE");
}
