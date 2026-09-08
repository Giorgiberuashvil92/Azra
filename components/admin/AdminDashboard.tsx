"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  Building2,
  CheckCircle2,
  Clock3,
  Inbox,
  LayoutDashboard,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { moduleRegistry } from "@/lib/erp/module-registry";
import type { ProvisionedAccount } from "./admin-types";

type AccessRequestStatus = "new" | "contacted" | "approved" | "rejected";

type AccessRequest = {
  id: string;
  companyName: string;
  legalName?: string | null;
  taxId?: string | null;
  industry?: string | null;
  employeeCount?: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
  selectedModules: string[];
  note?: string | null;
  status: AccessRequestStatus;
  createdAt: string;
};

type Company = {
  id: string;
  name: string;
  taxId?: string | null;
  status: string;
  users: unknown[];
  modules: { status: string; module: { key: string; name: string } }[];
};

type RequestPayload = {
  requests: AccessRequest[];
  stats: {
    totalRequests: number;
    activeCompanies: number;
    byStatus: Partial<Record<AccessRequestStatus, number>>;
  };
};

const statusLabels: Record<AccessRequestStatus, string> = {
  new: "ახალი",
  contacted: "დაკავშირებული",
  approved: "დამტკიცებული",
  rejected: "უარყოფილი",
};

const statusStyles: Record<AccessRequestStatus, string> = {
  new: "bg-[#f0edff] text-[#5e5bff]",
  contacted: "bg-sky-50 text-sky-600",
  approved: "bg-emerald-50 text-emerald-600",
  rejected: "bg-rose-50 text-rose-600",
};

