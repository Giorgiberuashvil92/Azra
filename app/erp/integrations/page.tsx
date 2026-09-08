"use client";

import { Fragment, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, Code2, Download, Eye, Loader2, PlugZap, ShieldCheck } from "lucide-react";
import { CoreModuleShell, getAuthHeaders } from "@/components/erp/CoreModuleShell";

type BalancePreviewProduct = {
  externalUid: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  category: string | null;
  brand: string | null;
  manufacturer: string | null;
  countryOfOrigin: string | null;
  supplierSku: string | null;
  rsName: string | null;
  unit: string;
  salePrice: number;
  vatRate: number;
  discountPercent: number | null;
  discountAmount: number | null;
  discountName: string | null;
  discountCondition: string | null;
  discountSchedule: string | null;
  stockQuantity: number;
  reservedQuantity: number;
  seriesCount: number;
  nearestExpiryDate: string | null;
  stockBreakdown: {
    warehouseUid: string;
    warehouseName: string | null;
    quantity: number;
    reserve: number;
    seriesUid: string | null;
    seriesName: string | null;
    expiryDate: string | null;
  }[];
  requestData?: {
    item: Record<string, unknown>;
    prices: Record<string, unknown>[];
    stocks: Record<string, unknown>[];
    discounts: Record<string, unknown>[];
    itemSeries: Record<string, unknown>[];
  };
  action: "create" | "update" | "conflict" | "skip";
  reason?: string;
};

type BalancePreview = {
  ok: boolean;
  complete?: boolean;
  warnings?: string[];
  totals: {
    total: number;
    create: number;
    update: number;
    conflicts: number;
    skipped: number;
  };
  products: BalancePreviewProduct[];
  diagnostics?: Record<string, { ok: boolean; rows: number; error?: string }>;
};

const actionLabels: Record<BalancePreviewProduct["action"], string> = {
  create: "შეიქმნება",
  update: "განახლდება",
  conflict: "კონფლიქტია",
  skip: "გამოტოვება",
};

