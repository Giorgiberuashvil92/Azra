import { Sparkles } from "lucide-react";
import { DistributionShell, MiniBadge, PageTitle } from "../_components/distribution-shell";

const opportunities = [
  ["მაღალი მოთხოვნა", "Coca-Cola 0.5L", "83 stores potentially require restocking", "3,240 units", "Vake 22 · Saburtalo 31 · Gldani 18 · Other 12", "შეთავაზების შექმნა"],
  ["Demand +18%", "Red Bull 250ml", "126 relevant stores", "Energy drinks segment", "თბილისი და რეგიონები", "კამპანიის შექმნა"],
  ["Water category", "Borjomi / Water bundle", "214 stores may require restocking soon", "2,800 units", "High summer demand", "შეთავაზების შექმნა"],
];

export default function MarketOpportunitiesPage() {
  return (
    <DistributionShell active="opportunities">
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4">
        <PageTitle title="შესაძლებლობები" subtitle="Privacy-safe aggregated POS/inventory demand signals AZLA ქსელიდან" />
        <main className="grid min-h-0 content-start gap-4 overflow-auto xl:grid-cols-3">
          {opportunities.map((item) => <section className="rounded-[20px] border border-[#DBEAFE] bg-white p-5 shadow-[0_8px_24px_rgba(24,21,31,0.04)]" key={item[1]}><span className="grid size-11 place-items-center rounded-[14px] bg-[#EFF6FF] text-[#2563EB]"><Sparkles size={20} /></span><MiniBadge tone="blue">{item[0]}</MiniBadge><h2 className="mt-4 text-[18px] font-semibold">{item[1]}</h2><p className="mt-2 text-[13px] font-medium text-[#5F5870]">{item[2]}</p><p className="mt-4 text-[25px] font-semibold text-[#18151F]">{item[3]}</p><p className="mt-2 text-[12px] font-medium text-[#817B8D]">{item[4]}</p><button className="mt-5 h-10 rounded-[12px] bg-[#2563EB] px-4 text-[12px] font-semibold text-white" type="button">{item[5]}</button></section>)}
        </main>
      </div>
    </DistributionShell>
  );
}
