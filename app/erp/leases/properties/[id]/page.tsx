"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, CalendarDays, ChevronDown, CircleDollarSign, DoorOpen, Layers3, MapPin, Percent, Plus, ReceiptText, SquarePen, UsersRound, WalletCards } from "lucide-react";
import { useParams } from "next/navigation";
import { getAuthHeaders } from "@/components/erp/CoreModuleShell";
import { LeaseModuleShell } from "../../_components/lease-module-shell";

type AssetStatus = "available" | "reserved" | "leased" | "maintenance" | "unavailable" | "inactive";

type RentalUnit = {
  id: string;
  name: string;
  code?: string | null;
  type?: string | null;
  floor?: string | null;
  area?: string | number | null;
  rentableArea?: string | number | null;
  monthlyRent: string | number;
  currency: string;
  status: AssetStatus;
  section?: { name: string; type?: string | null } | null;
  contractUnits?: Array<{ contract?: { id: string; tenant?: { name: string } | null } | null }>;
};

type LeaseProperty = {
  id: string;
  name: string;
  code?: string | null;
  type?: string | null;
  address?: string | null;
  description?: string | null;
  totalArea?: string | number | null;
  units: RentalUnit[];
};

type Charge = {
  amount: string | number;
  paidAmount: string | number;
  status: "open" | "partially_paid" | "paid" | "overdue" | "cancelled";
};

type Contract = {
  id: string;
  monthlyRent: string | number;
  status: "draft" | "active" | "expired" | "terminated";
  charges?: Charge[];
  contractUnits?: Array<{ rentalUnit?: { id: string; property?: { id?: string; name?: string } | null } | null }>;
};

type LeaseData = { contracts: Contract[] };

export default function LeasePropertyProfilePage() {
  return <Suspense fallback={null}><LeasePropertyProfileContent /></Suspense>;
}

