import { Banknote, Clock, Plus } from "lucide-react";
import { RetailShell, StatusPill } from "../_components/retail-shell";

const shifts = [
  ["ცვლა #24", "ნინო კალანდაძე", "09:00", "ღიაა", "120.00 ₾", "1,284.00 ₾", "0.00 ₾"],
  ["ცვლა #23", "გიორგი მაისურაძე", "გუშინ", "დახურული", "100.00 ₾", "982.40 ₾", "-2.00 ₾"],
  ["ცვლა #22", "ნინო კალანდაძე", "გუშინ", "დახურული", "100.00 ₾", "1,104.80 ₾", "0.00 ₾"],
];

export default function RetailShiftsPage() {
  return (
    <RetailShell active="shifts" title="ცვლები">
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Metric icon={<Clock size={20} />} label="მიმდინარე ცვლა" value="ცვლა #24" />
          <Metric icon={<Banknote size={20} />} label="ნაღდი სალაროში" value="1,404 ₾" />
          <button className="inline-flex h-[76px] items-center justify-center gap-2 rounded-[16px] bg-[#2563EB] px-5 text-[14px] font-semibold text-white"><Plus size={18} />ცვლის დახურვა</button>
        </div>
        <section className="min-h-0 overflow-hidden rounded-[18px] border border-[#E9E6EE] bg-white">
          {shifts.map((shift) => (
            <div className="grid grid-cols-[120px_minmax(180px,1fr)_100px_120px_120px_120px_110px] items-center border-b border-[#F0EEF4] px-5 py-4 text-[14px]" key={shift[0]}>
              <strong>{shift[0]}</strong><span className="font-semibold">{shift[1]}</span><span className="text-[#817B8D]">{shift[2]}</span>
              <StatusPill tone={shift[3] === "ღიაა" ? "green" : "gray"}>{shift[3]}</StatusPill>
              <span>{shift[4]}</span><strong>{shift[5]}</strong><span className={shift[6].startsWith("-") ? "text-[#D7264B]" : "text-[#16B982]"}>{shift[6]}</span>
            </div>
          ))}
        </section>
      </div>
    </RetailShell>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex h-[76px] items-center gap-4 rounded-[16px] border border-[#E9E6EE] bg-white px-5"><span className="grid size-11 place-items-center rounded-[12px] bg-[#EFF6FF] text-[#2563EB]">{icon}</span><div><p className="text-[12px] font-medium text-[#817B8D]">{label}</p><p className="text-[20px] font-bold">{value}</p></div></div>;
}
