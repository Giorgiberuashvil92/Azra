"use client";

import { Building2, Inbox, LayoutDashboard, Package, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Overview", href: "/azla-admin", icon: LayoutDashboard },
  { label: "მოთხოვნები", href: "/azla-admin/requests", icon: Inbox },
  { label: "კომპანიები", href: "/azla-admin/companies", icon: Building2 },
  { label: "მოდულები", href: "/azla-admin/modules", icon: Package },
];

export function AdminShell({
  children,
  title,
  eyebrow = "Super Admin",
}: {
  children: React.ReactNode;
  title: string;
  eyebrow?: string;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f7f9ff] text-[#101936]">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-indigo-950/8 bg-white px-5 py-6 lg:block">
        <Link className="flex items-center gap-3" href="/azla-admin">
          <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#5f63ff] to-[#d968e8] text-lg font-semibold text-white shadow-lg shadow-violet-500/25">
            A
          </span>
          <div>
            <p className="text-lg font-semibold">AZLA Admin</p>
            <p className="text-xs font-medium text-slate-400">Platform control</p>
          </div>
        </Link>

        <nav className="mt-8 grid gap-2 text-sm font-semibold">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
                  isActive
                    ? "bg-[#f0edff] text-[#5e5bff]"
                    : "text-slate-500 hover:bg-[#fbfcff]"
                }`}
                href={item.href}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="px-5 py-6 lg:ml-72 lg:px-8 xl:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#5e5bff]">{eyebrow}</p>
            <h1 className="mt-1 text-3xl font-semibold">{title}</h1>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-indigo-950/8 bg-white px-4 py-3 shadow-sm">
            <ShieldCheck className="text-[#5e5bff]" size={19} />
            <span className="text-sm font-semibold text-slate-600">Internal workspace</span>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
