import Link from "next/link";
import { ArrowRight, BarChart3, CalendarDays, ChevronDown, Package, Plus, ReceiptText, Store, Tags, TrendingUp, UsersRound } from "lucide-react";
import { DistributionShell, MiniBadge } from "./_components/distribution-shell";

const kpis = [
  { change: "+12%", icon: ReceiptText, label: "დღის შეკვეთები", sub: "გუშინ: 166", value: "186" },
  { change: "+18%", icon: BarChart3, label: "გაყიდვები", sub: "გუშინ: 41,120 ₾", value: "48,520 ₾" },
  { change: "+6%", icon: Store, label: "აქტიური მაღაზიები", sub: "სულ: 1,024", value: "324" },
  { change: "+100%", icon: UsersRound, label: "ახალი მაღაზიები", sub: "ბოლო 7 დღე", value: "+12" },
  { change: "+33%", icon: Tags, label: "აქტიური შეთავაზებები", sub: "სულ: 21", value: "8" },
  { change: "+2.1%", icon: TrendingUp, label: "შეკვეთების კონვერსია", sub: "offer → order", value: "11.4%" },
];

const bars = [6, 12, 18, 22, 28, 16, 20, 31, 42, 50, 68, 58, 74, 49, 62, 75, 24, 42, 56, 38, 30, 22, 18, 12];
const orders = [
  ["#ORD-4286", "მინი მარკეტი N12", "12 პროდუქტი", "320 ₾", "დადასტურებულია", "09 Sep"],
  ["#ORD-4285", "ვაკე მარკეტი", "38 პროდუქტი", "1,240 ₾", "მზადდება", "09 Sep"],
  ["#ORD-4284", "საბურთალო Express", "18 პროდუქტი", "680 ₾", "გზაში", "10 Sep"],
  ["#ORD-4283", "გლდანი Shop", "9 პროდუქტი", "214 ₾", "ახალი", "10 Sep"],
  ["#ORD-4282", "ისანი მარკეტი", "24 პროდუქტი", "780 ₾", "მიწოდებულია", "08 Sep"],
];
const offers = [
  ["🥤", "Coca-Cola 0.5L", "-12%", "420", "315", "48"],
  ["🥫", "Red Bull 250ml", "-10%", "380", "248", "36"],
  ["🍟", "Lay’s 90g", "1+1", "260", "188", "31"],
  ["🍾", "Borjomi 1.5L", "-8%", "512", "320", "41"],
  ["🍫", "Snickers 50g", "-15%", "320", "210", "25"],
];
const opportunities = [
  ["🥤", "Coca-Cola 0.5L", "83 მაღაზიას შესაძლოა შეევსოს", "სავარაუდო მოთხოვნა: 3,240 ცალი", "მაღალი მოთხოვნა"],
  ["🥫", "Red Bull 250ml", "126 შესაბამისი მაღაზია", "სავარაუდო მოთხოვნა: 1,840 ცალი", "მოთხოვნა +18%"],
  ["💧", "Water category", "214 მაღაზია", "სავარაუდო მოთხოვნა: 6,320 ცალი", "წყლის მარაგი იკლებს"],
];
const newStores = ["ვარკეთილი მარკეტი", "ნუცუბიძის მინი მარკეტი", "მეტრო Shop", "ლილო მარკეტი"];
const notes = ["ახალი შეკვეთა — 320 ₾", "შეთავაზებიდან 10 ახალი შეკვეთა", "Coca-Cola 0.5L-ზე მოთხოვნა გაიზარდა", "მინი მარკეტი N12-ს 30 დღეა შეკვეთა არ გაუკეთებია"];

export default function DistributionDashboardPage() {
  return (
    <DistributionShell active="dashboard">
      <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_360px] grid-rows-[auto_auto_minmax(0,1fr)] gap-4 overflow-hidden">
        <header className="col-span-2 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-semibold leading-9 text-[#111735]">კარგი დღეა, დავით!</h1>
            <p className="mt-1 text-[13px] font-medium text-[#63718A]">აი როგორ ვითარდება თქვენი ბიზნესი AZLA-ში</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="inline-flex h-11 items-center gap-2 rounded-[12px] border border-[#E1E6F0] bg-white px-4 text-[13px] font-semibold text-[#111735]" type="button">
              <CalendarDays size={17} className="text-[#52627A]" />
              01 - 08 სექტემბერი, 2026
              <ChevronDown size={15} />
            </button>
            <Link className="inline-flex h-11 items-center gap-2 rounded-[12px] bg-[#2563EB] px-5 text-[13px] font-semibold text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)]" href="/erp/distribution/offers/new">
              <Plus size={17} />
              ახალი შეთავაზება
            </Link>
          </div>
        </header>

        <div className="col-span-2 grid gap-3 xl:grid-cols-6">
          {kpis.map((item) => <Kpi key={item.label} {...item} />)}
        </div>

        <main className="grid min-h-0 gap-4 overflow-y-auto pr-1">
          <div className="grid gap-4 xl:grid-cols-[1.25fr_0.9fr]">
            <Card title="გაყიდვები დღის განმავლობაში" action="7 დღე">
              <BarChart />
            </Card>
            <Card title="გაყიდვები კატეგორიებით" action="დღე">
              <Donut />
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.25fr_0.9fr]">
            <OrdersTable />
            <OffersTable />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.25fr_0.9fr]">
            <InventoryStatus />
            <SeasonCard />
          </div>
        </main>

        <aside className="grid min-h-0 content-start gap-4 overflow-y-auto">
          <OpportunitiesCard />
          <NewStoresCard />
          <NotificationsCard />
        </aside>
      </div>
    </DistributionShell>
  );
}

