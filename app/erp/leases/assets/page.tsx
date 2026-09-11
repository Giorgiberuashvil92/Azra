"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Box,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Grid2X2,
  House,
  LayoutList,
  MapPin,
  FileText,
  Filter,
  Home,
  Plus,
  ReceiptText,
  Search,
  SquarePen,
  TriangleAlert,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { AzlaLogo } from "@/components/erp/AzlaLogo";
import { getAuthHeaders } from "@/components/erp/CoreModuleShell";

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
  currency: string;
  vatRate: string;
  status: AssetStatus;
  updatedAt?: string;
  property?: { name: string; type: string } | null;
  contractUnits?: Array<{ contract?: { tenant?: { name: string } | null } | null }>;
};

type LeaseProperty = {
  id: string;
  name: string;
  code?: string | null;
  type?: string | null;
  address?: string | null;
  totalArea?: string | number | null;
  updatedAt?: string;
  units: LeaseAsset[];
};

type AssetRow =
  | { kind: "property"; property: LeaseProperty }
  | { kind: "unit"; property: LeaseProperty; unit: LeaseAsset; index: number };

const navItems = [
  { label: "მთავარი", icon: Home, href: "/erp/leases" },
  { label: "იჯარები", icon: FileText, href: "/erp/leases" },
  { label: "ობიექტები", icon: Building2, href: "/erp/leases/assets", active: true },
  { label: "მოიჯარეები", icon: UsersRound, href: "/erp/leases/tenants" },
  { label: "გადახდები", icon: WalletCards, href: "/erp/leases/payments" },
  { label: "ხელშეკრულებები", icon: ReceiptText, href: "/erp/leases/contracts" },
  { label: "ვადები", icon: CalendarDays, href: "/erp/leases/reminders" },
  { label: "რეპორტები", icon: CircleDollarSign, href: "/erp/leases/reports" },
];

