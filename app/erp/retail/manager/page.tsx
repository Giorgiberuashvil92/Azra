import { ArrowRight, BarChart3, Bell, CalendarDays, ChevronDown, ClipboardList, CreditCard, PackageSearch, ReceiptText, Store, UsersRound } from "lucide-react";
import { RetailShell } from "../_components/retail-shell";

const kpis = [
  { label: "დღის გაყიდვები", value: "1,284 ₾", change: "+12%", meta: "გუშინ: 1,148 ₾", icon: BarChart3 },
  { label: "ტრანზაქციები", value: "186", change: "+8%", meta: "გუშინ: 172", icon: ReceiptText },
  { label: "საშუალო ჩეკი", value: "6.90 ₾", change: "+4%", meta: "გუშინ: 6.64 ₾", icon: CreditCard },
  { label: "მოგება (სავარაუდო)", value: "327 ₾", change: "25.4%", meta: "Margin", icon: ClipboardList },
];

const hours = [42, 68, 82, 54, 74, 96, 88, 122, 154, 210, 245, 318, 346, 282, 266, 224, 274, 138, 164, 216, 88, 146, 112, 74];
const yesterday = [36, 52, 68, 78, 56, 84, 104, 96, 132, 174, 196, 268, 302, 312, 278, 248, 196, 118, 186, 222, 158, 132, 92, 64];
const categorySales = [
  { color: "#2563EB", label: "სასმელები", value: "32%" },
  { color: "#93A7F8", label: "ტკბილეული", value: "18%" },
  { color: "#F6B74A", label: "სიგარეტი", value: "12%" },
  { color: "#F59E0B", label: "სნექები", value: "10%" },
  { color: "#60A5FA", label: "საკვები", value: "8%" },
  { color: "#31B6B0", label: "სხვა", value: "20%" },
];

const topProducts = [
  { margin: "24%", name: "Coca-Cola 0.5L", qty: "48", revenue: "72.00 ₾", thumb: "🥤" },
  { margin: "18%", name: "Marlboro Red", qty: "32", revenue: "160.00 ₾", thumb: "▣" },
  { margin: "26%", name: "Lay’s 90g", qty: "28", revenue: "154.00 ₾", thumb: "🍟" },
  { margin: "21%", name: "Borjomi 1.5L", qty: "24", revenue: "64.80 ₾", thumb: "🍾" },
  { margin: "28%", name: "Red Bull 250ml", qty: "21", revenue: "56.70 ₾", thumb: "🥫" },
];

const transactions = [
  { amount: "12.50 ₾", items: "3 პროდუქტი", method: "ბარათი", time: "16:42" },
  { amount: "2.70 ₾", items: "1 პროდუქტი", method: "ნაღდი", time: "16:38" },
  { amount: "18.90 ₾", items: "5 პროდუქტი", method: "ბარათი", time: "16:31" },
  { amount: "6.40 ₾", items: "2 პროდუქტი", method: "ნაღდი", time: "16:28" },
  { amount: "14.20 ₾", items: "4 პროდუქტი", method: "ბარათი", time: "16:22" },
];

const stockProblems = [
  { name: "Coca-Cola 0.5L", stock: "დარჩა 4 ცალი", thumb: "🥤" },
  { name: "Borjomi 1.5L", stock: "დარჩა 2 ცალი", thumb: "🍾" },
  { name: "Lay’s 90g", stock: "დარჩა 6 ცალი", thumb: "🍟" },
];

const orders = [
  { items: "24 პროდუქტი", name: "Wissol", number: "#ORD-4286", status: "მიღებულია", tone: "green" },
  { items: "12 პროდუქტი", name: "Coca-Cola Georgia", number: "#ORD-4285", status: "დასადასტურებელი", tone: "blue" },
  { items: "8 პროდუქტი", name: "PepsiCo", number: "#ORD-4284", status: "გზაში", tone: "amber" },
];

const shifts = [
  { name: "მარიამ კაკაბაძე", role: "მოლარე", shift: "09:00–17:00", status: "აქტიური" },
  { name: "დავით კაპანაძე", role: "მოლარე", shift: "17:00–01:00", status: "შემდეგი ცვლა" },
  { name: "ანა ლომიძე", role: "მოლარე", shift: "თავისუფალია", status: "დასვენება" },
];

const recommendations = [
  { action: "შეკვეთის შექმნა", label: "Coca-Cola 0.5L დაახლოებით 1 დღეში ამოიწურება." },
  { action: "ნახვა", label: "დღეს 14 პროდუქტს კრიტიკულად დაბალი ნაშთი აქვს." },
  { action: "ანალიზი", label: "დღის გაყიდვები გუშინდელთან შედარებით 12%-ით გაიზარდა." },
  { action: "ყველაფერი წესრიგშია", label: "სალაროს მიმდინარე თანხა მოსალოდნელ მონაცემს ემთხვევა." },
];

