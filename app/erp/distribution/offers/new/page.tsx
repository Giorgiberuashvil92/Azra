import { DistributionShell, MiniBadge, PageTitle } from "../../_components/distribution-shell";

const steps = ["პროდუქტები", "პირობა", "აუდიტორია", "მიწოდება", "გამოქვეყნება"];

export default function CreateOfferPage() {
  return (
    <DistributionShell active="offers">
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4">
        <PageTitle title="შეთავაზების შექმნა" subtitle="აირჩიე პროდუქტი, პირობა, აუდიტორია და მიწოდების წესები" action={<button className="h-10 rounded-[12px] bg-[#2563EB] px-4 text-[12px] font-semibold text-white" type="button">გამოქვეყნება</button>} />
        <main className="grid min-h-0 gap-4 overflow-auto xl:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-[18px] border border-[#E9E6EE] bg-white p-4">{steps.map((step, index) => <div className="flex items-center gap-3 border-b border-[#EEF0F4] py-3 last:border-b-0" key={step}><span className={index === 0 ? "grid size-7 place-items-center rounded-full bg-[#2563EB] text-[11px] font-bold text-white" : "grid size-7 place-items-center rounded-full bg-[#F3F4F7] text-[11px] font-bold text-[#817B8D]"}>{index + 1}</span><span className="text-[12px] font-semibold">{step}</span></div>)}</aside>
          <section className="grid content-start gap-4">
            <div className="rounded-[18px] border border-[#E9E6EE] bg-white p-4"><h2 className="text-[15px] font-semibold">Coca-Cola 0.5L</h2><p className="mt-1 text-[12px] text-[#817B8D]">Normal: 1.25 ₾ · Offer: 48+ → 1.12 ₾ · Valid: 8 Sep – 15 Sep</p></div>
            <div className="grid gap-3 md:grid-cols-3">{["ყველა მაღაზია", "ჩემი კლიენტები", "თბილისი / ვაკე", "Mini Markets", "Beverage buyers", "Custom selection"].map((item) => <button className="rounded-[16px] border border-[#E9E6EE] bg-white p-4 text-left text-[12px] font-semibold hover:border-[#BFDBFE]" key={item} type="button">{item}<p className="mt-2 text-[11px] font-medium text-[#817B8D]">აუდიტორია</p></button>)}</div>
            <div className="rounded-[18px] border border-[#DBEAFE] bg-[#EFF6FF] p-4"><MiniBadge tone="blue">Forecast</MiniBadge><p className="mt-2 text-[13px] font-semibold">420 მაღაზიას გაეგზავნება · მოსალოდნელი შეკვეთები 48 · Revenue 8,420 ₾</p></div>
          </section>
        </main>
      </div>
    </DistributionShell>
  );
}
