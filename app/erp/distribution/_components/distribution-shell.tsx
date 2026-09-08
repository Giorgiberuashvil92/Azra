"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { BarChart3, Bell, Building2, ChevronDown, Crown, Megaphone, Package, Search, Settings, Sparkles, Store, Tags, Truck, UsersRound } from "lucide-react";

type DistributionSection = "dashboard" | "stores" | "products" | "offers" | "orders" | "campaigns" | "opportunities" | "segments" | "analytics" | "settings";

const navItems = [
  { href: "/erp/distribution", key: "dashboard", icon: Store, label: "მთავარი" },
  { href: "/erp/distribution/stores", key: "stores", icon: Building2, label: "მაღაზიები" },
  { href: "/erp/distribution/products", key: "products", icon: Package, label: "პროდუქტები" },
  { href: "/erp/distribution/offers", key: "offers", icon: Tags, label: "შეთავაზებები" },
  { href: "/erp/distribution/orders", key: "orders", icon: Truck, label: "შეკვეთები", count: 12 },
  { href: "/erp/distribution/campaigns", key: "campaigns", icon: Megaphone, label: "კამპანიები" },
  { href: "/erp/distribution/opportunities", key: "opportunities", icon: Sparkles, label: "შესაძლებლობები" },
  { href: "/erp/distribution/stores", key: "segments", icon: UsersRound, label: "სეგმენტები" },
  { href: "/erp/distribution/campaigns", key: "analytics", icon: BarChart3, label: "ანალიტიკა" },
] satisfies Array<{ count?: number; href: string; key: DistributionSection; icon: typeof Store; label: string }>;