export default function LeaseAssetsPage() {
  const [properties, setProperties] = useState<LeaseProperty[]>([]);
  const [expandedPropertyIds, setExpandedPropertyIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    let ignore = false;
    void fetch("/api/erp/leases/properties", { headers: getAuthHeaders(), cache: "no-store" })
      .then(async (response) => {
        if (!ignore) setProperties(response.ok ? await response.json() : []);
      })
      .catch(() => undefined);

    return () => {
      ignore = true;
    };
  }, []);

  const assets = useMemo(() => properties.flatMap((property) => property.units ?? []), [properties]);

  const filteredRows = useMemo<AssetRow[]>(() => {
    const needle = query.trim().toLowerCase();
    const hasActiveFilter = Boolean(needle || statusFilter);
    return properties.flatMap((property) => {
      const units = property.units ?? [];
      const matchingUnits = units.filter((asset) => {
        const matchesStatus = statusFilter ? asset.status === statusFilter : true;
        const unitType = rentalUnitType(asset);
        const haystack = [asset.name, asset.code, unitTypeLabel(unitType), asset.address, property.name, property.code, asset.contractUnits?.[0]?.contract?.tenant?.name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return matchesStatus && (!needle || haystack.includes(needle));
      });
      const propertyHaystack = [property.name, property.code, propertyTypeLabel(property.type), property.address]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesProperty = !statusFilter && (!needle || propertyHaystack.includes(needle));
      if (!matchesProperty && !matchingUnits.length) return [];
      const shouldShowUnits = hasActiveFilter || expandedPropertyIds.includes(property.id);
      return [
        { kind: "property" as const, property },
        ...(shouldShowUnits ? matchingUnits.map((unit, index) => ({ kind: "unit" as const, property, unit, index })) : []),
      ];
    });
  }, [expandedPropertyIds, properties, query, statusFilter]);

  const summary = {
    total: properties.length,
    available: assets.filter((asset) => asset.status === "available").length,
    leased: assets.filter((asset) => asset.status === "leased").length,
    unavailable: assets.filter((asset) => ["maintenance", "unavailable"].includes(asset.status)).length,
  };
  const incompleteCount = assets.filter((asset) => !asset.address || !asset.code || Number(asset.monthlyRent) <= 0).length;

  return (
    <main className="min-h-screen bg-[#F6F7FB] text-[#111A3A]">
      <div className="grid min-h-screen grid-cols-[276px_1fr]">
        <aside className="flex min-h-screen flex-col border-r border-[#E6E9F2] bg-white px-3 py-5">
          <div className="flex h-12 items-center px-2">
            <AzlaLogo className="w-[128px]" priority />
          </div>

          <nav className="mt-9 grid gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  className={`flex h-12 items-center gap-3 rounded-xl px-4 text-[14px] font-bold transition ${
                    item.active ? "bg-[#F0ECFF] text-[#6849F5]" : "text-[#4C5875] hover:bg-[#F8F9FD]"
                  }`}
                  href={item.href}
                  key={item.label}
                >
                  <Icon size={20} strokeWidth={2} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-xl border border-[#E6E9F2] bg-[#F7F8FC] p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg border border-[#DDE2EF] bg-white text-[#4C5875]">
                <Building2 size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-[#111A3A]">უფრო მეტი</p>
                <p className="truncate text-[12px] font-semibold text-[#8A94AA]">თქვენი ბიზნესი</p>
              </div>
              <ChevronRight size={18} className="text-[#8A94AA]" />
            </div>
          </div>

          <div className="px-2 pb-1 pt-6">
            <p className="text-[15px] font-black text-[#8A94AA]">AZLA ERP</p>
            <p className="mt-1 text-[12px] font-semibold leading-5 text-[#9AA4B8]">თანამედროვე ბიზნესის სამუშაო პლატფორმა</p>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="flex h-[72px] items-center justify-between border-b border-[#E6E9F2] bg-white px-7">
            <label className="flex h-12 w-[590px] items-center gap-3 rounded-xl border border-[#DDE3EE] bg-[#F8FAFD] px-4 text-[#8A94AA] shadow-sm shadow-slate-200/60">
              <Search size={20} />
              <input className="w-full bg-transparent text-[14px] font-semibold text-[#111A3A] outline-none placeholder:text-[#99A3B8]" placeholder="ძებნა ობიექტი, მისამართი, კოდი..." />
            </label>
            <div className="flex items-center gap-5">
              <button className="relative grid size-11 place-items-center rounded-xl border border-[#EEF1F6] bg-white text-[#3D4665]" type="button">
                <Bell size={21} />
                <span className="absolute right-2 top-2 size-2.5 rounded-full bg-[#6849F5] ring-2 ring-white" />
              </button>
              <div className="h-8 w-px bg-[#E6E9F2]" />
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-full bg-[#8D9CC5] text-[15px] font-black text-white">გბ</span>
                <div>
                  <p className="text-[14px] font-black text-[#111A3A]">გიორგი ბერიძე</p>
                  <p className="text-[12px] font-semibold text-[#8A94AA]">შპს მმართველი</p>
                </div>
                <ChevronDown size={18} className="text-[#4C5875]" />
              </div>
            </div>
          </header>

          <div className="px-7 py-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-[13px] font-black text-[#6849F5]">იჯარები / ობიექტები</p>
                <h1 className="mt-2 text-[40px] font-black leading-tight tracking-normal text-[#111A3A]">ობიექტების სია</h1>
                <p className="mt-2 text-[16px] font-semibold leading-7 text-[#6F7B96]">
                  დაამატეთ და აკონტროლეთ ყველა გასაქირავებელი ბინა, ოფისი, ფართი, საწყობი, მანქანა ან ტექნიკა.
                </p>
              </div>
              <Link className="mt-2 inline-flex h-13 items-center gap-3 rounded-xl bg-[#6849F5] px-7 text-[15px] font-black text-white shadow-lg shadow-violet-500/25" href="/erp/leases/assets/new">
                <Plus size={20} />
                ახალი ობიექტი
              </Link>
            </div>

            <section className="mt-6 grid grid-cols-4 gap-4">
              <Metric change="+1 ამ თვეში" icon={<Building2 size={27} />} label="სულ ქონება" value={summary.total} />
              <Metric change="+1 ამ თვეში" icon={<SquarePen size={27} />} label="თავისუფალია" tone="green" value={summary.available} />
              <Metric change="უცვლელი" icon={<FileText size={27} />} label="გაქირავებულია" value={summary.leased} />
              <Metric change="საყურადღებო" icon={<Filter size={27} />} label="მიუწვდომელია" tone="amber" value={summary.unavailable} />
            </section>

            {incompleteCount > 0 ? (
            <section className="mt-5 flex h-14 items-center justify-between rounded-xl border border-[#F4C76E] bg-[#FFF8E8] px-6 text-[#A45B00]">
              <div className="flex items-center gap-3">
                <span className="grid size-7 place-items-center rounded-full bg-[#D98200] text-white">
                  <TriangleAlert size={16} />
                </span>
                <p className="text-[15px] font-black">{incompleteCount} ობიექტს ინფორმაცია არასრულად აქვს შევსებული</p>
              </div>
              <button className="inline-flex items-center gap-2 text-[14px] font-black text-[#6849F5]" type="button">
                ნახვა
                <ChevronRight size={18} />
              </button>
            </section>
            ) : null}

            <section className="mt-5">
              <div className="overflow-hidden rounded-xl border border-[#E1E5EF] bg-white shadow-sm shadow-slate-200/70">
                <div className="flex h-[76px] items-center justify-between border-b border-[#E6EAF2] px-5">
                  <h2 className="text-[23px] font-black">ობიექტები</h2>
                  <div className="flex items-center gap-2">
                    <label className="flex h-12 w-[260px] items-center gap-3 rounded-xl border border-[#DDE3EE] px-4 text-[#53617D]">
                      <Search size={19} />
                      <input className="w-full bg-transparent text-[14px] font-semibold outline-none placeholder:text-[#9AA4B8]" onChange={(event) => setQuery(event.target.value)} placeholder="ძებნა..." value={query} />
                    </label>
                    <select className="h-12 rounded-xl border border-[#DDE3EE] bg-white px-4 text-[14px] font-bold text-[#3D4665]" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
                      <option value="">ყველა სტატუსი</option>
                      <option value="available">თავისუფალია</option>
                      <option value="leased">გაქირავებულია</option>
                      <option value="reserved">დაჯავშნილია</option>
                      <option value="maintenance">რემონტზეა</option>
                      <option value="unavailable">დროებით მიუწვდომელია</option>
                    </select>
                    <button className="inline-flex h-12 items-center gap-2 rounded-xl border border-[#6849F5] px-5 text-[14px] font-black text-[#6849F5]" type="button">
                      <Filter size={18} />
                      ფილტრები
                    </button>
                    <div className="flex overflow-hidden rounded-xl border border-[#DDE3EE]">
                      <button className="grid size-12 place-items-center bg-[#6849F5] text-white" type="button"><LayoutList size={21} /></button>
                      <button className="grid size-12 place-items-center bg-white text-[#4C5875]" type="button"><Grid2X2 size={19} /></button>
                    </div>
                  </div>
                </div>

                <table className="w-full text-left">
                  <thead className="bg-[#F7F8FC] text-[13px] font-black text-[#4C5875]">
                    <tr>
                      <th className="px-5 py-4">ობიექტი ↕</th>
                      <th className="px-5 py-4">ტიპი</th>
                      <th className="px-5 py-4">მისამართი</th>
                      <th className="px-5 py-4">თვიური ფასი</th>
                      <th className="px-5 py-4">მოიჯარე</th>
                      <th className="px-5 py-4">სტატუსი</th>
                      <th className="px-5 py-4">განახლდა</th>
                      <th className="w-[240px] px-5 py-4">ქმედებები</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF1F6]">
                    {filteredRows.map((row, rowIndex) => row.kind === "property" ? (
                      <PropertyRow
                        isExpanded={Boolean(query.trim() || statusFilter || expandedPropertyIds.includes(row.property.id))}
                        key={row.property.id}
                        onToggle={() => setExpandedPropertyIds((current) => current.includes(row.property.id) ? current.filter((id) => id !== row.property.id) : [...current, row.property.id])}
                        property={row.property}
                        rowIndex={rowIndex}
                      />
                    ) : <UnitRow key={row.unit.id} index={row.index} property={row.property} unit={row.unit} />)}
                    {!filteredRows.length ? (
                      <tr>
                        <td className="px-5 py-12 text-center text-[14px] font-bold text-[#7D88A2]" colSpan={8}>
                          ობიექტები ჯერ არ არის დამატებული.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
                <div className="flex h-[72px] items-center justify-between border-t border-[#E6EAF2] px-5">
                  <p className="text-[14px] font-semibold text-[#7D88A2]">ჩანაწერები {filteredRows.length ? `1-${filteredRows.length}` : "0"} / სულ {properties.length} ქონება და {assets.length} ერთეული</p>
                  <div className="flex items-center gap-3">
                    <button className="grid size-10 place-items-center rounded-lg border border-[#DDE3EE] bg-white text-[#7D88A2]" type="button"><ChevronLeft size={18} /></button>
                    <button className="grid size-10 place-items-center rounded-lg bg-[#6849F5] text-[14px] font-black text-white shadow-md shadow-violet-500/25" type="button">1</button>
                    <button className="grid size-10 place-items-center rounded-lg border border-[#DDE3EE] bg-white text-[#7D88A2]" type="button"><ChevronRight size={18} /></button>
                    <select className="h-10 rounded-lg border border-[#DDE3EE] bg-white px-3 text-[13px] font-bold text-[#4C5875]">
                      <option>10 ერთ გვერდზე</option>
                      <option>25 ერთ გვერდზე</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ change, icon, label, tone = "purple", value }: { change: string; icon: React.ReactNode; label: string; tone?: "purple" | "green" | "amber"; value: number }) {
  const classes = tone === "green" ? "bg-[#DDF7EB] text-[#159961]" : tone === "amber" ? "bg-[#FFF0D3] text-[#E48700]" : "bg-[#F0ECFF] text-[#6849F5]";
  return (
    <article className="rounded-xl border border-[#E1E5EF] bg-white p-5 shadow-sm shadow-slate-200/70">
      <div className="flex items-start gap-4">
        <span className={`grid size-14 shrink-0 place-items-center rounded-xl ${classes}`}>{icon}</span>
        <div>
          <p className="text-[14px] font-black text-[#6F7B96]">{label}</p>
          <p className="mt-1 text-[30px] font-black leading-none text-[#111A3A]">{value.toLocaleString("ka-GE")}</p>
          <p className="mt-3 text-[13px] font-black text-[#16A466]">↗ {change}</p>
        </div>
      </div>
    </article>
  );
}

function AssetThumb({ index, size = "md" }: { index: number; size?: "sm" | "md" }) {
  const variants = [
    "from-[#8DA7C7] via-[#DDE8F4] to-[#415C83]",
    "from-[#BFA36D] via-[#E9DCC0] to-[#596F8A]",
    "from-[#214C62] via-[#9FBFD0] to-[#C28D55]",
    "from-[#7B8795] via-[#E3E7EB] to-[#394454]",
    "from-[#86A4BA] via-[#EEF4FA] to-[#54708C]",
  ];
  const sizeClass = size === "sm" ? "size-10 rounded-md" : "size-14 rounded-lg";
  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden bg-gradient-to-br ${sizeClass} ${variants[index % variants.length]}`}>
      <span className="h-3/5 w-3/5 rounded-[3px] border-2 border-white/80 bg-white/25 shadow-sm" />
    </span>
  );
}

