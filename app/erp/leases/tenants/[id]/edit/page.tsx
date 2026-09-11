"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, UsersRound } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { getAuthHeaders } from "@/components/erp/CoreModuleShell";
import { LeaseModuleShell } from "../../../_components/lease-module-shell";

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
  notes?: string | null;
  status?: string | null;
};

export default function EditLeaseTenantPage() {
  return <Suspense fallback={null}><EditLeaseTenantContent /></Suspense>;
}

function EditLeaseTenantContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [error, setError] = useState("");
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

  async function updateTenant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tenant) return;
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/erp/leases/tenants/${tenant.id}`, {
      method: "PATCH",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.message ?? "მოიჯარის რედაქტირება ვერ მოხერხდა.");
      return;
    }

    router.push("/erp/leases/tenants");
  }

  return (
    <LeaseModuleShell
      activeRoute="/erp/leases/tenants"
      actions={<Link className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#DDE3EE] bg-white px-5 text-[14px] font-bold text-[#4C5875]" href="/erp/leases/tenants"><ArrowLeft size={16} /> უკან</Link>}
      subtitle="განაახლეთ მოიჯარის იდენტიფიკაცია, საკონტაქტო ინფორმაცია და სტატუსი."
      title="მოიჯარის რედაქტირება"
    >
      {isLoading ? <div className="rounded-2xl border border-[#E1E5EF] bg-white p-6 text-[14px] font-bold text-[#7D88A2]">იტვირთება...</div> : null}
      {!isLoading && !tenant ? <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-[14px] font-bold text-rose-700">მოიჯარე ვერ მოიძებნა.</div> : null}
      {tenant ? <TenantEditForm error={error} onSubmit={updateTenant} tenant={tenant} /> : null}
    </LeaseModuleShell>
  );
}

function TenantEditForm({ error, onSubmit, tenant }: { error: string; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; tenant: Tenant }) {
  const [type, setType] = useState(tenant.type);
  return (
    <form className="grid gap-5 pb-12 text-[#111A3A]" onSubmit={onSubmit}>
      {error ? <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-[13px] font-bold text-rose-700">{error}</div> : null}
      <section className="rounded-2xl border border-[#E1E5EF] bg-white p-6 shadow-sm shadow-slate-200/70">
        <div className="flex items-start gap-4">
          <span className="grid size-12 place-items-center rounded-xl bg-[#F0ECFF] text-[#6849F5]"><UsersRound size={24} /></span>
          <div>
            <h2 className="text-[21px] font-black">{tenant.name}</h2>
            <p className="mt-1 text-[13px] font-semibold text-[#7D88A2]">ძირითადი ინფორმაცია და საკონტაქტო მონაცემები.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Field className="md:col-span-2" defaultValue={tenant.name} label="მოიჯარის სახელი" name="name" placeholder="სახელი" required />
          <Select label="ტიპი" name="type" onChange={(value) => setType(value as Tenant["type"])} value={type}>
            <option value="company">კომპანია</option>
            <option value="individual">ფიზიკური პირი</option>
          </Select>
          {type === "company" ? <Field defaultValue={tenant.taxId ?? ""} label="საიდენტიფიკაციო ნომერი" name="taxId" placeholder="405000000" /> : <Field defaultValue={tenant.personalId ?? ""} label="პირადი ნომერი" name="personalId" placeholder="01000000000" />}
          <Select defaultValue={tenant.status ?? "active"} label="სტატუსი" name="status">
            <option value="active">აქტიური</option>
            <option value="inactive">არააქტიური</option>
          </Select>
          <Field defaultValue={tenant.contactName ?? ""} label="საკონტაქტო პირი" name="contactName" placeholder="სახელი და გვარი" />
          <Field defaultValue={tenant.phone ?? ""} label="ტელეფონი" name="phone" placeholder="+995..." />
          <Field defaultValue={tenant.email ?? ""} label="ელფოსტა" name="email" placeholder="name@company.ge" type="email" />
          <Field className="md:col-span-3" defaultValue={tenant.address ?? ""} label="მისამართი" name="address" placeholder="ქალაქი, ქუჩა, ნომერი" />
          <label className="grid gap-1 text-[13px] font-bold text-[#4C5875] md:col-span-3">
            შენიშვნა
            <textarea className="min-h-24 rounded-xl border border-[#DDE3EE] px-3 py-3 text-[14px] font-semibold outline-none focus:border-[#6849F5]" defaultValue={tenant.notes ?? ""} name="notes" placeholder="შიდა შენიშვნა..." />
          </label>
        </div>
      </section>
      <div className="flex justify-end gap-3">
        <Link className="inline-flex h-12 items-center rounded-xl border border-[#DDE3EE] bg-white px-5 text-[14px] font-bold text-[#4C5875]" href="/erp/leases/tenants">გაუქმება</Link>
        <button className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#6849F5] px-6 text-[14px] font-black text-white shadow-lg shadow-violet-500/25" type="submit"><Save size={18} /> შენახვა</button>
      </div>
    </form>
  );
}

function Field({ className = "", defaultValue, label, name, placeholder, required, type = "text" }: { className?: string; defaultValue?: string; label: string; name: string; placeholder: string; required?: boolean; type?: string }) {
  return <label className={`grid gap-1 text-[13px] font-bold text-[#4C5875] ${className}`}>{label}<input className="h-11 rounded-xl border border-[#DDE3EE] px-3 text-[14px] font-semibold outline-none focus:border-[#6849F5]" defaultValue={defaultValue} name={name} placeholder={placeholder} required={required} type={type} /></label>;
}

function Select({ children, defaultValue, label, name, onChange, value }: { children: React.ReactNode; defaultValue?: string; label: string; name: string; onChange?: (value: string) => void; value?: string }) {
  return <label className="grid gap-1 text-[13px] font-bold text-[#4C5875]">{label}<select className="h-11 rounded-xl border border-[#DDE3EE] bg-white px-3 text-[14px] font-semibold outline-none focus:border-[#6849F5]" defaultValue={value === undefined ? defaultValue : undefined} name={name} onChange={onChange ? (event) => onChange(event.target.value) : undefined} value={value}>{children}</select></label>;
}
