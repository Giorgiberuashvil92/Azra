import { Link2, Upload } from "lucide-react";
import { DistributionShell, MiniBadge, PageTitle } from "../_components/distribution-shell";

const products = [
  ["Coca-Cola 0.5L", "5449000000996", "CC-05", "სასმელები", "1.25 ₾", "1,248", "24", "ნაპოვნია"],
  ["Borjomi 1.5L", "4860102030219", "BRJ-15", "სასმელები", "2.10 ₾", "840", "12", "ნაპოვნია"],
  ["Red Bull 250ml", "9002490227657", "RB-250", "ენერგეტიკული", "2.35 ₾", "420", "24", "აქტიური"],
  ["Lay’s 90g", "4860102030127", "LAY-90", "სნექები", "4.60 ₾", "680", "18", "ნაპოვნია"],
];

export default function DistributorProductsPage() {
  return (
    <DistributionShell active="products">
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4">
        <PageTitle title="პროდუქტები" subtitle="დისტრიბუტორის კატალოგი, barcode matching და საბითუმო ფასები" action={<button className="inline-flex h-10 items-center gap-2 rounded-[12px] bg-[#2563EB] px-4 text-[12px] font-semibold text-white" type="button"><Upload size={16} />იმპორტი</button>} />
        <section className="min-h-0 overflow-auto rounded-[18px] border border-[#E9E6EE] bg-white shadow-[0_8px_24px_rgba(24,21,31,0.04)]">
          <table className="w-full table-fixed text-left text-[12px]">
            <thead className="bg-[#FBFCFF] text-[11px] font-medium text-[#817B8D]"><tr><th className="px-4 py-3">პროდუქტი</th><th>Barcode</th><th>SKU</th><th>კატეგორია</th><th className="text-right">Wholesale</th><th className="text-right">მარაგი</th><th className="text-right">MOQ</th><th className="px-4">AZLA Catalog</th></tr></thead>
            <tbody>{products.map((item) => <tr className="border-t border-[#EEF0F4]" key={item[1]}><td className="px-4 py-3 font-semibold">{item[0]}</td><td>{item[1]}</td><td>{item[2]}</td><td>{item[3]}</td><td className="text-right font-semibold">{item[4]}</td><td className="text-right">{item[5]}</td><td className="text-right">{item[6]}</td><td className="px-4"><MiniBadge tone="green"><Link2 size={12} /> {item[7]}</MiniBadge></td></tr>)}</tbody>
          </table>
        </section>
      </div>
    </DistributionShell>
  );
}
