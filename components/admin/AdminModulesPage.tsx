import { moduleCategoryLabels, moduleRegistry } from "@/lib/erp/module-registry";

export function AdminModulesPage() {
  return (
    <section className="mt-8 rounded-[24px] border border-indigo-950/8 bg-white p-5 shadow-sm shadow-indigo-950/5">
      <h2 className="text-xl font-semibold">ERP მოდულების კატალოგი</h2>
      <p className="mt-1 text-sm font-medium text-slate-500">პლატფორმის ცენტრალური module registry</p>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {moduleRegistry.map((module) => {
          const Icon = module.icon;

          return (
            <article key={module.key} className="rounded-2xl border border-indigo-950/8 bg-[#fbfcff] p-4">
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-[#f0edff] text-[#5e5bff]">
                  <Icon size={19} />
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  module.status === "active"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-slate-100 text-slate-500"
                }`}>
                  {module.status === "active" ? "active" : "planned"}
                </span>
              </div>
              <h3 className="mt-4 font-semibold">{module.name}</h3>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{module.description}</p>
              <p className="mt-4 text-xs font-semibold text-[#5e5bff]">{moduleCategoryLabels[module.category]}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
