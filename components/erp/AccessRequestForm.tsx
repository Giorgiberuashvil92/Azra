"use client";

import { useState } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { moduleRegistry } from "@/lib/erp/module-registry";

const employeeCounts = ["1-10", "11-50", "51-200", "201-500", "500+"];

export function AccessRequestForm() {
  const [selectedModules, setSelectedModules] = useState<string[]>([
    "products",
    "warehouses",
    "inventory",
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      companyName: formData.get("companyName"),
      legalName: formData.get("legalName"),
      taxId: formData.get("taxId"),
      industry: formData.get("industry"),
      employeeCount: formData.get("employeeCount"),
      contactName: formData.get("contactName"),
      contactEmail: formData.get("contactEmail"),
      contactPhone: formData.get("contactPhone"),
      note: formData.get("note"),
      selectedModules,
    };

    try {
      const response = await fetch("/api/erp/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("მოთხოვნის გაგზავნა ვერ მოხერხდა.");
      }

      setIsSent(true);
      event.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "მოთხოვნის გაგზავნა ვერ მოხერხდა.");
    } finally {
      setIsLoading(false);
    }
  }

  function toggleModule(moduleKey: string) {
    setSelectedModules((current) =>
      current.includes(moduleKey)
        ? current.filter((key) => key !== moduleKey)
        : [...current, moduleKey],
    );
  }

  if (isSent) {
    return (
      <section className="rounded-[28px] border border-emerald-100 bg-white p-8 shadow-2xl shadow-[#6857ff]/12">
        <span className="grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={26} />
        </span>
        <h1 className="mt-6 text-3xl font-semibold">მოთხოვნა მიღებულია</h1>
        <p className="mt-3 max-w-xl text-base font-medium leading-7 text-slate-500">
          ჩვენი გუნდი გადაამოწმებს მონაცემებს და დაგიკავშირდება ERP გარემოს მოსამზადებლად.
        </p>
      </section>
    );
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <section className="rounded-[28px] border border-indigo-950/8 bg-white p-6 shadow-xl shadow-[#6857ff]/10 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-[#f0edff] text-[#5e5bff]">
            <Building2 size={22} />
          </span>
          <div>
            <h2 className="text-2xl font-semibold">კომპანიის მონაცემები</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">ძირითადი იურიდიული და საოპერაციო ინფორმაცია</p>
          </div>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2">
          <Field icon={<Building2 size={18} />} label="კომპანიის დასახელება" name="companyName" placeholder="მაგ. შპს ჩემი კომპანია" required />
          <Field label="საიდენტიფიკაციო კოდი" name="taxId" placeholder="მაგ. 405000000" />
          <Field label="იურიდიული დასახელება" name="legalName" placeholder="სრული დასახელება" />
          <Field label="ინდუსტრია" name="industry" placeholder="ვაჭრობა, წარმოება, სერვისი..." />
          <label className="grid gap-2 text-sm font-medium text-slate-600">
            თანამშრომლების რაოდენობა
            <select
              className="rounded-2xl border border-indigo-950/8 bg-[#fbfcff] px-4 py-3 text-[#101936] outline-none"
              name="employeeCount"
              defaultValue="11-50"
            >
              {employeeCounts.map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-[28px] border border-indigo-950/8 bg-white p-6 shadow-xl shadow-[#6857ff]/10 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-[#fff1f8] text-[#d455b8]">
            <User size={22} />
          </span>
          <div>
            <h2 className="text-2xl font-semibold">საკონტაქტო პირი</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">ვის დავუკავშირდეთ წვდომის გასახსნელად</p>
          </div>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-3">
          <Field icon={<User size={18} />} label="სახელი და გვარი" name="contactName" placeholder="გიორგი ბერაშვილი" required />
          <Field icon={<Mail size={18} />} label="ელფოსტა" name="contactEmail" placeholder="name@company.ge" required type="email" />
          <Field icon={<Phone size={18} />} label="ტელეფონი" name="contactPhone" placeholder="+995 ..." />
        </div>
      </section>

      <section className="rounded-[28px] border border-indigo-950/8 bg-white p-6 shadow-xl shadow-[#6857ff]/10 sm:p-8">
        <h2 className="text-2xl font-semibold">საწყისი მოდულები</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {moduleRegistry.slice(0, 12).map((module) => {
            const Icon = module.icon;
            const isSelected = selectedModules.includes(module.key);

            return (
              <button
                key={module.key}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                  isSelected
                    ? "border-[#6d5cff]/30 bg-[#f4f1ff] text-[#5e5bff]"
                    : "border-indigo-950/8 bg-[#fbfcff] text-slate-600 hover:bg-white"
                }`}
                onClick={() => toggleModule(module.key)}
                type="button"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-white shadow-sm">
                  <Icon size={18} />
                </span>
                <span className="text-sm font-semibold">{module.name}</span>
              </button>
            );
          })}
        </div>

        <label className="mt-5 grid gap-2 text-sm font-medium text-slate-600">
          დამატებითი კომენტარი
          <textarea
            className="min-h-28 rounded-2xl border border-indigo-950/8 bg-[#fbfcff] px-4 py-3 text-[#101936] outline-none placeholder:text-slate-400"
            name="note"
            placeholder="რა პროცესები გინდათ პირველ ეტაპზე გადავიტანოთ AZLA-ში?"
          />
        </label>

        {error ? <p className="mt-4 text-sm font-medium text-rose-600">{error}</p> : null}

        <button
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#5e5bff] to-[#8d55f7] px-5 py-4 font-semibold text-white shadow-xl shadow-[#6857ff]/20 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? "იგზავნება..." : "წვდომის მოთხოვნა"}
          <ArrowRight size={18} />
        </button>
      </section>
    </form>
  );
}

function Field({
  icon,
  label,
  name,
  placeholder,
  required,
  type = "text",
}: {
  icon?: React.ReactNode;
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-600">
      {label}
      <span className="flex items-center gap-3 rounded-2xl border border-indigo-950/8 bg-[#fbfcff] px-4 py-3">
        {icon ? <span className="text-slate-400">{icon}</span> : null}
        <input
          className="w-full bg-transparent text-[#101936] outline-none placeholder:text-slate-400"
          name={name}
          placeholder={placeholder}
          required={required}
          type={type}
        />
      </span>
    </label>
  );
}