export default function IntegrationsPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<"test" | "preview" | "import" | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [preview, setPreview] = useState<BalancePreview | null>(null);
  const [openRequestDataUid, setOpenRequestDataUid] = useState<string | null>(null);
  const [form, setForm] = useState({
    publicationId: "",
    username: "",
    password: "",
    authorization: "",
    itemsUrl: "",
  });

  useEffect(() => {
    fetch("/api/erp/integrations/balance/settings", {
      headers: getAuthHeaders(),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((settings) => {
        if (!settings) return;
        setForm({
          publicationId: settings.publicationId ?? "",
          username: settings.username ?? "",
          password: settings.hasPassword ? "••••••••" : "",
          authorization: settings.hasAuthorization ? "••••••••" : "",
          itemsUrl: settings.itemsUrl ?? "",
        });
      })
      .finally(() => setSettingsLoaded(true));
  }, []);

  async function submit(path: "test" | "preview" | "import") {
    setIsLoading(true);
    setLoadingAction(path);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/erp/integrations/balance/${path}`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, limit: 200 }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.message ?? "Balance ოპერაცია ვერ შესრულდა.");
        return;
      }

      if (path === "test") {
        setMessage(`კავშირი მუშაობს. მოიძებნა ${data.productRows ?? 0} პროდუქტი და ${data.groupRows ?? 0} ჯგუფი.`);
      }

      if (path === "preview") {
        setPreview(data);
        setMessage(data.complete === false ? "Preview ჩაიტვირთა, მაგრამ snapshot არასრულია." : "Preview მზადაა. გადაამოწმე კონფლიქტები და შემდეგ დააიმპორტე.");
      }

      if (path === "import") {
        setMessage(`იმპორტი დასრულდა. შეიქმნა ${data.created ?? 0}, განახლდა ${data.updated ?? 0}, კონფლიქტი ${data.conflicts ?? 0}.`);
        setPreview(null);
      }
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  }

  return (
    <CoreModuleShell activeRoute="/erp/integrations" eyebrow="Migration Center" title="ინტეგრაციები">
      <section className="grid gap-5">
        <div className="rounded-[24px] border border-indigo-950/8 bg-white p-5 shadow-sm">
          <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-[#f0edff] text-[#5e5bff]">
                  <PlugZap size={20} />
                </span>
                <div>
                  <h2 className="text-xl font-bold">Balance-იდან გადმოსვლა</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-400">კოდი, ავტორიზაცია, preview და კონტროლირებადი იმპორტი.</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <StepBadge active label="1. კავშირი" />
                <StepBadge active={Boolean(preview)} label="2. გადამოწმება" />
                <StepBadge active={false} label="3. იმპორტი" />
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <Input label="Balance კოდი ან Exchange URL" placeholder="7596 ან https://cloud.balance.ge/.../Balance/7596/hs/Exchange/Clients" value={form.publicationId} onChange={(value) => setForm((x) => ({ ...x, publicationId: value }))} />
                <Input label="Username" value={form.username} onChange={(value) => setForm((x) => ({ ...x, username: value }))} />
                <Input label="Password" type="password" value={form.password} onChange={(value) => setForm((x) => ({ ...x, password: value }))} />
                <div className="rounded-2xl border border-indigo-950/8 bg-[#fbfcff] px-4 py-3">
                  <p className="text-xs font-bold uppercase text-slate-400">სტატუსი</p>
                  <p className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                    <ShieldCheck size={16} className="text-emerald-500" />
                    {settingsLoaded ? "შენახული კონფიგურაცია ჩაიტვირთა" : "კონფიგურაცია იტვირთება"}
                  </p>
                </div>
              </div>

              <button
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#5e5bff]"
                onClick={() => setAdvancedOpen((value) => !value)}
                type="button"
              >
                <ChevronDown className={advancedOpen ? "rotate-180 transition" : "transition"} size={16} />
                Advanced settings
              </button>

              {advancedOpen ? (
                <div className="mt-3 grid gap-3 rounded-2xl bg-[#fbfcff] p-4 md:grid-cols-2">
                  <Input label="Custom Items URL" placeholder="მხოლოდ თუ Items endpoint ცალკე გაქვს" value={form.itemsUrl} onChange={(value) => setForm((x) => ({ ...x, itemsUrl: value }))} />
                  <label className="grid gap-2 text-sm font-semibold text-slate-600">
                    Authorization header
                    <input
                      className="rounded-2xl border border-indigo-950/8 bg-white px-4 py-3 outline-none"
                      placeholder="Basic ... ან Bearer ..."
                      value={form.authorization}
                      onChange={(event) => setForm((x) => ({ ...x, authorization: event.target.value }))}
                    />
                  </label>
                </div>
              ) : null}

              {error ? <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div> : null}
              {message ? <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{message}</div> : null}
              {loadingAction ? <LoadingNotice action={loadingAction} /> : null}

              <div className="mt-5 flex flex-wrap gap-3">
                <ActionButton active={loadingAction === "test"} disabled={isLoading} icon={<PlugZap size={16} />} label="კავშირის შემოწმება" loadingLabel="მოწმდება" onClick={() => submit("test")} />
                <ActionButton active={loadingAction === "preview"} disabled={isLoading} icon={<Eye size={16} />} label="Preview" loadingLabel="იტვირთება" onClick={() => submit("preview")} />
                <ActionButton active={loadingAction === "import"} disabled={isLoading || !preview || preview.complete === false || preview.totals.conflicts > 0} icon={<Download size={16} />} label="იმპორტი" loadingLabel="იმპორტი" onClick={() => submit("import")} primary />
              </div>
            </div>

            <div className="rounded-2xl bg-[#101936] p-5 text-white">
              <p className="text-xs font-bold uppercase text-white/50">რას გადმოვიტანთ</p>
              <div className="mt-4 grid gap-3">
                <Capability label="პროდუქტები" value="SKU, barcode, ფასი, დღგ, ბრენდი" />
                <Capability label="სტრუქტურა" value="კატეგორიის ხე Balance group-ებიდან" />
                <Capability label="მარაგი" value="საწყობები, რაოდენობა, რეზერვი, სერიები" />
                <Capability label="პირობები" value="ფასდაკლებები, პირობები, source GUID" />
              </div>
            </div>
          </div>
        </div>

        {preview ? (
          <div className="relative rounded-[24px] border border-indigo-950/8 bg-white p-5 shadow-sm">
            {loadingAction ? <PreviewOverlay action={loadingAction} /> : null}
            {preview.complete === false ? (
              <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                Snapshot არასრულია: {preview.warnings?.join(", ") || "ზოგი endpoint ვერ ჩაიტვირთა"}. Import დროებით დაბლოკილია.
              </div>
            ) : null}
            <div className="grid gap-3 md:grid-cols-5">
              <Metric label="სულ" value={preview.totals.total} />
              <Metric label="შეიქმნება" value={preview.totals.create} />
              <Metric label="განახლდება" value={preview.totals.update} />
              <Metric label="კონფლიქტი" value={preview.totals.conflicts} tone="danger" />
              <Metric label="გამოტოვება" value={preview.totals.skipped} />
            </div>

            {preview.diagnostics ? (
              <div className="mt-5 grid gap-2 md:grid-cols-5">
                {Object.entries(preview.diagnostics).map(([key, item]) => (
                  <div key={key} className={item.ok ? "rounded-2xl bg-[#fbfcff] p-3" : "rounded-2xl bg-rose-50 p-3"}>
                    <p className={item.ok ? "text-xs font-bold uppercase text-slate-400" : "text-xs font-bold uppercase text-rose-400"}>{key}</p>
                    <p className={item.ok ? "mt-1 font-black text-slate-900" : "mt-1 font-black text-rose-600"}>{item.ok ? `${item.rows} row` : "ვერ ჩაიტვირთა"}</p>
                    {item.error ? <p className="mt-1 line-clamp-2 text-xs font-semibold text-rose-500">{item.error}</p> : null}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[1480px] text-left text-sm">
                <thead className="text-xs font-semibold uppercase text-slate-400">
                  <tr className="border-b border-indigo-950/8">
                    <th className="py-3 pr-4">პროდუქტი</th>
                    <th className="py-3 pr-4">SKU</th>
                    <th className="py-3 pr-4">შტრიხკოდი</th>
                    <th className="py-3 pr-4">ბრენდი/მწარმოებელი</th>
                    <th className="py-3 pr-4">კატეგორია</th>
                    <th className="py-3 pr-4">ფასი</th>
                    <th className="py-3 pr-4">ფასდაკლება</th>
                    <th className="py-3 pr-4">ნაშთი/სერიები</th>
                    <th className="py-3 pr-4">სტატუსი</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.products.map((product) => {
                    const requestDataOpen = openRequestDataUid === product.externalUid;
                    return (
                      <Fragment key={product.externalUid}>
                        <tr className="border-b border-indigo-950/6 last:border-0">
                          <td className="py-4 pr-4">
                            <p className="font-bold">{product.name}</p>
                            <p className="mt-1 text-xs font-semibold text-slate-400">{product.externalUid}</p>
                          </td>
                          <td className="py-4 pr-4 text-slate-500">{product.sku ?? "-"}</td>
                          <td className="py-4 pr-4 text-slate-500">{product.barcode ?? "-"}</td>
                          <td className="py-4 pr-4 text-slate-500">
                            <p>{product.brand ?? product.manufacturer ?? "-"}</p>
                            {product.countryOfOrigin ? <p className="mt-1 text-xs font-semibold text-slate-400">{product.countryOfOrigin}</p> : null}
                            {product.supplierSku ? <p className="mt-1 text-xs font-semibold text-slate-400">SUP {product.supplierSku}</p> : null}
                          </td>
                          <td className="py-4 pr-4 text-slate-500">{product.category ?? "-"}</td>
                          <td className="py-4 pr-4 font-semibold">GEL {product.salePrice}</td>
                          <td className="py-4 pr-4 text-slate-500">
                            {product.discountPercent != null ? `${product.discountPercent}%` : product.discountAmount != null ? `GEL ${product.discountAmount}` : "-"}
                            {product.discountName ? <p className="mt-1 text-xs font-semibold text-slate-400">{product.discountName}</p> : null}
                            {product.discountCondition ? <p className="mt-1 text-xs font-semibold text-slate-400">{product.discountCondition}</p> : null}
                          </td>
                          <td className="py-4 pr-4">
                            <p className="font-semibold">{product.stockQuantity} / რეზ. {product.reservedQuantity}</p>
                            <p className="mt-1 text-xs font-semibold text-slate-400">
                              {product.stockBreakdown.length ? `${product.stockBreakdown.length} საწყობი/ხაზი` : "ნაშთი არ ჩანს"}
                            </p>
                            {product.seriesCount > 0 ? (
                              <p className="mt-1 text-xs font-semibold text-slate-400">
                                {product.seriesCount} სერია{product.nearestExpiryDate ? ` · ${product.nearestExpiryDate}` : ""}
                              </p>
                            ) : null}
                            {product.requestData ? (
                              <button
                                className="mt-2 inline-flex items-center gap-1 rounded-full border border-indigo-950/8 px-3 py-1 text-xs font-bold text-slate-500 hover:text-[#5e5bff]"
                                onClick={() => setOpenRequestDataUid(requestDataOpen ? null : product.externalUid)}
                                type="button"
                              >
                                <Code2 size={13} />
                                request data
                              </button>
                            ) : null}
                          </td>
                          <td className="py-4 pr-4">
                            <span className={product.action === "conflict" ? "rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600" : "rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600"}>
                              {actionLabels[product.action]}
                            </span>
                            {product.reason ? <p className="mt-2 max-w-xs text-xs font-semibold text-rose-500">{product.reason}</p> : null}
                          </td>
                        </tr>
                        {requestDataOpen ? (
                          <tr className="border-b border-indigo-950/6">
                            <td className="bg-[#fbfcff] py-4 pr-4" colSpan={9}>
                              <pre className="max-h-[420px] overflow-auto rounded-2xl bg-[#101936] p-4 text-xs font-semibold leading-5 text-white/85">
                                {JSON.stringify(product.requestData, null, 2)}
                              </pre>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </section>
    </CoreModuleShell>
  );
}

function Input({ label, onChange, placeholder, type = "text", value }: { label: string; onChange: (value: string) => void; placeholder?: string; type?: string; value: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-600">
      {label}
      <input className="rounded-2xl border border-indigo-950/8 bg-white px-4 py-3 outline-none" placeholder={placeholder} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function StepBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <div className={active ? "rounded-2xl border border-[#5e5bff]/20 bg-[#f0edff] px-4 py-3 text-sm font-black text-[#5e5bff]" : "rounded-2xl border border-indigo-950/8 bg-[#fbfcff] px-4 py-3 text-sm font-black text-slate-400"}>
      {label}
    </div>
  );
}

function Capability({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/8 p-3">
      <p className="text-sm font-black">{label}</p>
      <p className="mt-1 text-xs font-semibold text-white/55">{value}</p>
    </div>
  );
}

function ActionButton({ active = false, disabled, icon, label, loadingLabel, onClick, primary = false }: { active?: boolean; disabled?: boolean; icon: ReactNode; label: string; loadingLabel?: string; onClick: () => void; primary?: boolean }) {
  return (
    <button
      className={primary ? "inline-flex items-center gap-2 rounded-2xl bg-[#5e5bff] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50" : "inline-flex items-center gap-2 rounded-2xl border border-indigo-950/8 bg-white px-4 py-3 text-sm font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {active ? <Loader2 className="animate-spin" size={16} /> : icon}
      {active ? loadingLabel ?? label : label}
    </button>
  );
}

function LoadingNotice({ action }: { action: "test" | "preview" | "import" }) {
  const labels = {
    test: "Balance კავშირი მოწმდება",
    preview: "Balance მონაცემები იტვირთება და იჯამება",
    import: "იმპორტი მიმდინარეობს",
  };

  return (
    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#5e5bff]/15 bg-[#f0edff] px-4 py-3 text-sm font-bold text-[#5e5bff]">
      <Loader2 className="animate-spin" size={18} />
      {labels[action]}
    </div>
  );
}

function PreviewOverlay({ action }: { action: "test" | "preview" | "import" }) {
  if (action === "test") return null;
  return (
    <div className="absolute inset-0 z-10 grid place-items-center rounded-[24px] bg-white/75 backdrop-blur-[2px]">
      <div className="flex items-center gap-3 rounded-2xl border border-indigo-950/8 bg-white px-5 py-4 text-sm font-black text-slate-700 shadow-xl shadow-indigo-950/10">
        <Loader2 className="animate-spin text-[#5e5bff]" size={20} />
        {action === "preview" ? "Preview ახლდება" : "პროდუქტები იმპორტდება"}
      </div>
    </div>
  );
}

function Metric({ label, tone, value }: { label: string; tone?: "danger"; value: number }) {
  return (
    <div className={tone === "danger" ? "rounded-2xl bg-rose-50 p-4" : "rounded-2xl bg-[#fbfcff] p-4"}>
      <p className={tone === "danger" ? "text-xs font-bold uppercase text-rose-400" : "text-xs font-bold uppercase text-slate-400"}>{label}</p>
      <p className={tone === "danger" ? "mt-2 text-2xl font-black text-rose-600" : "mt-2 text-2xl font-black text-slate-900"}>{value}</p>
    </div>
  );
}