function PropertyRow({ isExpanded, onToggle, property, rowIndex }: { isExpanded: boolean; onToggle: () => void; property: LeaseProperty; rowIndex: number }) {
  const units = property.units ?? [];
  const leasedUnits = units.filter((unit) => unit.status === "leased").length;
  const monthlyRent = units.reduce((sum, unit) => sum + Number(unit.monthlyRent || 0), 0);
  const firstTenant = units.find((unit) => unit.contractUnits?.[0]?.contract?.tenant?.name)?.contractUnits?.[0]?.contract?.tenant?.name;
  const canExpand = units.length > 0;

  return (
    <tr className="h-[62px] bg-[#FBFCFF]">
      <td className="px-5 py-2">
        <div className="flex items-center gap-3">
          <AssetThumb index={rowIndex} size="sm" />
          <div>
            <p className="flex items-center gap-2 text-[14px] font-black text-[#111A3A]">
              <button
                aria-label={isExpanded ? "ერთეულების დახურვა" : "ერთეულების ჩამოშლა"}
                className={`grid size-7 place-items-center rounded-lg border border-[#E1E5EF] bg-white text-[#6849F5] transition ${isExpanded ? "" : "-rotate-90"} ${canExpand ? "hover:bg-[#F7F4FF]" : "opacity-45"}`}
                disabled={!canExpand}
                onClick={onToggle}
                type="button"
              >
                <ChevronDown size={16} />
              </button>
              <Link className="hover:text-[#6849F5]" href={`/erp/leases/properties/${property.id}`}>
                {property.name}
              </Link>
            </p>
            <p className="mt-0.5 text-[11px] font-bold text-[#6F7B96]">{property.code ?? "კოდის გარეშე"} · {units.length} ერთეული</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-2">
        <span className="inline-flex items-center gap-2 text-[13px] font-bold text-[#4C5875]">
          <Building2 size={18} className="text-[#4C5875]" />
          {propertyTypeLabel(property.type)}
        </span>
      </td>
      <td className="px-5 py-2">
        <span className="inline-flex items-center gap-2 text-[13px] font-bold text-[#4C5875]">
          <MapPin size={17} className="text-[#6F7B96]" />
          {property.address ?? "მისამართი არ არის მითითებული"}
        </span>
      </td>
      <td className="px-5 py-2 text-[14px] font-black">{formatMoney(monthlyRent)} ₾</td>
      <td className="px-5 py-2 text-[13px] font-bold text-[#4C5875]">{firstTenant ?? (leasedUnits ? `${leasedUnits} მოიჯარე` : "არ არის მიბმული")}</td>
      <td className="px-5 py-2"><PropertyStatus leased={leasedUnits} total={units.length} /></td>
      <td className="px-5 py-2">
        <p className="text-[12px] font-black text-[#4C5875]">{property.updatedAt ? new Date(property.updatedAt).toLocaleDateString("ka-GE") : "-"}</p>
        <p className="mt-0.5 text-[11px] font-semibold text-[#8A94AA]">მშობელი ქონება</p>
      </td>
      <td className="px-5 py-2">
        <div className="flex items-center gap-2">
          <Link className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#E1E5EF] px-2.5 text-[11px] font-black text-[#6849F5] hover:bg-[#F7F4FF]" href={`/erp/leases/properties/${property.id}`}>
            პროფილი
          </Link>
          <Link className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#E1E5EF] px-2.5 text-[11px] font-black text-[#6849F5] hover:bg-[#F7F4FF]" href={`/erp/leases/properties/${property.id}/units/new`} title="ერთეულის დამატება">
            <Plus size={15} />
            ერთეული
          </Link>
          <Link className="inline-flex h-8 items-center rounded-lg border border-[#E1E5EF] px-2.5 text-[11px] font-black text-[#4C5875] hover:bg-[#F7F8FC] hover:text-[#6849F5]" href={`/erp/leases/properties/${property.id}/edit`}>
            რედაქტირება
          </Link>
        </div>
      </td>
    </tr>
  );
}