function LeasePropertyProfileContent() {
  const params = useParams<{ id: string }>();
  const [property, setProperty] = useState<LeaseProperty | null>(null);
  const [leaseData, setLeaseData] = useState<LeaseData>({ contracts: [] });
  const [expandedFloors, setExpandedFloors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    void Promise.all([
      fetch(`/api/erp/leases/properties/${params.id}`, { headers: getAuthHeaders(), cache: "no-store" }),
      fetch("/api/erp/leases", { headers: getAuthHeaders(), cache: "no-store" }),
    ])
      .then(async ([propertyResponse, leasesResponse]) => {
        if (ignore) return;
        setProperty(propertyResponse.ok ? await propertyResponse.json() : null);
        setLeaseData(leasesResponse.ok ? await leasesResponse.json() : { contracts: [] });
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [params.id]);

  const unitIds = useMemo(() => new Set((property?.units ?? []).map((unit) => unit.id)), [property?.units]);
  const propertyContracts = useMemo(() => {
    return leaseData.contracts.filter((contract) => contract.contractUnits?.some((item) => item.rentalUnit?.id && unitIds.has(item.rentalUnit.id)));
  }, [leaseData.contracts, unitIds]);

  const metrics = useMemo(() => {
    const units = property?.units ?? [];
    const totalArea = Number(property?.totalArea || 0) || units.reduce((sum, unit) => sum + Number(unit.area || 0), 0);
    const leasedArea = units.filter((unit) => unit.status === "leased").reduce((sum, unit) => sum + Number(unit.rentableArea || unit.area || 0), 0);
    const activeContracts = propertyContracts.filter((contract) => contract.status === "active");
    const expectedIncome = activeContracts.reduce((sum, contract) => sum + Number(contract.monthlyRent || 0), 0);
    const charged = propertyContracts.flatMap((contract) => contract.charges ?? []);
    const paid = charged.reduce((sum, charge) => sum + Number(charge.paidAmount || 0), 0);
    const debt = charged
      .filter((charge) => ["open", "partially_paid", "overdue"].includes(charge.status))
      .reduce((sum, charge) => sum + Math.max(Number(charge.amount || 0) - Number(charge.paidAmount || 0), 0), 0);
    return {
      available: units.filter((unit) => unit.status === "available").length,
      leased: units.filter((unit) => unit.status === "leased").length,
      occupancy: units.length ? Math.round((units.filter((unit) => unit.status === "leased").length / units.length) * 100) : 0,
      totalArea,
      leasedArea,
      expectedIncome,
      paid,
      debt,
      units: units.length,
    };
  }, [property, propertyContracts]);

  const floorGroups = useMemo(() => {
    const groups = new Map<string, RentalUnit[]>();
    for (const unit of property?.units ?? []) {
      const key = unit.section?.name ?? (unit.floor ? `სართული ${unit.floor}` : "სართული არ არის მითითებული");
      groups.set(key, [...(groups.get(key) ?? []), unit]);
    }
    return Array.from(groups.entries()).map(([name, units]) => ({ name, units }));
  }, [property?.units]);

  useEffect(() => {
    if (floorGroups.length && !expandedFloors.length) setExpandedFloors([floorGroups[0].name]);
  }, [expandedFloors.length, floorGroups]);

  return (
    <LeaseModuleShell
      activeRoute="/erp/leases/assets"
      actions={<Link className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#DDE3EE] bg-white px-5 text-[14px] font-bold text-[#4C5875]" href="/erp/leases/assets"><ArrowLeft size={16} /> უკან</Link>}
      subtitle="სართულებად დაყოფილი ერთეულები, დატვირთულობა, შემოსავალი და დავალიანება."
      title={property?.name ?? "ობიექტის პროფილი"}
    >
      {isLoading ? <div className="rounded-2xl border border-[#E1E5EF] bg-white p-6 text-[14px] font-semibold text-[#7D88A2]">იტვირთება...</div> : null}
      {!isLoading && !property ? <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-[14px] font-semibold text-rose-700">ობიექტი ვერ მოიძებნა.</div> : null}
      {property ? (
        <div className="grid gap-5 pb-12">
          <section className="rounded-2xl border border-[#E1E5EF] bg-white p-5 shadow-sm shadow-slate-200/70">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex h-8 items-center rounded-full bg-[#F0ECFF] px-3 text-[12px] font-semibold text-[#6849F5]">{propertyTypeLabel(property.type)}</span>
                  <span className="inline-flex h-8 items-center rounded-full bg-[#F7F8FC] px-3 text-[12px] font-semibold text-[#64708A]">{property.code ?? "კოდი არ არის"}</span>
                </div>
                <h2 className="mt-3 text-[24px] font-semibold leading-tight text-[#111A3A]">{property.name}</h2>
                <p className="mt-2 flex items-center gap-2 text-[13px] font-semibold text-[#7D88A2]"><MapPin size={16} /> {property.address ?? "მისამართი არ არის მითითებული"}</p>
                {property.description ? <p className="mt-3 max-w-[780px] text-[13px] font-semibold leading-6 text-[#64708A]">{property.description}</p> : null}
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <Link className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#DDE3EE] bg-white px-4 text-[13px] font-semibold text-[#4C5875]" href={`/erp/leases/properties/${property.id}/edit`}>
                  <SquarePen size={16} />
                  რედაქტირება
                </Link>
                <Link className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#6849F5] px-4 text-[13px] font-bold text-white shadow-lg shadow-violet-500/20" href={`/erp/leases/properties/${property.id}/units/new`}>
                  <Plus size={16} />
                  ერთეულის დამატება
                </Link>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-4 gap-4">
            <Metric icon={<DoorOpen size={20} />} label="სულ ერთეულები" value={metrics.units.toLocaleString("ka-GE")} />
            <Metric icon={<Building2 size={20} />} label="თავისუფალი" tone="green" value={metrics.available.toLocaleString("ka-GE")} />
            <Metric icon={<UsersRound size={20} />} label="გაქირავებული" value={metrics.leased.toLocaleString("ka-GE")} />
            <Metric icon={<Percent size={20} />} label="დატვირთულობა" tone="amber" value={`${metrics.occupancy}%`} />
          </section>

          <section className="grid grid-cols-4 gap-4">
            <Metric icon={<Layers3 size={20} />} label="საერთო ფართობი" value={`${formatMoney(metrics.totalArea)} მ²`} />
            <Metric icon={<CalendarDays size={20} />} label="გაქირავებული ფართობი" value={`${formatMoney(metrics.leasedArea)} მ²`} />
            <Metric icon={<CircleDollarSign size={20} />} label="მოსალოდნელი შემოსავალი" tone="green" value={`${formatMoney(metrics.expectedIncome)} ₾`} />
            <Metric icon={<WalletCards size={20} />} label="დავალიანება" tone={metrics.debt > 0 ? "red" : "green"} value={`${formatMoney(metrics.debt)} ₾`} />
          </section>

          <section className="grid grid-cols-[minmax(0,1fr)_340px] gap-5">
            <div className="rounded-2xl border border-[#E1E5EF] bg-white shadow-sm shadow-slate-200/70">
              <div className="flex h-[70px] items-center justify-between border-b border-[#E6EAF2] px-5">
                <div>
                  <h2 className="text-[21px] font-semibold text-[#111A3A]">ერთეულები სართულების მიხედვით</h2>
                  <p className="mt-0.5 text-[13px] font-semibold text-[#8A94AA]">ხელშეკრულება ებმის კონკრეტულ გასაქირავებელ ერთეულს.</p>
                </div>
              </div>

              <div className="divide-y divide-[#EEF1F6]">
                {floorGroups.map((group) => {
                  const isOpen = expandedFloors.includes(group.name);
                  const leased = group.units.filter((unit) => unit.status === "leased").length;
                  return (
                    <section key={group.name}>
                      <button className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-[#FBFCFF]" onClick={() => setExpandedFloors((current) => current.includes(group.name) ? current.filter((name) => name !== group.name) : [...current, group.name])} type="button">
                        <div className="flex items-center gap-3">
                          <span className={`grid size-9 place-items-center rounded-xl border border-[#E1E5EF] bg-white text-[#6849F5] transition ${isOpen ? "" : "-rotate-90"}`}>
                            <ChevronDown size={17} />
                          </span>
                          <div>
                            <p className="text-[15px] font-semibold text-[#111A3A]">{group.name}</p>
                            <p className="mt-0.5 text-[12px] font-semibold text-[#8A94AA]">{group.units.length} ერთეული · {leased} გაქირავებული</p>
                          </div>
                        </div>
                        <span className="text-[13px] font-semibold text-[#64708A]">{formatMoney(group.units.reduce((sum, unit) => sum + Number(unit.monthlyRent || 0), 0))} ₾</span>
                      </button>
                      {isOpen ? (
                        <div className="overflow-x-auto border-t border-[#EEF1F6]">
                          <table className="w-full min-w-[820px] table-fixed text-left">
                            <thead className="bg-[#F7F8FC] text-[12px] font-semibold text-[#4C5875]">
                              <tr>
                                <th className="w-[22%] px-5 py-3">კოდი / ერთეული</th>
                                <th className="w-[15%] px-5 py-3">ტიპი</th>
                                <th className="w-[12%] px-5 py-3">ფართობი</th>
                                <th className="w-[13%] px-5 py-3">ფასი</th>
                                <th className="w-[20%] px-5 py-3">მოიჯარე</th>
                                <th className="w-[13%] px-5 py-3">სტატუსი</th>
                                <th className="w-[5%] px-5 py-3" />
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#EEF1F6]">
                              {group.units.map((unit) => (
                                <tr className="h-[62px] hover:bg-[#FBFCFF]" key={unit.id}>
                                  <td className="px-5 py-3">
                                    <p className="truncate text-[14px] font-semibold text-[#111A3A]">{unit.name}</p>
                                    <p className="mt-0.5 text-[12px] font-semibold text-[#8A94AA]">{unit.code ?? "კოდის გარეშე"}</p>
                                  </td>
                                  <td className="px-5 py-3 text-[13px] font-semibold text-[#4C5875]">{unitTypeLabel(unit.type)}</td>
                                  <td className="px-5 py-3 text-[13px] font-semibold text-[#4C5875]">{unit.area ? `${formatMoney(unit.area)} მ²` : "-"}</td>
                                  <td className="px-5 py-3 text-[13px] font-semibold text-[#111A3A]">{formatMoney(unit.monthlyRent)} {unit.currency}</td>
                                  <td className="px-5 py-3 text-[13px] font-semibold text-[#4C5875]">{unit.contractUnits?.[0]?.contract?.tenant?.name ?? "არ არის მიბმული"}</td>
                                  <td className="px-5 py-3"><StatusPill status={unit.status} /></td>
                                  <td className="px-5 py-3 text-right">
                                    <Link className="inline-flex h-8 items-center rounded-lg border border-[#E1E5EF] px-3 text-[12px] font-semibold text-[#6849F5] hover:bg-[#F7F4FF]" href={`/erp/leases/assets/${unit.id}/edit`}>ნახვა</Link>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : null}
                    </section>
                  );
                })}
                {!floorGroups.length ? <div className="p-10 text-center text-[14px] font-semibold text-[#7D88A2]">ერთეულები ჯერ არ არის დამატებული.</div> : null}
              </div>
            </div>

            <aside className="grid content-start gap-5">
              <Card title="ფართობის დატვირთულობა">
                <div className="h-3 overflow-hidden rounded-full bg-[#EEF1F6]">
                  <div className="h-full rounded-full bg-[#6849F5]" style={{ width: `${metrics.occupancy}%` }} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Info label="საერთო" value={`${formatMoney(metrics.totalArea)} მ²`} />
                  <Info label="გაქირავებული" value={`${formatMoney(metrics.leasedArea)} მ²`} />
                </div>
              </Card>
              <Card title="ფინანსები">
                <SummaryLine label="მოსალოდნელი შემოსავალი" value={`${formatMoney(metrics.expectedIncome)} ₾`} />
                <SummaryLine label="მიღებული თანხა" value={`${formatMoney(metrics.paid)} ₾`} />
                <SummaryLine label="მიმდინარე დავალიანება" tone={metrics.debt > 0 ? "red" : "green"} value={`${formatMoney(metrics.debt)} ₾`} />
              </Card>
            </aside>
          </section>
        </div>
      ) : null}
    </LeaseModuleShell>
  );
}

function Card({ children, title }: { children: React.ReactNode; title: string }) {
  return <section className="rounded-2xl border border-[#E1E5EF] bg-white p-5 shadow-sm shadow-slate-200/70"><h2 className="text-[18px] font-semibold text-[#111A3A]">{title}</h2><div className="mt-4">{children}</div></section>;
}

function Metric({ icon, label, tone = "purple", value }: { icon: React.ReactNode; label: string; tone?: "purple" | "green" | "amber" | "red"; value: string }) {
  const classes = {
    amber: "bg-[#FFF7E8] text-[#D98200]",
    green: "bg-[#ECFBF4] text-[#159961]",
    purple: "bg-[#F0ECFF] text-[#6849F5]",
    red: "bg-[#FFF1F3] text-[#E34E5B]",
  }[tone];
  return <article className="flex h-[84px] items-center gap-4 rounded-2xl border border-[#E1E5EF] bg-white px-5 shadow-sm shadow-slate-200/70"><span className={`grid size-11 place-items-center rounded-xl ${classes}`}>{icon}</span><div className="min-w-0"><p className="text-[12px] font-semibold text-[#6F7B96]">{label}</p><p className="mt-1 truncate text-[21px] font-semibold text-[#111A3A]">{value}</p></div></article>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-[#F8FAFD] px-3 py-3"><p className="text-[12px] font-semibold text-[#7D88A2]">{label}</p><p className="mt-1 text-[14px] font-semibold text-[#111A3A]">{value}</p></div>;
}

function SummaryLine({ label, tone, value }: { label: string; tone?: "green" | "red"; value: string }) {
  return <div className="flex items-center justify-between border-b border-[#EEF1F6] py-3 last:border-0"><span className="text-[13px] font-semibold text-[#6F7B96]">{label}</span><strong className={tone === "red" ? "text-[14px] text-[#E34E5B]" : tone === "green" ? "text-[14px] text-[#159961]" : "text-[14px] text-[#111A3A]"}>{value}</strong></div>;
}

function StatusPill({ status }: { status: AssetStatus }) {
  const labels: Record<AssetStatus, string> = {
    available: "თავისუფალია",
    reserved: "დაჯავშნილია",
    leased: "გაქირავებულია",
    maintenance: "რემონტზეა",
    unavailable: "მიუწვდომელია",
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
  return <span className={`inline-flex h-7 items-center rounded-full px-3 text-[12px] font-semibold ${classes[status]}`}>{labels[status]}</span>;
}

function propertyTypeLabel(type?: string | null) {
  const labels: Record<string, string> = {
    business_center: "ბიზნესცენტრი",
    hotel: "სასტუმრო / აპარტჰოტელი",
    land: "მიწის ნაკვეთი",
    residential_building: "საცხოვრებელი კორპუსი",
    shopping_center: "სავაჭრო ცენტრი",
    standalone: "დამოუკიდებელი ქონება",
    warehouse_complex: "საწყობების კომპლექსი",
  };
  return type ? labels[type] ?? type : "ქონება";
}

function unitTypeLabel(type?: string | null) {
  const labels: Record<string, string> = {
    advertising_space: "სარეკლამო ადგილი",
    apartment: "ბინა",
    commercial_space: "კომერციული ფართი",
    office: "ოფისი",
    other: "სხვა",
    parking_space: "პარკინგი",
    room: "ოთახი",
    warehouse: "საწყობი",
    whole_property: "მთლიანი ობიექტი",
    workspace: "სამუშაო სივრცე",
  };
  return type ? labels[type] ?? type : "სხვა";
}

function formatMoney(value: string | number) {
  return Number(value || 0).toLocaleString("ka-GE", { maximumFractionDigits: 2 });
}
