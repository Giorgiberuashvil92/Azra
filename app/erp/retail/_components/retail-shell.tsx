"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Bell, ChevronDown, FileText, HelpCircle, LayoutDashboard, LogOut, Package, ReceiptText, RotateCcw, Settings, ShoppingCart, Store } from "lucide-react";

type RetailSection = "checkout" | "products" | "sales" | "shifts" | "returns" | "manager";

const navItems = [
  { href: "/erp/retail", key: "checkout", icon: ShoppingCart, label: "სალარო" },
  { href: "/erp/retail/products", key: "products", icon: Package, label: "პროდუქტები" },
  { href: "/erp/retail/sales", key: "sales", icon: ReceiptText, label: "გაყიდვები" },
  { href: "/erp/retail/shifts", key: "shifts", icon: FileText, label: "ცვლები" },
  { href: "/erp/retail/returns", key: "returns", icon: RotateCcw, label: "დაბრუნებები" },
  { href: "/erp/retail/manager", key: "manager", icon: LayoutDashboard, label: "მენეჯერი" },
] satisfies Array<{ href: string; key: RetailSection; icon: typeof ShoppingCart; label: string }>;

export function RetailShell({ active, children, title }: { active: RetailSection; children: ReactNode; title: string }) {
  return (
    <main className="grid h-screen grid-cols-[68px_minmax(0,1fr)] overflow-hidden bg-[#F6F5F8] text-[#18151F]">
      <aside className="grid min-h-0 grid-rows-[64px_minmax(0,1fr)_168px] border-r border-[#E9E6EE] bg-white">
        <Link className="grid place-items-center border-b border-[#E9E6EE] text-[17px] font-bold tracking-normal text-[#18151F]" href="/erp/retail">
          AZLA
        </Link>
        <nav className="grid content-start justify-center gap-3 py-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.key === active;
            return (
              <Link aria-label={item.label} className={isActive ? "grid size-11 place-items-center rounded-[12px] bg-[#EFF6FF] text-[#2563EB]" : "grid size-11 place-items-center rounded-[12px] text-[#817B8D] transition hover:bg-[#F6F5F8] hover:text-[#1D4ED8]"} href={item.href} key={item.key}>
                <Icon size={20} strokeWidth={1.8} />
              </Link>
            );
          })}
        </nav>
        <div className="grid content-end justify-center gap-3 pb-6">
          <button aria-label="პარამეტრები" className="grid size-11 place-items-center rounded-[12px] text-[#817B8D] transition hover:bg-[#F6F5F8] hover:text-[#1D4ED8]" type="button">
            <Settings size={20} strokeWidth={1.8} />
          </button>
          <button aria-label="დახმარება" className="grid size-11 place-items-center rounded-[12px] text-[#817B8D] transition hover:bg-[#F6F5F8] hover:text-[#1D4ED8]" type="button">
            <HelpCircle size={20} strokeWidth={1.8} />
          </button>
          <Link aria-label="ERP" className="grid size-11 place-items-center rounded-[12px] text-[#817B8D] transition hover:bg-[#F6F5F8] hover:text-[#1D4ED8]" href="/erp/dashboard">
            <LogOut size={20} strokeWidth={1.8} />
          </Link>
        </div>
      </aside>
      <div className="grid min-h-0 grid-rows-[64px_minmax(0,1fr)]">
        <RetailHeader title={title} showTitle={active === "checkout"} />
        <section className="min-h-0 overflow-hidden p-4">{children}</section>
      </div>
    </main>
  );
}

function RetailHeader({ showTitle, title }: { showTitle: boolean; title: string }) {
  return (
    <header className="flex min-w-0 items-center gap-4 border-b border-[#E9E6EE] bg-white px-6">
      {showTitle ? <h1 className="text-[25px] font-bold leading-none tracking-normal">{title}</h1> : null}
      <button className={showTitle ? "ml-6 inline-flex h-11 items-center gap-3 rounded-[14px] border border-[#E9E6EE] bg-[#FBFAFD] px-4 text-[13px] font-semibold text-[#18151F]" : "inline-flex h-11 items-center gap-3 rounded-[14px] border border-[#E9E6EE] bg-[#FBFAFD] px-4 text-[13px] font-semibold text-[#18151F]"} type="button">
        <Store size={18} className="text-[#2563EB]" strokeWidth={1.8} />
        თბილისი, ვარკეთილის ფილიალი
        <ChevronDown size={16} className="text-[#817B8D]" strokeWidth={1.8} />
      </button>
      <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#18151F]">
        <span className="size-2 rounded-full bg-[#16B982]" />
        ონლაინ
      </div>
      <div className="ml-auto flex items-center gap-3">
        <button className="relative grid size-10 place-items-center rounded-[12px] text-[#18151F] transition hover:bg-[#F6F5F8]" type="button" aria-label="შეტყობინებები">
          <Bell size={20} strokeWidth={1.8} />
          <span className="absolute right-1.5 top-1 grid size-4 place-items-center rounded-full bg-[#2563EB] text-[10px] font-bold text-white">3</span>
        </button>
        <button className="inline-flex h-11 items-center gap-3 rounded-[14px] px-2 text-left transition hover:bg-[#F6F5F8]" type="button">
          <span className="grid size-10 place-items-center rounded-full bg-[#EFF6FF] text-[15px] font-bold text-[#1D4ED8]">ნ</span>
          <span className="hidden sm:block">
            <span className="block text-[13px] font-semibold leading-4 text-[#18151F]">ნინო კალანდაძე</span>
            <span className="block text-[12px] font-medium leading-4 text-[#817B8D]">კასირი</span>
          </span>
          <ChevronDown size={16} className="text-[#817B8D]" strokeWidth={1.8} />
        </button>
      </div>
    </header>
  );
}

export function StatusPill({ tone, children }: { tone: "green" | "red" | "blue" | "gray"; children: ReactNode }) {
  const tones = {
    green: "bg-[#E6F8F0] text-[#087C58]",
    red: "bg-[#FFF0F3] text-[#D7264B]",
    blue: "bg-[#EFF6FF] text-[#1D4ED8]",
    gray: "bg-[#F6F5F8] text-[#817B8D]",
  };
  return <span className={`inline-flex h-7 items-center rounded-full px-3 text-[12px] font-semibold ${tones[tone]}`}>{children}</span>;
}
