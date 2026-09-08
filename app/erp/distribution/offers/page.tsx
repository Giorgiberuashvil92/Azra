import Link from "next/link";
import { Plus } from "lucide-react";
import { DistributionShell, MiniBadge, PageTitle } from "../_components/distribution-shell";

const offers = [
  ["Coca-Cola 0.5L", "48+ → 1.12 ₾", "420", "315", "48", "8,420 ₾"],
  ["Red Bull 250ml", "-10%", "260", "188", "31", "3,180 ₾"],
  ["Water bundle", "Buy 10 get 1", "214", "126", "22", "2,640 ₾"],
];

export default function DistributorOffersPage() {
  return (
    <DistributionShell active="offers">
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4">
        <PageTitle title="შეთავაზებები" subtitle="B2B შეთავაზებები მაღაზიების სეგმენტებისთვის" action={<Link className="inline-flex h-10 items-center gap-2 rounded-[12px] bg-[#2563EB] px-4 text-[12px] font-semibold text-white" href="/erp/distribution/offers/new"><Plus size={16} />ახალი შეთავაზება</Link>} />
        <section className="rounded-[18px] border border-[#E9E6EE] bg-white p-4">
          <table className="w-full table-fixed text-left text-[12px]"><thead className="text-[11px] text-[#817B8D]"><tr><th className="pb-3">პროდუქტი</th><th>პირობა</th><th className="text-right">გაეგზავნა</th><th className="text-right">ნახა</th><th className="text-right">შეუკვეთა</th><th className="text-right">Revenue</th></tr></thead><tbody>{offers.map((offer) => <tr className="border-t border-[#EEF0F4]" key={offer[0]}><td className="py-3 font-semibold">{offer[0]}</td><td><MiniBadge>{offer[1]}</MiniBadge></td><td className="text-right">{offer[2]}</td><td className="text-right">{offer[3]}</td><td className="text-right font-semibold">{offer[4]}</td><td className="text-right font-semibold">{offer[5]}</td></tr>)}</tbody></table>
        </section>
      </div>
    </DistributionShell>
  );
}
