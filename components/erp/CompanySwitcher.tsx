import { Building2, ChevronDown } from "lucide-react";

export function CompanySwitcher({
  className = "",
  companyName,
}: {
  className?: string;
  companyName: string;
}) {
  return (
    <button
      className={`flex w-full items-center justify-between rounded-2xl border border-indigo-950/8 bg-[#fbfcff] px-4 py-3 text-left text-sm font-semibold shadow-sm ${className}`}
      type="button"
    >
      <span className="flex min-w-0 items-center gap-3">
        <Building2 size={18} className="shrink-0 text-[#5e5bff]" />
        <span className="truncate">{companyName}</span>
      </span>
      <ChevronDown size={16} className="shrink-0 text-slate-400" />
    </button>
  );
}
