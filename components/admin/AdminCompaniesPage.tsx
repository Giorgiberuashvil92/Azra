"use client";

import { useEffect, useState } from "react";
import { Settings2 } from "lucide-react";
import { type Company } from "./admin-types";

export function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadCompanies() {
    fetch("/api/azla-admin/companies")
      .then((response) => response.json())
      .then((data) => setCompanies(Array.isArray(data) ? data : []))
      .catch(() => setCompanies([]));
  }

  useEffect(() => {
    void loadCompanies();
  }, []);

  async function updateCompanyModule(companyId: string, moduleKey: string, enabled: boolean) {
    setMessage("");
    setError("");

    const response = await fetch(`/api/azla-admin/companies/${companyId}/modules/${moduleKey}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.message ?? "მოდულის განახლება ვერ მოხერხდა.");
      return;
    }

    setMessage(enabled ? "მოდული ჩაირთო." : "მოდული გამოირთო.");
    await loadCompanies();
  }

  return (
    <section className="mt-8 rounded-[24px] border border-indigo-950/8 bg-white p-5 shadow-sm shadow-indigo-950/5">
      <h2 className="text-xl font-semibold">კომპანიები</h2>
      <p className="mt-1 text-sm font-medium text-slate-500">ყველა tenant / ERP workspace</p>
      {message ? <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{message}</div> : null}
      {error ? <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div> : null}

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {companies.map((company) => (
          <article key={company.id} className="rounded-2xl border border-indigo-950/8 bg-[#fbfcff] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{company.name}</h3>
                <p className="mt-1 text-xs font-medium text-slate-400">{company.taxId ?? "კოდი არ არის მითითებული"}</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                {company.status}
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm font-medium text-slate-500">
              <span>{company.users.length} მომხმარებელი</span>
              <span>{company.modules.filter((module) => module.status === "enabled").length} მოდული</span>
            </div>
            <button
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-indigo-950/8 bg-white px-4 py-3 text-sm font-bold text-slate-600"
              onClick={() => setEditingCompanyId((current) => (current === company.id ? null : company.id))}
              type="button"
            >
              <Settings2 size={16} />
              მოდულების მართვა
            </button>
            {editingCompanyId === company.id ? (
              <div className="mt-4 grid gap-2 rounded-2xl bg-white p-3">
                <ModuleToggle company={company} label="ინტეგრაციები" moduleKey="integrations" onChange={updateCompanyModule} />
                <ModuleToggle company={company} label="პროდუქტები" moduleKey="products" onChange={updateCompanyModule} />
                <ModuleToggle company={company} label="საწყობები" moduleKey="warehouses" onChange={updateCompanyModule} />
                <ModuleToggle company={company} label="ინვენტარი" moduleKey="inventory" onChange={updateCompanyModule} />
                <ModuleToggle company={company} label="შესყიდვები" moduleKey="purchases" onChange={updateCompanyModule} />
                <ModuleToggle company={company} label="ფასდაკლებები" moduleKey="discounts" onChange={updateCompanyModule} />
              </div>
            ) : null}
          </article>
        ))}
        {companies.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-indigo-950/12 bg-[#fbfcff] p-8 text-center text-sm font-medium text-slate-400 md:col-span-2 xl:col-span-3">
            კომპანიები ჯერ არ არის
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ModuleToggle({
  company,
  label,
  moduleKey,
  onChange,
}: {
  company: Company;
  label: string;
  moduleKey: string;
  onChange: (companyId: string, moduleKey: string, enabled: boolean) => Promise<void>;
}) {
  const enabled = company.modules.some((module) => module.module.key === moduleKey && module.status === "enabled");

  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl border border-indigo-950/8 px-3 py-2 text-sm font-semibold text-slate-600">
      <span>{label}</span>
      <input
        checked={enabled}
        className="size-5 accent-[#5e5bff]"
        onChange={(event) => void onChange(company.id, moduleKey, event.target.checked)}
        type="checkbox"
      />
    </label>
  );
}