export function DistributionShell({ active, children }: { active: DistributionSection; children: ReactNode }) {
  return (
    <main className="grid h-screen grid-cols-[224px_minmax(0,1fr)] overflow-hidden bg-[#F7F8FC] text-[#18151F]">
      <aside className="grid min-h-0 grid-rows-[72px_minmax(0,1fr)_124px] border-r border-[#E9E6EE] bg-white px-3">
        <Link className="flex items-center gap-3 border-b border-[#E9E6EE] px-2 text-[#18151F]" href="/erp/distribution">
          <span className="grid size-10 place-items-center rounded-[12px] bg-[#2563EB] text-[20px] font-bold text-white">N</span>
          <span>
            <span className="block text-[18px] font-bold leading-5">AZLA</span>
            <span className="block text-[12px] font-medium leading-4 text-[#63718A]">Distribution</span>
          </span>
        </Link>
        <nav className="grid content-start gap-2 py-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.key === active;
            return (
              <Link aria-label={item.label} className={isActive ? "flex h-11 items-center gap-3 rounded-[12px] bg-[#EFF6FF] px-3 text-[#2563EB]" : "flex h-11 items-center gap-3 rounded-[12px] px-3 text-[#5F6680] transition hover:bg-[#F7F8FC] hover:text-[#1D4ED8]"} href={item.href} key={item.key} title={item.label}>
                <Icon size={20} strokeWidth={1.8} />
                <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{item.label}</span>
                {"count" in item ? <span className="grid size-5 place-items-center rounded-full bg-[#EF4444] text-[10px] font-bold text-white">{item.count}</span> : null}
              </Link>
            );
          })}
        </nav>
        <div className="pb-4">
          <div className="rounded-[16px] bg-[#F2F5FF] p-3">
            <Crown size={24} className="text-[#F59E0B]" />
            <p className="mt-2 text-[13px] font-semibold">Pro Plan</p>
            <p className="mt-1 text-[11px] font-medium leading-4 text-[#63718A]">მეტი შესაძლებლობა შენი გაყიდვებისთვის</p>
            <button className="mt-3 h-9 w-full rounded-[10px] bg-[#2563EB] text-[12px] font-semibold text-white" type="button">გაუმჯობესება</button>
          </div>
          <Link aria-label="პარამეტრები" className="mt-3 flex h-10 items-center gap-3 rounded-[12px] px-3 text-[#5F6680] transition hover:bg-[#F7F8FC] hover:text-[#1D4ED8]" href="/erp/distribution" title="პარამეტრები">
            <Settings size={18} strokeWidth={1.8} />
            <span className="text-[13px] font-semibold">პარამეტრები</span>
          </Link>
        </div>
      </aside>

      <div className="grid min-h-0 grid-rows-[64px_minmax(0,1fr)]">
        <header className="flex min-w-0 items-center gap-4 border-b border-[#E9E6EE] bg-white px-6">
          <label className="flex h-10 w-full max-w-[680px] items-center gap-3 rounded-[12px] border border-[#E9E6EE] bg-[#FBFAFC] px-3 text-[13px] text-[#817B8D] focus-within:border-[#2563EB] focus-within:ring-4 focus-within:ring-[#2563EB]/10">
            <Search size={18} strokeWidth={1.8} />
            <input className="min-w-0 flex-1 bg-transparent font-medium outline-none placeholder:text-[#9A94A6]" placeholder="მაღაზია, პროდუქტი, შეკვეთა..." />
          </label>
          <button className="ml-auto inline-flex h-10 items-center gap-2 rounded-[12px] border border-[#E9E6EE] bg-[#FBFAFC] px-4 text-[13px] font-semibold text-[#18151F]" type="button">
            <span className="grid size-7 place-items-center rounded-[8px] bg-[#E32424] text-[10px] font-bold text-white">CC</span>
            Coca-Cola Distribution
            <ChevronDown size={15} className="text-[#817B8D]" />
          </button>
          <div className="inline-flex items-center gap-2 text-[13px] font-medium text-[#18151F]">
            <span className="size-2 rounded-full bg-[#16B982]" />
            ონლაინ
          </div>
          <button className="relative grid size-10 place-items-center rounded-[12px] text-[#18151F] transition hover:bg-[#F7F8FC]" type="button" aria-label="შეტყობინებები">
            <Bell size={20} strokeWidth={1.8} />
            <span className="absolute right-1.5 top-1 grid size-4 place-items-center rounded-full bg-[#2563EB] text-[10px] font-bold text-white">5</span>
          </button>
          <button className="inline-flex h-11 items-center gap-3 rounded-[14px] px-2 text-left transition hover:bg-[#F7F8FC]" type="button">
            <span className="grid size-10 place-items-center rounded-full bg-[#EFF6FF] text-[15px] font-bold text-[#1D4ED8]">დ</span>
            <span className="hidden sm:block">
              <span className="block text-[13px] font-semibold leading-4 text-[#18151F]">დისტრიბუტორი</span>
              <span className="block text-[12px] font-medium leading-4 text-[#817B8D]">B2B არხი</span>
            </span>
            <ChevronDown size={16} className="text-[#817B8D]" strokeWidth={1.8} />
          </button>
        </header>
        <section className="min-h-0 overflow-hidden p-4">{children}</section>
      </div>
    </main>
  );
}

export function MiniBadge({ children, tone = "blue" }: { children: ReactNode; tone?: "amber" | "blue" | "green" | "gray" | "red" }) {
  const tones = {
    amber: "bg-[#FFF7E5] text-[#9A5A00]",
    blue: "bg-[#EFF6FF] text-[#1D4ED8]",
    green: "bg-[#E6F8F0] text-[#087C58]",
    gray: "bg-[#F3F4F7] text-[#6F687A]",
    red: "bg-[#FFF0F3] text-[#D7264B]",
  };
  return <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-semibold ${tones[tone]}`}>{children}</span>;
}

export function PageTitle({ action, subtitle, title }: { action?: ReactNode; subtitle: string; title: string }) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-[24px] font-semibold leading-8 text-[#18151F]">{title}</h1>
        <p className="mt-1 text-[13px] font-medium text-[#817B8D]">{subtitle}</p>
      </div>
      {action}
    </header>
  );
}
