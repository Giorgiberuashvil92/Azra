"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Save } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { getAuthHeaders } from "@/components/erp/CoreModuleShell";
import { LeaseModuleShell } from "../../../_components/lease-module-shell";

type AssetStatus = "available" | "reserved" | "leased" | "maintenance" | "unavailable" | "inactive";
type LeaseAsset = {
  id: string;
  name: string;
  code?: string | null;
  assetType?: string | null;
  type?: string | null;
  address?: string | null;
  description?: string | null;
  monthlyRent: string;
  vatRate: string;
  status: AssetStatus;
};

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

export default function EditLeaseAssetPage() {
  return <Suspense fallback={null}><EditLeaseAssetContent /></Suspense>;
}

function EditLeaseAssetContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [asset, setAsset] = useState<LeaseAsset | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    void fetch(`/api/erp/leases/assets/${params.id}`, { headers: getAuthHeaders(), cache: "no-store" })
      .then(async (response) => {
        if (!ignore) setAsset(response.ok ? await response.json() : null);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [params.id]);

  async function updateAsset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!asset) return;
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/erp/leases/assets/${asset.id}`, {
      method: "PATCH",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.message ?? "ობიექტის რედაქტირება ვერ მოხერხდა.");
      return;
    }

    router.push("/erp/leases/assets");
  }

  return (
    <LeaseModuleShell
      activeRoute="/erp/leases/assets"
      actions={<Link className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#DDE3EE] bg-white px-5 text-[14px] font-bold text-[#4C5875]" href="/erp/leases/assets"><ArrowLeft size={16} /> უკან</Link>}
      subtitle="განაახლეთ ობიექტის ინფორმაცია, ფასი, აღწერა და სტატუსი."
      title="ობიექტის რედაქტირება"
    >
      {isLoading ? <div className="rounded-2xl border border-[#E1E5EF] bg-white p-6 text-[14px] font-bold text-[#7D88A2]">იტვირთება...</div> : null}
      {!isLoading && !asset ? <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-[14px] font-bold text-rose-700">ობიექტი ვერ მოიძებნა.</div> : null}
      {asset ? <AssetEditForm asset={asset} error={error} onSubmit={updateAsset} /> : null}
    </LeaseModuleShell>
  );
}

function AssetEditForm({ asset, error, onSubmit }: { asset: LeaseAsset; error: string; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return (
    <form className="grid gap-5 pb-12 text-[#111A3A]" onSubmit={onSubmit}>
      <section className="rounded-2xl border border-[#E1E5EF] bg-white p-6 shadow-sm shadow-slate-200/70">
        <div className="flex items-start gap-4">
          <span className="grid size-14 place-items-center rounded-xl bg-[#F0ECFF] text-[#6849F5]"><Building2 size={28} /></span>
          <div>
            <h2 className="text-[22px] font-black">{asset.name}</h2>
            <p className="mt-1 text-[14px] font-semibold text-[#7D88A2]">განაახლეთ ობიექტის მონაცემები, ფასი და სტატუსი.</p>
          </div>
        </div>

        {error ? <div className="mt-5 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-[13px] font-bold text-rose-700">{error}</div> : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field defaultValue={asset.name} label="ობიექტის დასახელება" name="name" placeholder="მაგ. ოფისი A-Block" required />
          <Field defaultValue={asset.code ?? ""} label="კოდი" name="code" placeholder="OFF-A77" />
          <Select defaultValue={asset.assetType ?? asset.type ?? "other"} label="ტიპი" name="assetType">{assetTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
          <Field defaultValue={asset.address ?? ""} label="მისამართი / მდებარეობა" name="address" placeholder="ქალაქი, ქუჩა, ნომერი" />
          <Field defaultValue={String(asset.monthlyRent)} label="თვიური ფასი" name="monthlyRent" placeholder="0.00" required type="number" />
          <Field defaultValue={String(asset.vatRate)} label="დღგ %" name="vatRate" placeholder="18" type="number" />
          <Select defaultValue={asset.status} label="სტატუსი" name="status">
            <option value="available">თავისუფალია</option>
            <option value="reserved">დაჯავშნილია</option>
            <option value="leased">გაქირავებულია</option>
            <option value="maintenance">რემონტზეა</option>
            <option value="unavailable">დროებით მიუწვდომელია</option>
            <option value="inactive">არააქტიური</option>
          </Select>
          <label className="grid gap-1 text-[13px] font-bold text-[#4C5875] md:col-span-2">
            აღწერა
            <textarea className="min-h-28 rounded-xl border border-[#DDE3EE] px-3 py-3 text-[14px] font-semibold outline-none focus:border-[#6849F5]" defaultValue={asset.description ?? ""} name="description" placeholder="ფართი, სართული, მდგომარეობა, პასუხისმგებელი პირი..." />
          </label>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Link className="inline-flex h-12 items-center rounded-xl border border-[#DDE3EE] bg-white px-5 text-[14px] font-bold text-[#4C5875]" href="/erp/leases/assets">გაუქმება</Link>
        <button className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#6849F5] px-6 text-[14px] font-black text-white shadow-lg shadow-violet-500/25" type="submit">
          <Save size={18} />
          ცვლილებების შენახვა
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