export default function RetailManagerPage() {
  return (
    <RetailShell active="manager" title="მენეჯერი">
      <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_304px] grid-rows-[auto_auto_minmax(0,1fr)] gap-4 overflow-hidden">
        <header className="col-span-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[23px] font-semibold leading-7 text-[#18151F]">მენეჯერის სამუშაო სივრცე</h1>
            <p className="mt-1 text-[12px] font-medium text-[#817B8D]">დღის ოპერაციები და მაღაზიის მდგომარეობა</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-[#E9E6EE] bg-white px-4 text-[12px] font-medium text-[#18151F]" type="button">
              <Store size={17} className="text-[#2563EB]" />
              თბილისი, ვარკეთილი
              <ChevronDown size={15} className="text-[#817B8D]" />
            </button>
            <button className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-[#E9E6EE] bg-white px-4 text-[12px] font-medium text-[#18151F]" type="button">
              <CalendarDays size={17} className="text-[#64738F]" />
              8 სექტემბერი, 2026
            </button>
            <button className="h-10 rounded-[12px] bg-[#2563EB] px-5 text-[12px] font-semibold text-white shadow-[0_10px_22px_rgba(37,99,235,0.18)]" type="button">რეპორტები</button>
          </div>
        </header>

        <div className="col-span-2 grid gap-3 md:grid-cols-4">
          {kpis.map((item) => <KpiCard key={item.label} {...item} />)}
        </div>

        <main className="min-h-0 overflow-y-auto pr-1">
          <div className="grid gap-4">
            <div className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
              <Card action="დღე" title="გაყიდვები დღის განმავლობაში">
                <HourlyChart />
              </Card>
              <Card action="დღე" title="გაყიდვები კატეგორიებით">
                <CategoryDonut />
              </Card>
            </div>
            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <TopProductsTable />
              <RecentTransactions />
            </div>
            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <InventoryHealth />
              <Recommendations />
            </div>
          </div>
        </main>

        <aside className="grid min-h-0 content-start gap-4 overflow-y-auto">
          <AttentionCard />
          <OrdersCard />
          <ScheduleCard />
        </aside>
      </div>
    </RetailShell>
  );
}

function KpiCard({ change, icon: Icon, label, meta, value }: { change: string; icon: typeof BarChart3; label: string; meta: string; value: string }) {
  return (
    <article className="rounded-[18px] border border-[#E9E6EE] bg-white p-4 shadow-[0_8px_24px_rgba(24,21,31,0.04)]">
      <div className="flex items-start gap-3">
        <span className="grid size-11 place-items-center rounded-[14px] bg-[#EFF6FF] text-[#2563EB]"><Icon size={20} strokeWidth={1.8} /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium text-[#817B8D]">{label}</p>
          <div className="mt-1 flex items-end gap-2">
            <strong className="text-[21px] leading-7 text-[#18151F]">{value}</strong>
            <span className="mb-1 rounded-full bg-[#E6F8F0] px-2 py-0.5 text-[10px] font-semibold text-[#087C58]">{change}</span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-[#817B8D]">{meta}</p>
        </div>
      </div>
    </article>
  );
}

function Card({ action, children, title }: { action?: string; children: React.ReactNode; title: string }) {
  return (
    <section className="rounded-[18px] border border-[#E9E6EE] bg-white p-4 shadow-[0_8px_24px_rgba(24,21,31,0.04)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-[#18151F]">{title}</h2>
        {action ? <button className="inline-flex h-8 items-center gap-2 rounded-[10px] border border-[#E9E6EE] px-3 text-[10px] font-medium text-[#5F5870]" type="button">{action}<ChevronDown size={14} /></button> : null}
      </div>
      {children}
    </section>
  );
}

function HourlyChart() {
  const max = 360;
  return (
    <div className="h-[202px]">
      <div className="flex h-[170px] items-end gap-2 border-b border-l border-[#EDF0F5] px-3">
        {hours.map((value, index) => (
          <div className="relative flex flex-1 items-end justify-center gap-0.5" key={`${value}-${index}`}>
            <span className="w-1.5 rounded-t-full bg-[#CBD7F7]" style={{ height: `${Math.max(18, (yesterday[index] / max) * 150)}px` }} />
            <span className="w-1.5 rounded-t-full bg-[#2563EB]" style={{ height: `${Math.max(18, (value / max) * 150)}px` }} />
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-6 text-[10px] font-medium text-[#817B8D]">
        {["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"].map((hour) => <span key={hour}>{hour}</span>)}
      </div>
      <div className="mt-2 flex justify-end gap-4 text-[10px] font-medium text-[#817B8D]">
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#2563EB]" />დღევანდელი</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#CBD7F7]" />გუშინდელი</span>
      </div>
    </div>
  );
}

function CategoryDonut() {
  return (
    <div className="grid h-[202px] grid-cols-[154px_minmax(0,1fr)] items-center gap-4">
      <div className="relative grid size-[154px] place-items-center rounded-full" style={{ background: "conic-gradient(#2563EB 0 32%, #93A7F8 32% 50%, #F6B74A 50% 62%, #F59E0B 62% 72%, #60A5FA 72% 80%, #31B6B0 80% 100%)" }}>
        <div className="grid size-[92px] place-items-center rounded-full bg-white text-center">
          <div>
            <p className="text-[18px] font-semibold leading-5 text-[#18151F]">1,284 ₾</p>
            <p className="mt-1 text-[10px] font-medium text-[#817B8D]">ჯამი</p>
          </div>
        </div>
      </div>
      <div className="grid gap-2">
        {categorySales.map((item) => (
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-[12px]" key={item.label}>
            <span className="inline-flex min-w-0 items-center gap-2 font-medium text-[#5F5870]"><span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</span>
            <span className="font-semibold text-[#18151F]">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopProductsTable() {
  return (
    <Card title="ტოპ პროდუქტები">
      <table className="w-full table-fixed text-left text-[12px]">
        <thead className="text-[11px] font-medium text-[#817B8D]">
          <tr><th className="pb-3">პროდუქტი</th><th className="pb-3 text-right">გაყიდული</th><th className="pb-3 text-right">შემოსავალი</th><th className="pb-3 text-right">მარჟა</th></tr>
        </thead>
        <tbody>
          {topProducts.map((item, index) => (
            <tr className="border-t border-[#EEF0F4]" key={item.name}>
              <td className="py-2.5"><div className="flex min-w-0 items-center gap-2"><span className="w-4 text-[11px] font-semibold text-[#817B8D]">{index + 1}</span><span className="grid size-8 place-items-center rounded-[9px] bg-[#F7F8FC]">{item.thumb}</span><span className="truncate font-semibold text-[#18151F]">{item.name}</span></div></td>
              <td className="py-2.5 text-right font-medium text-[#18151F]">{item.qty}</td>
              <td className="py-2.5 text-right font-semibold text-[#18151F]">{item.revenue}</td>
              <td className="py-2.5 text-right font-medium text-[#334B7A]">{item.margin}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function RecentTransactions() {
  return (
    <Card title="ბოლო ტრანზაქციები">
      <div className="grid gap-1">
        {transactions.map((item) => (
          <div className="grid grid-cols-[54px_minmax(0,1fr)_auto_auto] items-center gap-3 border-t border-[#EEF0F4] py-2.5 text-[12px]" key={`${item.time}-${item.amount}`}>
            <span className="font-medium text-[#334B7A]">{item.time}</span>
            <span className="truncate font-medium text-[#817B8D]">{item.items}</span>
            <span className="font-semibold text-[#18151F]">{item.amount}</span>
            <StatusBadge label={item.method} tone={item.method === "ბარათი" ? "green" : "blue"} />
          </div>
        ))}
      </div>
    </Card>
  );
}

function InventoryHealth() {
  return (
    <Card title="ნაშთის მდგომარეობა">
      <div className="h-7 overflow-hidden rounded-full bg-[#EDF0F5] p-1"><div className="flex h-full gap-1"><span className="rounded-full bg-[#20C489]" style={{ width: "70%" }} /><span className="rounded-full bg-[#F5A300]" style={{ width: "15%" }} /><span className="min-w-12 rounded-full bg-[#F04438]" style={{ width: "8%" }} /><span className="min-w-12 rounded-full bg-[#8D95A6]" style={{ width: "7%" }} /></div></div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        <StockStat color="#20C489" label="ნორმაში" sub="78%" value="432" />
        <StockStat color="#F5A300" label="ყურადღება" sub="16%" value="88" />
        <StockStat color="#F04438" highlight="red" label="კრიტიკული" sub="3%" value="14" />
        <StockStat color="#8D95A6" highlight="gray" label="არ არის" sub="4%" value="21" />
      </div>
    </Card>
  );
}

function Recommendations() {
  return (
    <Card title="რეკომენდაციები">
      <div className="grid gap-2">
        {recommendations.map((item) => (
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-[#EEF0F4] py-2 last:border-b-0" key={item.label}>
            <p className="min-w-0 text-[12px] font-medium leading-5 text-[#3D3748]">{item.label}</p>
            <button className={item.action === "ყველაფერი წესრიგშია" ? "text-[10px] font-semibold text-[#087C58]" : "text-[10px] font-semibold text-[#1D4ED8] underline-offset-4 hover:underline"} type="button">{item.action}</button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AttentionCard() {
  return (
    <section className="overflow-hidden rounded-[18px] border border-[#FAD6D6] bg-white shadow-[0_8px_24px_rgba(24,21,31,0.04)]">
      <div className="flex items-center justify-between bg-[#FFF0F0] px-4 py-3"><h2 className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#D7264B]"><Bell size={17} />ყურადღება სჭირდება</h2><ArrowRight size={16} className="text-[#D7264B]" /></div>
      <div className="grid gap-1 p-3">
        {stockProblems.map((item) => (
          <div className="flex items-center gap-3 rounded-[12px] px-2 py-2" key={item.name}><span className="grid size-10 place-items-center rounded-[11px] bg-[#FFF7ED]">{item.thumb}</span><div className="min-w-0"><p className="truncate text-[12px] font-semibold text-[#18151F]">{item.name}</p><p className="text-[11px] font-medium text-[#D7264B]">{item.stock}</p></div></div>
        ))}
        <button className="mt-1 h-10 rounded-[12px] bg-[#FFF7FB] text-[12px] font-semibold text-[#D7264B]" type="button">ყველა პროდუქტზე ნახვა</button>
      </div>
    </section>
  );
}

function OrdersCard() {
  return (
    <SideCard icon={<PackageSearch size={17} />} title="მომწოდებლების შეკვეთები">
      {orders.map((item) => <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-t border-[#EEF0F4] py-2.5" key={item.number}><div className="min-w-0"><p className="truncate text-[12px] font-semibold text-[#18151F]">{item.name}</p><p className="mt-0.5 text-[11px] font-medium text-[#817B8D]">{item.number} · {item.items}</p></div><StatusBadge label={item.status} tone={item.tone} /></div>)}
    </SideCard>
  );
}

function ScheduleCard() {
  return (
    <SideCard icon={<UsersRound size={17} />} title="სამუშაო განრიგი">
      {shifts.map((item) => <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-t border-[#EEF0F4] py-2.5" key={item.name}><div className="min-w-0"><p className="truncate text-[12px] font-semibold text-[#18151F]">{item.name}</p><p className="mt-0.5 text-[11px] font-medium text-[#817B8D]">{item.role}</p></div><div className="text-right"><p className="text-[11px] font-semibold text-[#334B7A]">{item.shift}</p><p className={item.status === "აქტიური" ? "mt-0.5 text-[10px] font-semibold text-[#087C58]" : "mt-0.5 text-[10px] font-medium text-[#817B8D]"}>{item.status}</p></div></div>)}
      <button className="mt-1 inline-flex w-fit items-center gap-1 justify-self-end text-[11px] font-semibold text-[#1D4ED8] hover:underline" type="button">ცვლების მართვა <ArrowRight size={12} /></button>
    </SideCard>
  );
}

function SideCard({ children, icon, title }: { children: React.ReactNode; icon: React.ReactNode; title: string }) {
  return (
    <section className="rounded-[18px] border border-[#E9E6EE] bg-white p-4 shadow-[0_8px_24px_rgba(24,21,31,0.04)]">
      <div className="mb-2 flex items-center justify-between gap-3"><h2 className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#18151F]"><span className="grid size-8 place-items-center rounded-[10px] bg-[#EFF6FF] text-[#2563EB]">{icon}</span>{title}</h2><ArrowRight size={15} className="text-[#2563EB]" /></div>
      {children}
    </section>
  );
}

function StockStat({ color, highlight, label, sub, value }: { color: string; highlight?: "gray" | "red"; label: string; sub: string; value: string }) {
  const highlightClass = highlight === "red" ? "rounded-[12px] border border-[#FAD6D6] bg-[#FFF0F3] px-2.5 py-2" : highlight === "gray" ? "rounded-[12px] border border-[#E1E4EA] bg-[#F3F4F7] px-2.5 py-2" : "px-1 py-2";
  const valueClass = highlight === "red" ? "text-[#D7264B]" : "text-[#18151F]";
  return <div className={highlightClass}><p className={`inline-flex items-center gap-2 text-[18px] font-semibold ${valueClass}`}><span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />{value}</p><p className="mt-1 text-[12px] font-medium text-[#5F5870]">{label}</p><p className="text-[11px] font-medium text-[#817B8D]">({sub})</p></div>;
}

function StatusBadge({ label, tone }: { label: string; tone: string }) {
  const toneClass = {
    amber: "bg-[#FFF7E5] text-[#9A5A00]",
    blue: "bg-[#EFF6FF] text-[#1D4ED8]",
    green: "bg-[#E6F8F0] text-[#087C58]",
  }[tone] ?? "bg-[#F7F8FC] text-[#817B8D]";

  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${toneClass}`}>{label}</span>;
}
