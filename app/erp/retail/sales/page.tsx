import { Search } from "lucide-react";
import { RetailShell, StatusPill } from "../_components/retail-shell";

const sales = [
  ["#000786", "დღეს, 14:22", "ნინო კალანდაძე", "3 პროდუქტი", "13.10 ₾", "დასრულებული"],
  ["#000785", "დღეს, 14:08", "ნინო კალანდაძე", "7 პროდუქტი", "46.80 ₾", "დასრულებული"],
  ["#000784", "დღეს, 13:51", "გიორგი მაისურაძე", "2 პროდუქტი", "8.40 ₾", "დაბრუნება"],
  ["#000783", "დღეს, 13:35", "ნინო კალანდაძე", "5 პროდუქტი", "31.20 ₾", "გაუქმებული"],
];

export default function RetailSalesPage() {
  return (
    <RetailShell active="sales" title="გაყიდვები">
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4">
        <div className="flex items-center gap-3">
          <label className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-[14px] border border-[#E9E6EE] bg-white px-4 text-[14px] text-[#817B8D]">
            <Search size={19} strokeWidth={1.8} />
            <input className="w-full bg-transparent outline-none placeholder:text-[#9A94A6]" placeholder="ჩეკის ან კასირის ძებნა" />
          </label>
          <StatusPill tone="blue">დღეს: 1,284 ₾</StatusPill>
        </div>
        <section className="min-h-0 overflow-hidden rounded-[18px] border border-[#E9E6EE] bg-white">
          {sales.map((sale) => (
            <div className="grid grid-cols-[120px_150px_minmax(180px,1fr)_130px_120px_130px] items-center border-b border-[#F0EEF4] px-5 py-4 text-[14px]" key={sale[0]}>
              <strong className="font-bold text-[#18151F]">{sale[0]}</strong>
              <span className="text-[#817B8D]">{sale[1]}</span>
              <span className="font-semibold">{sale[2]}</span>
              <span className="text-[#817B8D]">{sale[3]}</span>
              <strong>{sale[4]}</strong>
              <StatusPill tone={sale[5] === "გაუქმებული" ? "red" : sale[5] === "დაბრუნება" ? "gray" : "green"}>{sale[5]}</StatusPill>
            </div>
          ))}
        </section>
      </div>
    </RetailShell>
  );
}
