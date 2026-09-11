"use client";

import { FolderTree, LogOut, Percent, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { demoUserPermissions, type Company } from "@/lib/erp/company-modules";
import { buildErpSidebar, type SidebarGroup } from "@/lib/erp/sidebar";
import { AzlaLogo } from "./AzlaLogo";
import { CompanySwitcher } from "./CompanySwitcher";

type ErpSession = {
  permissions?: string[];
};

export function ErpSidebar({
  activeRoute,
  initialCompany,
}: {
  activeRoute: string;
  initialCompany: Company;
}) {
  const [company, setCompany] = useState(initialCompany);
  const [permissions, setPermissions] = useState(demoUserPermissions);

  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem("azla_access_token");
    const session = readSession();

    if (session.permissions?.length) {
      queueMicrotask(() => {
        if (isMounted) setPermissions(session.permissions ?? []);
      });
    }

    if (token) {
      fetch("/api/erp/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((data: ErpSession | null) => {
          if (!isMounted || !data?.permissions?.length) return;
          setPermissions(data.permissions);
          localStorage.setItem(
            "azla_session",
            JSON.stringify({
              ...readSession(),
              permissions: data.permissions,
            }),
          );
        })
        .catch(() => undefined);
    }

    fetch("/api/erp/company-modules", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((response) => response.json())
      .then((data: { company?: Company }) => {
        if (isMounted && data.company?.moduleStates) {
          setCompany(data.company);
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  const groups: SidebarGroup[] = buildErpSidebar({
    company,
    permissions,
    activeRoute,
  });

  return (
    <aside className="hidden border-r border-indigo-950/8 bg-white px-5 py-6 lg:flex lg:flex-col">
      <div className="flex items-center">
        <AzlaLogo priority />
      </div>

      <CompanySwitcher className="mt-6" companyName={company.name} />

      <nav className="mt-7 grid gap-5">
        {groups.map((group, groupIndex) => (
          <div key={group.label ?? `main-${groupIndex}`}>
            {group.label ? (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {group.label}
              </p>
            ) : null}
            <div className="grid gap-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isProducts = item.route === "/erp/products";

                return (
                  <div key={item.route}>
                    <Link
                      href={item.route}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                        item.active
                          ? "bg-[#f0edff] text-[#5e5bff]"
                          : "text-slate-500 hover:bg-[#fbfcff] hover:text-[#101936]"
                      }`}
                    >
                      <Icon size={18} />
                      <span className="min-w-0 flex-1">{item.label}</span>
                    </Link>
                    {isProducts ? (
                      <div className="ml-7 mt-1 border-l border-indigo-950/10 pl-3">
                        <Link
                          className={`group relative flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition ${
                            activeRoute === "/erp/products/categories"
                              ? "bg-[#f0edff] text-[#5e5bff] shadow-sm shadow-indigo-950/5"
                              : "text-slate-400 hover:bg-[#fbfcff] hover:text-[#5e5bff]"
                          }`}
                          href="/erp/products/categories"
                        >
                          <span className="absolute -left-3 top-1/2 h-px w-3 bg-indigo-950/10" />
                          <span
                            className={`grid size-7 place-items-center rounded-lg ${
                              activeRoute === "/erp/products/categories"
                                ? "bg-white text-[#5e5bff]"
                                : "bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-[#5e5bff]"
                            }`}
                          >
                            <FolderTree size={14} />
                          </span>
                          <span className="min-w-0 flex-1 truncate">კატეგორიები</span>
                        </Link>
                        <Link
                          className={`group relative mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition ${
                            activeRoute === "/erp/discounts"
                              ? "bg-[#f0edff] text-[#5e5bff] shadow-sm shadow-indigo-950/5"
                              : "text-slate-400 hover:bg-[#fbfcff] hover:text-[#5e5bff]"
                          }`}
                          href="/erp/discounts"
                        >
                          <span className="absolute -left-3 top-1/2 h-px w-3 bg-indigo-950/10" />
                          <span
                            className={`grid size-7 place-items-center rounded-lg ${
                              activeRoute === "/erp/discounts"
                                ? "bg-white text-[#5e5bff]"
                                : "bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-[#5e5bff]"
                            }`}
                          >
                            <Percent size={14} />
                          </span>
                          <span className="min-w-0 flex-1 truncate">ფასდაკლებები</span>
                        </Link>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto grid gap-3 pt-6">
        <Link
          href="/erp/modules"
          className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold shadow-lg shadow-[#6857ff]/20 ${
            permissions.includes("company.modules.manage")
              ? "bg-gradient-to-r from-[#5e5bff] to-[#8d55f7] text-white"
              : "pointer-events-none bg-slate-100 text-slate-400 shadow-none"
          }`}
        >
          <Plus size={16} />
          მოდულის დამატება
        </Link>
        <Link
          href="/"
          onClick={() => {
            localStorage.removeItem("azla_access_token");
            localStorage.removeItem("azla_session");
          }}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-indigo-950/8 bg-white px-4 py-3 text-sm font-medium text-slate-500 shadow-sm transition hover:text-[#5e5bff]"
        >
          <LogOut size={16} />
          გასვლა
        </Link>
      </div>
    </aside>
  );
}

function readSession(): ErpSession {
  try {
    return JSON.parse(localStorage.getItem("azla_session") ?? "{}") as ErpSession;
  } catch {
    return {};
  }
}