function UnitRow({ index, property, unit }: { index: number; property: LeaseProperty; unit: LeaseAsset }) {
  return (
    <tr className="h-[58px]">
      <td className="px-5 py-2">
        <div className="flex items-center gap-2.5 pl-9">
          <span className="h-10 w-px bg-[#DDE3EE]" />
          <AssetThumb index={index} size="sm" />
          <div>
            <p className="text-[14px] font-black text-[#111A3A]">{unit.name}</p>
            <p className="mt-0.5 text-[11px] font-bold text-[#6F7B96]">{unit.code ?? "კოდის გარეშე"} · {property.name}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-2">
        <span className="inline-flex items-center gap-2 text-[13px] font-bold text-[#4C5875]">
          <AssetTypeIcon type={rentalUnitType(unit)} />
          {unitTypeLabel(rentalUnitType(unit))}
        </span>
      </td>
      <td className="px-5 py-2">
        <span className="inline-flex items-center gap-2 text-[13px] font-bold text-[#4C5875]">
          <MapPin size={17} className="text-[#6F7B96]" />
          {unit.address ?? property.address ?? "მისამართი არ არის მითითებული"}
        </span>
      </td>
      <td className="px-5 py-2 text-[14px] font-black">{formatMoney(unit.monthlyRent)} ₾</td>
      <td className="px-5 py-2 text-[13px] font-bold text-[#4C5875]">{unit.contractUnits?.[0]?.contract?.tenant?.name ?? "არ არის მიბმული"}</td>
      <td className="px-5 py-2"><StatusPill status={unit.status} /></td>
      <td className="px-5 py-2">
        <p className="text-[12px] font-black text-[#4C5875]">{unit.updatedAt ? new Date(unit.updatedAt).toLocaleDateString("ka-GE") : "-"}</p>
        <p className="mt-0.5 text-[11px] font-semibold text-[#8A94AA]">{unit.updatedAt ? new Date(unit.updatedAt).toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit" }) : ""}</p>
      </td>
      <td className="px-5 py-2">
        <Link className="inline-flex h-8 items-center rounded-lg border border-[#E1E5EF] px-2.5 text-[11px] font-black text-[#4C5875] hover:bg-[#F7F8FC] hover:text-[#6849F5]" href={`/erp/leases/assets/${unit.id}/edit`}>
          რედაქტირება
        </Link>
      </td>
    </tr>
  );
}

function AssetTypeIcon({ type }: { type?: string | null }) {
  const normalizedType = type ?? "";
  if (normalizedType.includes("apartment") || normalizedType.includes("ბინა")) return <House size={18} className="text-[#4C5875]" />;
  if (normalizedType.includes("warehouse") || normalizedType.includes("საწყობ")) return <Box size={18} className="text-[#4C5875]" />;
  return <Building2 size={18} className="text-[#4C5875]" />;
}

function propertyTypeLabel(type?: string | null) {
  const labels: Record<string, string> = {
    residential_building: "საცხოვრებელი კორპუსი",
    business_center: "ბიზნესცენტრი",
    shopping_center: "სავაჭრო ცენტრი",
    warehouse_complex: "საწყობების კომპლექსი",
    hotel: "სასტუმრო / აპარტჰოტელი",
    land: "მიწის ნაკვეთი",
    standalone: "დამოუკიდებელი ქონება",
  };
  return type ? labels[type] ?? type : "ქონება";
}

function rentalUnitType(asset: LeaseAsset) {
  return asset.assetType ?? asset.type ?? "other";
}

function unitTypeLabel(type?: string | null) {
  const labels: Record<string, string> = {
    apartment: "ბინა",
    office: "ოფისი",
    commercial_space: "კომერციული ფართი",
    warehouse: "საწყობი",
    room: "ოთახი",
    workspace: "სამუშაო სივრცე",
    parking_space: "პარკინგის ადგილი",
    advertising_space: "სარეკლამო ადგილი",
    whole_property: "მთლიანი ობიექტი",
    other: "სხვა",
  };
  return type ? labels[type] ?? type : "სხვა";
}

function StatusPill({ status }: { status: AssetStatus }) {
  const labels: Record<AssetStatus, string> = {
    available: "თავისუფალია",
    reserved: "დაჯავშნილია",
    leased: "გაქირავებულია",
    maintenance: "რემონტზეა",
    unavailable: "დროებით მიუწვდომელია",
    inactive: "არააქტიური",
  };
  const classes: Record<AssetStatus, string> = {
    available: "bg-[#DDF7EB] text-[#159961]",
    reserved: "bg-[#F0ECFF] text-[#6849F5]",
    leased: "bg-[#E8F0FF] text-[#3F63C8]",
    maintenance: "bg-[#FFF0D3] text-[#E48700]",
    unavailable: "bg-[#FDE1E3] text-[#E34E5B]",
    inactive: "bg-[#EEF1F6] text-[#68748D]",
  };
  return <span className={`inline-flex h-7 items-center rounded-full px-3 text-[12px] font-black ${classes[status]}`}>{labels[status]}</span>;
}

function PropertyStatus({ leased, total }: { leased: number; total: number }) {
  const label = total === 0 ? "ერთეული არ აქვს" : leased === total ? "სრულად გაქირავებულია" : leased > 0 ? "ნაწილობრივ გაქირავებულია" : "თავისუფალია";
  const classes = total === 0 ? "bg-[#EEF1F6] text-[#68748D]" : leased === total ? "bg-[#E8F0FF] text-[#3F63C8]" : leased > 0 ? "bg-[#FFF0D3] text-[#E48700]" : "bg-[#DDF7EB] text-[#159961]";
  return <span className={`inline-flex h-7 items-center rounded-full px-3 text-[12px] font-black ${classes}`}>{label}</span>;
}

function formatMoney(value: string | number) {
  return Number(value || 0).toLocaleString("ka-GE", { maximumFractionDigits: 2 });
}
