"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Layers3, Plus, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { getAuthHeaders } from "@/components/erp/CoreModuleShell";
import { LeaseModuleShell } from "../../_components/lease-module-shell";

const assetTypes = [
  ["apartment", "ბინა"],
  ["office", "ოფისი"],
  ["commercial_space", "კომერციული ფართი"],
  ["warehouse", "საწყობი"],
  ["room", "ოთახი"],
  ["workspace", "სამუშაო სივრცე"],
  ["parking_space", "პარკინგის ადგილი"],
  ["advertising_space", "სარეკლამო ადგილი"],
  ["other", "სხვა"],
];
const propertyTypes = [
  ["business_center", "ბიზნესცენტრი"],
  ["shopping_center", "სავაჭრო ცენტრი"],
  ["residential_building", "საცხოვრებელი კორპუსი"],
  ["warehouse_complex", "საწყობების კომპლექსი"],
  ["hotel", "სასტუმრო ან აპარტჰოტელი"],
  ["land", "მიწის ნაკვეთი"],
  ["standalone", "დამოუკიდებელი უძრავი ქონება"],
];

export default function NewLeaseAssetPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"standalone" | "complex">("standalone");

  async function createAsset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(mode === "standalone" ? "/api/erp/leases/assets" : "/api/erp/leases/properties", {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.message ?? "ობიექტის დამატება ვერ მოხერხდა.");
      return;
    }

    router.push("/erp/leases/assets");
  }

  return (
    <LeaseModuleShell
      activeRoute="/erp/leases/assets"
      actions={<Link className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#DDE3EE] bg-white px-5 text-[14px] font-bold text-[#4C5875]" href="/erp/leases/assets"><ArrowLeft size={16} /> უკან</Link>}
      subtitle="შეავსეთ ობიექტის ძირითადი მონაცემები, ფასი და მიმდინარე სტატუსი."
      title="ახალი ობიექტის დამატება"
    >
      <div className="mb-5 grid gap-4 md:grid-cols-2">
        <ChoiceCard active={mode === "standalone"} description="ერთი მთლიანად გასაქირავებელი სივრცე. სისტემა ქონებას და ერთეულს ერთად შექმნის." icon={<Building2 size={24} />} onClick={() => setMode("standalone")} title="დამოუკიდებელი ობიექტი" />
        <ChoiceCard active={mode === "complex"} description="მთავარი ქონება, რომელსაც შემდეგ დაემატება სართულები, სექციები და ბევრი ერთეული." icon={<Layers3 size={24} />} onClick={() => setMode("complex")} title="ობიექტების კომპლექსი" />
      </div>
      <AssetForm error={error} mode={mode} onSubmit={createAsset} />
    </LeaseModuleShell>
  );
}

function ChoiceCard({ active, description, icon, onClick, title }: { active: boolean; description: string; icon: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button className={`rounded-2xl border p-5 text-left shadow-sm transition ${active ? "border-[#6849F5] bg-[#F7F4FF] shadow-violet-100" : "border-[#E1E5EF] bg-white shadow-slate-200/70 hover:border-[#C9BEFF]"}`} onClick={onClick} type="button">
      <span className={`grid size-12 place-items-center rounded-xl ${active ? "bg-[#6849F5] text-white" : "bg-[#F0ECFF] text-[#6849F5]"}`}>{icon}</span>
      <h2 className="mt-4 text-[18px] font-black text-[#111A3A]">{title}</h2>
      <p className="mt-2 text-[13px] font-semibold leading-6 text-[#6F7B96]">{description}</p>
    </button>
  );
}

