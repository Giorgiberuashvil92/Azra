import { DistributionShell, MiniBadge, PageTitle } from "../_components/distribution-shell";

const orders = [
  ["#ORD-4286", "მინი მარკეტი N12", "თბილისი / ვაკე", "12 products", "320 ₾", "09 Sep", "ახალი"],
  ["#ORD-4285", "ვაკე მარკეტი", "თბილისი / ვაკე", "38 products", "1,240 ₾", "09 Sep", "დადასტურებული"],
  ["#ORD-4284", "საბურთალო Express", "თბილისი", "18 products", "680 ₾", "10 Sep", "მზადდება"],
  ["#ORD-4283", "გლდანი Shop", "თბილისი", "9 products", "214 ₾", "10 Sep", "გზაში"],
];

export default function DistributorOrdersPage() {
  return (
    <DistributionShell active="orders">
      <div className="grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] gap-4">
        <PageTitle title="შეკვეთები" subtitle="მაღაზიებიდან მიღებული შეკვეთები და მიწოდების სტატუსები" />
        <div className="flex gap-2 overflow-x-auto">{["ახალი", "დადასტურებული", "მზადდება", "გზაში", "მიწოდებული", "გაუქმებული"].map((status, index) => <button className={index === 0 ? "h-9 rounded-[11px] bg-[#2563EB] px-4 text-[12px] font-semibold text-white" : "h-9 rounded-[11px] border border-[#E9E6EE] bg-white px-4 text-[12px] font-medium text-[#5F5870]"} key={status} type="button">{status}</button>)}</div>
        <section className="min-h-0 overflow-auto rounded-[18px] border border-[#E9E6EE] bg-white">
          <table className="w-full table-fixed text-left text-[12px]"><thead className="bg-[#FBFCFF] text-[11px] text-[#817B8D]"><tr><th className="px-4 py-3">შეკვეთა</th><th>მაღაზია</th><th>ლოკაცია</th><th>პროდუქტები</th><th className="text-right">Total</th><th>მიწოდება</th><th className="px-4">Actions</th></tr></thead><tbody>{orders.map((order) => <tr className="border-t border-[#EEF0F4]" key={order[0]}><td className="px-4 py-3 font-semibold text-[#334B7A]">{order[0]}</td><td className="font-semibold">{order[1]}</td><td>{order[2]}</td><td>{order[3]}</td><td className="text-right font-semibold">{order[4]}</td><td>{order[5]}</td><td className="px-4"><div className="flex gap-1"><MiniBadge tone="blue">დადასტურება</MiniBadge><MiniBadge tone="gray">რედაქტირება</MiniBadge></div></td></tr>)}</tbody></table>
        </section>
      </div>
    </DistributionShell>
  );
}