function Kpi({ change, icon: Icon, label, sub, value }: { change: string; icon: typeof ReceiptText; label: string; sub: string; value: string }) {
  return (
    <article className="rounded-[18px] border border-[#E1E6F0] bg-white p-4 shadow-[0_8px_24px_rgba(23,35,70,0.05)]">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-[13px] bg-[#EFF6FF] text-[#2563EB]"><Icon size={21} strokeWidth={1.8} /></span>
        <div className="min-w-0">
          <p className="truncate text-[12px] font-medium text-[#63718A]">{label}</p>
          <div className="mt-1 flex items-center gap-2">
            <strong className="text-[22px] leading-7 text-[#111735]">{value}</strong>
            <span className="rounded-full bg-[#DFF8EC] px-2 py-0.5 text-[10px] font-semibold text-[#0B9B68]">▲ {change}</span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-[#63718A]">{sub}</p>
        </div>
      </div>
    </article>
  );
}

function Card({ action, children, title }: { action?: string; children: React.ReactNode; title: string }) {
  return (
    <section className="rounded-[18px] border border-[#E1E6F0] bg-white p-4 shadow-[0_8px_24px_rgba(23,35,70,0.05)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-[#111735]">{title}</h2>
        {action ? <button className="inline-flex h-8 items-center gap-2 rounded-[10px] border border-[#E1E6F0] px-3 text-[12px] font-semibold text-[#334B7A]" type="button">{action}<ChevronDown size={14} /></button> : null}
      </div>
      {children}
    </section>
  );
}

function BarChart() {
  return (
    <div className="h-[214px]">
      <div className="flex h-[180px] items-end gap-2 border-b border-l border-[#E7ECF5] px-4">
        {bars.map((value, index) => <div className="flex flex-1 items-end gap-0.5" key={`${value}-${index}`}><span className="w-2 rounded-t-full bg-[#CFE1FF]" style={{ height: `${Math.max(20, value * 1.8)}px` }} /><span className="w-2 rounded-t-full bg-[#2563EB]" style={{ height: `${Math.max(18, value * 2.15)}px` }} /></div>)}
      </div>
      <div className="mt-2 grid grid-cols-6 text-[11px] font-medium text-[#63718A]">{["00:00", "03:00", "06:00", "09:00", "12:00", "18:00"].map((hour) => <span key={hour}>{hour}</span>)}</div>
    </div>
  );
}

function Donut() {
  const rows = [["სასმელები", "32%", "#2563EB"], ["სნექები", "18%", "#668BF6"], ["ტკბილეული", "14%", "#F6B74A"], ["სიგარეტი", "12%", "#FF5656"], ["სეზონური", "10%", "#43C6A3"], ["სხვა", "14%", "#31B6B0"]];
  return (
    <div className="grid h-[214px] grid-cols-[170px_minmax(0,1fr)] items-center gap-5">
      <div className="grid size-[170px] place-items-center rounded-full" style={{ background: "conic-gradient(#2563EB 0 32%, #668BF6 32% 50%, #F6B74A 50% 64%, #FF5656 64% 76%, #43C6A3 76% 86%, #31B6B0 86% 100%)" }}>
        <div className="grid size-[102px] place-items-center rounded-full bg-white text-center"><div><p className="text-[23px] font-semibold">48,520 ₾</p><p className="text-[12px] text-[#63718A]">გაყიდვები</p></div></div>
      </div>
      <div className="grid gap-3">{rows.map(([label, value, color]) => <div className="flex items-center justify-between text-[13px]" key={label}><span className="inline-flex items-center gap-2 text-[#63718A]"><span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />{label}</span><strong>{value}</strong></div>)}</div>
    </div>
  );
}

function OrdersTable() {
  return (
    <Card title="ბოლო შეკვეთები">
      <table className="w-full table-fixed text-left text-[12px]"><thead className="text-[11px] text-[#63718A]"><tr><th className="pb-3">#</th><th>მაღაზია</th><th>პროდუქტები</th><th className="text-right">თანხა</th><th>სტატუსი</th><th>მიწოდება</th></tr></thead><tbody>{orders.map((row) => <tr className="border-t border-[#EEF2F7]" key={row[0]}><td className="py-3 font-medium text-[#334B7A]">{row[0]}</td><td className="truncate font-semibold">{row[1]}</td><td>{row[2]}</td><td className="text-right font-semibold">{row[3]}</td><td><MiniBadge tone={row[4] === "ახალი" ? "amber" : row[4] === "გზაში" ? "blue" : "green"}>{row[4]}</MiniBadge></td><td>{row[5]}</td></tr>)}</tbody></table>
    </Card>
  );
}

function OffersTable() {
  return (
    <Card title="აქტიური შეთავაზებები">
      <table className="w-full table-fixed text-left text-[12px]"><thead className="text-[11px] text-[#63718A]"><tr><th className="pb-3">პროდუქტი</th><th>ფასდაკლება</th><th className="text-right">გაეგზავნა</th><th className="text-right">ნახა</th><th className="text-right">შეკვეთა</th></tr></thead><tbody>{offers.map((row) => <tr className="border-t border-[#EEF2F7]" key={row[1]}><td className="py-3"><span className="mr-2">{row[0]}</span><span className="font-semibold">{row[1]}</span></td><td><MiniBadge tone="red">{row[2]}</MiniBadge></td><td className="text-right">{row[3]}</td><td className="text-right">{row[4]}</td><td className="text-right font-semibold">{row[5]}</td></tr>)}</tbody></table>
    </Card>
  );
}

function InventoryStatus() {
  return (
    <Card title="მაღაზიების სტატუსი">
      <div className="h-5 overflow-hidden rounded-full bg-[#E8EDF5]"><div className="flex h-full"><span className="bg-[#24C58B]" style={{ width: "58%" }} /><span className="bg-[#2563EB]" style={{ width: "22%" }} /><span className="bg-[#F59E0B]" style={{ width: "12%" }} /><span className="bg-[#F04438]" style={{ width: "6%" }} /><span className="bg-[#B8BECC]" style={{ width: "2%" }} /></div></div>
      <div className="mt-4 grid grid-cols-5 gap-4">{[["672", "აქტიური კლიენტი"], ["214", "პოტენციური"], ["83", "არაქტიური"], ["41", "30+ დღე შეკვეთის გარეშე"], ["14", "არამიზნობრივი"]].map(([value, label]) => <div key={label}><p className="text-[22px] font-semibold">{value}</p><p className="text-[12px] font-medium text-[#63718A]">{label}</p></div>)}</div>
    </Card>
  );
}

function SeasonCard() {
  return <Card title="ამ კვირის შედეგები"><div className="grid grid-cols-2 gap-4"><Metric icon={<Package size={22} />} label="შეკვეთილი პროდუქტები" value="2,184" /><Metric icon={<TrendingUp size={22} />} label="მიღებული შემოსავალი" value="8,420 ₾" /></div></Card>;
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-[16px] bg-[#F7F8FC] p-4"><span className="grid size-11 place-items-center rounded-[13px] bg-[#EFF6FF] text-[#2563EB]">{icon}</span><p className="mt-3 text-[22px] font-semibold">{value}</p><p className="text-[12px] font-medium text-[#63718A]">{label}</p><MiniBadge tone="green">+16%</MiniBadge></div>;
}

function OpportunitiesCard() {
  return <SideCard title="მოთხოვნის შესაძლებლობები">{opportunities.map((item) => <div className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 border-t border-[#EEF2F7] py-3" key={item[1]}><span className="grid size-11 place-items-center rounded-[12px] bg-[#EFF6FF] text-[22px]">{item[0]}</span><div><MiniBadge tone="red">{item[4]}</MiniBadge><p className="mt-1 text-[13px] font-semibold">{item[1]}</p><p className="text-[11px] text-[#63718A]">{item[2]}</p><p className="text-[11px] font-semibold">{item[3]}</p></div><button className="h-8 rounded-[9px] border border-[#AFC8FF] px-3 text-[11px] font-semibold text-[#1D4ED8]" type="button">შეთავაზება</button></div>)}</SideCard>;
}

function NewStoresCard() {
  return <SideCard title="ახალი მაღაზიები">{newStores.map((store, index) => <div className="flex items-center justify-between border-t border-[#EEF2F7] py-2.5" key={store}><div><p className="text-[13px] font-semibold">{store}</p><p className="text-[11px] text-[#63718A]">თბილისი, {index % 2 ? "ნუცუბიძე" : "ვარკეთილი"}</p></div><MiniBadge tone="green">ახალი</MiniBadge></div>)}</SideCard>;
}

function NotificationsCard() {
  return <SideCard title="შეტყობინებები">{notes.map((note, index) => <div className="flex items-center justify-between border-t border-[#EEF2F7] py-2.5 text-[12px]" key={note}><span className="font-medium text-[#334B7A]">{note}</span><span className="text-[11px] text-[#63718A]">{["14:32", "12:18", "11:05", "10:44"][index]}</span></div>)}</SideCard>;
}

function SideCard({ children, title }: { children: React.ReactNode; title: string }) {
  return <section className="rounded-[18px] border border-[#E1E6F0] bg-white p-4 shadow-[0_8px_24px_rgba(23,35,70,0.05)]"><div className="mb-2 flex items-center justify-between"><h2 className="text-[16px] font-semibold">{title}</h2><Link className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#1D4ED8]" href="/erp/distribution/opportunities">ყველა ნახვა <ArrowRight size={13} /></Link></div>{children}</section>;
}
