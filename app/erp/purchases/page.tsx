"use client";

import { useEffect, useState } from "react";
import { Download, PackageCheck } from "lucide-react";
import { CoreModuleShell, getAuthHeaders } from "@/components/erp/CoreModuleShell";

type Warehouse = { id: string; name: string };
type Product = { id: string; name: string; sku?: string | null };
type Purchase = {
  id: string;
  supplierName: string;
  documentNumber: string;
  status: string;
  total: string;
  warehouse?: Warehouse | null;
  lines: Array<{ id: string; externalName: string; product?: Product | null; quantity: string; unitCost: string }>;
};

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [error, setError] = useState("");
  const [isImportOpen, setIsImportOpen] = useState(false);

  async function loadData() {
    const headers = getAuthHeaders();
    const [purchaseResponse, warehouseResponse] = await Promise.all([
      fetch("/api/erp/purchases", { headers }),
      fetch("/api/erp/warehouses", { headers }),
    ]);
    setPurchases(purchaseResponse.ok ? await purchaseResponse.json() : []);
    setWarehouses(warehouseResponse.ok ? await warehouseResponse.json() : []);
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function importPurchase(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/erp/purchases/import", {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        supplierName: form.get("supplierName"),
        supplierTaxId: form.get("supplierTaxId"),
        documentNumber: form.get("documentNumber"),
        documentDate: form.get("documentDate"),
        warehouseId: form.get("warehouseId") || undefined,
        lines: [
          {
            externalName: form.get("lineName"),
            externalSku: form.get("lineSku"),
            quantity: Number(form.get("quantity") || 1),
            unitCost: Number(form.get("unitCost") || 0),
            vatRate: 18,
          },
        ],
      }),
    });

    if (!response.ok) {
      setError("RS დოკუმენტის იმპორტი ვერ მოხერხდა.");
      return;
    }

    event.currentTarget.reset();
    setIsImportOpen(false);
    await loadData();
  }

  async function receivePurchase(purchase: Purchase) {
    const warehouseId = purchase.warehouse?.id ?? warehouses[0]?.id;

    if (!warehouseId) {
      setError("მიღებამდე შექმენი საწყობი.");
      return;
    }

    const response = await fetch(`/api/erp/purchases/${purchase.id}/receive`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ warehouseId }),
    });

    if (!response.ok) {
      setError("მიღება ვერ შესრულდა. ყველა ხაზი უნდა იყოს product-ზე მიბმული.");
      return;
    }

    await loadData();
  }

  return (
    <CoreModuleShell
      activeRoute="/erp/purchases"
      actions={
        <button
          className="inline-flex items-center gap-2 rounded-2xl bg-[#5e5bff] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#6857ff]/20"
          onClick={() => setIsImportOpen(true)}
          type="button"
        >
          <Download size={16} />
          RS იმპორტი
        </button>
      }
      eyebrow="RS Import"
      title="შესყიდვები"
    >
      <section className="grid gap-5">
        {isImportOpen ? (
        <form onSubmit={importPurchase} className="rounded-[24px] border border-indigo-950/8 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">RS დოკუმენტის იმპორტი</h2>
            <button className="text-sm font-bold text-slate-400 hover:text-slate-600" onClick={() => setIsImportOpen(false)} type="button">
              დახურვა
            </button>
          </div>
          <div className="mt-5 grid gap-3">
            <Input label="მომწოდებელი" name="supplierName" required />
            <Input label="მომწოდებლის კოდი" name="supplierTaxId" />
            <Input label="დოკუმენტის ნომერი" name="documentNumber" required />
            <Input label="თარიღი" name="documentDate" type="date" />
            <label className="grid gap-2 text-sm font-semibold text-slate-600">
              საწყობი
              <select className="rounded-2xl border border-indigo-950/8 bg-[#fbfcff] px-4 py-3 outline-none" name="warehouseId">
                <option value="">მიღებისას არჩევა</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                ))}
              </select>
            </label>
            <Input label="RS ხაზის დასახელება" name="lineName" required />
            <Input label="SKU match-ისთვის" name="lineSku" />
            <Input label="რაოდენობა" name="quantity" type="number" defaultValue="1" />
            <Input label="ერთეულის ფასი" name="unitCost" type="number" defaultValue="0" />
          </div>
          {error ? <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p> : null}
          <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#5e5bff] px-4 py-3 text-sm font-bold text-white" type="submit">
            <Download size={16} />
            იმპორტი
          </button>
        </form>
        ) : null}

        <section className="grid gap-3">
          {purchases.map((purchase) => (
            <article key={purchase.id} className="rounded-[24px] border border-indigo-950/8 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">{purchase.supplierName}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-400">RS #{purchase.documentNumber}</p>
                </div>
                <span className="rounded-full bg-[#f0edff] px-3 py-1 text-xs font-semibold text-[#5e5bff]">
                  {purchase.status}
                </span>
              </div>
              <div className="mt-4 grid gap-2">
                {purchase.lines.map((line) => (
                  <div key={line.id} className="rounded-2xl bg-[#fbfcff] p-3 text-sm">
                    <p className="font-bold">{line.externalName}</p>
                    <p className="mt-1 font-semibold text-slate-500">
                      Product: {line.product?.name ?? "mapping საჭიროა"} / Qty: {line.quantity} / ₾{line.unitCost}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="font-bold">სულ: ₾{purchase.total}</p>
                <button
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:bg-slate-200 disabled:text-slate-400"
                  disabled={purchase.status === "received"}
                  onClick={() => receivePurchase(purchase)}
                  type="button"
                >
                  <PackageCheck size={16} />
                  მიღება
                </button>
              </div>
            </article>
          ))}
          {purchases.length === 0 ? (
            <p className="rounded-[24px] border border-dashed border-indigo-950/12 bg-white p-10 text-center text-sm font-semibold text-slate-400">
              შესყიდვები ჯერ არ არის.
            </p>
          ) : null}
        </section>
      </section>
    </CoreModuleShell>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...inputProps } = props;
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-600">
      {label}
      <input className="rounded-2xl border border-indigo-950/8 bg-[#fbfcff] px-4 py-3 outline-none" {...inputProps} />
    </label>
  );
}
