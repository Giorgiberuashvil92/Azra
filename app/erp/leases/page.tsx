"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  DoorOpen,
  FileText,
  Filter,
  Home,
  MoreHorizontal,
  Percent,
  Plus,
  ReceiptText,
  Search,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { AzlaLogo } from "@/components/erp/AzlaLogo";
import { getAuthHeaders } from "@/components/erp/CoreModuleShell";

type LeaseAsset = {
  id: string;
  name: string;
  status?: "available" | "reserved" | "leased" | "maintenance" | "unavailable" | "inactive";
  monthlyRent?: string | number;
  currency?: string;
  address?: string | null;
  property?: { id?: string; name: string; address?: string | null } | null;
};

type LeaseTenant = {
  id: string;
  name: string;
  contracts?: LeaseContract[];
};

type LeaseCharge = {
  id: string;
  dueDate: string;
  amount: string;
  paidAmount: string;
  currency: string;
  status: "open" | "partially_paid" | "paid" | "overdue" | "cancelled";
  contract?: LeaseContract;
};

type LeaseContract = {
  id: string;
  contractNumber: string;
  startsAt: string;
  endsAt?: string | null;
  monthlyRent: string;
  currency: string;
  status: "draft" | "active" | "expired" | "terminated";
  asset: LeaseAsset;
  tenant: LeaseTenant;
  contractUnits?: Array<{ rentalUnit?: { name: string; address?: string | null; property?: { name: string; address?: string | null } | null } | null }>;
  charges?: LeaseCharge[];
};

type LeaseData = {
  assets: LeaseAsset[];
  tenants: LeaseTenant[];
  contracts: LeaseContract[];
  charges: LeaseCharge[];
};

type LeaseSummary = {
  assetCount?: number;
  activeContractCount: number;
  expectedMonthlyIncome: number;
  outstandingBalance: number;
  collectedTotal?: number;
};

type DashboardLease = {
  id: string;
  object: string;
  address: string;
  tenant: string;
  tenantMeta: string;
  amount: number;
  date: string;
  status: "paid" | "due" | "overdue";
  thumb: "business" | "apartment" | "retail" | "warehouse" | "office";
};

const navItems = [
  { label: "მთავარი", icon: Home, href: "/erp/leases" },
  { label: "იჯარები", icon: FileText, href: "/erp/leases", active: true },
  { label: "ობიექტები", icon: Building2, href: "/erp/leases/assets" },
  { label: "მოიჯარეები", icon: UsersRound, href: "/erp/leases/tenants" },
  { label: "გადახდები", icon: WalletCards, href: "/erp/leases/payments" },
  { label: "ხელშეკრულებები", icon: ReceiptText, href: "/erp/leases/contracts" },
  { label: "ვადები", icon: CalendarDays, href: "/erp/leases/reminders" },
  { label: "რეპორტები", icon: CircleDollarSign, href: "/erp/leases/reports" },
];

