"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Bot,
  Boxes,
  Building2,
  CalendarDays,
  ChevronRight,
  Layers3,
  PackagePlus,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { CompanySwitcher } from "@/components/erp/CompanySwitcher";
import { ErpSidebar } from "@/components/erp/ErpSidebar";
import { demoCompany } from "@/lib/erp/company-modules";

type DashboardModule = {
  key: string;
  name: string;
  category: string;
  route: string;
};

type DashboardData = {
  user: { name: string; email: string };
  company: { id: string; name: string; legalName?: string | null; taxId?: string | null };
  role: { name: string };
  metrics: {
    enabledModules: number;
    availableModules: number;
    teamMembers: number;
    unreadNotifications: number;
  };
  enabledModules: DashboardModule[];
  plannedModules: DashboardModule[];
};

const fallbackDashboard: DashboardData = {
  user: { name: "გიორგი", email: "admin@azla.ge" },
  company: { id: demoCompany.id, name: demoCompany.name },
  role: { name: "Admin" },
  metrics: {
    enabledModules: demoCompany.moduleStates.filter((state) => state.enabled).length,
    availableModules: demoCompany.moduleStates.length,
    teamMembers: 1,
    unreadNotifications: 0,
  },
  enabledModules: [],
  plannedModules: [],
};

const metricCards = [
  { key: "enabledModules", title: "ჩართული მოდულები", icon: Layers3, tint: "bg-[#f0edff] text-[#5e5bff]" },
  { key: "availableModules", title: "სულ მოდულები", icon: Boxes, tint: "bg-blue-50 text-blue-600" },
  { key: "teamMembers", title: "მომხმარებლები", icon: Users, tint: "bg-emerald-50 text-emerald-600" },
  { key: "unreadNotifications", title: "შეტყობინებები", icon: Bell, tint: "bg-rose-50 text-rose-500" },
] as const;

