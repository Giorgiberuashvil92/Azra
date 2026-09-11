"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { getAuthHeaders } from "@/components/erp/CoreModuleShell";
import { LeaseModuleShell } from "../../_components/lease-module-shell";

type Tenant = { id: string; name: string };
type Unit = { id: string; name: string; code?: string | null; monthlyRent: string | number; currency: string; status: string; property?: { name: string } | null };
type LeaseData = { tenants: Tenant[]; assets: Unit[] };

export default function NewLeaseContractPage() {
  return <Suspense fallback={null}><NewLeaseContractContent /></Suspense>;
}

function NewLeaseContractContent() {
  const router = useRouter();
  const [data, setData] = useState<LeaseData>({ tenants: [], assets: [] });
  const [tenantMode, setTenantMode] = useState<"existing" | "new">("existing");
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [monthlyRent, setMonthlyRent] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    void fetch("/api/erp/leases", { headers: getAuthHeaders(), cache: "no-store" })
      .then(async (response) => {
        if (!ignore) setData(response.ok ? await response.json() : { tenants: [], assets: [] });
      })
      .catch(() => undefined);

    return () => {
      ignore = true;
    };
  }, []);

  const availableUnits = useMemo(() => data.assets.filter((unit) => ["available", "reserved"].includes(unit.status)), [data.assets]);
  const selectedTotal = useMemo(() => availableUnits.filter((unit) => selectedUnits.includes(unit.id)).reduce((sum, unit) => sum + Number(unit.monthlyRent || 0), 0), [availableUnits, selectedUnits]);

  useEffect(() => {
    setMonthlyRent(String(selectedTotal || ""));
  }, [selectedTotal]);

  async function createContract(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!selectedUnits.length) {
      setError("აირჩიეთ მინიმუმ ერთი გასაქირავებელი ერთეული.");
      return;
    }
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const response = await fetch("/api/erp/leases/contracts", {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, tenantMode, rentalUnitIds: selectedUnits, monthlyRent }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.message ?? "იჯარის დამატება ვერ მოხერხდა.");
      return;
    }

    router.push("/erp/leases/contracts");
  }

  return (
    <LeaseModuleShell
      activeRoute="/erp/leases/contracts"
      actions={<Link className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#DDE3EE] bg-white px-5 text-[14px] font-bold text-[#4C5875]" href="/erp/leases/contracts"><ArrowLeft size={16} /> უკან</Link>}
      subtitle="იჯარა მიაბით კონკრეტულ ერთეულს ან რამდენიმე ერთეულს ერთ ხელშეკრულებაში."
      title="ახალი იჯარა"
    >
      <form className="grid gap-5 pb-12 text-[#111A3A]" onSubmit={createContract}>
        {error ? <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-[13px] font-bold text-rose-700">{error}</div> : null}
        <section className="rounded-2xl border border-[#E1E5EF] bg-white p-6 shadow-sm shadow-slate-200/70">
          <SectionTitle icon={<FileText size={22} />} subtitle="ხელშეკრულების ნომერი, მოიჯარე და პერიოდი." title="ძირითადი ინფორმაცია" />
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Field defaultValue={`L-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`} label="ხელშეკრულების ნომერი" name="contractNumber" placeholder="L-2026-0001" required />
            <Select label="სტატუსი" name="status">
              <option value="active">აქტიური</option>
              <option value="draft">დრაფტი</option>
            </Select>
            <Field label="დაწყების თარიღი" name="startsAt" placeholder="" required type="date" />
            <Field label="დასრულების თარიღი" name="endsAt" placeholder="" type="date" />
            <Field defaultValue="1" label="გადახდის დღე" name="paymentDay" placeholder="1" required type="number" />
          </div>
        </section>

        <section className="rounded-2xl border border-[#E1E5EF] bg-white p-6 shadow-sm shadow-slate-200/70">
          <SectionTitle icon={<Plus size={22} />} subtitle="შეგიძლიათ აირჩიოთ არსებული მოიჯარე ან შექმნათ ახალი პირდაპირ იჯარის დამატებისას." title="მოიჯარე" />
          <div className="mt-5 inline-flex rounded-xl border border-[#DDE3EE] bg-[#F7F8FC] p-1">
            <button className={`h-10 rounded-lg px-4 text-[13px] font-black ${tenantMode === "existing" ? "bg-white text-[#6849F5] shadow-sm" : "text-[#6F7B96]"}`} onClick={() => setTenantMode("existing")} type="button">არსებული</button>
            <button className={`h-10 rounded-lg px-4 text-[13px] font-black ${tenantMode === "new" ? "bg-white text-[#6849F5] shadow-sm" : "text-[#6F7B96]"}`} onClick={() => setTenantMode("new")} type="button">ახალი მოიჯარე</button>
          </div>
          {tenantMode === "existing" ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Select label="მოიჯარე" name="tenantId" required={tenantMode === "existing"}>
                <option value="">აირჩიეთ მოიჯარე</option>
                {data.tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}
              </Select>
              {!data.tenants.length ? <div className="flex items-end text-[13px] font-bold text-[#E48700]">მოიჯარე ჯერ არ არის დამატებული. გადადით “ახალი მოიჯარე”-ზე.</div> : null}
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <Field label="მოიჯარის სახელი" name="tenantName" placeholder="მაგ. შპს ალფა" required={tenantMode === "new"} />
              <Select label="ტიპი" name="tenantType">
                <option value="company">კომპანია</option>
                <option value="individual">ფიზიკური პირი</option>
              </Select>
              <Field label="საიდენტიფიკაციო ნომერი" name="tenantTaxId" placeholder="მაგ. 405000000" />
              <Field label="პირადი ნომერი" name="tenantPersonalId" placeholder="ფიზიკური პირისთვის" />
              <Field label="საკონტაქტო პირი" name="tenantContactName" placeholder="სახელი და გვარი" />
              <Field label="ტელეფონი" name="tenantPhone" placeholder="+995..." />
              <Field label="ელფოსტა" name="tenantEmail" placeholder="name@company.ge" type="email" />
              <Field className="md:col-span-2" label="მისამართი" name="tenantAddress" placeholder="ქალაქი, ქუჩა, ნომერი" />
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[#E1E5EF] bg-white p-6 shadow-sm shadow-slate-200/70">
          <SectionTitle icon={<Plus size={22} />} subtitle="აირჩიეთ თავისუფალი ან დაჯავშნილი ერთეულები. დაკავებული ერთეულები ხელმისაწვდომი არ არის." title="ობიექტები" />
          <div className="mt-5 grid gap-3">
            {availableUnits.map((unit) => (
              <label className="flex min-h-14 items-center gap-4 rounded-xl border border-[#E1E5EF] px-4 py-3 text-[14px] font-bold text-[#4C5875] hover:bg-[#FBFCFF]" key={unit.id}>
                <input
                  checked={selectedUnits.includes(unit.id)}
                  className="size-4 accent-[#6849F5]"
                  onChange={(event) => setSelectedUnits((current) => event.target.checked ? [...current, unit.id] : current.filter((id) => id !== unit.id))}
                  type="checkbox"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[#111A3A]">{unit.property?.name ?? "ობიექტი"} · {unit.name}</span>
                  <span className="mt-0.5 block text-[12px] text-[#7D88A2]">{unit.code ?? "კოდის გარეშე"}</span>
                </span>
                <span className="font-black text-[#111A3A]">{formatMoney(unit.monthlyRent)} {unit.currency}</span>
              </label>
            ))}
            {!availableUnits.length ? <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-[13px] font-bold text-amber-700">თავისუფალი ერთეული ჯერ არ არის.</div> : null}
          </div>
        </section>

        <section className="rounded-2xl border border-[#E1E5EF] bg-white p-6 shadow-sm shadow-slate-200/70">
          <SectionTitle icon={<FileText size={22} />} subtitle="ეს არის კონკრეტული იჯარის ფინანსური პირობები." title="ფასი და პირობები" />
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Field label="თვიური თანხა" name="monthlyRentVisible" onChange={setMonthlyRent} placeholder="0.00" required type="number" value={monthlyRent} />
            <Field defaultValue="0" label="დეპოზიტი" name="depositAmount" placeholder="0.00" type="number" />
            <Select label="ვალუტა" name="currency">
              <option value="GEL">GEL</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </Select>
            <Field defaultValue="18" label="დღგ %" name="vatRate" placeholder="18" type="number" />
            <label className="grid gap-1 text-[13px] font-bold text-[#4C5875] md:col-span-3">
              შენიშვნა
              <textarea className="min-h-24 rounded-xl border border-[#DDE3EE] px-3 py-3 text-[14px] font-semibold outline-none focus:border-[#6849F5]" name="notes" placeholder="ხელშეკრულების შიდა შენიშვნა..." />
            </label>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Link className="inline-flex h-12 items-center rounded-xl border border-[#DDE3EE] bg-white px-5 text-[14px] font-bold text-[#4C5875]" href="/erp/leases/contracts">გაუქმება</Link>
          <button className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#6849F5] px-6 text-[14px] font-black text-white shadow-lg shadow-violet-500/25" type="submit"><Plus size={18} /> იჯარის დამატება</button>
        </div>
      </form>
    </LeaseModuleShell>
  );
}

function SectionTitle({ icon, subtitle, title }: { icon: React.ReactNode; subtitle: string; title: string }) {
  return <div className="flex items-start gap-3"><span className="grid size-11 place-items-center rounded-xl bg-[#F0ECFF] text-[#6849F5]">{icon}</span><div><h2 className="text-[19px] font-black">{title}</h2><p className="mt-1 text-[13px] font-semibold text-[#7D88A2]">{subtitle}</p></div></div>;
}

function Field({ className = "", defaultValue, label, name, onChange, placeholder, required, type = "text", value }: { className?: string; defaultValue?: string; label: string; name: string; onChange?: (value: string) => void; placeholder: string; required?: boolean; type?: string; value?: string }) {
  return <label className={`grid gap-1 text-[13px] font-bold text-[#4C5875] ${className}`}>{label}<input className="h-11 rounded-xl border border-[#DDE3EE] px-3 text-[14px] font-semibold outline-none focus:border-[#6849F5]" defaultValue={value === undefined ? defaultValue : undefined} name={name} onChange={onChange ? (event) => onChange(event.target.value) : undefined} placeholder={placeholder} required={required} step={type === "number" ? "0.01" : undefined} type={type} value={value} /></label>;
}

function Select({ children, label, name, required }: { children: React.ReactNode; label: string; name: string; required?: boolean }) {
  return <label className="grid gap-1 text-[13px] font-bold text-[#4C5875]">{label}<select className="h-11 rounded-xl border border-[#DDE3EE] bg-white px-3 text-[14px] font-semibold outline-none focus:border-[#6849F5]" name={name} required={required}>{children}</select></label>;
}

function formatMoney(value: string | number) {
  return Number(value || 0).toLocaleString("ka-GE", { maximumFractionDigits: 2 });
}
