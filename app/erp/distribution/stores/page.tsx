import Link from "next/link";
import { ArrowRight, Filter, Megaphone, Search } from "lucide-react";
import { DistributionShell, MiniBadge, PageTitle } from "../_components/distribution-shell";

const stores = [
  { amount: "1,240 ₾", city: "თბილისი, ვაკე", last: "2 დღის წინ", name: "მინი მარკეტი N12", orders: "12", status: "აქტიური კლიენტი", type: "Mini Market" },
  { amount: "860 ₾", city: "თბილისი, საბურთალო", last: "დღეს", name: "Express Shop", orders: "8", status: "ახალი", type: "Convenience" },
  { amount: "2,430 ₾", city: "ქუთაისი", last: "5 დღის წინ", name: "Market Plus", orders: "18", status: "აქტიური კლიენტი", type: "Mini Market" },
  { amount: "0 ₾", city: "თბილისი, გლდანი", last: "30+ დღე", name: "Corner Store", orders: "0", status: "არააქტიური", type: "Kiosk" },
];

export default function DistributionStoresPage() {
  return (
    <DistributionShell active="stores">
      <div className="grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] gap-4">
        <PageTitle title="მაღაზიები" subtitle="AZLA ქსელში არსებული მაღაზიების აღმოჩენა და კლიენტების მართვა" action={<button className="inline-flex h-10 items-center gap-2 rounded-[12px] bg-[#2563EB] px-4 text-[12px] font-semibold text-white" type="button"><Megaphone size={16} />შეთავაზების გაგზავნა</button>} />
        <div className="rounded-[18px] border border-[#E9E6EE] bg-white p-3">
          <div className="flex gap-6 border-b border-[#E9E6EE] px-1">
            {["ყველა", "ჩემი კლიენტები", "ახალი", "აქტიური", "არააქტიური"].map((tab, index) => <button className={index === 0 ? "relative h-9 text-[12px] font-semibold text-[#2563EB] after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:bg-[#2563EB]" : "h-9 text-[12px] font-medium text-[#817B8D]"} key={tab} type="button">{tab}</button>)}
          </div>
          <div className="mt-3 grid gap-2 xl:grid-cols-[minmax(0,1fr)_repeat(6,130px)]">
            <label className="flex h-10 items-center gap-2 rounded-[11px] border border-[#E9E6EE] px-3 text-[12px] text-[#817B8D]"><Search size={16} /><input className="min-w-0 flex-1 outline-none" placeholder="მაღაზიის ძებნა" /></label>
            {["Region", "City", "District", "Store type", "Activity", "Status"].map((filter) => <button className="inline-flex h-10 items-center justify-between rounded-[11px] border border-[#E9E6EE] px-3 text-[12px] font-medium text-[#5F5870]" key={filter} type="button">{filter}<Filter size={14} /></button>)}
          </div>
        </div>
        <section className="min-h-0 overflow-auto rounded-[18px] border border-[#E9E6EE] bg-white shadow-[0_8px_24px_rgba(24,21,31,0.04)]">
          <table className="w-full table-fixed text-left text-[12px]">
            <thead className="bg-[#FBFCFF] text-[11px] font-medium text-[#817B8D]">
              <tr><th className="w-10 px-4 py-3"><input type="checkbox" /></th><th>მაღაზია</th><th>ტიპი</th><th>ურთიერთობა</th><th>ბოლო შეკვეთა</th><th className="text-right">30 დღე</th><th className="text-right">შესყიდვა</th><th className="px-4 text-right">პროფილი</th></tr>
            </thead>
            <tbody>
              {stores.map((store) => <tr className="border-t border-[#EEF0F4]" key={store.name}><td className="px-4 py-3"><input type="checkbox" /></td><td className="py-3"><p className="font-semibold text-[#18151F]">{store.name}</p><p className="text-[11px] font-medium text-[#817B8D]">{store.city}</p></td><td>{store.type}</td><td><MiniBadge tone={store.status === "არააქტიური" ? "gray" : store.status === "ახალი" ? "blue" : "green"}>{store.status}</MiniBadge></td><td>{store.last}</td><td className="text-right font-semibold">{store.orders}</td><td className="text-right font-semibold">{store.amount}</td><td className="px-4 text-right"><Link className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#1D4ED8]" href="/erp/distribution/stores/S-012">პროფილი <ArrowRight size={13} /></Link></td></tr>)}
            </tbody>
          </table>
        </section>
      </div>
    </DistributionShell>
  );
}
