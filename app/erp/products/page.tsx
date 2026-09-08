"use client";

import { Suspense, useEffect, useState } from "react";
import { Box, ChevronLeft, ChevronRight, MoreVertical, Pencil, Plus, Search, Settings2, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CoreModuleShell, getAuthHeaders } from "@/components/erp/CoreModuleShell";

type Product = {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  categoryId?: string | null;
  category?: string | null;
  categoryPath?: string | null;
  categoryRef?: ProductCategory | null;
  brand?: string | null;
  description?: string | null;
  unit: string;
  type: "stocked" | "service" | "expense";
  isPurchasable: boolean;
  isSellable: boolean;
  tracksInventory: boolean;
  tracksLots: boolean;
  tracksExpiry: boolean;
  costPrice: string;
  salePrice: string;
  currency: string;
  vatRate: string;
  discountPercent?: string | null;
  discountAmount?: string | null;
  discountName?: string | null;
  discountCondition?: string | null;
  discountSchedule?: string | null;
  minStock: string;
  reorderPoint: string;
  supplierSku?: string | null;
  rsName?: string | null;
  defaultWarehouseId?: string | null;
  source?: string | null;
  externalUid?: string | null;
  syncStatus?: string | null;
  stockQuantity?: number;
  reservedQuantity?: number;
  seriesCount?: number;
  nearestExpiryDate?: string | null;
  warehouseCount?: number;
  status: string;
};

type ProductCategory = {
  id: string;
  parentId: string | null;
  name: string;
  path: string;
  level: number;
  status: string;
};

type ApiError = {
  code?: string;
  message?: string;
  details?: {
    meta?: {
      target?: string[];
    };
  };
  traceId?: string;
};

type ProductView = "simple" | "accounting" | "inventory" | "balance";