export default function ErpDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData>(fallbackDashboard);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("azla_access_token");

    fetch("/api/erp/dashboard", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Dashboard data unavailable.");
        }

        return response.json() as Promise<DashboardData>;
      })
      .then((data) => {
        setDashboard(data);
        setError("");
      })
      .catch(() => {
        setError("Dashboard მონაცემების ჩატვირთვა ვერ მოხერხდა.");
      });
  }, []);

  const setupProgress = useMemo(() => {
    if (dashboard.metrics.availableModules === 0) {
      return 0;
    }

    return Math.round(
      (dashboard.metrics.enabledModules / dashboard.metrics.availableModules) * 100,
    );
  }, [dashboard.metrics.availableModules, dashboard.metrics.enabledModules]);

  return (
    <main className="min-h-screen bg-[#F7F8FC] text-[#151B32]">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <ErpSidebar activeRoute="/erp/dashboard" initialCompany={demoCompany} />

        <section className="erp-adaptive-density min-w-0 p-5 sm:p-6">
          <header className="mb-5 flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="mb-1 text-[12px] font-semibold uppercase leading-4 tracking-[0.16em] text-[#5B55F7]">Dashboard</p>
              <h1 className="text-[32px] font-bold leading-10">მთავარი გვერდი</h1>
              <p className="mt-1 text-[14px] font-normal leading-5 text-[#707A91]">გამარჯობა, {dashboard.user.name}!</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <CompanySwitcher
                className="min-w-56 bg-white lg:hidden"
                companyName={dashboard.company.name}
              />
              <button className="inline-flex h-[42px] items-center gap-2 rounded-[11px] border border-[#E3E6EE] bg-white px-4 text-[13px] font-medium leading-5 shadow-[0_3px_10px_rgba(15,23,42,0.04)]" type="button">
                მიმდინარე პერიოდი
                <CalendarDays size={16} className="text-slate-400" />
              </button>
              <button className="relative grid size-[42px] place-items-center rounded-[11px] border border-[#E3E6EE] bg-white text-[#707A91] shadow-[0_3px_10px_rgba(15,23,42,0.04)]" type="button" aria-label="შეტყობინებები">
                <Bell size={18} />
                {dashboard.metrics.unreadNotifications > 0 ? (
                  <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                    {dashboard.metrics.unreadNotifications}
                  </span>
                ) : null}
              </button>
            </div>
          </header>

          {error ? (
            <div className="mb-5 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
              {error}
            </div>
          ) : null}

          <section className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-4">
            {metricCards.map((metric) => {
              const Icon = metric.icon;
              return (
                <article key={metric.key} className="min-h-[132px] rounded-2xl border border-[#E3E6EE] bg-white p-5 shadow-[0_4px_14px_rgba(15,23,42,0.03)]">
                  <div className="flex items-start gap-4">
                    <div className={`grid size-11 shrink-0 place-items-center rounded-xl ${metric.tint}`}>
                      <Icon size={22} />
                    </div>
                    <div className="min-w-0">
                      <p className="m-0 text-[13px] font-semibold leading-5 text-[#535D74]">{metric.title}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3">
                        <p className="text-[27px] font-bold leading-[34px] text-[#151B32]">{dashboard.metrics[metric.key]}</p>
                        <span className={metric.key === "unreadNotifications" ? "rounded-lg bg-[#FFEBEF] px-2.5 py-1.5 text-[11px] font-semibold leading-4 text-[#E53555]" : "rounded-lg bg-[#E4F8EF] px-2.5 py-1.5 text-[11px] font-semibold leading-4 text-[#07945B]"}>
                          {metric.key === "unreadNotifications" ? "საყურადღებო" : "აქტიური"}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] font-normal leading-4 text-[#8991A4]">{metricDescription(metric.key, setupProgress)}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="mt-3.5 grid gap-3.5 xl:grid-cols-[minmax(0,1.65fr)_minmax(380px,1fr)]">
            <article className="min-h-[335px] overflow-hidden rounded-2xl border border-[#E3E6EE] bg-white shadow-[0_4px_14px_rgba(15,23,42,0.03)]">
              <div className="flex items-start justify-between gap-4 px-5 py-4">
                <div>
                  <h2 className="text-[17px] font-bold leading-6">ERP აქტივობა</h2>
                  <p className="mt-1 text-[12px] leading-[18px] text-[#707A91]">{dashboard.company.legalName ?? dashboard.company.name}</p>
                </div>
                <PeriodTabs />
              </div>
              <div className="flex h-[250px] px-5 pb-5 pt-2">
                <div className="flex w-11 flex-col justify-between pb-7 text-[10px] text-[#8991A4]">
                  <span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span>
                </div>
                <div className="relative min-w-0 flex-1">
                  {[20, 40, 60, 80].map((top) => <span className="absolute left-0 right-0 border-t border-dashed border-[#E5E8EF]" key={top} style={{ top: `${top}%` }} />)}
                  <svg className="relative z-10 h-[calc(100%-26px)] w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 520 190">
                    <path d={`M0 170 C90 145 120 95 210 112 C300 130 330 54 420 72 C470 82 500 ${180 - setupProgress} 520 ${170 - setupProgress}`} fill="none" stroke="#5B55F7" strokeLinecap="round" strokeWidth="4" />
                    <path d={`M0 170 C90 145 120 95 210 112 C300 130 330 54 420 72 C470 82 500 ${180 - setupProgress} 520 ${170 - setupProgress} L520 190 L0 190 Z`} fill="url(#dashboardArea)" opacity="0.18" />
                    <defs>
                      <linearGradient id="dashboardArea" x1="0" x2="0" y1="0" y2="1">
                        <stop stopColor="#5B55F7" />
                        <stop offset="1" stopColor="#5B55F7" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="flex justify-between text-[10px] text-[#7D869B]">
                    <span>ორშ</span><span>სამ</span><span>ოთხ</span><span>ხუთ</span><span>პარ</span><span>შაბ</span>
                  </div>
                </div>
              </div>
            </article>

            <article className="min-h-[335px] overflow-hidden rounded-2xl border border-[#E3E6EE] bg-white shadow-[0_4px_14px_rgba(15,23,42,0.03)]">
              <div className="px-5 py-4">
                <h2 className="text-[17px] font-bold leading-6">სწრაფი მოქმედებები</h2>
                <p className="mt-1 text-[12px] leading-[18px] text-[#707A91]">ხშირად გამოყენებული ERP ოპერაციები</p>
              </div>
              <div className="grid grid-cols-2 gap-2.5 px-5 pb-5 sm:grid-cols-3">
                <QuickAction href="/erp/products" icon={<PackagePlus size={21} />} label="პროდუქტი" sublabel="კატალოგი" tone="purple" />
                <QuickAction href="/erp/purchases" icon={<ShoppingCart size={21} />} label="შესყიდვა" sublabel="ორდერი" tone="green" />
                <QuickAction href="/erp/discounts" icon={<TrendingUp size={21} />} label="ფასდაკლება" sublabel="Pricing" tone="orange" />
                <QuickAction href="/erp/integrations" icon={<RefreshCw size={21} />} label="სინქრონი" sublabel="Balance" tone="blue" />
                <QuickAction href="/erp/modules" icon={<Layers3 size={21} />} label="მოდულები" sublabel="წვდომები" tone="purple" />
                <QuickAction href="/erp/request" icon={<ShieldCheck size={21} />} label="მოთხოვნა" sublabel="აქტივაცია" tone="green" />
              </div>
            </article>
          </section>

          <section className="mt-3.5 grid gap-3.5 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1.1fr)_minmax(300px,0.9fr)]">
            <ModuleList title="ჩართული მოდულები" modules={dashboard.enabledModules} emptyText="ამ კომპანიაზე მოდულები ჯერ არ არის ჩართული." />
            <OperationsCard />
            <AlertsCard setupProgress={setupProgress} unread={dashboard.metrics.unreadNotifications} />
          </section>

          <section className="mt-3.5 grid gap-3.5 xl:grid-cols-[1fr_1fr]">
            <CompanyCard dashboard={dashboard} setupProgress={setupProgress} />
            <SyncCard />
          </section>
        </section>
      </div>
      <button className="fixed bottom-20 right-6 grid size-12 place-items-center rounded-[15px] bg-[#5B55F7] text-white shadow-[0_10px_25px_rgba(91,85,247,0.28)]" type="button" aria-label="AI ასისტენტი">
        <Bot size={22} />
      </button>
    </main>
  );
}

function metricDescription(key: keyof DashboardData["metrics"], setupProgress: number) {
  const descriptions: Record<keyof DashboardData["metrics"], string> = {
    availableModules: "სისტემაში ხელმისაწვდომი ფუნქციები",
    enabledModules: `setup პროგრესი ${setupProgress}%`,
    teamMembers: "კომპანიის აქტიური მომხმარებლები",
    unreadNotifications: "გადაუმოწმებელი შეტყობინებები",
  };
  return descriptions[key];
}

function PeriodTabs() {
  return (
    <div className="flex gap-1.5">
      {["დღე", "კვირა", "თვე"].map((period, index) => (
        <button className={index === 1 ? "h-9 rounded-lg bg-[#5B55F7] px-3.5 text-[12px] font-semibold leading-4 text-white" : "h-9 rounded-lg bg-[#F1F3F8] px-3.5 text-[12px] font-semibold leading-4 text-[#606A80]"} key={period} type="button">
          {period}
        </button>
      ))}
    </div>
  );
}

function QuickAction({ href, icon, label, sublabel, tone }: { href: string; icon: React.ReactNode; label: string; sublabel: string; tone: "blue" | "green" | "orange" | "purple" }) {
  const tones = {
    blue: "bg-[#EAF2FF] text-[#3478E5]",
    green: "bg-[#E4F8EF] text-[#07945B]",
    orange: "bg-[#FFF3D9] text-[#D98400]",
    purple: "bg-[#EFEDFF] text-[#5B55F7]",
  };
  return (
    <Link className="flex min-h-28 flex-col items-center justify-center rounded-[13px] border border-[#E3E6EE] bg-white text-center transition hover:-translate-y-0.5 hover:border-[#C9C5FF] hover:bg-[#FAF9FF] hover:shadow-[0_8px_20px_rgba(91,85,247,0.10)]" href={href}>
      <span className={`mb-2 grid size-10 place-items-center rounded-full ${tones[tone]}`}>{icon}</span>
      <strong className="text-[12px] font-semibold leading-4 text-[#151B32]">{label}</strong>
      <small className="mt-1 text-[10px] leading-4 text-[#9299AA]">{sublabel}</small>
    </Link>
  );
}

function OperationsCard() {
  const operations = [
    { icon: "+", title: "პროდუქტის იმპორტი", sub: "Balance sync", amount: "+124", tone: "income" },
    { icon: "₾", title: "შესყიდვის ორდერი", sub: "დრაფტი", amount: "-320", tone: "expense" },
    { icon: "%", title: "ფასდაკლების წესი", sub: "აქტიური", amount: "5%", tone: "neutral" },
  ];
  return (
    <article className="overflow-hidden rounded-2xl border border-[#E3E6EE] bg-white shadow-[0_4px_14px_rgba(15,23,42,0.03)]">
      <CardHeader href="/erp/purchases" subtitle="ბოლო სისტემური მოვლენები" title="ოპერაციები" />
      <div className="px-3.5 pb-3.5">
        {operations.map((operation) => (
          <div className="grid min-h-[54px] grid-cols-[34px_minmax(0,1fr)_auto_auto] items-center gap-2.5 border-b border-[#EDF0F4] last:border-b-0 hover:bg-[#FAFAFF]" key={operation.title}>
            <span className="grid size-[30px] place-items-center rounded-lg bg-[#EFEDFF] text-[12px] font-semibold text-[#5B55F7]">{operation.icon}</span>
            <span className="min-w-0">
              <strong className="block truncate text-[11px] font-semibold leading-4 text-[#151B32]">{operation.title}</strong>
              <small className="mt-0.5 block truncate text-[9px] leading-3 text-[#858DA0]">{operation.sub}</small>
            </span>
            <span className={operation.tone === "income" ? "text-[11px] font-semibold text-[#07945B]" : operation.tone === "expense" ? "text-[11px] font-semibold text-[#E53555]" : "text-[11px] font-semibold text-[#4E5870]"}>{operation.amount}</span>
            <time className="text-[9px] text-[#858DA0]">დღეს</time>
          </div>
        ))}
      </div>
    </article>
  );
}

function AlertsCard({ setupProgress, unread }: { setupProgress: number; unread: number }) {
  const alerts = [
    { icon: <AlertTriangle size={16} />, title: "Setup პროგრესი", sub: `${setupProgress}% დასრულებულია`, tone: "orange" },
    { icon: <Bell size={16} />, title: "შეტყობინებები", sub: `${unread} ახალი`, tone: unread ? "red" : "green" },
    { icon: <Sparkles size={16} />, title: "AI ასისტენტი", sub: "კომპანიის context მზადაა", tone: "purple" },
  ];
  return (
    <article className="overflow-hidden rounded-2xl border border-[#E3E6EE] bg-white shadow-[0_4px_14px_rgba(15,23,42,0.03)]">
      <CardHeader subtitle="საყურადღებო საკითხები" title="ალერტები" />
      <div className="px-3.5 pb-3.5">
        {alerts.map((alert) => (
          <div className="grid min-h-[61px] grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-2.5 border-b border-[#EDF0F4] last:border-b-0" key={alert.title}>
            <span className={`grid size-[34px] place-items-center rounded-[10px] ${alert.tone === "red" ? "bg-[#FFEBEF] text-[#E53555]" : alert.tone === "green" ? "bg-[#E4F8EF] text-[#07945B]" : alert.tone === "purple" ? "bg-[#EFEDFF] text-[#5B55F7]" : "bg-[#FFF3D9] text-[#D98400]"}`}>{alert.icon}</span>
            <span>
              <strong className="block text-[11px] font-semibold leading-4 text-[#151B32]">{alert.title}</strong>
              <small className="mt-1 block text-[9px] leading-3 text-[#868FA3]">{alert.sub}</small>
            </span>
            <ChevronRight size={18} className="text-[#9BA2B2]" />
          </div>
        ))}
      </div>
    </article>
  );
}

function CompanyCard({ dashboard, setupProgress }: { dashboard: DashboardData; setupProgress: number }) {
  return (
    <article className="rounded-2xl border border-[#E3E6EE] bg-white p-5 shadow-[0_4px_14px_rgba(15,23,42,0.03)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[17px] font-bold leading-6">კომპანიის გარემო</h2>
          <p className="mt-1 text-[12px] leading-[18px] text-[#707A91]">{dashboard.company.legalName ?? dashboard.company.name}</p>
        </div>
        <span className="rounded-full bg-[#E4F8EF] px-3 py-1 text-[12px] font-semibold leading-4 text-[#07945B]">{dashboard.role.name}</span>
      </div>
      <div className="mt-5 rounded-xl bg-[#F8F9FC] p-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[13px] font-semibold leading-5 text-[#535D74]">ERP setup</p>
          <p className="text-[13px] font-semibold leading-5 text-[#5B55F7]">{setupProgress}%</p>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
          <span className="block h-full rounded-full bg-[#5B55F7]" style={{ width: `${setupProgress}%` }} />
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <InfoRow icon={<Building2 size={18} />} label="საიდენტიფიკაციო" value={dashboard.company.taxId ?? "არ არის მითითებული"} />
        <InfoRow icon={<ShieldCheck size={18} />} label="მომხმარებელი" value={dashboard.user.email} />
      </div>
    </article>
  );
}

function SyncCard() {
  return (
    <article className="flex min-h-[86px] flex-wrap items-center justify-between gap-5 rounded-2xl border border-[#E3E6EE] bg-white px-5 py-4 shadow-[0_4px_14px_rgba(15,23,42,0.03)]">
      <div className="flex items-center gap-3">
        <RefreshCw size={24} className="text-[#5B55F7]" />
        <span>
          <strong className="block text-[13px] font-semibold leading-5">Balance სინქრონიზაცია</strong>
          <span className="mt-1 inline-flex rounded-full bg-[#E4F8EF] px-2.5 py-1 text-[10px] font-semibold leading-3 text-[#07945B]">აქტიური</span>
        </span>
      </div>
      <span className="border-l border-[#E3E6EE] pl-3 text-[10px] leading-4 text-[#858DA0]">ბოლო განახლება: დღეს</span>
      <Link className="h-9 rounded-lg border border-[#D2CEFF] bg-white px-3.5 py-2 text-[11px] font-semibold leading-4 text-[#5B55F7]" href="/erp/integrations">განახლება</Link>
    </article>
  );
}

function CardHeader({ href, subtitle, title }: { href?: string; subtitle: string; title: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4">
      <div>
        <h2 className="text-[17px] font-bold leading-6">{title}</h2>
        <p className="mt-1 text-[12px] leading-[18px] text-[#707A91]">{subtitle}</p>
      </div>
      {href ? <Link className="shrink-0 text-[12px] font-semibold leading-4 text-[#5B55F7]" href={href}>ნახვა</Link> : null}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#fbfcff] p-4">
      <span className="grid size-10 place-items-center rounded-2xl bg-white text-[#5e5bff] shadow-sm">
        {icon}
      </span>
      <span>
        <span className="block text-xs font-semibold text-slate-400">{label}</span>
        <span className="mt-1 block text-sm font-bold text-slate-700">{value}</span>
      </span>
    </div>
  );
}

function ModuleList({
  emptyText,
  modules,
  title,
}: {
  emptyText: string;
  modules: DashboardModule[];
  title: string;
}) {
  return (
    <article className="rounded-[24px] border border-indigo-950/8 bg-white p-5 shadow-sm shadow-indigo-950/5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
        <Link href="/erp/modules" className="text-sm font-bold text-[#5e5bff]">
          მართვა
        </Link>
      </div>
      <div className="grid gap-3">
        {modules.map((module) => (
          <Link
            key={module.key}
            href={module.route}
            className="flex items-center justify-between rounded-2xl bg-[#fbfcff] p-4 text-left transition hover:bg-[#f7f5ff]"
          >
            <span>
              <span className="block font-bold">{module.name}</span>
              <span className="mt-1 block text-xs font-semibold uppercase text-slate-400">
                {module.category}
              </span>
            </span>
            <ChevronRight size={17} className="text-slate-400" />
          </Link>
        ))}
        {modules.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-indigo-950/12 bg-[#fbfcff] p-6 text-center text-sm font-semibold text-slate-400">
            {emptyText}
          </p>
        ) : null}
      </div>
    </article>
  );
}