export function AdminDashboard() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stats, setStats] = useState<RequestPayload["stats"]>({
    totalRequests: 0,
    activeCompanies: 0,
    byStatus: {},
  });
  const [activeStatus, setActiveStatus] = useState<AccessRequestStatus | "all">("all");
  const [error, setError] = useState("");
  const [provisionedAccount, setProvisionedAccount] =
    useState<ProvisionedAccount | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadAdminData = useCallback(async () => {
    try {
      const [requestResponse, companyResponse] = await Promise.all([
        fetch("/api/azla-admin/access-requests"),
        fetch("/api/azla-admin/companies"),
      ]);
      const requestData = (await requestResponse.json()) as RequestPayload;
      const companyData = (await companyResponse.json()) as Company[];

      setRequests(requestData.requests ?? []);
      setStats(requestData.stats ?? { totalRequests: 0, activeCompanies: 0, byStatus: {} });
      setCompanies(Array.isArray(companyData) ? companyData : []);
    } catch {
      setError("Admin მონაცემების ჩატვირთვა ვერ მოხერხდა.");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAdminData();
  }, [loadAdminData]);

  function updateStatus(id: string, status: AccessRequestStatus) {
    setError("");
    setProvisionedAccount(null);
    startTransition(async () => {
      const response = await fetch(`/api/azla-admin/access-requests/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError("სტატუსის შეცვლა ვერ მოხერხდა.");
        return;
      }

      if (status === "approved" && payload.account) {
        setProvisionedAccount(payload.account);
      }

      await loadAdminData();
    });
  }

  const filteredRequests = useMemo(() => {
    if (activeStatus === "all") {
      return requests;
    }

    return requests.filter((request) => request.status === activeStatus);
  }, [activeStatus, requests]);

  return (
    <div className="min-h-screen bg-[#f7f9ff] text-[#101936]">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-indigo-950/8 bg-white px-5 py-6 lg:block">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#5f63ff] to-[#d968e8] text-lg font-semibold text-white shadow-lg shadow-violet-500/25">
            A
          </span>
          <div>
            <p className="text-lg font-semibold">AZLA Admin</p>
            <p className="text-xs font-medium text-slate-400">Platform control</p>
          </div>
        </div>

        <nav className="mt-8 grid gap-2 text-sm font-semibold">
          <Link className="flex items-center gap-3 rounded-2xl bg-[#f0edff] px-4 py-3 text-[#5e5bff]" href="/azla-admin">
            <LayoutDashboard size={18} />
            Overview
          </Link>
          <Link className="flex items-center gap-3 rounded-2xl px-4 py-3 text-slate-500 hover:bg-[#fbfcff]" href="/azla-admin/requests">
            <Inbox size={18} />
            მოთხოვნები
          </Link>
          <Link className="flex items-center gap-3 rounded-2xl px-4 py-3 text-slate-500 hover:bg-[#fbfcff]" href="/azla-admin/companies">
            <Building2 size={18} />
            კომპანიები
          </Link>
        </nav>
      </aside>

      <main className="px-5 py-6 lg:ml-72 lg:px-8 xl:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#5e5bff]">Super Admin</p>
            <h1 className="mt-1 text-3xl font-semibold">მართვის პანელი</h1>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-indigo-950/8 bg-white px-4 py-3 shadow-sm">
            <ShieldCheck className="text-[#5e5bff]" size={19} />
            <span className="text-sm font-semibold text-slate-600">Internal workspace</span>
          </div>
        </header>

        {error ? (
          <div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
            {error}
          </div>
        ) : null}
        {provisionedAccount ? (
          <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <p>{provisionedAccount.companyName} აქტიურ ERP კომპანიად შეიქმნა.</p>
            <p className="mt-1 text-emerald-800">
              Login: {provisionedAccount.email}
              {provisionedAccount.temporaryPassword
                ? ` / Password: ${provisionedAccount.temporaryPassword}`
                : " / არსებული მომხმარებლის პაროლი"}
            </p>
          </div>
        ) : null}

        <section id="overview" className="mt-8 grid gap-4 md:grid-cols-4">
          <Metric title="ყველა მოთხოვნა" value={stats.totalRequests} icon={<Inbox size={20} />} />
          <Metric title="დასამუშავებელი" value={stats.byStatus.new ?? 0} icon={<Clock3 size={20} />} />
          <Metric title="დამტკიცებული" value={stats.byStatus.approved ?? 0} icon={<CheckCircle2 size={20} />} />
          <Metric title="აქტიური კომპანიები" value={companies.length || stats.activeCompanies} icon={<Building2 size={20} />} />
        </section>

        <section id="requests" className="mt-8 rounded-[24px] border border-indigo-950/8 bg-white p-5 shadow-sm shadow-indigo-950/5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">წვდომის მოთხოვნები</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">ახალი კომპანიების შემოსული განაცხადები</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", "new", "contacted", "approved", "rejected"] as const).map((status) => (
                <button
                  key={status}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    activeStatus === status ? "bg-[#5e5bff] text-white" : "bg-[#f7f9ff] text-slate-500"
                  }`}
                  onClick={() => setActiveStatus(status)}
                  type="button"
                >
                  {status === "all" ? "ყველა" : statusLabels[status]}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="text-xs font-semibold uppercase text-slate-400">
                <tr className="border-b border-indigo-950/8">
                  <th className="py-3 pr-4">კომპანია</th>
                  <th className="py-3 pr-4">კოდი</th>
                  <th className="py-3 pr-4">კონტაქტი</th>
                  <th className="py-3 pr-4">მოდულები</th>
                  <th className="py-3 pr-4">სტატუსი</th>
                  <th className="py-3 pr-4">ქმედება</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="border-b border-indigo-950/6 last:border-0">
                    <td className="py-4 pr-4">
                      <p className="font-semibold">{request.companyName}</p>
                      <p className="mt-1 text-xs font-medium text-slate-400">{request.industry ?? "ინდუსტრია არ არის მითითებული"}</p>
                    </td>
                    <td className="py-4 pr-4 font-medium text-slate-500">{request.taxId ?? "-"}</td>
                    <td className="py-4 pr-4">
                      <p className="font-semibold">{request.contactName}</p>
                      <p className="mt-1 text-xs font-medium text-slate-400">{request.contactEmail}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex max-w-sm flex-wrap gap-1.5">
                        {request.selectedModules.slice(0, 4).map((key) => (
                          <span key={key} className="rounded-full bg-[#f0edff] px-2.5 py-1 text-xs font-semibold text-[#5e5bff]">
                            {moduleRegistry.find((module) => module.key === key)?.name ?? key}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[request.status]}`}>
                        {statusLabels[request.status]}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex gap-2">
                        <ActionButton
                          disabled={isPending || request.status !== "new"}
                          label="დაკავშირება"
                          onClick={() => updateStatus(request.id, "contacted")}
                        />
                        <ActionButton
                          disabled={isPending || request.status === "approved" || request.status === "rejected"}
                          label="დამტკიცება"
                          onClick={() => updateStatus(request.id, "approved")}
                        />
                        <button
                          className="grid size-9 place-items-center rounded-xl bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:opacity-60"
                          disabled={isPending || request.status === "approved" || request.status === "rejected"}
                          onClick={() => updateStatus(request.id, "rejected")}
                          title="უარყოფა"
                          type="button"
                        >
                          <XCircle size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td className="py-10 text-center font-medium text-slate-400" colSpan={6}>
                      მოთხოვნები ჯერ არ არის
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section id="companies" className="mt-8 rounded-[24px] border border-indigo-950/8 bg-white p-5 shadow-sm shadow-indigo-950/5">
          <h2 className="text-xl font-semibold">აქტიური კომპანიები</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">დამტკიცებული tenant / ERP workspace-ები</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {companies.map((company) => (
              <article key={company.id} className="rounded-2xl border border-indigo-950/8 bg-[#fbfcff] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{company.name}</h3>
                    <p className="mt-1 text-xs font-medium text-slate-400">{company.taxId ?? "კოდი არ არის მითითებული"}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                    {company.status}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm font-medium text-slate-500">
                  <span>{company.users.length} მომხმარებელი</span>
                  <span>{company.modules.filter((module) => module.status === "enabled").length} მოდული</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function Metric({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
}) {
  return (
    <article className="rounded-[22px] border border-indigo-950/8 bg-white p-5 shadow-sm shadow-indigo-950/5">
      <span className="grid size-11 place-items-center rounded-2xl bg-[#f0edff] text-[#5e5bff]">
        {icon}
      </span>
      <p className="mt-4 text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
    </article>
  );
}

function ActionButton({
  disabled,
  label,
  onClick,
}: {
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="rounded-xl bg-[#f7f9ff] px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-[#f0edff] hover:text-[#5e5bff] disabled:opacity-60"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
