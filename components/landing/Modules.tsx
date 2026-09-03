import { BarChart3, Box, Link2, Plus, ShieldCheck, ShoppingCart, Users, FolderKanban } from "lucide-react";

const modules = [
  { title: "გაყიდვები", description: "შეკვეთები, მომხმარებლები, ინვოისები და გაყიდვების ანალიტიკა.", icon: ShoppingCart, accent: "text-violet-600 bg-violet-50" },
  { title: "საწყობი", description: "მარაგების კონტროლი, საწყობები და ნაშთები რეალურ დროში.", icon: Box, accent: "text-emerald-600 bg-emerald-50" },
  { title: "ფინანსები", description: "ხარჯები, შემოსავლები, გადახდები და ფინანსური ანალიტიკა.", icon: BarChart3, accent: "text-blue-600 bg-blue-50" },
  { title: "HR და ხელფასები", description: "თანამშრომლები, დასწრება, ხელფასები და ბონუსები.", icon: Users, accent: "text-orange-600 bg-orange-50" },
  { title: "პროექტები", description: "დავალებები, ვადები და პროექტების მართვა.", icon: FolderKanban, accent: "text-violet-600 bg-violet-50" },
  { title: "ინტეგრაციები", description: "RS.ge, ბანკები, გადახდები და სხვა სერვისები.", icon: Link2, accent: "text-cyan-600 bg-cyan-50" },
  { title: "უსაფრთხოება", description: "მომხმარებლების წვდომები, როლები და აუდიტის ისტორია.", icon: ShieldCheck, accent: "text-amber-600 bg-amber-50" },
  { title: "მეტი მოდულები", description: "მომავალში დამატებითი მოდულები და AI შესაძლებლობები.", icon: Plus, accent: "text-pink-600 bg-pink-50" },
];

export function Modules() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto w-full max-w-[1800px] px-5 sm:px-8 lg:px-12 2xl:px-16">
        <p className="text-center text-sm font-black uppercase tracking-[0.18em] text-[#5e5bff]">შესაძლებლობები</p>
        <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="mx-auto text-center">
            <h2 className="text-4xl font-black tracking-normal text-[#101936] sm:text-5xl">აირჩიე ის, რაც გჭირდება</h2>
            <p className="mt-4 max-w-2xl text-lg font-medium leading-8 text-slate-600">ჩართე მხოლოდ ის მოდულები, რომლებიც შენს ბიზნესს სჭირდება.</p>
          </div>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <article key={module.title} className="group rounded-2xl border border-indigo-950/8 bg-white p-6 shadow-sm shadow-indigo-950/5 transition hover:-translate-y-1 hover:border-[#8b7dff]/30 hover:shadow-xl hover:shadow-[#6857ff]/10">
                <div className={`grid size-12 place-items-center rounded-2xl ${module.accent}`}>
                  <Icon size={22} />
                </div>
                <h3 className="mt-5 text-xl font-black text-[#101936]">{module.title}</h3>
                <p className="mt-3 min-h-20 leading-7 text-slate-600">{module.description}</p>
                <a href="#" className="mt-5 inline-block font-bold text-[#5e5bff]">გაიგე მეტი →</a>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
