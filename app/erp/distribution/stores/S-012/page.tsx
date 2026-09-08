import Link from "next/link";
import { ArrowLeft, Megaphone, MapPin, Phone, Store } from "lucide-react";
import { DistributionShell, MiniBadge, PageTitle } from "../../_components/distribution-shell";

export default function StoreProfilePage() {
  return (
    <DistributionShell active="stores">
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4">
        <PageTitle title="მინი მარკეტი N12" subtitle="თბილისი, ვაკე · Mini Market · აქტიური კლიენტი" action={<div className="flex gap-2"><Link className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-[#E9E6EE] bg-white px-4 text-[12px] font-semibold text-[#18151F]" href="/erp/distribution/stores"><ArrowLeft size={15} />უკან</Link><button className="inline-flex h-10 items-center gap-2 rounded-[12px] bg-[#2563EB] px-4 text-[12px] font-semibold text-white" type="button"><Megaphone size={16} />შეთავაზების გაგზავნა</button></div>} />
        <main className="grid min-h-0 gap-4 overflow-auto xl:grid-cols-[330px_minmax(0,1fr)]">
          <aside className="grid content-start gap-4">
            <section className="rounded-[18px] border border-[#E9E6EE] bg-white p-4">
              <span className="grid size-12 place-items-center rounded-[14px] bg-[#EFF6FF] text-[#2563EB]"><Store size={22} /></span>
              <h2 className="mt-4 text-[16px] font-semibold">Store information</h2>
              <div className="mt-3 grid gap-3 text-[12px] font-medium text-[#5F5870]">
                <p className="flex items-center gap-2"><MapPin size={15} />თბილისი, ვაკე, აბაშიძის 42</p>
                <p className="flex items-center gap-2"><Phone size={15} />+995 599 12 34 56</p>
                <MiniBadge tone="green">აქტიური კლიენტი</MiniBadge>
              </div>
            </section>
            <section className="rounded-[18px] border border-[#DBEAFE] bg-[#EFF6FF] p-4">
              <h2 className="text-[15px] font-semibold">Privacy note</h2>
              <p className="mt-2 text-[12px] font-medium leading-5 text-[#5F5870]">აქ ჩანს მხოლოდ თქვენგან შეკვეთები და შეთავაზებები. კონკურენტების გაყიდვები არ ჩანს.</p>
            </section>
          </aside>
          <section className="grid content-start gap-4">
            <div className="grid gap-3 md:grid-cols-4">
              {[["ჩვენგან შესყიდვები", "1,240 ₾"], ["შეკვეთები", "12"], ["საშუალო შეკვეთა", "103 ₾"], ["ბოლო შეკვეთა", "2 დღის წინ"]].map(([label, value]) => <div className="rounded-[18px] border border-[#E9E6EE] bg-white p-4" key={label}><p className="text-[11px] font-medium text-[#817B8D]">{label}</p><p className="mt-1 text-[21px] font-semibold">{value}</p></div>)}
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <InfoCard title="ბოლო შეკვეთები" items={["#ORD-4286 · 12 პროდუქტი · 320 ₾", "#ORD-4212 · 8 პროდუქტი · 214 ₾", "#ORD-4174 · 18 პროდუქტი · 706 ₾"]} />
              <InfoCard title="ხშირად ყიდულობს" items={["Coca-Cola 0.5L", "Borjomi 1.5L", "Lay’s 90g", "Red Bull 250ml"]} />
              <InfoCard title="აქტიური შეთავაზებები" items={["Coca-Cola 48+ → 1.12 ₾", "Energy Drinks -10%", "Water category bundle"]} />
              <InfoCard title="შესაძლებლობები" items={["ამ მაღაზიას თქვენგან Coca-Cola 0.5L ბოლო 21 დღეა არ შეუკვეთავს.", "სასმელების კატეგორია აქტიურია ამ სეგმენტში."]} />
            </div>
          </section>
        </main>
      </div>
    </DistributionShell>
  );
}

function InfoCard({ items, title }: { items: string[]; title: string }) {
  return <section className="rounded-[18px] border border-[#E9E6EE] bg-white p-4"><h2 className="text-[15px] font-semibold">{title}</h2><div className="mt-3 grid gap-2">{items.map((item) => <p className="rounded-[12px] bg-[#F7F8FC] px-3 py-2 text-[12px] font-medium text-[#3D3748]" key={item}>{item}</p>)}</div></section>;
}
