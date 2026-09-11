"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Plus, UsersRound } from "lucide-react";
import { getAuthHeaders } from "@/components/erp/CoreModuleShell";
import { LeaseModuleShell } from "../../_components/lease-module-shell";

export default function NewLeaseTenantPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function createTenant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/erp/leases/tenants", {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.message ?? "მოიჯარის დამატება ვერ მოხერხდა.");
      return;
    }

    router.push("/erp/leases/tenants");
  }

  return (
    <LeaseModuleShell
      activeRoute="/erp/leases/tenants"
      actions={<Link className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#DDE3EE] bg-white px-5 text-[14px] font-bold text-[#4C5875]" href="/erp/leases/tenants"><ArrowLeft size={16} /> უკან</Link>}
      subtitle="დაამატეთ კომპანია ან ფიზიკური პირი, რომელიც იჯარის ხელშეკრულებას მიებმება."
      title="ახალი მოიჯარე"
    >
      <TenantForm error={error} onSubmit={createTenant} submitLabel="მოიჯარის დამატება" />
    </LeaseModuleShell>
  );
}

function TenantForm({ error, onSubmit, submitLabel }: { error: string; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; submitLabel: string }) {
  const [type, setType] = useState("company");
  return (
    <form className="grid gap-5 pb-12 text-[#111A3A]" onSubmit={onSubmit}>
      {error ? <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-[13px] font-bold text-rose-700">{error}</div> : null}
      <section className="rounded-2xl border border-[#E1E5EF] bg-white p-6 shadow-sm shadow-slate-200/70">
        <div className="flex items-start gap-4">
          <span className="grid size-12 place-items-center rounded-xl bg-[#F0ECFF] text-[#6849F5]"><UsersRound size={24} /></span>
          <div>
            <h2 className="text-[21px] font-black">ძირითადი ინფორმაცია</h2>
            <p className="mt-1 text-[13px] font-semibold text-[#7D88A2]">მოიჯარის იდენტიფიკაცია და სამართლებრივი ტიპი.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Field className="md:col-span-2" label="მოიჯარის სახელი" name="name" placeholder="მაგ. შპს ალფა ან გიორგი მაისურაძე" required />
          <Select label="ტიპი" name="type" onChange={setType} value={type}>
            <option value="company">კომპანია</option>
            <option value="individual">ფიზიკური პირი</option>
          </Select>
          {type === "company" ? <Field label="საიდენტიფიკაციო ნომერი" name="taxId" placeholder="405000000" /> : <Field label="პირადი ნომერი" name="personalId" placeholder="01000000000" />}
          <Select label="სტატუსი" name="status">
            <option value="active">აქტიური</option>
            <option value="inactive">არააქტიური</option>
          </Select>
        </div>
      </section>

      <section className="rounded-2xl border border-[#E1E5EF] bg-white p-6 shadow-sm shadow-slate-200/70">
        <h2 className="text-[21px] font-black">საკონტაქტო ინფორმაცია</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Field label="საკონტაქტო პირი" name="contactName" placeholder="სახელი და გვარი" />
          <Field label="ტელეფონი" name="phone" placeholder="+995..." />
          <Field label="ელფოსტა" name="email" placeholder="name@company.ge" type="email" />
          <Field className="md:col-span-3" label="მისამართი" name="address" placeholder="ქალაქი, ქუჩა, ნომერი" />
          <label className="grid gap-1 text-[13px] font-bold text-[#4C5875] md:col-span-3">
            შენიშვნა
            <textarea className="min-h-24 rounded-xl border border-[#DDE3EE] px-3 py-3 text-[14px] font-semibold outline-none focus:border-[#6849F5]" name="notes" placeholder="შიდა შენიშვნა, გადახდის ჩვევა, დამატებითი კონტექსტი..." />
          </label>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Link className="inline-flex h-12 items-center rounded-xl border border-[#DDE3EE] bg-white px-5 text-[14px] font-bold text-[#4C5875]" href="/erp/leases/tenants">გაუქმება</Link>
        <button className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#6849F5] px-6 text-[14px] font-black text-white shadow-lg shadow-violet-500/25" type="submit"><Plus size={18} /> {submitLabel}</button>
      </div>
    </form>
  );
}

function Field({ className = "", defaultValue, label, name, placeholder, required, type = "text" }: { className?: string; defaultValue?: string; label: string; name: string; placeholder: string; required?: boolean; type?: string }) {
  return <label className={`grid gap-1 text-[13px] font-bold text-[#4C5875] ${className}`}>{label}<input className="h-11 rounded-xl border border-[#DDE3EE] px-3 text-[14px] font-semibold outline-none focus:border-[#6849F5]" defaultValue={defaultValue} name={name} placeholder={placeholder} required={required} type={type} /></label>;
}

function Select({ children, label, name, onChange, value }: { children: React.ReactNode; label: string; name: string; onChange?: (value: string) => void; value?: string }) {
  return <label className="grid gap-1 text-[13px] font-bold text-[#4C5875]">{label}<select className="h-11 rounded-xl border border-[#DDE3EE] bg-white px-3 text-[14px] font-semibold outline-none focus:border-[#6849F5]" name={name} onChange={onChange ? (event) => onChange(event.target.value) : undefined} value={value}>{children}</select></label>;
}
