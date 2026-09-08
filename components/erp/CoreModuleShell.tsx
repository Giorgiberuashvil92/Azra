"use client";

import { ReactNode } from "react";
import { ErpSidebar } from "@/components/erp/ErpSidebar";
import { CompanySwitcher } from "@/components/erp/CompanySwitcher";
import { demoCompany } from "@/lib/erp/company-modules";

export function CoreModuleShell({
  activeRoute,
  actions,
  children,
  eyebrow,
  title,
}: {
  activeRoute: string;
  actions?: ReactNode;
  children: ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <main className="min-h-screen bg-[#f7f8ff] text-[#101936]">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <ErpSidebar activeRoute={activeRoute} initialCompany={demoCompany} />
        <section className="erp-adaptive-density min-w-0 px-4 py-5 sm:px-6 lg:px-8">
          <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5e5bff]">
                {eyebrow}
              </p>
              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{title}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <CompanySwitcher className="min-w-56 bg-white lg:hidden" companyName={demoCompany.name} />
              {actions}
            </div>
          </header>
          {children}
        </section>
      </div>
    </main>
  );
}

export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("azla_access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