const productViews: { key: ProductView; label: string }[] = [
  { key: "simple", label: "მარტივი ხედი" },
  { key: "accounting", label: "ბუღალტრული ხედი" },
  { key: "inventory", label: "მარაგები" },
  { key: "balance", label: "Balance" },
];

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsContent />
    </Suspense>
  );
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCategoryId = searchParams.get("category");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isColumnsOpen, setIsColumnsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [vatFilter, setVatFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [productView, setProductView] = useState<ProductView>("accounting");

  async function loadProducts() {
    const response = await fetch("/api/erp/products", { headers: getAuthHeaders() });
    setProducts(response.ok ? await response.json() : []);
  }

  async function loadCategories() {
    const response = await fetch("/api/erp/products/categories", { headers: getAuthHeaders() });
    setCategories(response.ok ? await response.json() : []);
  }

  useEffect(() => {
    void fetch("/api/erp/products", { headers: getAuthHeaders() })
      .then(async (response) => (response.ok ? ((await response.json()) as Product[]) : []))
      .then(setProducts);
    void fetch("/api/erp/products/categories", { headers: getAuthHeaders() })
      .then(async (response) => (response.ok ? ((await response.json()) as ProductCategory[]) : []))
      .then(setCategories);
  }, []);

  async function createProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/erp/products", {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(productPayload(form)),
    });

    if (!response.ok) {
      const apiError = (await response.json().catch(() => ({}))) as ApiError;
      console.error("Product create failed", apiError);
      setError(getProductCreateErrorMessage(apiError));
      return;
    }

    event.currentTarget.reset();
    setIsCreateOpen(false);
    setSuccess("პროდუქტი დაემატა.");
    await loadProducts();
    await loadCategories();
  }

  async function deleteProduct(product: Product) {
    setError("");
    setSuccess("");
    const response = await fetch(`/api/erp/products/${product.id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const apiError = (await response.json().catch(() => ({}))) as ApiError;
      setError(apiError.message ?? "პროდუქტის წაშლა ვერ მოხერხდა.");
      return;
    }

    setSuccess("პროდუქტი წაიშალა.");
    await loadProducts();
  }

  const selectedCategoryIds = selectedCategoryId ? categoryWithDescendants(categories, selectedCategoryId) : new Set<string>();
  const filteredProducts = products.filter((product) => {
    const routeCategoryMatch = selectedCategoryId ? product.categoryId && selectedCategoryIds.has(product.categoryId) : true;
    const selectedCategoryMatch = categoryFilter ? product.categoryId === categoryFilter : true;
    const vatMatch = vatFilter ? Number(product.vatRate) === Number(vatFilter) : true;
    const statusMatch = statusFilter ? product.status === statusFilter : true;
    const needle = search.trim().toLowerCase();
    const haystack = [product.name, product.sku, product.barcode, product.categoryPath, product.category, product.externalUid, product.rsName].filter(Boolean).join(" ").toLowerCase();
    return Boolean(routeCategoryMatch) && selectedCategoryMatch && vatMatch && statusMatch && (!needle || haystack.includes(needle));
  });
  const totalStockValue = filteredProducts.reduce((sum, product) => sum + Number(product.costPrice || 0) * Number(product.stockQuantity ?? 0), 0);
  const vatRates = Array.from(new Set(products.map((product) => String(product.vatRate)).filter(Boolean))).sort((a, b) => Number(a) - Number(b));
  const statuses = Array.from(new Set(products.map((product) => product.status).filter(Boolean))).sort();

  return (
    <CoreModuleShell
      activeRoute="/erp/products"
      actions={
        <button
          className="inline-flex items-center gap-2 rounded-2xl bg-[#5e5bff] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#6857ff]/20"
          onClick={() => {
            setError("");
            setSuccess("");
            setIsCreateOpen(true);
          }}
          type="button"
        >
          <Plus size={16} />
          ახალი პროდუქტი
        </button>
      }
      eyebrow="Catalog"
      title="პროდუქტები"
    >
      <section className="grid gap-5">
        {success ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            {success}
          </div>
        ) : null}

        {isCreateOpen ? (
          <form onSubmit={createProduct} className="rounded-[24px] border border-indigo-950/8 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">ახალი პროდუქტი</h2>
              <button className="text-sm font-bold text-slate-400 hover:text-slate-600" onClick={() => setIsCreateOpen(false)} type="button">
                დახურვა
              </button>
            </div>

            <ProductFormFields categories={categories} />

            {error ? <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p> : null}
            <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#5e5bff] px-4 py-3 text-sm font-bold text-white" type="submit">
              <Plus size={16} />
              დამატება
            </button>
          </form>
        ) : null}

        {selectedCategoryId ? (
          <button
            className="w-fit rounded-2xl border border-indigo-950/8 bg-white px-4 py-2 text-sm font-bold text-slate-500 hover:text-[#5e5bff]"
            onClick={() => router.push("/erp/products")}
            type="button"
          >
            ფილტრის მოხსნა
          </button>
        ) : null}

        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid w-full max-w-[780px] grid-cols-2 overflow-hidden rounded-xl border border-[#DFE2EC] bg-white sm:grid-cols-4">
            {productViews.map((view, index) => (
              <button
                className={productView === view.key ? "h-11 bg-[#5B55F7] text-[14px] font-semibold leading-5 text-white shadow-md shadow-indigo-200" : "h-11 border-l border-[#E4E6ED] text-[14px] font-medium leading-5 text-[#667085] transition first:border-l-0 hover:bg-[#F8F7FF]"}
                key={view.key}
                onClick={() => setProductView(view.key)}
                type="button"
              >
                {view.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ProductMetric icon="₾" label="ნაშთის ღირებულება" tone="violet" value={`${formatMoney(totalStockValue)} ₾`} />
            <ProductMetric icon="%" label="დღგ" tone="amber" value={vatRates.length ? `${vatRates.length} ტიპი` : "-"} />
            <ProductMetric icon={<Box size={16} />} label="პროდუქტი" tone="green" value={filteredProducts.length.toLocaleString("ka-GE")} />
          </div>
        </div>

        <div className="flex items-start gap-4">
          <main className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-[#E1E4EC] bg-white">
            <div className="flex flex-wrap items-center gap-3 border-b border-[#E7E9F0] p-4">
              <label className="relative min-w-[260px] flex-1">
                <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#8B94A7]" />
                <input
                  className="h-11 w-full rounded-xl border border-[#DEE2EA] bg-white pl-11 pr-4 text-[14px] font-normal leading-5 outline-none placeholder:text-[#9AA2B5] focus:border-[#5B55F7] focus:ring-4 focus:ring-[#5B55F7]/10"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="სახელი, SKU ან შტრიხკოდი"
                  type="search"
                  value={search}
                />
              </label>

              <select className="h-11 min-w-36 rounded-xl border border-[#DEE2EA] bg-white px-4 text-[14px] font-medium leading-5 text-[#5F6880] outline-none" onChange={(event) => setCategoryFilter(event.target.value)} value={categoryFilter}>
                <option value="">კატეგორია</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.path}</option>)}
              </select>

              <select className="h-11 min-w-28 rounded-xl border border-[#DEE2EA] bg-white px-4 text-[14px] font-medium leading-5 text-[#5F6880] outline-none" onChange={(event) => setVatFilter(event.target.value)} value={vatFilter}>
                <option value="">დღგ</option>
                {vatRates.map((rate) => <option key={rate} value={rate}>{rate}%</option>)}
              </select>

              <select className="h-11 min-w-32 rounded-xl border border-[#DEE2EA] bg-white px-4 text-[14px] font-medium leading-5 text-[#5F6880] outline-none" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
                <option value="">სტატუსი</option>
                {statuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
              </select>

              <button className="flex h-11 items-center gap-2 rounded-xl border border-[#CFCBFF] bg-white px-4 text-[14px] font-semibold leading-5 text-[#5B55F7] hover:bg-[#F7F6FF]" onClick={() => setIsColumnsOpen((value) => !value)} type="button">
                <Settings2 size={16} />
                სვეტები
              </button>

              <button className="h-11 rounded-xl border border-[#DEE2EA] bg-white px-4 text-[14px] font-medium leading-5 text-[#5F6880] hover:bg-[#F8F9FC]" type="button">
                ფილტრის შენახვა
              </button>
            </div>

            <TableShell empty={filteredProducts.length === 0} emptyText={products.length === 0 ? "პროდუქტები ჯერ არ არის." : "ამ ფილტრში პროდუქტი არ არის."} totalCount={filteredProducts.length} view={productView}>
              {filteredProducts.map((product) => (
                <ProductRow
                  key={product.id}
                  onDelete={() => void deleteProduct(product)}
                  product={product}
                  view={productView}
                />
              ))}
            </TableShell>
          </main>

          {isColumnsOpen ? <ColumnsPanel onClose={() => setIsColumnsOpen(false)} /> : null}
        </div>
      </section>
    </CoreModuleShell>
  );
}

function getProductCreateErrorMessage(apiError: ApiError) {
  if (apiError.code === "UNIQUE_CONSTRAINT_FAILED") {
    const target = apiError.details?.meta?.target ?? [];

    if (target.includes("sku")) {
      return "ამ SKU-ით პროდუქტი უკვე არსებობს. შეცვალე შიდა კოდი და თავიდან სცადე.";
    }

    if (target.includes("barcode")) {
      return "ამ შტრიხკოდით პროდუქტი უკვე არსებობს. შეამოწმე კოდი ან მოძებნე არსებული პროდუქტი.";
    }

    return "ასეთი პროდუქტი უკვე არსებობს. შეამოწმე SKU ან შტრიხკოდი.";
  }

  if (apiError.code === "INVALID_REFERENCE") {
    return "არჩეული მონაცემი აღარ არსებობს ან ამ კომპანიას არ ეკუთვნის.";
  }

  return apiError.message ?? "პროდუქტის შექმნა ვერ მოხერხდა. სცადე თავიდან.";
}

function formatNumber(value?: number) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number.toLocaleString("ka-GE") : "0";
}

function availableQuantity(product: Product) {
  const stockQuantity = Number(product.stockQuantity ?? 0);
  const reservedQuantity = Number(product.reservedQuantity ?? 0);
  return Math.max(0, stockQuantity - reservedQuantity);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ka-GE");
}

function discountText(product: Product) {
  if (product.discountPercent != null) return `${product.discountPercent}%`;
  if (product.discountAmount != null) return `${product.currency} ${product.discountAmount}`;
  return "-";
}

function formatMoney(value: number) {
  return Number.isFinite(value) ? value.toLocaleString("ka-GE", { maximumFractionDigits: 2 }) : "0";
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    active: "აქტიური",
    inactive: "არააქტიური",
    draft: "შავი",
    archived: "არქივი",
  };
  return labels[status] ?? status;
}

function marginPercent(product: Product) {
  const cost = Number(product.costPrice || 0);
  const sale = Number(product.salePrice || 0);
  if (!sale) return "-";
  return `${Math.round(((sale - cost) / sale) * 100)}%`;
}

function stockValue(product: Product) {
  return Number(product.costPrice || 0) * Number(product.stockQuantity ?? 0);
}

function productPayload(form: FormData) {
  return {
    name: form.get("name"),
    sku: form.get("sku"),
    barcode: form.get("barcode"),
    categoryId: form.get("categoryId"),
    brand: form.get("brand"),
    description: form.get("description"),
    unit: form.get("unit"),
    type: form.get("type"),
    isPurchasable: form.get("isPurchasable") === "on",
    isSellable: form.get("isSellable") === "on",
    tracksInventory: form.get("tracksInventory") === "on",
    tracksLots: form.get("tracksLots") === "on",
    tracksExpiry: form.get("tracksExpiry") === "on",
    costPrice: Number(form.get("costPrice") || 0),
    salePrice: Number(form.get("salePrice") || 0),
    currency: form.get("currency"),
    vatRate: Number(form.get("vatRate") || 18),
    discountPercent: nullableNumber(form.get("discountPercent")),
    discountAmount: nullableNumber(form.get("discountAmount")),
    discountName: form.get("discountName"),
    minStock: Number(form.get("minStock") || 0),
    reorderPoint: Number(form.get("reorderPoint") || 0),
    supplierSku: form.get("supplierSku"),
    rsName: form.get("rsName"),
    defaultWarehouseId: form.get("defaultWarehouseId"),
    status: form.get("status"),
  };
}

function nullableNumber(value: FormDataEntryValue | null) {
  if (value === null || String(value).trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function categoryWithDescendants(categories: ProductCategory[], categoryId: string) {
  const ids = new Set<string>([categoryId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const category of categories) {
      if (category.parentId && ids.has(category.parentId) && !ids.has(category.id)) {
        ids.add(category.id);
        changed = true;
      }
    }
  }
  return ids;
}

function ProductFormFields({ categories, product }: { categories: ProductCategory[]; product?: Product }) {
  return (
    <>
      <FormSection title="ძირითადი">
        <Input defaultValue={product?.name ?? ""} label="დასახელება" name="name" required />
        <Input defaultValue={product?.sku ?? ""} label="SKU / შიდა კოდი" name="sku" />
        <Input defaultValue={product?.barcode ?? ""} label="შტრიხკოდი" name="barcode" />
        <label className="grid gap-2 text-sm font-semibold text-slate-600">
          კატეგორია
          <select className="rounded-2xl border border-indigo-950/8 bg-white px-4 py-3 outline-none" name="categoryId" defaultValue={product?.categoryId ?? ""}>
            <option value="">კატეგორიის გარეშე</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {"- ".repeat(Math.max(0, category.level - 1))}
                {category.path}
              </option>
            ))}
          </select>
        </label>
        <Input defaultValue={product?.brand ?? ""} label="ბრენდი" name="brand" />
        <Input defaultValue={product?.unit ?? "ცალი"} label="ერთეული" name="unit" />
      </FormSection>

      <FormSection title="ფასები">
        <Input defaultValue={product?.costPrice ?? "0"} label="შესყიდვის ფასი" name="costPrice" type="number" step="0.01" />
        <Input defaultValue={product?.salePrice ?? "0"} label="გაყიდვის ფასი" name="salePrice" type="number" step="0.01" />
        <Input defaultValue={product?.currency ?? "GEL"} label="ვალუტა" name="currency" />
        <Input defaultValue={product?.vatRate ?? "18"} label="დღგ %" name="vatRate" type="number" step="0.01" />
        <Input defaultValue={product?.discountPercent ?? ""} label="ფასდაკლება %" name="discountPercent" type="number" step="0.01" />
        <Input defaultValue={product?.discountAmount ?? ""} label="ფასდაკლება თანხა" name="discountAmount" type="number" step="0.01" />
        <Input defaultValue={product?.discountName ?? ""} label="ფასდაკლების სახელი" name="discountName" />
      </FormSection>

      <FormSection title="მარაგი">
        <Input defaultValue={product?.minStock ?? "0"} label="მინ. მარაგი" name="minStock" type="number" step="0.01" />
        <Input defaultValue={product?.reorderPoint ?? "0"} label="შევსების ზღვარი" name="reorderPoint" type="number" step="0.01" />
        <Input defaultValue={String(product?.stockQuantity ?? 0)} label="ნაშთი" name="stockQuantity" disabled />
        <Input defaultValue={String(product?.reservedQuantity ?? 0)} label="რეზერვი" name="reservedQuantity" disabled />
        <Input defaultValue={String(product ? availableQuantity(product) : 0)} label="ხელმისაწვდომი" name="availableQuantity" disabled />
        <Input defaultValue={String(product?.seriesCount ?? 0)} label="სერიები" name="seriesCount" disabled />
        <Input defaultValue={product?.nearestExpiryDate ?? ""} label="უახლოესი ვადა" name="nearestExpiryDate" disabled />
      </FormSection>

      <FormSection title="პარამეტრები">
        <label className="grid gap-2 text-sm font-semibold text-slate-600">
          ტიპი
          <select className="rounded-2xl border border-indigo-950/8 bg-white px-4 py-3 outline-none" name="type" defaultValue={product?.type ?? "stocked"}>
            <option value="stocked">საქონელი</option>
            <option value="service">სერვისი</option>
            <option value="expense">ხარჯი</option>
          </select>
        </label>
        <Input defaultValue={product?.status ?? "active"} label="სტატუსი" name="status" />
        <Toggle label="შესყიდვადია" name="isPurchasable" defaultChecked={product?.isPurchasable ?? true} />
        <Toggle label="გაყიდვადია" name="isSellable" defaultChecked={product?.isSellable ?? true} />
        <Toggle label="მარაგი აღირიცხება" name="tracksInventory" defaultChecked={product?.tracksInventory ?? true} />
        <Toggle label="პარტიებით აღრიცხვა" name="tracksLots" defaultChecked={product?.tracksLots ?? false} />
        <Toggle label="ვადის კონტროლი" name="tracksExpiry" defaultChecked={product?.tracksExpiry ?? false} />
      </FormSection>

      <FormSection title="კავშირები">
        <Input defaultValue={product?.supplierSku ?? ""} label="Supplier SKU" name="supplierSku" />
        <Input defaultValue={product?.rsName ?? ""} label="RS დასახელება" name="rsName" />
        <Input defaultValue={product?.defaultWarehouseId ?? ""} label="Default warehouse ID" name="defaultWarehouseId" />
        <Input defaultValue={product?.source ?? ""} label="Source" name="source" disabled />
        <Input defaultValue={product?.externalUid ?? ""} label="External UID" name="externalUid" disabled />
        <Input defaultValue={product?.syncStatus ?? ""} label="Sync status" name="syncStatus" disabled />
        <label className="grid gap-2 text-sm font-semibold text-slate-600 md:col-span-2 xl:col-span-3">
          აღწერა
          <textarea className="min-h-24 rounded-2xl border border-indigo-950/8 bg-white px-4 py-3 outline-none" defaultValue={product?.description ?? ""} name="description" />
        </label>
      </FormSection>
    </>
  );
}

function FormSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="mt-5 rounded-2xl bg-[#fbfcff] p-4">
      <h3 className="font-bold">{title}</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...inputProps } = props;
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-600">
      {label}
      <input className="rounded-2xl border border-indigo-950/8 bg-white px-4 py-3 outline-none" {...inputProps} />
    </label>
  );
}

function Toggle({ label, ...inputProps }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl border border-indigo-950/8 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
      {label}
      <input className="size-5 accent-[#5e5bff]" type="checkbox" {...inputProps} />
    </label>
  );
}

function ProductMetric({ icon, label, tone, value }: { icon: React.ReactNode; label: string; tone: "amber" | "green" | "violet"; value: string }) {
  const tones = {
    amber: "bg-[#FFF4DB] text-[#D98B00]",
    green: "bg-[#E8F9F1] text-[#07945B]",
    violet: "bg-[#EFEDFF] text-[#5B55F7]",
  };

  return (
    <article className="flex min-w-[130px] items-center gap-3 rounded-xl border border-[#E3E5EC] bg-white px-4 py-3">
      <div className={`flex size-9 items-center justify-center rounded-lg text-[14px] font-bold ${tones[tone]}`}>{icon}</div>
      <div>
        <p className="text-[12px] font-normal leading-[18px] text-[#7C859A]">{label}</p>
        <p className="mt-0.5 text-[16px] font-bold leading-6 text-[#151B32]">{value}</p>
      </div>
    </article>
  );
}

function ProductRow({ onDelete, product, view }: { onDelete: () => void; product: Product; view: ProductView }) {
  return (
    <tr className="group h-[68px] transition hover:bg-[#F8F7FF]">
      <td className="sticky left-0 z-10 bg-white px-4 group-hover:bg-[#F8F7FF]">
        <input className="size-4 accent-[#5B55F7]" type="checkbox" />
      </td>
      <td className="sticky left-12 z-10 border-r border-[#E7E9F0] bg-white px-4 shadow-[6px_0_12px_-10px_rgba(15,23,42,0.5)] group-hover:bg-[#F8F7FF]">
        <p className="max-w-56 truncate text-[14px] font-semibold leading-5 text-[#151B32]">{product.name}</p>
        <div className="mt-1 flex items-center gap-2 text-[12px] font-normal leading-[18px] text-[#7D869B]">
          <span className="max-w-24 truncate">{product.sku ?? "-"}</span>
          <span className="size-1 rounded-full bg-[#B1B7C4]" />
          <span className="max-w-24 truncate">{product.externalUid ?? product.barcode ?? "-"}</span>
        </div>
      </td>
      {view === "simple" ? <SimpleCells product={product} /> : null}
      {view === "accounting" ? <AccountingCells product={product} /> : null}
      {view === "inventory" ? <InventoryCells product={product} /> : null}
      {view === "balance" ? <BalanceCells product={product} /> : null}
      <td className="px-4 text-right">
        <div className="flex items-center justify-end gap-1">
          <Link className="grid size-8 place-items-center rounded-lg text-[#687188] hover:bg-[#ECEAFD] hover:text-[#5B55F7]" href={`/erp/products/${product.id}/edit`} title="რედაქტირება">
            <Pencil size={15} />
          </Link>
          <button className="grid size-8 place-items-center rounded-lg text-rose-500 hover:bg-rose-50" onClick={onDelete} title="წაშლა" type="button">
            <Trash2 size={15} />
          </button>
          <button className="grid size-8 place-items-center rounded-lg text-[#687188] hover:bg-[#ECEAFD] hover:text-[#5B55F7]" title="მენიუ" type="button">
            <MoreVertical size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function SimpleCells({ product }: { product: Product }) {
  return (
    <>
      <td className="px-4 text-[14px] font-normal leading-5 text-[#596278]">{product.categoryPath ?? product.category ?? "-"}</td>
      <td className="px-4 text-[14px] font-normal leading-5 text-[#596278]">{product.unit}</td>
      <td className="border-l border-[#EDF0F4] px-4 text-[14px] font-semibold leading-5 text-[#151B32]">{product.currency} {product.salePrice}</td>
      <td className="px-4"><StockText product={product} /></td>
      <td className="px-4"><StatusPill status={product.status} /></td>
    </>
  );
}

function AccountingCells({ product }: { product: Product }) {
  return (
    <>
      <td className="px-4 text-[14px] font-normal leading-5 text-[#596278]">{product.unit}</td>
      <td className="border-l border-[#EDF0F4] px-4 text-[14px] font-medium leading-5 text-[#151B32]">{product.currency} {product.costPrice}</td>
      <td className="px-4 text-[14px] font-medium leading-5 text-[#151B32]">{product.currency} {product.costPrice}</td>
      <td className="px-4 text-[14px] font-semibold leading-5 text-[#151B32]">{product.currency} {product.salePrice}</td>
      <td className="border-l border-[#EDF0F4] px-4"><VatPill value={product.vatRate} /></td>
      <td className="px-4"><MarginPill product={product} /></td>
      <td className="border-l border-[#EDF0F4] px-4"><StockText product={product} /></td>
      <td className="px-4 text-[14px] font-normal leading-5 text-[#596278]">{formatNumber(product.reservedQuantity)}</td>
      <td className="px-4 text-[14px] font-semibold leading-5 text-[#151B32]">{formatMoney(stockValue(product))}</td>
      <td className="border-l border-[#EDF0F4] px-4 text-[14px] font-normal leading-5 text-[#596278]">{product.supplierSku ?? product.rsName ?? "-"}</td>
      <td className="px-4"><StatusPill status={product.status} /></td>
    </>
  );
}

function InventoryCells({ product }: { product: Product }) {
  return (
    <>
      <td className="px-4 text-[14px] font-normal leading-5 text-[#596278]">{product.unit}</td>
      <td className="border-l border-[#EDF0F4] px-4"><StockText product={product} /></td>
      <td className="px-4 text-[14px] font-normal leading-5 text-[#596278]">{formatNumber(product.reservedQuantity)}</td>
      <td className="px-4 text-[14px] font-semibold leading-5 text-[#078752]">{formatNumber(availableQuantity(product))}</td>
      <td className="px-4 text-[14px] font-normal leading-5 text-[#596278]">{formatNumber(product.warehouseCount)}</td>
      <td className="px-4 text-[14px] font-normal leading-5 text-[#596278]">{formatNumber(product.seriesCount)}</td>
      <td className="px-4 text-[14px] font-medium leading-5 text-[#D98B00]">{product.nearestExpiryDate ? formatDate(product.nearestExpiryDate) : "-"}</td>
      <td className="border-l border-[#EDF0F4] px-4 text-[14px] font-semibold leading-5 text-[#151B32]">{formatMoney(stockValue(product))}</td>
      <td className="px-4"><StatusPill status={product.status} /></td>
    </>
  );
}

function BalanceCells({ product }: { product: Product }) {
  return (
    <>
      <td className="px-4 text-[14px] font-normal leading-5 text-[#596278]">{product.externalUid ?? "-"}</td>
      <td className="px-4 text-[14px] font-normal leading-5 text-[#596278]">{product.barcode ?? "-"}</td>
      <td className="border-l border-[#EDF0F4] px-4 text-[14px] font-normal leading-5 text-[#596278]">{product.rsName ?? "-"}</td>
      <td className="px-4 text-[14px] font-normal leading-5 text-[#596278]">{product.source ?? "-"}</td>
      <td className="px-4 text-[14px] font-normal leading-5 text-[#596278]">{product.syncStatus ?? "-"}</td>
      <td className="border-l border-[#EDF0F4] px-4 text-[14px] font-semibold leading-5 text-[#151B32]">{discountText(product)}</td>
      <td className="px-4 text-[14px] font-normal leading-5 text-[#596278]">{product.discountName ?? "-"}</td>
      <td className="px-4 text-[14px] font-normal leading-5 text-[#596278]">{product.discountCondition ?? "-"}</td>
      <td className="px-4"><StatusPill status={product.status} /></td>
    </>
  );
}

function VatPill({ value }: { value: string }) {
  return <span className="rounded-lg bg-[#EFEDFF] px-2.5 py-1 text-[12px] font-semibold leading-4 text-[#5B55F7]">{value}%</span>;
}

function MarginPill({ product }: { product: Product }) {
  return <span className="rounded-lg bg-[#DFF8EC] px-2.5 py-1 text-[12px] font-semibold leading-4 text-[#078752]">{marginPercent(product)}</span>;
}

function StockText({ product }: { product: Product }) {
  return (
    <div className="flex items-center gap-2">
      <span className="size-2 rounded-full bg-[#0DA766]" />
      <span className="text-[14px] font-semibold leading-5 text-[#151B32]">{formatNumber(product.stockQuantity)}</span>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-[#DFF8EC] px-3 py-1.5 text-[12px] font-semibold leading-4 text-[#078752]">
      <span className="size-1.5 rounded-full bg-[#0DA766]" />
      {statusLabel(status)}
    </span>
  );
}

function ProductTableHead({ view }: { view: ProductView }) {
  if (view === "simple") {
    return (
      <thead>
        <tr className="border-b border-[#E5E8EF] bg-[#F9FAFC] text-[12px] font-semibold leading-4 text-[#6F7890]">
          <BaseProductHeaders />
          <th className="min-w-52 px-4 py-3">კატეგორია</th>
          <th className="min-w-28 px-4 py-3">ერთეული</th>
          <th className="min-w-28 border-l border-[#E5E8EF] px-4 py-3">გაყიდვა</th>
          <th className="min-w-28 px-4 py-3">ნაშთი</th>
          <th className="min-w-32 px-4 py-3">სტატუსი</th>
          <th className="w-32 px-4 py-3"></th>
        </tr>
      </thead>
    );
  }

  if (view === "inventory") {
    return (
      <thead>
        <tr className="border-b border-[#E5E8EF] bg-[#F9FAFC] text-[12px] font-semibold leading-4 text-[#6F7890]">
          <BaseProductHeaders rowSpan={2} />
          <th className="min-w-28 px-4 py-3" rowSpan={2}>ერთეული</th>
          <th className="border-b border-l border-[#E5E8EF] px-4 py-2 text-center" colSpan={6}>მარაგი</th>
          <th className="min-w-32 border-l border-[#E5E8EF] px-4 py-3" rowSpan={2}>ღირებულება</th>
          <th className="min-w-32 px-4 py-3" rowSpan={2}>სტატუსი</th>
          <th className="w-32 px-4 py-3" rowSpan={2}></th>
        </tr>
        <tr className="border-b border-[#E5E8EF] bg-[#F9FAFC] text-[12px] font-semibold leading-4 text-[#6F7890]">
          <th className="min-w-28 border-l border-[#E5E8EF] px-4 py-2">რაოდენობა</th>
          <th className="min-w-24 px-4 py-2">რეზერვი</th>
          <th className="min-w-32 px-4 py-2">ხელმისაწვდომი</th>
          <th className="min-w-28 px-4 py-2">საწყობები</th>
          <th className="min-w-24 px-4 py-2">სერიები</th>
          <th className="min-w-36 px-4 py-2">უახლოესი ვადა</th>
        </tr>
      </thead>
    );
  }

  if (view === "balance") {
    return (
      <thead>
        <tr className="border-b border-[#E5E8EF] bg-[#F9FAFC] text-[12px] font-semibold leading-4 text-[#6F7890]">
          <BaseProductHeaders rowSpan={2} />
          <th className="border-b px-4 py-2 text-center" colSpan={2}>იდენტიფიკაცია</th>
          <th className="border-b border-l border-[#E5E8EF] px-4 py-2 text-center" colSpan={3}>Balance</th>
          <th className="border-b border-l border-[#E5E8EF] px-4 py-2 text-center" colSpan={3}>ფასდაკლება</th>
          <th className="min-w-32 px-4 py-3" rowSpan={2}>სტატუსი</th>
          <th className="w-32 px-4 py-3" rowSpan={2}></th>
        </tr>
        <tr className="border-b border-[#E5E8EF] bg-[#F9FAFC] text-[12px] font-semibold leading-4 text-[#6F7890]">
          <th className="min-w-32 px-4 py-2">Balance ID</th>
          <th className="min-w-36 px-4 py-2">შტრიხკოდი</th>
          <th className="min-w-44 border-l border-[#E5E8EF] px-4 py-2">RS დასახელება</th>
          <th className="min-w-28 px-4 py-2">Source</th>
          <th className="min-w-32 px-4 py-2">Sync</th>
          <th className="min-w-28 border-l border-[#E5E8EF] px-4 py-2">მნიშვნელობა</th>
          <th className="min-w-48 px-4 py-2">სახელი</th>
          <th className="min-w-48 px-4 py-2">პირობა</th>
        </tr>
      </thead>
    );
  }

  return (
    <thead>
      <tr className="border-b border-[#E5E8EF] bg-[#F9FAFC] text-[12px] font-semibold leading-4 text-[#6F7890]">
        <BaseProductHeaders rowSpan={2} />
        <th className="min-w-28 px-4 py-3" rowSpan={2}>ერთეული</th>
        <th className="border-b border-l border-[#E5E8EF] px-4 py-2 text-center" colSpan={3}>ფასები</th>
        <th className="border-l border-[#E5E8EF] px-4 py-3" rowSpan={2}>დღგ</th>
        <th className="px-4 py-3" rowSpan={2}>მარჟა</th>
        <th className="border-b border-l border-[#E5E8EF] px-4 py-2 text-center" colSpan={3}>მარაგი</th>
        <th className="min-w-40 border-l border-[#E5E8EF] px-4 py-3" rowSpan={2}>მომწოდებელი</th>
        <th className="px-4 py-3" rowSpan={2}>სტატუსი</th>
        <th className="w-32 px-4 py-3" rowSpan={2}></th>
      </tr>
      <tr className="border-b border-[#E5E8EF] bg-[#F9FAFC] text-[12px] font-semibold leading-4 text-[#6F7890]">
        <th className="min-w-28 border-l border-[#E5E8EF] px-4 py-2">შესყიდვა</th>
        <th className="min-w-36 px-4 py-2">თვითღირებულება</th>
        <th className="min-w-28 px-4 py-2">გაყიდვა</th>
        <th className="min-w-28 border-l border-[#E5E8EF] px-4 py-2">რაოდენობა</th>
        <th className="min-w-24 px-4 py-2">რეზერვი</th>
        <th className="min-w-32 px-4 py-2">ღირებულება</th>
      </tr>
    </thead>
  );
}

function BaseProductHeaders({ rowSpan }: { rowSpan?: number }) {
  return (
    <>
      <th className="sticky left-0 z-20 w-12 bg-[#F9FAFC] px-4 py-3" rowSpan={rowSpan}>
        <input className="size-4 accent-[#5B55F7]" type="checkbox" />
      </th>
      <th className="sticky left-12 z-20 min-w-[260px] border-r border-[#E5E8EF] bg-[#F9FAFC] px-4 py-3 shadow-[6px_0_12px_-10px_rgba(15,23,42,0.5)]" rowSpan={rowSpan}>პროდუქტი</th>
    </>
  );
}

function TableShell({ children, empty, emptyText, totalCount, view }: { children: React.ReactNode; empty: boolean; emptyText: string; totalCount: number; view: ProductView }) {
  const colSpan = view === "accounting" ? 14 : view === "inventory" || view === "balance" ? 12 : 8;
  const minWidth = view === "accounting" ? "min-w-[1350px]" : view === "inventory" ? "min-w-[1180px]" : view === "balance" ? "min-w-[1260px]" : "min-w-[980px]";

  return (
    <>
      <div className="overflow-x-auto">
        <table className={`w-full ${minWidth} border-collapse text-left`}>
          <ProductTableHead view={view} />
          <tbody className="divide-y divide-[#E9EBF1]">
            {children}
            {empty ? <tr><td className="py-12 text-center text-[14px] font-semibold leading-5 text-[#7D869B]" colSpan={colSpan}>{emptyText}</td></tr> : null}
          </tbody>
        </table>
      </div>

      <div className="px-4 pt-3">
        <div className="h-2 overflow-hidden rounded-full bg-[#ECEEF4]">
          <div className="h-full w-[45%] rounded-full bg-[#C9CEDC]" />
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-4 px-4 py-4">
        <p className="text-[14px] font-normal leading-5 text-[#747D92]">ნაჩვენებია {totalCount.toLocaleString("ka-GE")} შედეგი</p>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-[14px] font-normal leading-5 text-[#747D92]">
            სტრიქონები:
            <select className="h-9 rounded-lg border border-[#DFE2EA] bg-white px-3 outline-none">
              <option>25</option>
              <option>50</option>
              <option>100</option>
            </select>
          </label>
          <div className="flex items-center gap-1">
            <button className="grid size-9 place-items-center rounded-lg border border-[#E1E4EB] hover:bg-[#F7F7FA]" type="button"><ChevronLeft size={16} /></button>
            <button className="h-9 min-w-9 rounded-lg bg-[#5B55F7] px-3 text-[14px] font-semibold leading-5 text-white" type="button">1</button>
            <button className="grid size-9 place-items-center rounded-lg border border-[#E1E4EB] hover:bg-[#F7F7FA]" type="button"><ChevronRight size={16} /></button>
          </div>
        </div>
      </footer>
    </>
  );
}

function ColumnsPanel({ onClose }: { onClose: () => void }) {
  const groups = [
    { title: "პროდუქტის მონაცემები", count: "5/5", items: ["პროდუქტი", "SKU", "ერთეული", "კატეგორია", "შტრიხკოდი"] },
    { title: "ფასები და გადასახადები", count: "4/4", items: ["შესყიდვის ფასი", "თვითღირებულება", "გაყიდვის ფასი", "დღგ"] },
    { title: "მარაგები", count: "3/4", items: ["რაოდენობა", "რეზერვი", "ნაშთის ღირებულება", "ვარგისიანობის ვადა"] },
    { title: "Balance მონაცემები", count: "2/4", items: ["Balance ID", "ჯგუფის კოდი", "საბუღალტრო ანგარიში", "სინქრონიზაციის თარიღი"] },
  ];

  return (
    <aside className="w-[350px] shrink-0 overflow-hidden rounded-2xl border border-[#DEE1EA] bg-white shadow-xl shadow-slate-200/50">
      <header className="flex items-center justify-between border-b border-[#E8EAF0] px-5 py-4">
        <h2 className="text-[18px] font-bold leading-7 text-[#151B32]">სვეტების მართვა</h2>
        <button className="grid size-8 place-items-center rounded-lg text-[#667085] hover:bg-[#F2F3F7]" onClick={onClose} type="button">
          <X size={18} />
        </button>
      </header>
      <div className="border-b border-[#E8EAF0] p-4">
        <label className="relative block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9299AA]" />
          <input className="h-10 w-full rounded-xl border border-[#DFE2EA] pl-9 pr-3 text-[14px] outline-none focus:border-[#5B55F7]" placeholder="სვეტის ძებნა" type="search" />
        </label>
      </div>
      <div className="max-h-[610px] space-y-5 overflow-y-auto p-5">
        {groups.map((group) => (
          <section className="border-b border-[#E9EBF0] pb-5 last:border-b-0 last:pb-0" key={group.title}>
            <label className="mb-3 flex cursor-pointer items-center gap-3">
              <input className="size-4 accent-[#5B55F7]" defaultChecked type="checkbox" />
              <span className="text-[14px] font-semibold leading-5 text-[#151B32]">{group.title}</span>
              <span className="ml-auto text-[12px] font-normal leading-[18px] text-[#818A9E]">{group.count}</span>
            </label>
            <div className="ml-7 space-y-3">
              {group.items.map((item, index) => (
                <label className="flex cursor-pointer items-center gap-3 text-[14px] font-normal leading-5 text-[#566077]" key={item}>
                  <input className="size-4 accent-[#5B55F7]" defaultChecked={index < 3 || group.title !== "მარაგები"} type="checkbox" />
                  {item}
                </label>
              ))}
            </div>
          </section>
        ))}
      </div>
      <footer className="flex gap-3 border-t border-[#E8EAF0] p-4">
        <button className="h-11 flex-1 rounded-xl border border-[#DFE2EA] bg-white text-[14px] font-semibold leading-5 text-[#606A80] hover:bg-[#F8F9FC]" type="button">ნაგულისხმევი</button>
        <button className="h-11 flex-1 rounded-xl bg-[#5B55F7] text-[14px] font-semibold leading-5 text-white hover:bg-[#4D47E8]" onClick={onClose} type="button">შენახვა</button>
      </footer>
    </aside>
  );
}