export default function LeasesPage() {
  const [data, setData] = useState<LeaseData>({ assets: [], tenants: [], contracts: [], charges: [] });
  const [summary, setSummary] = useState<LeaseSummary | null>(null);

  useEffect(() => {
    let ignore = false;
    void Promise.all([
      fetch("/api/erp/leases", { headers: getAuthHeaders(), cache: "no-store" }),
      fetch("/api/erp/leases/summary", { headers: getAuthHeaders(), cache: "no-store" }),
    ])
      .then(async ([listResponse, summaryResponse]) => {
        if (ignore) return;
        setData(listResponse.ok ? await listResponse.json() : { assets: [], tenants: [], contracts: [], charges: [] });
        setSummary(summaryResponse.ok ? await summaryResponse.json() : null);
      })
      .catch(() => undefined);

    return () => {
      ignore = true;
    };
  }, []);

  const rows = useMemo(() => {
    return data.contracts.slice(0, 5).map((contract, index) => {
      const charge = contract.charges?.[0];
      const status: DashboardLease["status"] = charge?.status === "overdue" ? "overdue" : charge?.status === "paid" ? "paid" : "due";
      const units = contract.contractUnits?.map((item) => item.rentalUnit).filter(Boolean) ?? [];
      const object = units.length === 1 ? `${units[0]?.property?.name ?? contract.asset.name} · ${units[0]?.name}` : units.length > 1 ? `${units[0]?.property?.name ?? contract.asset.name} · ${units.length} ერთეული` : contract.asset.name;
      const address = units[0]?.address ?? units[0]?.property?.address ?? contract.asset.address ?? "მისამართი არ არის მითითებული";
      return {
        id: contract.id,
        object,
        address,
        tenant: contract.tenant.name,
        tenantMeta: contract.contractNumber,
        amount: Number(contract.monthlyRent),
        date: charge ? new Date(charge.dueDate).toLocaleDateString("ka-GE") : new Date(contract.startsAt).toLocaleDateString("ka-GE"),
        status,
        thumb: ["business", "apartment", "retail", "warehouse", "office"][index % 5] as DashboardLease["thumb"],
      };
    });
  }, [data.contracts]);

  const upcoming = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const criticalUntil = new Date(today);
    criticalUntil.setDate(criticalUntil.getDate() + 30);

    return data.charges
      .filter((charge) => {
        if (!["open", "partially_paid", "overdue"].includes(charge.status)) return false;
        const dueDate = new Date(charge.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate >= today && dueDate <= criticalUntil;
      })
      .slice()
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5)
      .map((charge, index) => ({
        id: charge.id,
        object: charge.contract?.asset.name ?? "ობიექტი არ არის მითითებული",
        tenant: charge.contract?.tenant.name ?? "მოიჯარე არ არის მითითებული",
        date: new Date(charge.dueDate).toLocaleDateString("ka-GE"),
        amount: Math.max(Number(charge.amount) - Number(charge.paidAmount), 0),
        tone: charge.status === "overdue" ? "red" : "amber",
        thumb: ["business", "apartment", "retail", "warehouse", "office"][index % 5] as DashboardLease["thumb"],
      }));
  }, [data.charges]);

  const paymentStatus = useMemo(() => {
    const paid = data.charges.filter((charge) => charge.status === "paid").length;
    const due = data.charges.filter((charge) => ["open", "partially_paid"].includes(charge.status)).length;
    const overdue = data.charges.filter((charge) => charge.status === "overdue").length;
    const total = paid + due + overdue;
    const percent = (value: number) => total ? Math.round((value / total) * 100) : 0;
    return { paid, due, overdue, total, paidPercent: percent(paid), duePercent: percent(due), overduePercent: percent(overdue) };
  }, [data.charges]);

  const assetDashboard = useMemo(() => {
    const freeAssets = data.assets.filter((asset) => asset.status === "available");
    const rentableAssets = data.assets.filter((asset) => asset.status !== "inactive");
    const leasedAssets = data.assets.filter((asset) => asset.status === "leased");
    const lostPotential = freeAssets.reduce((sum, asset) => sum + Number(asset.monthlyRent || 0), 0);
    const occupancy = rentableAssets.length ? Math.round((leasedAssets.length / rentableAssets.length) * 100) : 0;
    return { freeAssets, lostPotential, occupancy, rentableCount: rentableAssets.length };
  }, [data.assets]);

  const topDebtors = useMemo(() => {
    const totals = new Map<string, { id: string; name: string; debt: number; overdueDays: number }>();
    for (const charge of data.charges) {
      if (!["open", "partially_paid", "overdue"].includes(charge.status) || !charge.contract?.tenant) continue;
      const balance = Math.max(Number(charge.amount || 0) - Number(charge.paidAmount || 0), 0);
      if (balance <= 0) continue;
      const dueDate = new Date(charge.dueDate);
      const overdueDays = charge.status === "overdue" ? Math.max(1, Math.floor((Date.now() - dueDate.getTime()) / 86400000)) : 0;
      const tenant = charge.contract.tenant;
      const current = totals.get(tenant.id) ?? { id: tenant.id, name: tenant.name, debt: 0, overdueDays: 0 };
      current.debt += balance;
      current.overdueDays = Math.max(current.overdueDays, overdueDays);
      totals.set(tenant.id, current);
    }
    return Array.from(totals.values()).sort((a, b) => b.debt - a.debt).slice(0, 4);
  }, [data.charges]);

  const expiringCount = data.contracts.filter((contract) => {
    if (!("endsAt" in contract) || !contract.endsAt) return false;
    const days = (new Date(contract.endsAt).getTime() - Date.now()) / 86400000;
    return days >= 0 && days <= 30;
  }).length;
  const activeCount = summary?.activeContractCount ?? 0;
  const monthlyIncome = summary?.expectedMonthlyIncome ?? 0;
  const debt = summary?.outstandingBalance ?? 0;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F6F7FB] text-[#111A3A]">
      <div className="grid min-h-screen grid-cols-[240px_minmax(0,1fr)]">
        <aside className="flex min-h-screen flex-col border-r border-[#E6E9F2] bg-white px-4 py-5">
          <div className="flex h-12 items-center px-2">
            <AzlaLogo className="w-[146px]" priority />
          </div>

          <nav className="mt-10 grid gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  className={`flex h-12 items-center gap-3 rounded-xl px-4 text-[15px] font-bold transition ${
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
            <p className="text-[15px] font-bold text-[#8A94AA]">AZLA ERP</p>
            <p className="mt-1 text-[12px] font-semibold leading-5 text-[#9AA4B8]">თანამედროვე ბიზნესის სამუშაო პლატფორმა</p>
          </div>
        </aside>

        <section className="min-w-0 max-w-[calc(100vw-240px)] overflow-hidden">
          <header className="flex h-[64px] items-center justify-between gap-4 border-b border-[#E6E9F2] bg-white px-6">
            <label className="flex h-11 max-w-[560px] flex-1 items-center gap-3 rounded-xl border border-[#EEF1F6] bg-[#F7F8FC] px-4 text-[#8A94AA]">
              <Search size={20} />
              <input className="w-full bg-transparent text-[14px] font-semibold text-[#111A3A] outline-none placeholder:text-[#99A3B8]" placeholder="ძებნა ობიექტი, მოიჯარე, ხელშეკრულება..." />
            </label>

            <div className="flex shrink-0 items-center gap-4">
              <button className="relative grid size-11 place-items-center rounded-xl border border-[#EEF1F6] bg-white text-[#3D4665]" type="button">
                <Bell size={21} />
                <span className="absolute right-2 top-2 size-2.5 rounded-full bg-[#6849F5] ring-2 ring-white" />
              </button>
              <div className="h-8 w-px bg-[#E6E9F2]" />
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-full bg-[#8D9CC5] text-[15px] font-bold text-white">გბ</span>
                <div>
                  <p className="text-[14px] font-bold text-[#111A3A]">გიორგი ბერიძე</p>
                  <p className="text-[12px] font-semibold text-[#8A94AA]">შპს მმართველი</p>
                </div>
                <ChevronDown size={18} className="text-[#4C5875]" />
              </div>
            </div>
          </header>

          <div className="w-full max-w-full overflow-hidden px-4 py-5">
            <section className="rounded-2xl border border-[#E1E5EF] bg-white p-5 shadow-sm shadow-slate-200/70">
              <div className="flex min-w-0 items-center justify-between gap-5">
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-[#6849F5]">AZLA / იჯარების მოდული</p>
                  <h1 className="mt-1 text-[31px] font-semibold leading-tight tracking-normal text-[#111A3A]">იჯარების მართვა</h1>
                  <p className="mt-1 max-w-[720px] truncate text-[14px] font-semibold text-[#66718A]">
                    ობიექტები, მოიჯარეები, გადახდები და ხელშეკრულებები ერთ სამუშაო სივრცეში.
                  </p>
                </div>
                <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-2">
                  <HeaderBadge label="მოახლოებული" value={upcoming.length} tone="amber" />
                  <HeaderBadge label="დავალიანება" value={`${formatMoney(debt)} ₾`} tone={debt > 0 ? "red" : "green"} />
                  <Link className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#6849F5] px-4 text-[12px] font-bold text-white shadow-lg shadow-violet-500/25 transition hover:bg-[#5737EA]" href="/erp/leases/contracts/new">
                    <Plus size={18} />
                    ახალი იჯარა
                  </Link>
                </div>
              </div>

              <div className="mt-5 grid min-w-0 grid-cols-4 gap-3">
                <CompactKpi icon={<FileText size={20} />} label="აქტიური იჯარები" tone="green" value={activeCount.toLocaleString("ka-GE")} />
                <CompactKpi icon={<CircleDollarSign size={20} />} label="თვის შემოსავალი" tone="purple" value={`${formatMoney(monthlyIncome)} ₾`} />
                <CompactKpi icon={<WalletCards size={20} />} label="დავალიანება" tone={debt > 0 ? "red" : "green"} value={`${formatMoney(debt)} ₾`} />
                <CompactKpi icon={<Percent size={20} />} label="დატვირთულობა" tone="amber" value={`${assetDashboard.occupancy}%`} />
              </div>
            </section>

            <section className="mt-5 grid grid-cols-[1fr_1fr_1.25fr] gap-4">
              <InsightCard
                actionHref="/erp/leases/assets"
                actionLabel="ობიექტები"
                icon={<DoorOpen size={20} />}
                label="თავისუფალი ობიექტები"
                helper={`პოტენციური შემოსავალი: ${formatMoney(assetDashboard.lostPotential)} ₾`}
                tone="green"
                value={assetDashboard.freeAssets.length.toLocaleString("ka-GE")}
              />
              <InsightCard
                actionHref="/erp/leases/contracts"
                actionLabel="იჯარები"
                icon={<CalendarDays size={20} />}
                label="30 დღის კონტროლი"
                helper={`${upcoming.length} გადახდის ვადა · ${expiringCount} ხელშეკრულება სრულდება`}
                tone="amber"
                value={(upcoming.length + expiringCount).toLocaleString("ka-GE")}
              />
              <section className="rounded-2xl border border-[#E1E5EF] bg-white p-4 shadow-sm shadow-slate-200/70">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[16px] font-bold text-[#111A3A]">ტოპ დავალიანებული მოიჯარეები</h2>
                    <p className="mt-1 text-[12px] font-semibold text-[#8A94AA]">ყველაზე მაღალი მიმდინარე ნაშთი</p>
                  </div>
                  <Link className="text-[12px] font-semibold text-[#6849F5]" href="/erp/leases/tenants">ყველა</Link>
                </div>
                <div className="mt-3 grid gap-2">
                  {topDebtors.map((tenant) => (
                    <Link className="flex items-center justify-between gap-3 rounded-xl border border-[#EEF1F6] px-3 py-2.5 hover:bg-[#FBFCFF]" href={`/erp/leases/tenants/${tenant.id}`} key={tenant.id}>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-[#111A3A]">{tenant.name}</p>
                        <p className="mt-0.5 text-[11px] font-semibold text-[#8A94AA]">{tenant.overdueDays ? `${tenant.overdueDays} დღე დაგვიანება` : "მიმდინარე გადასახდელი"}</p>
                      </div>
                      <strong className="shrink-0 text-[13px] text-[#E34E5B]">{formatMoney(tenant.debt)} ₾</strong>
                    </Link>
                  ))}
                  {!topDebtors.length ? (
                    <div className="rounded-xl border border-dashed border-[#DDE3EE] bg-[#F8FAFD] px-3 py-4 text-center text-[12px] font-semibold text-[#7D88A2]">
                      დავალიანებული მოიჯარეები არ არის.
                    </div>
                  ) : null}
                </div>
              </section>
            </section>

            <section className="mt-5 grid max-w-full grid-cols-[minmax(0,1fr)_minmax(360px,390px)] gap-4">
              <div className="min-w-0 overflow-hidden rounded-2xl border border-[#E1E5EF] bg-white shadow-sm shadow-slate-200/70">
                <div className="flex h-[68px] items-center justify-between gap-4 border-b border-[#E6EAF2] px-5">
                  <div className="min-w-0">
                    <h2 className="text-[20px] font-bold">იჯარების სია</h2>
                    <p className="mt-0.5 truncate text-[12px] font-semibold text-[#8A94AA]">აქტიური, დასრულებული და საყურადღებო იჯარები</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <label className="flex h-10 w-[180px] items-center gap-2 rounded-xl border border-[#DDE3EE] px-3 text-[#53617D]">
                      <Search size={18} />
                      <input className="w-full bg-transparent text-[14px] font-semibold outline-none placeholder:text-[#9AA4B8]" placeholder="ძებნა..." />
                    </label>
                    <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#DDE3EE] px-3 text-[13px] font-bold text-[#3D4665]" type="button">
                      <Filter size={17} />
                      ფილტრები
                    </button>
                    <button className="grid size-10 place-items-center rounded-xl border border-[#DDE3EE] text-[#3D4665]" type="button">
                      <MoreHorizontal size={21} />
                    </button>
                  </div>
                </div>

                <div className="max-w-full overflow-x-auto">
                <table className="w-full min-w-[760px] table-fixed text-left">
                  <thead className="bg-[#F7F8FC] text-[12px] font-semibold text-[#4C5875]">
                    <tr>
                      <th className="w-[33%] px-3 py-3">ობიექტი</th>
                      <th className="w-[18%] px-3 py-3">მოიჯარე</th>
                      <th className="w-[14%] px-3 py-3">თანხა</th>
                      <th className="w-[14%] px-3 py-3">თარიღი</th>
                      <th className="w-[12%] px-3 py-3">სტატუსი</th>
                      <th className="w-[9%] px-3 py-3 text-right">ნახვა</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF1F6]">
                    {rows.map((row) => (
                      <tr className="h-[64px] transition hover:bg-[#FBFCFF]" key={row.id}>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2.5">
                            <AssetThumb size="small" variant={row.thumb} />
                            <div className="min-w-0">
                              <p className="truncate text-[14px] font-semibold text-[#111A3A]">{row.object}</p>
                              <p className="mt-0.5 truncate text-[12px] font-semibold text-[#8A94AA]">{row.address}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <p className="truncate text-[14px] font-semibold">{row.tenant}</p>
                          <p className="mt-0.5 truncate text-[12px] font-semibold text-[#8A94AA]">{row.tenantMeta}</p>
                        </td>
                        <td className="px-3 py-2 text-[13px] font-semibold">{formatMoney(row.amount)} ₾</td>
                        <td className="px-3 py-2 text-[13px] font-semibold">{row.date}</td>
                        <td className="px-3 py-2"><StatusPill status={row.status} /></td>
                        <td className="px-3 py-2">
                          <Link className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#F0ECFF] px-3 text-[12px] font-semibold text-[#6849F5] hover:bg-[#E7DFFF]" href={`/erp/leases/contracts/${row.id}`}>
                            პროფილი
                            <ChevronRight size={18} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {!rows.length ? (
                      <tr>
                        <td className="px-5 py-16 text-center" colSpan={6}>
                          <div className="mx-auto grid max-w-[360px] justify-items-center">
                            <span className="grid size-14 place-items-center rounded-2xl bg-[#F0ECFF] text-[#6849F5]"><FileText size={26} /></span>
                            <p className="mt-4 text-[16px] font-bold text-[#111A3A]">იჯარები ჯერ არ არის დამატებული</p>
                            <p className="mt-1 text-[13px] font-semibold leading-6 text-[#7D88A2]">აირჩიეთ გასაქირავებელი ერთეული და შექმენით პირველი ხელშეკრულება.</p>
                            <Link className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#6849F5] px-4 text-[13px] font-bold text-white" href="/erp/leases/contracts/new"><Plus size={16} /> ახალი იჯარა</Link>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
                </div>

                <div className="flex h-[60px] items-center justify-between border-t border-[#E6EAF2] px-4">
                  <p className="text-[12px] font-semibold text-[#7D88A2]">ჩანაწერები {rows.length ? `1-${rows.length}` : "0"} {data.contracts.length}-დან</p>
                  <div className="flex items-center gap-2">
                    <PageButton icon={<ChevronLeft size={18} />} />
                    {[1, 2, 3, 4, 5].map((page) => <PageButton active={page === 1} key={page} label={String(page)} />)}
                    <PageButton icon={<ChevronRight size={18} />} />
                  </div>
                </div>
              </div>

              <aside className="min-w-0 grid gap-4">
                <section className="min-w-0 rounded-2xl border border-[#E1E5EF] bg-white p-5 shadow-sm shadow-slate-200/70">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[20px] font-bold">მოახლოებული ვადები</h2>
                    <button className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#6849F5]" type="button">
                      ყველას ნახვა
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className="mt-4 grid gap-2">
                    {upcoming.map((item) => (
                      <div className="flex min-w-0 items-center gap-3 rounded-xl border border-[#EEF1F6] px-3 py-2.5" key={item.id}>
                        <AssetThumb size="small" variant={item.thumb} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-[#111A3A]">{item.object}</p>
                          <p className="truncate text-[12px] font-semibold text-[#8A94AA]">{item.tenant}</p>
                        </div>
                        <div className="w-[86px] shrink-0 text-right">
                          <p className={item.tone === "red" ? "truncate text-[12px] font-semibold text-[#EF5D68]" : "truncate text-[12px] font-semibold text-[#4C5875]"}>{item.date}</p>
                          <p className="mt-1 truncate text-[12px] font-semibold text-[#111A3A]">{formatMoney(item.amount)} ₾</p>
                        </div>
                      </div>
                    ))}
                    {!upcoming.length ? (
                      <div className="rounded-xl border border-dashed border-[#DDE3EE] bg-[#F8FAFD] p-6 text-center">
                        <CalendarDays className="mx-auto text-[#8A94AA]" size={28} />
                        <p className="mt-3 text-[14px] font-bold text-[#111A3A]">მოახლოებული ვადები არ არის</p>
                        <p className="mt-1 text-[12px] font-semibold leading-5 text-[#8A94AA]">შემდეგი 30 დღის კრიტიკული ვადები აქ გამოჩნდება.</p>
                      </div>
                    ) : null}
                  </div>
                </section>

                <section className="min-w-0 rounded-2xl border border-[#E1E5EF] bg-white p-5 shadow-sm shadow-slate-200/70">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-[18px] font-bold">გადახდის სტატუსი</h2>
                      <p className="mt-1 text-[12px] font-semibold text-[#8A94AA]">დარიცხვების მიმდინარე სურათი</p>
                    </div>
                    <button className="inline-flex h-9 w-fit shrink-0 items-center gap-2 rounded-lg border border-[#DDE3EE] px-3 text-[12px] font-semibold text-[#4C5875]" type="button">
                      მიმდინარე თვე
                      <ChevronDown size={16} />
                    </button>
                  </div>

                  <PaymentStatusChart paymentStatus={paymentStatus} />
                </section>
              </aside>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function KpiCard({ change, helper, icon, label, tone, value }: { change: string; helper: string; icon: React.ReactNode; label: string; tone: "green" | "red" | "amber"; value: string }) {
  const toneClass = tone === "green" ? "text-[#22A96B]" : tone === "red" ? "text-[#EF5D68]" : "text-[#F39A17]";
  const iconClass = tone === "red" ? "bg-[#FDEDEE] text-[#EF5D68]" : tone === "amber" ? "bg-[#FFF4DB] text-[#E48700]" : "bg-[#F0ECFF] text-[#6849F5]";
  return (
    <article className="rounded-2xl border border-[#E1E5EF] bg-white p-5 shadow-sm shadow-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-200/80">
      <div className="flex items-start gap-4">
        <span className={`grid size-12 shrink-0 place-items-center rounded-xl ${iconClass}`}>{icon}</span>
        <div>
          <p className="text-[13px] font-semibold text-[#6F7B96]">{label}</p>
          <p className="mt-1 text-[28px] font-bold leading-none text-[#111A3A]">{value}</p>
          <p className={`mt-3 text-[12px] font-semibold ${toneClass}`}>↑ {change}</p>
          <p className="mt-1 text-[12px] font-semibold text-[#8A94AA]">{helper}</p>
        </div>
      </div>
    </article>
  );
}

function HeaderBadge({ label, tone = "purple", value }: { label: string; tone?: "purple" | "green" | "amber" | "red"; value: string | number }) {
  const classes = {
    purple: "border-[#DCD7FF] bg-white text-[#6849F5]",
    green: "border-[#BDEED8] bg-[#F3FCF7] text-[#159961]",
    amber: "border-[#FFE0A3] bg-[#FFFAF0] text-[#B86900]",
    red: "border-[#FFD0D5] bg-[#FFF6F7] text-[#D9414E]",
  }[tone];
  return (
    <span className={`inline-flex h-8 max-w-[140px] items-center gap-2 rounded-xl border px-2.5 text-[11px] font-bold ${classes}`}>
      <span className="size-1.5 rounded-full bg-current" />
      <span className="truncate">{label}: {typeof value === "number" ? value.toLocaleString("ka-GE") : value}</span>
    </span>
  );
}

function InsightCard({ actionHref, actionLabel, helper, icon, label, tone, value }: { actionHref: string; actionLabel: string; helper: string; icon: React.ReactNode; label: string; tone: "green" | "amber" | "purple"; value: string }) {
  const classes = {
    amber: "bg-[#FFF7E8] text-[#D98200]",
    green: "bg-[#ECFBF4] text-[#159961]",
    purple: "bg-[#F0ECFF] text-[#6849F5]",
  }[tone];
  return (
    <section className="rounded-2xl border border-[#E1E5EF] bg-white p-4 shadow-sm shadow-slate-200/70">
      <div className="flex items-start justify-between gap-3">
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${classes}`}>{icon}</span>
        <Link className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#E1E5EF] px-3 text-[12px] font-semibold text-[#6849F5] hover:bg-[#F7F4FF]" href={actionHref}>
          {actionLabel}
          <ChevronRight size={15} />
        </Link>
      </div>
      <p className="mt-4 text-[12px] font-semibold text-[#6F7B96]">{label}</p>
      <p className="mt-1 text-[26px] font-bold leading-none text-[#111A3A]">{value}</p>
      <p className="mt-3 truncate text-[12px] font-semibold text-[#8A94AA]">{helper}</p>
    </section>
  );
}

function CompactKpi({ icon, label, tone, value }: { icon: React.ReactNode; label: string; tone: "purple" | "green" | "amber" | "red"; value: string }) {
  const classes = {
    purple: "bg-[#F4F1FF] text-[#6849F5]",
    green: "bg-[#ECFBF4] text-[#159961]",
    amber: "bg-[#FFF7E8] text-[#D98200]",
    red: "bg-[#FFF1F3] text-[#E34E5B]",
  }[tone];
  return (
    <article className="flex h-[74px] items-center gap-3 rounded-xl border border-[#EEF1F6] bg-[#FBFCFF] px-4">
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${classes}`}>{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-[12px] font-semibold text-[#6F7B96]">{label}</p>
        <p className="mt-1 truncate text-[22px] font-bold leading-none text-[#111A3A]">{value}</p>
      </div>
    </article>
  );
}

function AssetThumb({ size = "normal", variant }: { size?: "normal" | "small" | "tiny"; variant: DashboardLease["thumb"] }) {
  const classes = {
    business: "from-[#8DA7C7] via-[#DDE8F4] to-[#415C83]",
    apartment: "from-[#BFA36D] via-[#E9DCC0] to-[#596F8A]",
    retail: "from-[#214C62] via-[#9FBFD0] to-[#C28D55]",
    warehouse: "from-[#7B8795] via-[#E3E7EB] to-[#394454]",
    office: "from-[#86A4BA] via-[#EEF4FA] to-[#54708C]",
  }[variant];
  return (
    <span className={`${size === "tiny" ? "size-8 rounded-lg" : size === "small" ? "size-10 rounded-lg" : "size-12 rounded-lg"} grid shrink-0 place-items-center overflow-hidden bg-gradient-to-br ${classes}`}>
      <span className="h-3/5 w-3/5 rounded-[3px] border-2 border-white/80 bg-white/25 shadow-sm" />
    </span>
  );
}

function StatusPill({ status }: { status: DashboardLease["status"] }) {
  const labels = { paid: "გადახდილია", due: "გადასახდელია", overdue: "ვადაგადაცილებულია" };
  const classes = {
    paid: "bg-[#DDF7EB] text-[#159961]",
    due: "bg-[#FFF0D3] text-[#E48700]",
    overdue: "bg-[#FDE1E3] text-[#E34E5B]",
  };
  return <span className={`inline-flex h-7 items-center rounded-full px-3 text-[12px] font-semibold ${classes[status]}`}>{labels[status]}</span>;
}

function PageButton({ active, icon, label }: { active?: boolean; icon?: React.ReactNode; label?: string }) {
  return (
    <button className={active ? "grid size-10 place-items-center rounded-lg bg-[#6849F5] text-[14px] font-bold text-white shadow-md shadow-violet-500/25" : "grid size-10 place-items-center rounded-lg border border-[#DDE3EE] bg-white text-[14px] font-bold text-[#7D88A2]"} type="button">
      {icon ?? label}
    </button>
  );
}

function PaymentStatusChart({ paymentStatus }: { paymentStatus: ReturnType<typeof usePaymentStatusShape> }) {
  const total = paymentStatus.total || 1;
  const paidStroke = (paymentStatus.paid / total) * 100;
  const dueStroke = (paymentStatus.due / total) * 100;
  const overdueStroke = (paymentStatus.overdue / total) * 100;
  const hasData = paymentStatus.total > 0;

  return (
    <div className="mt-4 min-w-0 rounded-2xl border border-[#EEF1F6] bg-[#FBFCFF] p-3">
      <div className="grid justify-items-center gap-4">
        <div className="relative size-[116px] shrink-0">
          <svg className="-rotate-90 drop-shadow-sm" height="116" viewBox="0 0 150 150" width="116">
            <circle cx="75" cy="75" fill="none" r="55" stroke="#EDF1F7" strokeWidth="18" />
            {hasData ? (
              <>
                <circle cx="75" cy="75" fill="none" r="55" stroke="#24B47E" strokeDasharray={`${paidStroke} ${100 - paidStroke}`} strokeLinecap="round" strokeWidth="18" />
                <circle cx="75" cy="75" fill="none" r="55" stroke="#F5A623" strokeDasharray={`${dueStroke} ${100 - dueStroke}`} strokeDashoffset={-paidStroke} strokeLinecap="round" strokeWidth="18" />
                <circle cx="75" cy="75" fill="none" r="55" stroke="#EF5D68" strokeDasharray={`${overdueStroke} ${100 - overdueStroke}`} strokeDashoffset={-(paidStroke + dueStroke)} strokeLinecap="round" strokeWidth="18" />
              </>
            ) : (
              <circle cx="75" cy="75" fill="none" r="55" stroke="#DCD7FF" strokeDasharray="18 82" strokeLinecap="round" strokeWidth="18" />
            )}
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div className="grid size-[72px] place-items-center rounded-full border border-[#EEF1F6] bg-white shadow-sm">
              <div>
                <p className="text-[21px] font-bold leading-none text-[#111A3A]">{paymentStatus.total}</p>
                <p className="mt-1 text-[11px] font-semibold text-[#8A94AA]">დარიცხვა</p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid w-full gap-2">
          <ChartLegend color="#24B47E" label="გადახდილია" percent={paymentStatus.paidPercent} value={paymentStatus.paid} />
          <ChartLegend color="#F5A623" label="გადასახდელია" percent={paymentStatus.duePercent} value={paymentStatus.due} />
          <ChartLegend color="#EF5D68" label="ვადაგადაცილებულია" percent={paymentStatus.overduePercent} value={paymentStatus.overdue} />
        </div>
      </div>
      {!hasData ? (
        <div className="mt-4 rounded-xl border border-dashed border-[#DDE3EE] bg-white px-4 py-3 text-[12px] font-semibold leading-5 text-[#7D88A2]">
          მიმდინარე თვეში გადახდის ჩანაწერები ჯერ არ არის. იჯარის გრაფიკის გენერირების შემდეგ სტატუსები აქ გამოჩნდება.
        </div>
      ) : null}
    </div>
  );
}

function usePaymentStatusShape() {
  return { due: 0, duePercent: 0, overdue: 0, overduePercent: 0, paid: 0, paidPercent: 0, total: 0 };
}

function ChartLegend({ color, label, percent, value }: { color: string; label: string; percent: number; value: number }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#EEF1F6] bg-white px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="truncate text-[12px] font-semibold text-[#4C5875]">{label}</span>
        </div>
        <strong className="shrink-0 text-[12px] text-[#111A3A]">{value} ({percent}%)</strong>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EEF1F6]">
        <div className="h-full rounded-full" style={{ backgroundColor: color, width: `${percent}%` }} />
      </div>
    </div>
  );
}

function formatMoney(value: string | number) {
  return Number(value || 0).toLocaleString("ka-GE", { maximumFractionDigits: 2 });
}
