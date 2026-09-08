import { DistributionShell, MiniBadge, PageTitle } from "../_components/distribution-shell";

const funnel = [["Delivered", "380"], ["Viewed", "294"], ["Ordered", "51"], ["Revenue", "9,840 ₾"], ["Conversion", "13.4%"], ["New customers", "17"]];

export default function CampaignAnalyticsPage() {
  return (
    <DistributionShell active="campaigns">
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4">
        <PageTitle title="კამპანიები" subtitle="B2B კამპანიები, offer funnel და ახალი კლიენტების მიღება" action={<button className="h-10 rounded-[12px] bg-[#2563EB] px-4 text-[12px] font-semibold text-white" type="button">კამპანიის შექმნა</button>} />
        <main className="grid min-h-0 gap-4 overflow-auto xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="rounded-[18px] border border-[#E9E6EE] bg-white p-4"><div className="flex items-start justify-between"><div><MiniBadge tone="blue">Active</MiniBadge><h2 className="mt-3 text-[20px] font-semibold">September Coca-Cola Promotion</h2><p className="mt-1 text-[12px] text-[#817B8D]">Audience: Mini Markets · Location: Tbilisi · Offer: Coca-Cola 48+ → -12%</p></div><strong className="text-[24px]">13.4%</strong></div><div className="mt-6 grid gap-3 md:grid-cols-3">{funnel.map((item) => <div className="rounded-[16px] bg-[#F7F8FC] p-4" key={item[0]}><p className="text-[11px] font-medium text-[#817B8D]">{item[0]}</p><p className="mt-1 text-[21px] font-semibold">{item[1]}</p></div>)}</div></section>
          <aside className="grid content-start gap-4"><Side title="Top regions" items={["ვაკე · 22 orders", "საბურთალო · 18", "გლდანი · 11"]} /><Side title="Top stores" items={["მინი მარკეტი N12", "Express Shop", "Market Plus"]} /><Side title="Average order value" items={["193 ₾", "New vs returning stores: 17 / 34"]} /></aside>
        </main>
      </div>
    </DistributionShell>
  );
}

function Side({ items, title }: { items: string[]; title: string }) {
  return <section className="rounded-[18px] border border-[#E9E6EE] bg-white p-4"><h2 className="text-[15px] font-semibold">{title}</h2><div className="mt-3 grid gap-2">{items.map((item) => <p className="rounded-[12px] bg-[#F7F8FC] px-3 py-2 text-[12px] font-medium" key={item}>{item}</p>)}</div></section>;
}
