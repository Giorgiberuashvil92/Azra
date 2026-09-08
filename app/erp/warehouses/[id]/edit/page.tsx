"use client";

import { Suspense, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Building2, ChevronDown, FileText, Link2, MapPin, Save, ShieldCheck, Warehouse as WarehouseIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { CoreModuleShell, getAuthHeaders } from "@/components/erp/CoreModuleShell";

type Warehouse = {
  id: string;
  name: string;
  code?: string | null;
  address?: string | null;
  source?: string | null;
  externalUid?: string | null;
  externalData?: Record<string, unknown> | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

type ApiError = { code?: string; message?: string };

export default function WarehouseEditPage() {
  return (
    <Suspense fallback={null}>
      <WarehouseEditContent />
    </Suspense>
  );
}

function WarehouseEditContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetch(`/api/erp/warehouses/${params.id}`, { headers: getAuthHeaders() })
        .then(async (response) => (response.ok ? ((await response.json()) as Warehouse) : null))
        .then((nextWarehouse) => {
          setWarehouse(nextWarehouse);
          setIsLoading(false);
        });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [params.id]);

  async function updateWarehouse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!warehouse) return;
    setError("");

    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/erp/warehouses/${warehouse.id}`, {
      method: "PATCH",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        code: form.get("code"),
        address: form.get("address"),
        status: form.get("status"),
      }),
    });

    if (!response.ok) {
      const apiError = (await response.json().catch(() => ({}))) as ApiError;
      setError(humanWarehouseError(apiError));
      return;
    }

    router.push("/erp/warehouses");
  }

  if (isLoading) {
    return (
      <CoreModuleShell activeRoute="/erp/warehouses" eyebrow="Locations" title="საწყობის რედაქტირება">
        <div className="rounded-2xl border border-[#E3E5EC] bg-white p-8 text-[14px] font-semibold text-[#707A91]">იტვირთება...</div>
      </CoreModuleShell>
    );
  }

  if (!warehouse) {
    return (
      <CoreModuleShell activeRoute="/erp/warehouses" eyebrow="Locations" title="საწყობის რედაქტირება">
        <div className="rounded-2xl border border-[#E3E5EC] bg-white p-8 text-[14px] font-semibold text-rose-600">საწყობი ვერ მოიძებნა.</div>
      </CoreModuleShell>
    );
  }

  const externalRows = warehouse.externalData ? Object.entries(warehouse.externalData) : [];

  return (
    <CoreModuleShell
      activeRoute="/erp/warehouses"
      actions={
        <div className="flex items-center gap-3">
          <button className="h-11 rounded-xl border border-[#BFC7DC] bg-white px-5 text-[14px] font-semibold leading-5 text-[#151B32] transition hover:bg-[#F7F8FC]" onClick={() => router.push("/erp/warehouses")} type="button">
            გაუქმება
          </button>
          <button className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#5B55F7] px-5 text-[14px] font-semibold leading-5 text-white shadow-lg shadow-indigo-200 transition hover:bg-[#4D47E8]" form="warehouse-edit-form" type="submit">
            <Save size={16} />
            ცვლილებების შენახვა
          </button>
        </div>
      }
      eyebrow="Locations"
      title="საწყობის რედაქტირება"
    >
      <form className="grid gap-5 pb-20 text-[#151B32]" id="warehouse-edit-form" onSubmit={updateWarehouse}>
        <p className="-mt-4 text-[14px] font-normal leading-5 text-[#707A91]">განაახლე საწყობის სამუშაო მონაცემები და გადაამოწმე Balance-იდან მიღებული ველები</p>

        {error ? <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">{error}</div> : null}

        <section className="flex flex-wrap items-center gap-5 rounded-2xl border border-[#E3E5EC] bg-white p-5 shadow-sm shadow-indigo-950/5">
          <span className="grid size-[68px] place-items-center rounded-2xl bg-[#EFEDFF] text-[#5B55F7]"><WarehouseIcon size={34} /></span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="truncate text-[22px] font-bold leading-8">{warehouse.name}</h2>
              <StatusPill status={warehouse.status} />
              <SourcePill source={warehouse.source ?? "manual"} />
            </div>
            <p className="mt-1 truncate text-[13px] font-normal leading-5 text-[#8A93A8]">{warehouse.externalUid ?? "Manual warehouse"}</p>
          </div>
          <SummaryDivider />
          <SummaryItem label="კოდი:" value={warehouse.code ?? "-"} />
          <SummaryDivider />
          <SummaryItem label="განახლდა:" value={warehouse.updatedAt ? formatDateTime(warehouse.updatedAt) : "-"} />
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_460px]">
          <div className="grid gap-5">
            <EditCard icon={<FileText size={20} />} title="ძირითადი ინფორმაცია">
              <Input defaultValue={warehouse.name} help="საწყობის სახელი გამოჩნდება სიებში, შესყიდვებსა და მარაგის ჭრილში." label="სახელი" name="name" required />
              <Input defaultValue={warehouse.code ?? ""} help="შიდა კოდი სწრაფი ძებნისა და იდენტიფიკაციისთვის." label="კოდი" name="code" />
              <Input defaultValue={warehouse.address ?? ""} help="ფიზიკური მისამართი ან მდებარეობის აღწერა." label="მისამართი" name="address" />
              <Select defaultValue={warehouse.status} help="არააქტიური საწყობი ისტორიაში რჩება, მაგრამ ოპერაციებში შეგიძლია აღარ გამოიყენო." label="სტატუსი" name="status">
                <option value="active">აქტიური</option>
                <option value="inactive">არააქტიური</option>
              </Select>
            </EditCard>

            <EditCard icon={<Link2 size={20} />} title="Balance კავშირი">
              <ReadonlyInput help="ხელით შექმნილი თუ Balance import-ით მიღებული ჩანაწერი." label="წყარო" value={warehouse.source ?? "manual"} />
              <ReadonlyInput help="Balance-ის უნიკალური იდენტიფიკატორი; ხელით არ იცვლება." label="External UID / Balance ID" value={warehouse.externalUid ?? "-"} />
              <ReadonlyInput help="ჩანაწერის შექმნის დრო CoreFinly-ში." label="შეიქმნა" value={warehouse.createdAt ? formatDateTime(warehouse.createdAt) : "-"} />
              <ReadonlyInput help="ბოლო განახლების დრო CoreFinly-ში." label="ბოლო განახლება" value={warehouse.updatedAt ? formatDateTime(warehouse.updatedAt) : "-"} />
              <div className="flex min-h-[76px] items-center gap-3 rounded-xl border border-dashed border-[#DDE2EC] bg-[#FBFCFF] px-4 py-3 md:col-span-2">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#F3F5FA] text-[#64738F]"><ShieldCheck size={18} /></span>
                <div>
                  <p className="text-[13px] font-semibold leading-[18px] text-[#526078]">Balance ველები readonly არის</p>
                  <p className="mt-1 text-[12px] font-normal leading-[18px] text-[#8A93A8]">შემდეგი სინქრონიზაცია source მონაცემებს განაახლებს; სამუშაო ველები ცალკე ინახება</p>
                </div>
              </div>
            </EditCard>
          </div>

          <EditCard columns="one" icon={<Building2 size={20} />} title="Balance raw data">
            {externalRows.length ? (
              <div className="grid gap-2">
                {externalRows.map(([key, value]) => (
                  <div className="rounded-xl border border-[#E8EAF1] bg-[#FBFCFF] px-3 py-2" key={key}>
                    <p className="text-[11px] font-semibold uppercase leading-4 text-[#9AA2B5]">{key}</p>
                    <p className="mt-0.5 break-words text-[13px] font-semibold leading-5 text-[#526078]">{formatRawValue(value)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid min-h-44 place-items-center rounded-2xl border border-dashed border-[#DDE2EC] bg-[#FBFCFF] p-6 text-center">
                <div>
                  <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#EFEDFF] text-[#5B55F7]"><MapPin size={22} /></span>
                  <p className="mt-4 text-[15px] font-bold leading-[22px] text-[#151B32]">Balance მონაცემი არ არის</p>
                  <p className="mt-1 text-[13px] font-normal leading-5 text-[#8A93A8]">ეს საწყობი ხელით არის შექმნილი ან ჯერ არ არის მიბმული გარე სისტემაზე.</p>
                </div>
              </div>
            )}
          </EditCard>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#E3E6EE] bg-white/95 px-5 py-4 backdrop-blur lg:left-[260px]">
          <div className="flex justify-end gap-3">
            <button className="h-11 rounded-xl border border-[#BFC7DC] bg-white px-5 text-[14px] font-semibold leading-5 text-[#151B32]" onClick={() => router.push("/erp/warehouses")} type="button">გაუქმება</button>
            <button className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#5B55F7] px-5 text-[14px] font-semibold leading-5 text-white shadow-lg shadow-indigo-200" type="submit">
              <Save size={16} />
              ცვლილებების შენახვა
            </button>
          </div>
        </div>
      </form>
    </CoreModuleShell>
  );
}

function EditCard({ children, columns = "two", icon, title }: { children: ReactNode; columns?: "one" | "two"; icon: ReactNode; title: string }) {
  const gridClass = columns === "one" ? "grid gap-4" : "grid gap-4 md:grid-cols-2";

  return (
    <section className="rounded-2xl border border-[#E3E5EC] bg-white p-5 shadow-sm shadow-indigo-950/5">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-[#EFEDFF] text-[#5B55F7]">{icon}</span>
        <h2 className="text-[18px] font-bold leading-7">{title}</h2>
      </div>
      <div className={gridClass}>{children}</div>
    </section>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { help?: string; label: string }) {
  const { help, label, ...inputProps } = props;
  return (
    <label className="grid gap-2 text-[13px] font-semibold leading-[18px] text-[#526078]">
      <FieldLabel help={help} label={label} />
      <input className="h-12 rounded-xl border border-[#DDE2EC] bg-white px-4 text-[14px] font-medium leading-5 text-[#151B32] outline-none focus:border-[#5B55F7] focus:ring-4 focus:ring-[#5B55F7]/10" {...inputProps} />
    </label>
  );
}

function Select({ children, help, label, ...selectProps }: React.SelectHTMLAttributes<HTMLSelectElement> & { help?: string; label: string }) {
  return (
    <label className="grid gap-2 text-[13px] font-semibold leading-[18px] text-[#526078]">
      <FieldLabel help={help} label={label} />
      <span className="relative">
        <select className="h-12 w-full appearance-none rounded-xl border border-[#DDE2EC] bg-white px-4 pr-10 text-[14px] font-medium leading-5 text-[#151B32] outline-none focus:border-[#5B55F7] focus:ring-4 focus:ring-[#5B55F7]/10" {...selectProps}>
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#64738F]" />
      </span>
    </label>
  );
}

function ReadonlyInput({ help, label, value }: { help?: string; label: string; value: string }) {
  return (
    <label className="grid gap-2 text-[13px] font-semibold leading-[18px] text-[#526078]">
      <FieldLabel help={help} label={label} />
      <span className="flex min-h-12 items-center rounded-xl border border-[#DDE2EC] bg-[#FBFCFF] px-4 text-[14px] font-medium leading-5 text-[#151B32]">{value}</span>
    </label>
  );
}

function FieldLabel({ help, label }: { help?: string; label: string }) {
  return (
    <span>
      <span className="block">{label}</span>
      {help ? <span className="mt-0.5 block text-[11px] font-normal leading-4 text-[#8A93A8]">{help}</span> : null}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const active = status === "active";
  return (
    <span className={active ? "inline-flex items-center gap-2 rounded-full bg-[#DFF8EC] px-3 py-1.5 text-[12px] font-semibold leading-4 text-[#078752]" : "inline-flex items-center gap-2 rounded-full bg-[#F3F5FA] px-3 py-1.5 text-[12px] font-semibold leading-4 text-[#64738F]"}>
      <span className={active ? "size-1.5 rounded-full bg-[#0DA766]" : "size-1.5 rounded-full bg-[#9AA2B5]"} />
      {active ? "აქტიური" : "არააქტიური"}
    </span>
  );
}

function SourcePill({ source }: { source: string }) {
  const isBalance = source === "balance";
  return (
    <span className={isBalance ? "rounded-full bg-[#EFEDFF] px-3 py-1.5 text-[12px] font-semibold leading-4 text-[#5B55F7]" : "rounded-full bg-[#F3F5FA] px-3 py-1.5 text-[12px] font-semibold leading-4 text-[#64738F]"}>
      {isBalance ? "Balance" : "Manual"}
    </span>
  );
}

function SummaryDivider() {
  return <span className="hidden h-10 w-px bg-[#E3E6EE] md:block" />;
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] font-semibold uppercase leading-4 text-[#9AA2B5]">{label}</p>
      <p className="mt-1 text-[14px] font-bold leading-5 text-[#151B32]">{value}</p>
    </div>
  );
}

function humanWarehouseError(payload: ApiError) {
  if (payload.code === "UNIQUE_CONSTRAINT_FAILED") {
    return "ამ კოდით საწყობი უკვე არსებობს.";
  }

  return payload.message ?? "საწყობის შენახვა ვერ მოხერხდა.";
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ka-GE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatRawValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}
