import { ArrowDown, Building2, LayoutGrid, MonitorCheck } from "lucide-react";

const chips = ["Sales", "Inventory", "Finance", "HR", "CRM", "Projects"];

export function ModularPlatform() {
  return (
    <section className="bg-[#f8f9ff] py-20 sm:py-28">
      <div className="mx-auto grid w-full max-w-[1800px] gap-12 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:px-12 2xl:px-16">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#5e5bff]">Modular ERP</p>
          <h2 className="mt-3 text-4xl font-black tracking-normal text-[#101936] sm:text-5xl">ერთი სისტემა. შენი ბიზნესის წესებით.</h2>
          <p className="mt-5 text-lg font-medium leading-8 text-slate-600">
            AZLA გაძლევს მოქნილ სამუშაო სივრცეს, სადაც კომპანია ირჩევს მხოლოდ საჭირო მოდულებს და ზრდასთან ერთად ამატებს ახალ შესაძლებლობებს.
          </p>
        </div>
        <div className="rounded-[24px] border border-indigo-950/8 bg-white p-6 shadow-xl shadow-indigo-950/6 sm:p-8">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              ["კომპანია", Building2],
              ["მოდულების არჩევა", LayoutGrid],
              ["შენი Workspace", MonitorCheck],
            ].map(([label, Icon], index) => (
              <div key={label as string} className="relative rounded-2xl border border-indigo-950/8 bg-[#fbfcff] p-5 text-center">
                <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#f0edff] text-[#5e5bff]">
                  <Icon size={22} />
                </div>
                <p className="mt-4 font-black">{label as string}</p>
                {index < 2 ? <ArrowDown className="mx-auto mt-4 text-slate-300 md:hidden" /> : null}
              </div>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            {chips.map((chip) => (
              <span key={chip} className="rounded-full border border-[#6d5cff]/12 bg-[#f7f5ff] px-4 py-2 text-sm font-bold text-slate-700">
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
