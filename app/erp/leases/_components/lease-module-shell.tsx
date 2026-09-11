"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Bell,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Home,
  ReceiptText,
  Search,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { AzlaLogo } from "@/components/erp/AzlaLogo";

const navItems = [
  { label: "მთავარი", icon: Home, href: "/erp/leases" },
  { label: "იჯარები", icon: FileText, href: "/erp/leases" },
  { label: "ობიექტები", icon: Building2, href: "/erp/leases/assets" },
  { label: "მოიჯარეები", icon: UsersRound, href: "/erp/leases/tenants" },
  { label: "გადახდები", icon: WalletCards, href: "/erp/leases/payments" },
  { label: "ხელშეკრულებები", icon: ReceiptText, href: "/erp/leases/contracts" },
  { label: "ვადები", icon: CalendarDays, href: "/erp/leases/reminders" },
  { label: "რეპორტები", icon: CircleDollarSign, href: "/erp/leases/reports" },
];

export function LeaseModuleShell({
  actions,
  activeRoute,
  children,
  subtitle,
  title,
}: {
  actions?: ReactNode;
  activeRoute: string;
  children: ReactNode;
  subtitle?: string;
  title: string;
}) {
  return (
    <main className="min-h-screen bg-[#F6F7FB] text-[#111A3A]">
      <div className="grid min-h-screen grid-cols-[276px_1fr]">
        <aside className="flex min-h-screen flex-col border-r border-[#E6E9F2] bg-white px-4 py-5">
          <div className="flex h-12 items-center px-2">
            <AzlaLogo className="w-[146px]" priority />
          </div>

          <nav className="mt-10 grid gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.href === "/erp/leases" ? activeRoute === item.href : activeRoute === item.href || activeRoute.startsWith(`${item.href}/`);
              return (
                <Link
                  className={`flex h-12 items-center gap-3 rounded-xl px-4 text-[15px] font-bold transition ${
                    active ? "bg-[#F0ECFF] text-[#6849F5]" : "text-[#4C5875] hover:bg-[#F8F9FD]"
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
            <label className="flex h-12 w-[610px] items-center gap-3 rounded-xl border border-[#EEF1F6] bg-[#F7F8FC] px-4 text-[#8A94AA]">
              <Search size={20} />
              <input className="w-full bg-transparent text-[14px] font-semibold text-[#111A3A] outline-none placeholder:text-[#99A3B8]" placeholder="ძებნა ობიექტი, მოიჯარე, ხელშეკრულება..." />
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

          <div className="px-7 py-7">
            <div className="mb-7 flex items-start justify-between gap-6">
              <div>
                <p className="text-[13px] font-black text-[#6849F5]">იჯარები / ობიექტები</p>
                <h1 className="mt-2 text-[38px] font-black leading-tight tracking-normal text-[#111A3A]">{title}</h1>
                {subtitle ? <p className="mt-2 text-[16px] font-semibold leading-7 text-[#7D88A2]">{subtitle}</p> : null}
              </div>
              {actions}
            </div>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
