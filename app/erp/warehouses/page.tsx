"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Building2, ChevronDown, ChevronLeft, ChevronRight, Edit2, MapPin, Package, PackageSearch, Plus, RefreshCw, Search, Warehouse as WarehouseIcon } from "lucide-react";
import Link from "next/link";
import { CoreModuleShell, getAuthHeaders } from "@/components/erp/CoreModuleShell";

type Warehouse = {
  id: string;
  name: string;
  code?: string | null;
  address?: string | null;
  source?: string | null;
  externalUid?: string | null;
  status: string;
  updatedAt?: string;
};

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  async function loadWarehouses() {
    const response = await fetch("/api/erp/warehouses", { headers: getAuthHeaders() });
    setWarehouses(response.ok ? await response.json() : []);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadWarehouses();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function createWarehouse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/erp/warehouses", {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        code: form.get("code"),
        address: form.get("address"),
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(humanWarehouseError(payload));
      return;
    }

    event.currentTarget.reset();
    setIsCreateOpen(false);
    setSuccess("საწყობი დაემატა.");
    await loadWarehouses();
  }

  const filteredWarehouses = warehouses.filter((warehouse) => {
    const value = [warehouse.name, warehouse.code, warehouse.address, warehouse.source]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return value.includes(search.toLowerCase().trim())
      && (!sourceFilter || (warehouse.source ?? "manual") === sourceFilter)
      && (!statusFilter || warehouse.status === statusFilter);
  });

  const balanceWarehouses = warehouses.filter((warehouse) => warehouse.source === "balance").length;
  const activeWarehouses = warehouses.filter((warehouse) => warehouse.status === "active").length;
  const inactiveWarehouses = warehouses.length - activeWarehouses;
  const lastSyncTime = formatLastSyncTime(warehouses.filter((warehouse) => warehouse.source === "balance"));

  return (
    <CoreModuleShell
      activeRoute="/erp/warehouses"
      actions={
        <button
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#5B55F7] px-5 text-[14px] font-semibold leading-5 text-white shadow-lg shadow-indigo-200 transition hover:bg-[#4D47E8]"
          onClick={() => {
            setError("");
            setSuccess("");
            setIsCreateOpen(true);
          }}
          type="button"
        >
          <Plus size={16} />
          ახალი საწყობი
        </button>
      }
      eyebrow="Locations"
      title="საწყობები"
    >
      <section className="grid gap-5 text-[#151B32]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric icon={<WarehouseIcon size={22} />} label="სულ საწყობი" value={warehouses.length} />
          <Metric icon={<Building2 size={22} />} label="აქტიური" value={activeWarehouses} />
          <Metric icon={<PackageSearch size={22} />} label="არააქტიური" value={inactiveWarehouses} />
          <Metric icon={<Package size={22} />} label="Balance-თან დაკავშირებული" value={balanceWarehouses} />
        </div>

        {success ? <Notice tone="success">{success}</Notice> : null}
        {error && !isCreateOpen ? <Notice tone="error">{error}</Notice> : null}

        {isCreateOpen ? (
          <form onSubmit={createWarehouse} className="rounded-2xl border border-[#E3E5EC] bg-white p-5 shadow-sm shadow-indigo-950/5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[20px] font-bold leading-7">ახალი საწყობი</h2>
                <p className="mt-1 text-[14px] font-normal leading-5 text-[#707A91]">საკმარისია სახელი; კოდი და მისამართი სურვილისამებრ.</p>
              </div>
              <button className="text-[14px] font-semibold leading-5 text-[#8A93A8] hover:text-[#151B32]" onClick={() => setIsCreateOpen(false)} type="button">
                დახურვა
              </button>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <Input help="საწყობის სახელი, რომელიც სიასა და მარაგის ჭრილში გამოჩნდება." label="სახელი" name="name" required />
              <Input help="შიდა კოდი სწრაფი ძებნისთვის, მაგალითად WH-001." label="კოდი" name="code" />
              <Input help="ფიზიკური მისამართი ან მდებარეობის აღწერა." label="მისამართი" name="address" />
            </div>
            {error ? <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div> : null}
            <button className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#5B55F7] px-5 text-[14px] font-semibold leading-5 text-white md:w-auto" type="submit">
              <Plus size={16} />
              დამატება
            </button>
          </form>
        ) : null}

        <section className="overflow-hidden rounded-2xl border border-[#E1E4EC] bg-white shadow-sm shadow-indigo-950/5">
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5">
            <div>
              <h2 className="text-[24px] font-bold leading-8">საწყობების სია</h2>
              <p className="mt-1 text-[14px] font-normal leading-5 text-[#707A91]">manual და Balance-იდან გადმოტანილი ლოკაციები ერთ სივრცეში.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[14px] font-medium leading-5 text-[#707A91]">ბოლო სინქრონიზაცია: {lastSyncTime}</span>
              <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#CFCBFF] bg-white px-4 text-[14px] font-semibold leading-5 text-[#5B55F7] transition hover:bg-[#F7F6FF]" type="button">
                <RefreshCw size={18} />
                სინქრონიზაცია
              </button>
            </div>
          </div>

          <div className="grid gap-3 border-t border-[#E7E9F0] p-5 lg:grid-cols-[minmax(280px,1fr)_260px_260px]">
            <label className="flex h-12 items-center gap-3 rounded-xl border border-[#DEE2EA] bg-white px-4 text-[14px] font-normal leading-5 text-[#596278] focus-within:border-[#5B55F7] focus-within:ring-4 focus-within:ring-[#5B55F7]/10">
              <Search size={18} className="text-[#64738F]" />
              <input
                className="w-full bg-transparent outline-none"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ძებნა სახელით, კოდით ან მისამართით"
                value={search}
              />
            </label>

            <FilterSelect label="წყარო" onChange={setSourceFilter} value={sourceFilter}>
              <option value="">ყველა</option>
              <option value="balance">Balance</option>
              <option value="manual">Manual</option>
            </FilterSelect>

            <FilterSelect label="სტატუსი" onChange={setStatusFilter} value={statusFilter}>
              <option value="">ყველა</option>
              <option value="active">აქტიური</option>
              <option value="inactive">არააქტიური</option>
            </FilterSelect>
          </div>

          <div className="overflow-x-auto px-5">
            <table className="w-full min-w-[1080px] border-collapse text-left">
              <thead className="bg-[#F9FAFC] text-[13px] font-semibold leading-[18px] text-[#6F7890]">
                <tr className="border-y border-[#E5E8EF]">
                  <th className="px-4 py-4">საწყობის სახელი</th>
                  <th className="px-4 py-4">კოდი</th>
                  <th className="px-4 py-4">მისამართი</th>
                  <th className="px-4 py-4">წყარო</th>
                  <th className="px-4 py-4">სტატუსი</th>
                  <th className="px-4 py-4">მარაგი</th>
                  <th className="px-4 py-4">ბოლო განახლება</th>
                  <th className="px-4 py-4 text-right">მოქმედებები</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9EBF1]">
                {filteredWarehouses.map((warehouse) => (
                  <tr key={warehouse.id} className="h-[72px] transition hover:bg-[#F8F7FF]">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#EFEDFF] text-[#5B55F7]">
                          <MapPin size={20} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-semibold leading-[22px] text-[#151B32]">{warehouse.name}</p>
                          <p className="mt-1 truncate text-[12px] font-normal leading-[18px] text-[#8A93A8]">{warehouse.externalUid ?? "Manual warehouse"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[14px] font-medium leading-5 text-[#596278]">{warehouse.code ?? "-"}</td>
                    <td className="px-4 py-4 text-[14px] font-normal leading-5 text-[#596278]">{warehouse.address ?? "მისამართი მითითებული არ არის"}</td>
                    <td className="px-4 py-4"><SourceBadge source={warehouse.source ?? "manual"} /></td>
                    <td className="px-4 py-4"><StatusBadge status={warehouse.status} /></td>
                    <td className="px-4 py-4 text-[14px] font-semibold leading-5 text-[#151B32]">{warehouse.source === "balance" ? "სინქრონიზებული" : "-"}</td>
                    <td className="px-4 py-4 text-[14px] font-normal leading-5 text-[#596278]">{warehouse.source === "balance" ? lastSyncTime : "-"}</td>
                    <td className="px-4 py-4 text-right">
                      <Link className="inline-grid size-10 place-items-center rounded-full border border-[#E3E6EE] bg-[#FBFCFF] text-[#667085] transition hover:bg-[#ECEAFD] hover:text-[#5B55F7]" href={`/erp/warehouses/${warehouse.id}/edit`} title="რედაქტირება">
                        <Edit2 size={18} />
                      </Link>
                    </td>
                  </tr>
                ))}
                {filteredWarehouses.length === 0 ? (
                  <tr>
                    <td className="px-4 py-12 text-center text-[14px] font-semibold leading-5 text-[#7D869B]" colSpan={8}>
                      საწყობი ვერ მოიძებნა.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-4 px-5 py-5">
            <p className="text-[15px] font-semibold leading-[22px] text-[#596278]">1-{filteredWarehouses.length} / {warehouses.length}</p>
            <div className="flex items-center gap-2">
              <button className="grid size-11 place-items-center rounded-xl border border-[#E1E4EB] bg-white text-[#596278] hover:bg-[#F7F7FA]" type="button"><ChevronLeft size={18} /></button>
              <span className="grid size-11 place-items-center rounded-xl bg-[#5B55F7] text-[16px] font-bold leading-6 text-white shadow-lg shadow-indigo-200">1</span>
              <button className="grid size-11 place-items-center rounded-xl border border-[#E1E4EB] bg-white text-[#596278] hover:bg-[#F7F7FA]" type="button"><ChevronRight size={18} /></button>
            </div>
          </footer>
        </section>
      </section>
    </CoreModuleShell>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="min-h-[132px] rounded-2xl border border-[#E3E5EC] bg-white p-5 shadow-sm shadow-indigo-950/5">
      <div className="flex items-center justify-between gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-[#EFEDFF] text-[#5B55F7]">{icon}</span>
        <span className="text-[30px] font-bold leading-9 text-[#151B32]">{value}</span>
      </div>
      <p className="mt-4 text-[15px] font-semibold leading-[22px] text-[#65718A]">{label}</p>
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  const isBalance = source === "balance";
  return (
    <span className={isBalance ? "rounded-full bg-[#EFEDFF] px-3 py-1.5 text-[12px] font-semibold leading-4 text-[#5B55F7]" : "rounded-full bg-[#F3F5FA] px-3 py-1.5 text-[12px] font-semibold leading-4 text-[#64738F]"}>
      {isBalance ? "Balance" : "Manual"}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const active = status === "active";
  return (
    <span className={active ? "inline-flex items-center gap-2 rounded-full bg-[#DFF8EC] px-3 py-1.5 text-[12px] font-semibold leading-4 text-[#078752]" : "inline-flex items-center gap-2 rounded-full bg-[#F3F5FA] px-3 py-1.5 text-[12px] font-semibold leading-4 text-[#64738F]"}>
      <span className={active ? "size-1.5 rounded-full bg-[#0DA766]" : "size-1.5 rounded-full bg-[#9AA2B5]"} />
      {active ? "აქტიური" : status}
    </span>
  );
}

function Notice({ children, tone }: { children: ReactNode; tone: "error" | "success" }) {
  return (
    <div className={tone === "success" ? "rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-[14px] font-semibold leading-5 text-emerald-700" : "rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-[14px] font-semibold leading-5 text-rose-700"}>
      {children}
    </div>
  );
}

function FilterSelect({ children, label, onChange, value }: { children: ReactNode; label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="relative h-12 rounded-xl border border-[#DEE2EA] bg-white px-4 py-2 text-[#596278] focus-within:border-[#5B55F7]">
      <span className="block text-[11px] font-semibold leading-4 text-[#64738F]">{label}</span>
      <select className="h-5 w-full appearance-none bg-transparent pr-8 text-[14px] font-semibold leading-5 outline-none" onChange={(event) => onChange(event.target.value)} value={value}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#64738F]" />
    </label>
  );
}

function humanWarehouseError(payload: { code?: string; message?: string }) {
  if (payload.code === "UNIQUE_CONSTRAINT_FAILED") {
    return "ამ კოდით საწყობი უკვე არსებობს.";
  }

  return payload.message ?? "საწყობის შექმნა ვერ მოხერხდა.";
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { help?: string; label: string }) {
  const { help, label, ...inputProps } = props;
  return (
    <label className="grid gap-2 text-[13px] font-semibold leading-[18px] text-[#526078]">
      <span>
        <span className="block">{label}</span>
        {help ? <span className="mt-0.5 block text-[11px] font-normal leading-4 text-[#8A93A8]">{help}</span> : null}
      </span>
      <input className="h-12 rounded-xl border border-[#DDE2EC] bg-white px-4 text-[14px] font-medium leading-5 text-[#151B32] outline-none focus:border-[#5B55F7] focus:ring-4 focus:ring-[#5B55F7]/10" {...inputProps} />
    </label>
  );
}

function formatLastSyncTime(warehouses: Warehouse[]) {
  const timestamp = warehouses
    .map((warehouse) => warehouse.updatedAt ? new Date(warehouse.updatedAt).getTime() : 0)
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => b - a)[0];

  if (!timestamp) return "ჯერ არ არის";

  return new Intl.DateTimeFormat("ka-GE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}
