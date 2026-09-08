import { ErpSidebar } from "@/components/erp/ErpSidebar";
import { CompanySwitcher } from "@/components/erp/CompanySwitcher";
import { demoCompany } from "@/lib/erp/company-modules";
import {
  getModuleDefinition,
  moduleRegistry,
  type ModuleKey,
} from "@/lib/erp/module-registry";
import Link from "next/link";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return moduleRegistry.map((module) => ({
    module: module.key,
  }));
}

export default async function ErpModulePage({
  params,
}: PageProps<"/erp/[module]">) {
  const { module: moduleKey } = await params;
  const moduleDefinition = getModuleDefinition(moduleKey as ModuleKey);

  if (!moduleDefinition) {
    notFound();
  }

  const Icon = moduleDefinition.icon;

  return (
    <main className="min-h-screen bg-[#f7f8ff] text-[#101936]">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <ErpSidebar activeRoute={moduleDefinition.route} initialCompany={demoCompany} />
        <section className="min-w-0 px-4 py-5 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-indigo-950/8 bg-white p-6 shadow-sm shadow-indigo-950/5 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <span className="grid size-14 place-items-center rounded-2xl bg-[#f0edff] text-[#5e5bff]">
                  <Icon size={26} />
                </span>
                <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-[#5e5bff]">
                  {moduleDefinition.category}
                </p>
                <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                  {moduleDefinition.name}
                </h1>
                <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-slate-500">
                  {moduleDefinition.description}
                </p>
              </div>
              <div className="grid w-full max-w-xs gap-3 sm:w-auto">
                <CompanySwitcher className="bg-white lg:hidden" companyName={demoCompany.name} />
                <span
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    moduleDefinition.status === "active"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {moduleDefinition.status === "active" ? "Phase 1 მზადაა" : "მომდევნო ფაზა"}
                </span>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                ["კომპანია", "ყველა ჩანაწერი companyId-ით იქნება scoped."],
                ["უფლებები", `${moduleDefinition.key}.view permission აკონტროლებს ხილვადობას.`],
                ["მოდული", "რეალური workflow დაემატება შესაბამის ფაზაში."],
              ].map(([title, text]) => (
                <article key={title} className="rounded-2xl bg-[#fbfcff] p-5">
                  <h2 className="font-bold">{title}</h2>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                    {text}
                  </p>
                </article>
              ))}
            </div>

            <Link
              href="/erp/modules"
              className="mt-8 inline-flex rounded-2xl bg-gradient-to-r from-[#5e5bff] to-[#8d55f7] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#6857ff]/20"
            >
              მოდულების მართვა
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
