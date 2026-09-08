"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { XCircle } from "lucide-react";
import { moduleRegistry } from "@/lib/erp/module-registry";
import {
  type AccessRequest,
  type AccessRequestStatus,
  type ProvisionedAccount,
  type RequestPayload,
  statusLabels,
  statusStyles,
} from "./admin-types";

export function AdminRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [activeStatus, setActiveStatus] = useState<AccessRequestStatus | "all">("all");
  const [error, setError] = useState("");
  const [provisionedAccount, setProvisionedAccount] =
    useState<ProvisionedAccount | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadRequests = useCallback(async () => {
    try {
      const response = await fetch("/api/azla-admin/access-requests");
      const data = (await response.json()) as RequestPayload;
      setRequests(data.requests ?? []);
    } catch {
      setError("მოთხოვნების ჩატვირთვა ვერ მოხერხდა.");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRequests();
  }, [loadRequests]);

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

      await loadRequests();
    });
  }

  const filteredRequests = useMemo(() => {
    return activeStatus === "all"
      ? requests
      : requests.filter((request) => request.status === activeStatus);
  }, [activeStatus, requests]);

  return (
    <section className="mt-8 rounded-[24px] border border-indigo-950/8 bg-white p-5 shadow-sm shadow-indigo-950/5">
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

      {error ? <p className="mt-4 text-sm font-medium text-rose-600">{error}</p> : null}
      {provisionedAccount ? (
        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <p>{provisionedAccount.companyName} აქტიურ ERP კომპანიად შეიქმნა.</p>
          <p className="mt-1 text-emerald-800">
            Login: {provisionedAccount.email}
            {provisionedAccount.temporaryPassword
              ? ` / Password: ${provisionedAccount.temporaryPassword}`
              : " / არსებული მომხმარებლის პაროლი"}
          </p>
        </div>
      ) : null}

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