function AssetForm({ error, mode, onSubmit }: { error: string; mode: "standalone" | "complex"; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return (
    <form className="grid gap-5 pb-12 text-[#111A3A]" onSubmit={onSubmit}>
      <section className="rounded-2xl border border-[#E1E5EF] bg-white p-6 shadow-sm shadow-slate-200/70">
        <div className="flex items-start gap-4">
          <span className="grid size-14 place-items-center rounded-xl bg-[#F0ECFF] text-[#6849F5]"><Building2 size={28} /></span>
          <div>
            <h2 className="text-[22px] font-black">{mode === "standalone" ? "დამოუკიდებელი ობიექტის მონაცემები" : "კომპლექსის მონაცემები"}</h2>
            <p className="mt-1 text-[14px] font-semibold text-[#7D88A2]">{mode === "standalone" ? "შეავსეთ ძირითადი ინფორმაცია, ფასი და სტატუსი." : "შექმენით მთავარი ქონება. ერთეულებს შემდეგ სართულების მიხედვით დაამატებთ."}</p>
          </div>
        </div>

        {error ? <div className="mt-5 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-[13px] font-bold text-rose-700">{error}</div> : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="ობიექტის დასახელება" name="name" placeholder="მაგ. ოფისი A-Block" required />
          <Field label="კოდი" name="code" placeholder="OFF-A77" />
          {mode === "standalone" ? (
            <Select label="გასაქირავებელი ერთეულის ტიპი" name="assetType">{assetTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
          ) : (
            <Select label="მთავარი ქონების ტიპი" name="propertyType">{propertyTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
          )}
          <Field label="მისამართი / მდებარეობა" name="address" placeholder="ქალაქი, ქუჩა, ნომერი" />
          {mode === "standalone" ? <Field label="თვიური ფასი" name="monthlyRent" placeholder="0.00" required type="number" /> : <Field label="საერთო ფართობი მ²" name="area" placeholder="0.00" type="number" />}
          <Field label="დღგ %" name="vatRate" placeholder="18" type="number" />
          {mode === "standalone" ? <Select label="სტატუსი" name="status">
            <option value="available">თავისუფალია</option>
            <option value="reserved">დაჯავშნილია</option>
            <option value="leased">გაქირავებულია</option>
            <option value="maintenance">რემონტზეა</option>
            <option value="unavailable">დროებით მიუწვდომელია</option>
          </Select> : null}
          <label className="grid gap-1 text-[13px] font-bold text-[#4C5875] md:col-span-2">
            აღწერა
            <textarea className="min-h-28 rounded-xl border border-[#DDE3EE] px-3 py-3 text-[14px] font-semibold outline-none focus:border-[#6849F5]" name="description" placeholder="ფართი, სართული, მდგომარეობა, პასუხისმგებელი პირი..." />
          </label>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Link className="inline-flex h-12 items-center rounded-xl border border-[#DDE3EE] bg-white px-5 text-[14px] font-bold text-[#4C5875]" href="/erp/leases/assets">გაუქმება</Link>
        <button className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#6849F5] px-6 text-[14px] font-black text-white shadow-lg shadow-violet-500/25" type="submit">
          {mode === "standalone" ? <Plus size={18} /> : <Save size={18} />}
          {mode === "standalone" ? "ობიექტის დამატება" : "კომპლექსის შექმნა"}
        </button>
      </div>
    </form>
  );
}

function Field({ defaultValue, label, name, placeholder, required, type = "text" }: { defaultValue?: string; label: string; name: string; placeholder: string; required?: boolean; type?: string }) {
  return (
    <label className="grid gap-1 text-[13px] font-bold text-[#4C5875]">
      {label}
      <input className="h-11 rounded-xl border border-[#DDE3EE] px-3 text-[14px] font-semibold outline-none focus:border-[#6849F5]" defaultValue={defaultValue} name={name} placeholder={placeholder} required={required} step={type === "number" ? "0.01" : undefined} type={type} />
    </label>
  );
}

function Select({ children, defaultValue, label, name }: { children: React.ReactNode; defaultValue?: string; label: string; name: string }) {
  return (
    <label className="grid gap-1 text-[13px] font-bold text-[#4C5875]">
      {label}
      <select className="h-11 rounded-xl border border-[#DDE3EE] bg-white px-3 text-[14px] font-semibold outline-none focus:border-[#6849F5]" defaultValue={defaultValue} name={name}>
        {children}
      </select>
    </label>
  );
}
