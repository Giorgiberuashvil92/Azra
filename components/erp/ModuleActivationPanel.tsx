"use client";

import { useEffect, useState, useTransition } from "react";
import {
  canDisableModule,
  demoCompany,
  getActivationPreview,
  getEnabledModuleKeys,
  resolveAtomicEnableKeys,
} from "@/lib/erp/company-modules";
import {
  moduleCategoryLabels,
  moduleRegistry,
  type ModuleCategory,
  type ModuleKey,
} from "@/lib/erp/module-registry";

const categories: ModuleCategory[] = [
  "operations",
  "finance",
  "team",
  "relationships",
  "analytics",
  "system",
];

export function ModuleActivationPanel() {
  const [company, setCompany] = useState(demoCompany);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const enabledKeys = getEnabledModuleKeys(company);

  useEffect(() => {
    const token = localStorage.getItem("azla_access_token");

    fetch("/api/erp/company-modules", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((response) => response.json())
      .then((data: { company?: typeof demoCompany }) => {
        if (data.company?.moduleStates) {
          setCompany(data.company);
        }
      })
      .catch(() => setError("მოდულების ჩატვირთვა ვერ მოხერხდა."));
  }, []);

  const updateModule = (moduleKey: ModuleKey, enabled: boolean) => {
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/erp/company-modules", {
        method: "PATCH",
        headers: {
          ...(localStorage.getItem("azla_access_token")
            ? { Authorization: `Bearer ${localStorage.getItem("azla_access_token")}` }
            : {}),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ moduleKey, enabled }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError("ოპერაცია დაბლოკილია მოდულის დამოკიდებულებების გამო.");
        return;
      }

      if (data.company?.moduleStates) {
        setCompany(data.company);
      }
    });
  };

  const enableModule = (moduleKey: ModuleKey) => {
    updateModule(moduleKey, true);
  };

  const disableModule = (moduleKey: ModuleKey) => {
    const disableState = canDisableModule(moduleKey, company);

    if (!disableState.canDisable) {
      return;
    }

    updateModule(moduleKey, false);
  };

  return (
    <div className="grid gap-6">
      {error ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
          {error}
        </div>
      ) : null}
      {categories.map((category) => {
        const modules = moduleRegistry
          .filter((module) => module.category === category)
          .sort((a, b) => a.sortOrder - b.sortOrder);

        return (
          <section
            key={category}
            className="rounded-[24px] border border-indigo-950/8 bg-white p-5 shadow-sm shadow-indigo-950/5"
          >
            <h2 className="text-lg font-bold">{moduleCategoryLabels[category]}</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {modules.map((module) => {
                const Icon = module.icon;
                const isEnabled = enabledKeys.includes(module.key);
                const activation = getActivationPreview(module.key, company);
                const disableState = canDisableModule(module.key, company);
                const atomicKeys = resolveAtomicEnableKeys(module.key, enabledKeys);

                return (
                  <article
                    key={module.key}
                    className="rounded-2xl border border-indigo-950/8 bg-[#fbfcff] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="grid size-11 place-items-center rounded-2xl bg-[#f0edff] text-[#5e5bff]">
                        <Icon size={20} />
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          isEnabled
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {isEnabled ? "ჩართულია" : "გამორთულია"}
                      </span>
                    </div>
                    <h3 className="mt-4 font-bold">{module.name}</h3>
                    <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                      {module.description}
                    </p>

                    {!isEnabled && !activation.canEnableDirectly ? (
                      <div className="mt-4 rounded-2xl bg-white p-3">
                        <p className="text-xs font-semibold text-slate-400">
                          საჭიროებს
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {activation.missingDependencies.map((dependency) => (
                            <span
                              key={dependency?.key}
                              className="rounded-full bg-[#f0edff] px-2.5 py-1 text-xs font-semibold text-[#5e5bff]"
                            >
                              {dependency?.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {isEnabled && !disableState.canDisable ? (
                      <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-700">
                        გამორთვა დაბლოკილია, რადგან მასზე დამოკიდებულია{" "}
                        {disableState.blockingDependents
                          .map((dependency) => dependency?.name)
                          .join(", ")}
                        .
                      </p>
                    ) : null}

                    <button
                      className={`mt-4 w-full rounded-2xl px-4 py-3 text-sm font-bold ${
                        isEnabled
                          ? disableState.canDisable
                            ? "border border-indigo-950/8 bg-white text-slate-500"
                            : "cursor-not-allowed border border-indigo-950/8 bg-slate-100 text-slate-400"
                          : "bg-gradient-to-r from-[#5e5bff] to-[#8d55f7] text-white"
                      }`}
                      disabled={isPending || (isEnabled && !disableState.canDisable)}
                      onClick={() =>
                        isEnabled
                          ? disableModule(module.key)
                          : enableModule(module.key)
                      }
                      type="button"
                    >
                      {isEnabled
                        ? "გამორთვა"
                        : activation.canEnableDirectly
                          ? "ჩართვა"
                          : `საჭირო მოდულების ჩართვა (${atomicKeys.length})`}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
