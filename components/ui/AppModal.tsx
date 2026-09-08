"use client";

import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

type AppModalTone = "default" | "danger" | "success" | "warning";

type AppModalAction = {
  label: string;
  onClick: () => void;
  tone?: "primary" | "danger" | "muted";
  disabled?: boolean;
};

export function AppModal({
  actions,
  children,
  description,
  onClose,
  open,
  title,
  tone = "default",
}: {
  actions?: AppModalAction[];
  children?: ReactNode;
  description?: string;
  onClose: () => void;
  open: boolean;
  title: string;
  tone?: AppModalTone;
}) {
  if (!open) return null;

  const Icon = tone === "danger" ? XCircle : tone === "success" ? CheckCircle2 : tone === "warning" ? AlertTriangle : Info;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/80 bg-white shadow-2xl shadow-slate-950/20">
        <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
          <span className={iconClassName(tone)}>
            <Icon size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black text-slate-900">{title}</h2>
            {description ? <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">{description}</p> : null}
          </div>
          <button
            className="rounded-xl px-2.5 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            onClick={onClose}
            type="button"
          >
            დახურვა
          </button>
        </div>
        {children ? <div className="px-5 py-4 text-sm font-semibold leading-6 text-slate-600">{children}</div> : null}
        {actions?.length ? (
          <div className="flex flex-wrap justify-end gap-2 bg-slate-50 px-5 py-4">
            {actions.map((action) => (
              <button
                className={actionClassName(action.tone)}
                disabled={action.disabled}
                key={action.label}
                onClick={action.onClick}
                type="button"
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function iconClassName(tone: AppModalTone) {
  if (tone === "danger") return "grid size-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600";
  if (tone === "success") return "grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600";
  if (tone === "warning") return "grid size-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600";
  return "grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-[#5e5bff]";
}

function actionClassName(tone: AppModalAction["tone"] = "primary") {
  if (tone === "danger") {
    return "rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-rose-600/15 disabled:cursor-not-allowed disabled:opacity-60";
  }

  if (tone === "muted") {
    return "rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-600 shadow-sm hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60";
  }

  return "rounded-xl bg-[#5e5bff] px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-[#6857ff]/20 disabled:cursor-not-allowed disabled:opacity-60";
}
