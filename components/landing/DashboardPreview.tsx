import { BarChart3, Bell, Box, CreditCard, LayoutDashboard, ShoppingCart, Users } from "lucide-react";

const sidebar = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "გაყიდვები", icon: ShoppingCart },
  { label: "შესყიდვები", icon: CreditCard },
  { label: "საწყობი", icon: Box },
  { label: "ფინანსები", icon: BarChart3 },
  { label: "HR", icon: Users },
];

export function DashboardPreview({ large = false }: { large?: boolean }) {
  return (
    <div className={large ? "relative mx-auto w-full max-w-[1500px]" : "relative w-full"}>
      <div className="overflow-hidden rounded-[28px] border border-indigo-950/8 bg-white text-[#101936] shadow-2xl shadow-[#6857ff]/12">
        <div className="flex h-[440px] min-h-0 sm:h-[500px]">
          <aside className="hidden w-48 shrink-0 border-r border-indigo-950/6 bg-[#fbfbff] p-4 text-[#101936] sm:block">
            <div className="mb-7 flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-[#5e5bff] to-[#d968e8] text-sm font-black text-white">A</span>
              <span className="font-black tracking-[0.14em]">AZLA</span>
            </div>
            <div className="space-y-1">
              {sidebar.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                      index === 0 ? "bg-[#eeeaff] text-[#5e5bff]" : "text-slate-500"
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </aside>
          <section className="min-w-0 flex-1 bg-white p-4 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5e5bff]">Dashboard</p>
                <h3 className="mt-1 text-xl font-black text-[#101936]">ბიზნესის მიმოხილვა</h3>
              </div>
              <div className="grid size-10 place-items-center rounded-xl border border-indigo-950/8 bg-white text-slate-500 shadow-sm">
                <Bell size={17} />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                ["₾125,430", "შემოსავალი", "+18.4%"],
                ["₾32,200", "ხარჯები", "-6.2%"],
                ["1,250", "შეკვეთები", "+12.8%"],
              ].map(([value, label, change]) => (
                <div key={label} className="rounded-2xl border border-indigo-950/8 bg-white p-4 shadow-sm shadow-indigo-950/5">
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-2 text-2xl font-black text-[#101936]">{value}</p>
                  <p className={`mt-2 text-sm font-bold ${change.startsWith("+") ? "text-emerald-600" : "text-rose-500"}`}>
                    {change}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
              <div className="rounded-2xl border border-indigo-950/8 bg-white p-4 shadow-sm shadow-indigo-950/5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-bold">გაყიდვების დინამიკა</p>
                  <span className="rounded-full bg-[#f0edff] px-3 py-1 text-xs font-bold text-[#5e5bff]">2026</span>
                </div>
                <div className="relative h-44 overflow-hidden rounded-xl bg-gradient-to-b from-white to-[#f8f7ff]">
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 520 180" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M0 128 C32 92 58 130 88 96 S145 82 174 116 S231 121 258 76 S315 64 346 88 S404 44 436 65 S488 96 520 54" fill="none" stroke="#6d5cff" strokeWidth="4" strokeLinecap="round" />
                    <path d="M0 128 C32 92 58 130 88 96 S145 82 174 116 S231 121 258 76 S315 64 346 88 S404 44 436 65 S488 96 520 54 V180 H0 Z" fill="url(#chartFill)" opacity="0.24" />
                    <defs>
                      <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                        <stop stopColor="#8b5cf6" />
                        <stop offset="1" stopColor="#ffffff" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div className="mt-4 hidden h-0 items-end gap-2">
                  {[32, 48, 41, 66, 58, 74, 69, 86, 78, 92, 88, 100].map((height, index) => (
                    <div key={index} className="flex flex-1 items-end rounded-full bg-slate-100">
                      <div
                        className="w-full rounded-full bg-gradient-to-t from-violet-600 to-cyan-400"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-indigo-950/8 bg-white p-4 shadow-sm shadow-indigo-950/5">
                <p className="mb-4 font-bold">აქტივობები</p>
                {["ახალი ინვოისი შეიქმნა", "მარაგი განახლდა", "HR მოთხოვნა დამტკიცდა"].map((item) => (
                  <div key={item} className="mb-3 rounded-xl bg-[#f8f9ff] p-3 text-sm text-slate-600">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
      {!large ? (
        <div className="absolute -bottom-8 right-3 w-36 rounded-[24px] border border-indigo-950/10 bg-white p-2 shadow-2xl shadow-[#6857ff]/20 sm:-right-8 sm:w-44">
          <div className="rounded-xl bg-white p-3">
            <p className="text-xs font-bold text-[#5e5bff]">Mobile</p>
            <p className="mt-1 text-lg font-black">₾18.2k</p>
            <div className="mt-3 space-y-2">
              {[72, 48, 84].map((width, index) => (
                <div key={index} className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-gradient-to-r from-[#5e5bff] to-[#d968e8]" style={{ width: `${width}%` }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
