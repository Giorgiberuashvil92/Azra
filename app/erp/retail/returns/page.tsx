import { RotateCcw, Search } from "lucide-react";
import { RetailShell, StatusPill } from "../_components/retail-shell";

const returns = [
  ["#R-104", "#000784", "ქართული ყველი 200გ", "7.90 ₾", "მენეჯერი", "დადასტურებული"],
  ["#R-103", "#000779", "რძე 2.5%", "3.40 ₾", "კასირი", "მოლოდინში"],
  ["#R-102", "#000771", "კოკა კოლა 250გ", "18.90 ₾", "მენეჯერი", "უარყოფილი"],
];

export default function RetailReturnsPage() {
  return (
    <RetailShell active="returns" title="დაბრუნებები">
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4">
        <div className="flex items-center gap-3">
          <label className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-[14px] border border-[#E9E6EE] bg-white px-4 text-[14px] text-[#817B8D]">
            <Search size={19} strokeWidth={1.8} />
            <input className="w-full bg-transparent outline-none placeholder:text-[#9A94A6]" placeholder="დაბრუნების ან ჩეკის ძებნა" />
          </label>
          <button className="inline-flex h-12 items-center gap-2 rounded-[14px] bg-[#2563EB] px-4 text-[14px] font-semibold text-white"><RotateCcw size={18} />დაბრუნება</button>
        </div>
        <section className="min-h-0 overflow-hidden rounded-[18px] border border-[#E9E6EE] bg-white">
          {returns.map((item) => (
            <div className="grid grid-cols-[110px_110px_minmax(220px,1fr)_120px_130px_140px] items-center border-b border-[#F0EEF4] px-5 py-4 text-[14px]" key={item[0]}>
              <strong>{item[0]}</strong><span className="text-[#817B8D]">{item[1]}</span><span className="font-semibold">{item[2]}</span><strong>{item[3]}</strong><span>{item[4]}</span>
              <StatusPill tone={item[5] === "უარყოფილი" ? "red" : item[5] === "მოლოდინში" ? "blue" : "green"}>{item[5]}</StatusPill>
            </div>
          ))}
        </section>
      </div>
    </RetailShell>
  );
}
