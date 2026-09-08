"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgePercent, Box, CalendarDays, CheckCircle2, FileText, FolderTree, Info, Package, Pencil, Play, Plus, Save, Search, ShoppingCart, Trash2, Users, X } from "lucide-react";
import { CoreModuleShell, getAuthHeaders } from "@/components/erp/CoreModuleShell";

type Discount = {
  id: string;
  name: string;
  type: DiscountType;
  scope: DiscountScope;
  value: string | number | null;
  currency: string;
  priority: number;
  stackable: boolean;
  startsAt: string | null;
  endsAt: string | null;
  minQuantity: string | number | null;
  minAmount: string | number | null;
  buyQuantity: number | null;
  getQuantity: number | null;
  channel: string;
  status: DiscountStatus;
  notes: string | null;
  ruleConfig?: { conditions?: DiscountCondition[]; source?: string } | null;
  products: { productId: string; product: Pick<Product, "id" | "name" | "sku"> }[];
  categories: { categoryId: string; category: Pick<ProductCategory, "id" | "name" | "path"> }[];
  customers: { customerId: string; customer: Customer }[];
};

type Product = { id: string; name: string; sku?: string | null };
type ProductCategory = { id: string; parentId: string | null; name: string; path: string; level: number; status: string };
type Customer = { id: string; name: string; code?: string | null; taxId?: string | null; personalId?: string | null; source?: string | null };
type DiscountType = "percent" | "amount" | "fixed_price";
type DiscountScope = "all_products" | "products" | "categories" | "cart" | "customer";
type DiscountStatus = "draft" | "active" | "paused" | "expired";
type DiscountCondition = { field: string; operator: string; value: string | number };

const typeLabels: Record<DiscountType, string> = {
  percent: "პროცენტი",
  amount: "თანხა",
  fixed_price: "ფიქსირებული ფასი",
};

const scopeLabels: Record<DiscountScope, string> = {
  all_products: "ყველა პროდუქტი",
  products: "პროდუქტები",
  categories: "კატეგორიები",
  cart: "კალათა",
  customer: "კონკრეტული მომხმარებელი",
};

const statusLabels: Record<DiscountStatus, string> = {
  draft: "შავი",
  active: "აქტიური",
  paused: "პაუზა",
  expired: "ვადაგასული",
};

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<"all" | DiscountScope>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | DiscountStatus>("all");
  const [selectedDiscountId, setSelectedDiscountId] = useState<string | null>(null);
  const [targetModalDiscount, setTargetModalDiscount] = useState<Discount | null>(null);

  async function loadDiscounts() {
    const response = await fetch("/api/erp/discounts", { headers: getAuthHeaders() });
    setDiscounts(response.ok ? await response.json() : []);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDiscounts();
      void fetch("/api/erp/products", { headers: getAuthHeaders() })
        .then(async (response) => (response.ok ? ((await response.json()) as Product[]) : []))
        .then(setProducts);
      void fetch("/api/erp/products/categories", { headers: getAuthHeaders() })
        .then(async (response) => (response.ok ? ((await response.json()) as ProductCategory[]) : []))
        .then(setCategories);
      void fetch("/api/erp/discounts/customers", { headers: getAuthHeaders() })
        .then(async (response) => (response.ok ? ((await response.json()) as Customer[]) : []))
        .then(setCustomers);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function saveDiscount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const response = await fetch(editingDiscount ? `/api/erp/discounts/${editingDiscount.id}` : "/api/erp/discounts", {
      method: editingDiscount ? "PATCH" : "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(discountPayload(new FormData(event.currentTarget))),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.message ?? "ფასდაკლების შენახვა ვერ მოხერხდა.");
      return;
    }

    event.currentTarget.reset();
    setIsCreateOpen(false);
    setEditingDiscount(null);
    setSuccess(editingDiscount ? "ფასდაკლება განახლდა." : "ფასდაკლება დაემატა.");
    await loadDiscounts();
  }

  async function deleteDiscount(discount: Discount) {
    setError("");
    setSuccess("");
    const response = await fetch(`/api/erp/discounts/${discount.id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.message ?? "ფასდაკლების წაშლა ვერ მოხერხდა.");
      return;
    }

    if (editingDiscount?.id === discount.id) setEditingDiscount(null);
    setSuccess("ფასდაკლება წაიშალა.");
    await loadDiscounts();
  }

  const metrics = useMemo(() => {
    const active = discounts.filter((discount) => discount.status === "active").length;
    const scheduled = discounts.filter((discount) => discount.startsAt || discount.endsAt).length;
    const balance = discounts.filter((discount) => discount.ruleConfig?.source === "balance").length;
    return { active, balance, scheduled };
  }, [discounts]);
  const filteredDiscounts = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return discounts.filter((discount) => {
      const haystack = [
        discount.name,
        scopeLabels[discount.scope],
        typeLabels[discount.type],
        targetText(discount),
        conditionText(discount),
        discount.notes ?? "",
      ].join(" ").toLowerCase();
      return (!needle || haystack.includes(needle))
        && (scopeFilter === "all" || discount.scope === scopeFilter)
        && (statusFilter === "all" || discount.status === statusFilter);
    });
  }, [discounts, scopeFilter, search, statusFilter]);
  const selectedDiscount = filteredDiscounts.find((discount) => discount.id === selectedDiscountId) ?? filteredDiscounts[0] ?? null;

  return (
    <CoreModuleShell
      activeRoute="/erp/discounts"
      actions={
        <button
          className="inline-flex items-center gap-2 rounded-2xl bg-[#5e5bff] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#6857ff]/20"
          onClick={() => {
            setError("");
            setSuccess("");
            setEditingDiscount(null);
            setIsCreateOpen(true);
          }}
          type="button"
        >
          <Plus size={16} />
          ახალი ფასდაკლება
        </button>
      }
      eyebrow="PRICING"
      title="ფასდაკლებები"
    >
      <section className="grid gap-6 text-[#151B32]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric icon={<BadgePercent size={22} />} label="სულ ფასდაკლება" tone="violet" value={discounts.length} />
          <Metric icon={<Play size={22} />} label="აქტიური" tone="green" value={metrics.active} />
          <Metric icon={<CalendarDays size={22} />} label="დაგეგმილი" tone="amber" value={metrics.scheduled} />
          <Metric icon={<CheckCircle2 size={22} />} label="Balance-იდან" tone="slate" value={metrics.balance} />
        </div>

        {success ? <Notice tone="success">{success}</Notice> : null}
        {error ? <Notice tone="error">{error}</Notice> : null}

        {(isCreateOpen || editingDiscount) ? (
          <form onSubmit={saveDiscount} className="rounded-2xl border border-[#E3E5EC] bg-white p-5 shadow-sm shadow-indigo-950/5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[12px] font-semibold uppercase leading-4 tracking-[0.16em] text-[#5B55F7]">Rule builder</p>
                <h2 className="mt-1 text-[20px] font-bold leading-7">{editingDiscount ? "ფასდაკლების რედაქტირება" : "ახალი ფასდაკლება"}</h2>
              </div>
              <button
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-600"
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingDiscount(null);
                }}
                type="button"
              >
                <X size={16} />
                დახურვა
              </button>
            </div>
            <DiscountFormFields categories={categories} customers={customers} discount={editingDiscount ?? undefined} products={products} />
            <button className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#5B55F7] px-5 text-[14px] font-semibold leading-5 text-white shadow-lg shadow-indigo-200 transition hover:bg-[#4E48E8] md:w-auto" type="submit">
              {editingDiscount ? <Save size={16} /> : <Plus size={16} />}
              {editingDiscount ? "შენახვა" : "დამატება"}
            </button>
          </form>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
          <section className="min-w-0">
            <div className="mb-5 grid gap-3 lg:grid-cols-[minmax(280px,1fr)_170px_170px]">
                <label className="flex h-12 items-center gap-3 rounded-xl border border-[#DFE2EA] bg-white px-4 text-[14px] font-normal leading-5 text-[#596278] transition focus-within:border-[#5B55F7] focus-within:ring-4 focus-within:ring-[#5B55F7]/10">
                  <Search size={18} />
                  <input className="w-full bg-transparent outline-none placeholder:text-[#9AA2B5]" onChange={(event) => setSearch(event.target.value)} placeholder="ფასდაკლების ძებნა" type="search" value={search} />
                </label>
                <select className="h-12 rounded-xl border border-[#DFE2EA] bg-white px-4 text-[14px] font-medium leading-5 text-[#596278] outline-none focus:border-[#5B55F7]" onChange={(event) => setStatusFilter(event.target.value as "all" | DiscountStatus)} value={statusFilter}>
                  <option value="all">სტატუსი</option>
                  {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <select className="h-12 rounded-xl border border-[#DFE2EA] bg-white px-4 text-[14px] font-medium leading-5 text-[#596278] outline-none focus:border-[#5B55F7]" onChange={(event) => setScopeFilter(event.target.value as "all" | DiscountScope)} value={scopeFilter}>
                  <option value="all">ტიპი</option>
                  {Object.entries(scopeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#E3E5EC] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b border-[#E9EBF1] bg-[#FBFBFD] text-[13px] font-semibold leading-[18px] text-[#778097]">
                  <tr>
                    <th className="px-5 py-4">ფასდაკლება</th>
                    <th className="px-5 py-4">ტიპი</th>
                    <th className="px-5 py-4">მნიშვნელობა</th>
                    <th className="px-5 py-4">ვრცელდება</th>
                    <th className="px-5 py-4">პერიოდი</th>
                    <th className="px-5 py-4">სტატუსი</th>
                    <th className="w-16 px-5 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECEEF3]">
                  {filteredDiscounts.map((discount) => {
                    const selected = selectedDiscount?.id === discount.id;
                    return (
                      <tr
                        className={selected ? "cursor-pointer bg-[#F8F7FF]" : "cursor-pointer bg-white transition hover:bg-[#F8F7FF]"}
                        key={discount.id}
                        onClick={() => setSelectedDiscountId(discount.id)}
                      >
                        <td className="px-5 py-5">
                          <p className="max-w-[280px] truncate text-[15px] font-semibold leading-[22px] text-[#151B32]">{discount.name}</p>
                          <p className="mt-1 text-[12px] font-normal leading-[18px] text-[#8A93A8]">{discount.ruleConfig?.source === "balance" ? "Balance import" : discount.notes || "Manual rule"}</p>
                        </td>
                        <td className="px-5 py-5 text-[14px] font-normal leading-5 text-[#596278]">{scopeLabels[discount.scope]}</td>
                        <td className="px-5 py-5"><ValuePill discount={discount} /></td>
                        <td className="px-5 py-5">
                          <TargetPill
                            discount={discount}
                            onClick={(event) => {
                              event.stopPropagation();
                              setTargetModalDiscount(discount);
                            }}
                          />
                        </td>
                        <td className="px-5 py-5 text-[14px] font-normal leading-5 text-[#596278]">{dateRange(discount)}</td>
                        <td className="px-5 py-5"><StatusBadge status={discount.status} /></td>
                        <td className="px-5 py-5 text-right">
                          <button className="grid size-9 place-items-center rounded-lg text-[#667085] transition hover:bg-[#ECEAFD] hover:text-[#5B55F7]" title="დეტალები" type="button">
                            <Info size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredDiscounts.length === 0 ? (
                    <tr>
                      <td className="px-5 py-12 text-center text-[14px] font-medium leading-5 text-[#7D869B]" colSpan={7}>ფასდაკლება ვერ მოიძებნა.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-x border-b border-[#E3E5EC] bg-white px-5 py-4 text-[14px] font-normal leading-5 text-[#7D869B]">
              <span>ნაჩვენებია {filteredDiscounts.length} ჩანაწერი</span>
              <div className="flex items-center gap-2">
                <button className="grid size-9 place-items-center rounded-lg border border-[#E1E4EB] bg-white text-[#596278] hover:bg-[#F7F7FA]" type="button">‹</button>
                <span className="grid size-9 place-items-center rounded-lg bg-[#5B55F7] text-[14px] font-semibold leading-5 text-white">1</span>
                <button className="grid size-9 place-items-center rounded-lg border border-[#E1E4EB] bg-white text-[#596278] hover:bg-[#F7F7FA]" type="button">›</button>
              </div>
            </div>
          </section>

          <DiscountDetailPanel
            discount={selectedDiscount}
            onClose={() => setSelectedDiscountId(null)}
            onDelete={(discount) => void deleteDiscount(discount)}
            onEdit={(discount) => {
              setIsCreateOpen(false);
              setEditingDiscount(discount);
            }}
            onViewTargets={setTargetModalDiscount}
          />
        </div>

        <TargetModal discount={targetModalDiscount} onClose={() => setTargetModalDiscount(null)} />
      </section>
    </CoreModuleShell>
  );
}

function DiscountFormFields({ categories, customers, discount, products }: { categories: ProductCategory[]; customers: Customer[]; discount?: Discount; products: Product[] }) {
  const [scope, setScope] = useState<DiscountScope>(discount?.scope ?? "products");
  const [conditions, setConditions] = useState<DiscountCondition[]>(discount?.ruleConfig?.conditions?.length ? discount.ruleConfig.conditions : []);
  const selectedProductIds = new Set(discount?.products.map((item) => item.productId) ?? []);
  const selectedCategoryIds = new Set(discount?.categories.map((item) => item.categoryId) ?? []);
  const selectedCustomerIds = new Set(discount?.customers.map((item) => item.customerId) ?? []);
  const showProducts = scope === "products";
  const showCategories = scope === "categories";
  const showCart = scope === "cart";
  const showCustomer = scope === "customer";

  return (
    <>
      <FormSection step="1" title="ტიპი და მნიშვნელობა">
        <Input defaultValue={discount?.name ?? ""} label="სახელი" name="name" required />
        <Select defaultValue={discount?.scope ?? "products"} label="ფასდაკლების ტიპი" name="scope" onChange={(value) => setScope(value as DiscountScope)} options={scopeLabels} />
        <Select defaultValue={discount?.type ?? "percent"} label="დათვლის მეთოდი" name="type" options={typeLabels} />
        <Input defaultValue={discount?.value ?? ""} label="მნიშვნელობა" name="value" type="number" step="0.01" />
        <Input defaultValue={discount?.currency ?? "GEL"} label="ვალუტა" name="currency" />
        <Select defaultValue={discount?.status ?? "draft"} label="სტატუსი" name="status" options={statusLabels} />
      </FormSection>

      <FormSection step="2" title="სამიზნე">
        {showProducts ? <MultiSelect defaultValues={selectedProductIds} label="პროდუქტები" name="productIds" options={products.map((product) => ({ value: product.id, label: product.sku ? `${product.name} · ${product.sku}` : product.name }))} /> : null}
        {showCategories ? <MultiSelect defaultValues={selectedCategoryIds} label="კატეგორიები" name="categoryIds" options={categories.map((category) => ({ value: category.id, label: category.path }))} /> : null}
        {showCustomer ? <MultiSelect defaultValues={selectedCustomerIds} label="მომხმარებელი / კომპანია" name="customerIds" options={customers.map((customer) => ({ value: customer.id, label: customerLabel(customer) }))} /> : null}
        {scope === "all_products" ? <ReadonlyBox icon={<Package size={16} />} title="ყველა პროდუქტი" text="წესი გავრცელდება კომპანიის ყველა აქტიურ პროდუქტზე." /> : null}
        {showCart ? <ReadonlyBox icon={<ShoppingCart size={16} />} title="კალათა" text="წესი ითვლება შეკვეთის/კალათის საერთო ჯამზე." /> : null}
      </FormSection>

      <FormSection step="3" title="პირობები">
        <Input defaultValue={discount?.minQuantity ?? ""} label="მინ. რაოდენობა" name="minQuantity" type="number" step="0.01" />
        <Input defaultValue={discount?.minAmount ?? ""} label={showCart ? "კალათის მინ. ჯამი" : "მინ. თანხა"} name="minAmount" type="number" step="0.01" />
        {showCart ? <Input defaultValue={conditionValue(conditions, "cart_total")} label="კალათის ჯამი მინიმუმ" name="cartTotalCondition" type="number" step="0.01" /> : null}
        <Input defaultValue={discount?.priority ?? 100} label="პრიორიტეტი" name="priority" type="number" />
        <Input defaultValue={discount?.channel ?? "all"} label="არხი" name="channel" />
        <Toggle defaultChecked={discount?.stackable ?? false} label="სხვა ფასდაკლებასთან ჯამდება" name="stackable" />
      </FormSection>

      <FormSection step="4" title="ვადა და შენიშვნა">
        <Input defaultValue={dateInputValue(discount?.startsAt)} label="დაწყება" name="startsAt" type="datetime-local" />
        <Input defaultValue={dateInputValue(discount?.endsAt)} label="დასრულება" name="endsAt" type="datetime-local" />
        <label className="grid gap-2 text-sm font-semibold text-slate-600 md:col-span-2">
          შენიშვნა
          <textarea className="min-h-24 rounded-2xl border border-indigo-950/8 bg-white px-4 py-3 outline-none" defaultValue={discount?.notes ?? ""} name="notes" />
        </label>
      </FormSection>

      <FormSection step="5" title="დამატებითი პირობები">
        <input name="conditionsJson" type="hidden" value={JSON.stringify(conditions)} />
        <div className="grid gap-3 md:col-span-2 xl:col-span-3">
          {conditions.map((condition, index) => (
            <div key={index} className="grid gap-2 rounded-2xl border border-indigo-950/8 bg-white p-3 md:grid-cols-[1fr_1fr_1fr_auto]">
              <select className="rounded-xl border border-indigo-950/8 bg-[#fbfcff] px-3 py-2 outline-none" value={condition.field} onChange={(event) => updateCondition(conditions, setConditions, index, "field", event.target.value)}>
                <option value="customer">მომხმარებელი</option>
                <option value="cart_total">კალათის ჯამი</option>
                <option value="quantity">რაოდენობა</option>
                <option value="channel">არხი</option>
              </select>
              <select className="rounded-xl border border-indigo-950/8 bg-[#fbfcff] px-3 py-2 outline-none" value={condition.operator} onChange={(event) => updateCondition(conditions, setConditions, index, "operator", event.target.value)}>
                <option value="equals">უდრის</option>
                <option value="gte">მეტია ან ტოლი</option>
                <option value="lte">ნაკლებია ან ტოლი</option>
                <option value="contains">შეიცავს</option>
              </select>
              <input className="rounded-xl border border-indigo-950/8 bg-[#fbfcff] px-3 py-2 outline-none" value={condition.value} onChange={(event) => updateCondition(conditions, setConditions, index, "value", event.target.value)} />
              <button className="grid size-10 place-items-center rounded-xl border border-rose-100 text-rose-500 hover:bg-rose-50" onClick={() => setConditions(conditions.filter((_, itemIndex) => itemIndex !== index))} title="პირობის წაშლა" type="button">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <button className="inline-flex w-fit items-center gap-2 rounded-2xl border border-indigo-950/8 bg-white px-4 py-3 text-sm font-bold text-slate-600 hover:text-[#5e5bff]" onClick={() => setConditions([...conditions, { field: showCustomer ? "customer" : showCart ? "cart_total" : "quantity", operator: showCustomer ? "equals" : "gte", value: "" }])} type="button">
            <Plus size={15} />
            პირობის დამატება
          </button>
        </div>
      </FormSection>
    </>
  );
}

function discountPayload(form: FormData) {
  return {
    name: form.get("name"),
    type: form.get("type"),
    scope: form.get("scope"),
    value: nullableNumber(form.get("value")),
    currency: form.get("currency"),
    priority: nullableInteger(form.get("priority")) ?? 100,
    stackable: form.get("stackable") === "on",
    startsAt: emptyToNull(form.get("startsAt")),
    endsAt: emptyToNull(form.get("endsAt")),
    minQuantity: nullableNumber(form.get("minQuantity")),
    minAmount: nullableNumber(form.get("minAmount")),
    buyQuantity: nullableInteger(form.get("buyQuantity")),
    getQuantity: nullableInteger(form.get("getQuantity")),
    channel: form.get("channel"),
    status: form.get("status"),
    notes: emptyToNull(form.get("notes")),
    conditions: conditionsPayload(form),
    productIds: form.getAll("productIds").map(String),
    categoryIds: form.getAll("categoryIds").map(String),
    customerIds: form.getAll("customerIds").map(String),
  };
}

function conditionsPayload(form: FormData) {
  const conditions = parseConditions(form.get("conditionsJson"));
  const cartTotal = nullableNumber(form.get("cartTotalCondition"));

  if (cartTotal != null) conditions.push({ field: "cart_total", operator: "gte", value: cartTotal });

  return conditions;
}

function parseConditions(value: FormDataEntryValue | null): DiscountCondition[] {
  try {
    const parsed = JSON.parse(String(value ?? "[]")) as DiscountCondition[];
    return Array.isArray(parsed) ? parsed.filter((condition) => condition.field && condition.operator && String(condition.value).trim()) : [];
  } catch {
    return [];
  }
}

function DiscountDetailPanel({
  discount,
  onClose,
  onDelete,
  onEdit,
  onViewTargets,
}: {
  discount: Discount | null;
  onClose: () => void;
  onDelete: (discount: Discount) => void;
  onEdit: (discount: Discount) => void;
  onViewTargets: (discount: Discount) => void;
}) {
  if (!discount) {
    return (
      <aside className="rounded-2xl border border-[#E3E5EC] bg-white p-6 shadow-sm shadow-indigo-950/5">
        <div className="grid min-h-80 place-items-center text-center">
          <div>
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#f0edff] text-[#5e5bff]">
              <BadgePercent size={22} />
            </span>
            <p className="mt-4 text-[14px] font-medium leading-5 text-[#69728A]">აირჩიე ფასდაკლება დეტალების სანახავად.</p>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl border border-[#E3E5EC] bg-white p-5 shadow-sm shadow-indigo-950/5 xl:sticky xl:top-5 xl:self-start">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold uppercase leading-4 tracking-[0.16em] text-[#5B55F7]">Detail</p>
          <h2 className="mt-3 text-[20px] font-bold leading-7 text-[#151B32]">{discount.name}</h2>
        </div>
        <button className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-[#fbfcff] hover:text-slate-700" onClick={onClose} title="დახურვა" type="button">
          <X size={18} />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={discount.status} />
        <span className={discount.ruleConfig?.source === "balance" ? "rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-600" : "rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500"}>
          {discount.ruleConfig?.source === "balance" ? "Balance" : "Manual"}
        </span>
        <button className="ml-auto inline-flex h-10 items-center gap-2 rounded-xl border border-[#5B55F7]/40 bg-white px-3 text-[14px] font-semibold leading-5 text-[#5B55F7]" onClick={() => onEdit(discount)} type="button">
          <Pencil size={15} />
          რედაქტირება
        </button>
      </div>

      <DetailSection icon={<Info size={18} />} title="ძირითადი ინფორმაცია">
        <DetailRow label="სახელი" value={discount.name} />
        <DetailRow label="არეალი" value={scopeLabels[discount.scope]} />
        <DetailRow label="მნიშვნელობა" value={discountValue(discount)} accent />
        <DetailRow label="სტატუსი" value={statusLabels[discount.status]} />
        <DetailRow label="შექმნის წყარო" value={discount.ruleConfig?.source === "balance" ? "Balance import" : "Manual"} />
      </DetailSection>

      <DetailSection icon={<Box size={18} />} title="მოქმედების სფერო">
        <DetailActionRow label="ვრცელდება">
          <button className="inline-flex max-w-full items-center gap-2 rounded-lg bg-[#EFEDFF] px-3 py-1.5 text-[14px] font-semibold leading-5 text-[#5B55F7] transition hover:bg-[#E5E2FF]" onClick={() => onViewTargets(discount)} type="button">
            {renderTargetIcon(discount.scope)}
            <span className="truncate">{targetCountText(discount)}</span>
          </button>
        </DetailActionRow>
        <DetailRow label="სამიზნეების რაოდენობა" value={String(targetCount(discount))} accent />
      </DetailSection>

      <DetailSection icon={<FileText size={18} />} title="პირობები">
        <DetailRow label="პერიოდი" value={dateRange(discount)} />
        <DetailRow label="მინ. შეკვეთა" value={discount.minAmount ? `${discount.currency} ${discount.minAmount}` : "-"} />
        <DetailRow label="მინ. რაოდენობა" value={discount.minQuantity ? String(discount.minQuantity) : "-"} />
        <DetailRow label="დამატებითი პირობები" value={conditionText(discount)} />
        <DetailRow label="კომენტარი" value={discount.notes ?? "-"} />
      </DetailSection>

      <button className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 text-[14px] font-semibold leading-5 text-rose-600 hover:bg-rose-100" onClick={() => onDelete(discount)} type="button">
        <Trash2 size={16} />
        წაშლა
      </button>
    </aside>
  );
}

function nullableNumber(value: FormDataEntryValue | null) {
  if (value === null || String(value).trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function nullableInteger(value: FormDataEntryValue | null) {
  if (value === null || String(value).trim() === "") return null;
  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}

function emptyToNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function discountValue(discount: Discount) {
  if (discount.value == null) return "-";
  if (discount.type === "percent") return `${discount.value}%`;
  return `${discount.currency} ${discount.value}`;
}

function targetText(discount: Discount) {
  if (discount.scope === "products") return discount.products.map((item) => item.product.name).join(", ") || "პროდუქტები არ არის არჩეული";
  if (discount.scope === "categories") return discount.categories.map((item) => item.category.path).join(", ") || "კატეგორია არ არის არჩეული";
  if (discount.scope === "customer") return discount.customers.map((item) => customerLabel(item.customer)).join(", ") || "მომხმარებელი არ არის არჩეული";
  return scopeLabels[discount.scope];
}

function conditionText(discount: Discount) {
  const configuredConditions = discount.ruleConfig?.conditions ?? [];
  const parts = [
    discount.minQuantity ? `მინ. ${discount.minQuantity} ც.` : "",
    discount.minAmount ? `მინ. ${discount.currency} ${discount.minAmount}` : "",
    discount.buyQuantity && discount.getQuantity ? `${discount.buyQuantity}+${discount.getQuantity}` : "",
    ...configuredConditions.map((condition) => conditionLabel(condition)),
    discount.stackable ? "ჯამდება" : "",
  ].filter(Boolean);
  return parts.join(" · ") || "-";
}

function conditionLabel(condition: DiscountCondition) {
  const fieldLabels: Record<string, string> = {
    customer: "მომხმარებელი",
    cart_total: "კალათა",
    quantity: "რაოდენობა",
    channel: "არხი",
  };
  const operatorLabels: Record<string, string> = {
    equals: "=",
    gte: ">=",
    lte: "<=",
    contains: "შეიცავს",
  };
  return `${fieldLabels[condition.field] ?? condition.field} ${operatorLabels[condition.operator] ?? condition.operator} ${condition.value}`;
}

function conditionValue(conditions: DiscountCondition[], field: string) {
  const condition = conditions.find((item) => item.field === field);
  return condition ? String(condition.value) : "";
}

function customerLabel(customer: Customer) {
  const code = customer.personalId ?? customer.taxId ?? customer.code;
  return code ? `${customer.name} · ${code}` : customer.name;
}

function renderTargetIcon(scope: DiscountScope) {
  if (scope === "categories") return <FolderTree size={14} />;
  if (scope === "cart") return <ShoppingCart size={14} />;
  if (scope === "customer") return <Users size={14} />;
  return <Package size={14} />;
}

function ValuePill({ discount }: { discount: Discount }) {
  return (
      <span className="inline-flex min-w-14 justify-center rounded-lg bg-[#DDF8EA] px-3 py-1.5 text-[14px] font-semibold leading-5 text-[#078752]">
      {discountValue(discount)}
    </span>
  );
}

function TargetPill({ discount, onClick }: { discount: Discount; onClick: (event: React.MouseEvent<HTMLButtonElement>) => void }) {
  return (
    <button className="inline-flex max-w-52 items-center gap-2 rounded-lg bg-[#EFEDFF] px-3 py-1.5 text-[14px] font-medium leading-5 text-[#5B55F7] transition hover:bg-[#E5E2FF]" onClick={onClick} type="button">
      {renderTargetIcon(discount.scope)}
      <span className="truncate">{targetCountText(discount)}</span>
    </button>
  );
}

function TargetModal({ discount, onClose }: { discount: Discount | null; onClose: () => void }) {
  if (!discount) return null;

  const targets = targetItems(discount);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#151B32]/35 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/80 bg-white shadow-2xl shadow-[#151B32]/20">
        <div className="flex items-start justify-between gap-4 border-b border-[#E9EBF1] px-5 py-4">
          <div className="min-w-0">
            <p className="text-[12px] font-semibold uppercase leading-4 tracking-[0.16em] text-[#5B55F7]">ვრცელდება</p>
            <h2 className="mt-2 truncate text-[20px] font-bold leading-7 text-[#151B32]">{discount.name}</h2>
            <p className="mt-1 text-[14px] font-normal leading-5 text-[#69728A]">{scopeLabels[discount.scope]} · {targets.length} ჩანაწერი</p>
          </div>
          <button className="grid size-10 shrink-0 place-items-center rounded-xl text-[#69728A] transition hover:bg-[#F7F8FC] hover:text-[#151B32]" onClick={onClose} title="დახურვა" type="button">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[62vh] overflow-y-auto p-5">
          {targets.length > 0 ? (
            <div className="grid gap-2">
              {targets.map((target) => (
                <div className="flex items-center justify-between gap-4 rounded-xl border border-[#E8EAF1] bg-[#FBFBFD] px-4 py-3" key={target.key}>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold leading-[22px] text-[#151B32]">{target.title}</p>
                    <p className="mt-1 text-[12px] font-normal leading-[18px] text-[#8A93A8]">{target.subtitle}</p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-[#EFEDFF] px-3 py-1.5 text-[12px] font-semibold leading-4 text-[#5B55F7]">{target.kind}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid min-h-56 place-items-center text-center">
              <div>
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#EFEDFF] text-[#5B55F7]">
                  {renderTargetIcon(discount.scope)}
                </span>
                <p className="mt-4 text-[15px] font-semibold leading-[22px] text-[#151B32]">სამიზნე სია ცარიელია</p>
                <p className="mt-1 text-[14px] font-normal leading-5 text-[#69728A]">{scopeLabels[discount.scope]}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-[#E9EBF1] bg-[#FBFBFD] px-5 py-4">
          <button className="h-10 rounded-xl border border-[#DFE2EA] bg-white px-4 text-[14px] font-semibold leading-5 text-[#596278] transition hover:bg-[#F7F8FC]" onClick={onClose} type="button">
            დახურვა
          </button>
        </div>
      </div>
    </div>
  );
}

function targetItems(discount: Discount) {
  if (discount.scope === "products") {
    return discount.products.map((item) => ({
      key: item.productId,
      kind: "პროდუქტი",
      title: item.product.name,
      subtitle: item.product.sku ? `SKU ${item.product.sku}` : "SKU არ არის მითითებული",
    }));
  }

  if (discount.scope === "categories") {
    return discount.categories.map((item) => ({
      key: item.categoryId,
      kind: "კატეგორია",
      title: item.category.path,
      subtitle: item.category.name,
    }));
  }

  if (discount.scope === "customer") {
    return discount.customers.map((item) => ({
      key: item.customerId,
      kind: "მომხმარებელი",
      title: item.customer.name,
      subtitle: item.customer.personalId ?? item.customer.taxId ?? item.customer.code ?? "კოდი არ არის მითითებული",
    }));
  }

  return [{
    key: discount.scope,
    kind: "არეალი",
    title: scopeLabels[discount.scope],
    subtitle: "ცალკე სამიზნეების არჩევა არ სჭირდება",
  }];
}

function targetCount(discount: Discount) {
  if (discount.scope === "products") return discount.products.length;
  if (discount.scope === "categories") return discount.categories.length;
  if (discount.scope === "customer") return discount.customers.length;
  return 1;
}

function targetCountText(discount: Discount) {
  if (discount.scope === "products") return `${discount.products.length} პროდუქტი`;
  if (discount.scope === "categories") return `${discount.categories.length} კატეგორია`;
  if (discount.scope === "customer") return `${discount.customers.length} მომხმარებელი`;
  return scopeLabels[discount.scope];
}

function DetailSection({ children, icon, title }: { children: React.ReactNode; icon: React.ReactNode; title: string }) {
  return (
    <section className="mt-4 rounded-2xl border border-[#E8EAF1] bg-white p-4">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-xl bg-[#EFEDFF] text-[#5B55F7]">{icon}</span>
        <h3 className="text-[15px] font-semibold leading-[22px] text-[#151B32]">{title}</h3>
      </div>
      <div className="mt-4 grid gap-3">{children}</div>
    </section>
  );
}

function DetailRow({ accent, label, value }: { accent?: boolean; label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 text-[14px] leading-5">
      <span className="font-normal text-[#69728A]">{label}</span>
      <span className={accent ? "font-semibold text-[#5B55F7]" : "font-normal leading-5 text-[#596278]"}>{value}</span>
    </div>
  );
}

function DetailActionRow({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-3 text-[14px] leading-5">
      <span className="font-normal text-[#69728A]">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function updateCondition(
  conditions: DiscountCondition[],
  setConditions: React.Dispatch<React.SetStateAction<DiscountCondition[]>>,
  index: number,
  key: keyof DiscountCondition,
  value: string,
) {
  setConditions(conditions.map((condition, itemIndex) => (itemIndex === index ? { ...condition, [key]: value } : condition)));
}

function dateRange(discount: Discount) {
  const startsAt = formatDate(discount.startsAt);
  const endsAt = formatDate(discount.endsAt);
  if (!startsAt && !endsAt) return "-";
  return `${startsAt || "ახლავე"} - ${endsAt || "უვადო"}`;
}

function formatDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("ka-GE");
}

function dateInputValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

function Metric({ icon, label, tone, value }: { icon: React.ReactNode; label: string; tone: "amber" | "green" | "slate" | "violet"; value: number }) {
  const tones = {
    amber: "bg-[#FFF5DE] text-[#D99000]",
    green: "bg-[#E9FAF2] text-[#16A66A]",
    slate: "bg-[#F0F2F7] text-[#6F7890]",
    violet: "bg-[#EFEDFF] text-[#5B55F7]",
  };

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[#E8EAF1] bg-white p-5">
      <span className={`grid size-12 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>{icon}</span>
      <div>
        <p className="text-[14px] font-medium leading-5 text-[#69728A]">{label}</p>
        <p className="mt-1 text-[30px] font-bold leading-9 text-[#151B32]">{value}</p>
      </div>
    </div>
  );
}

function Notice({ children, tone }: { children: React.ReactNode; tone: "success" | "error" }) {
  const className = tone === "success"
    ? "rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"
    : "rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700";
  return <div className={className}>{children}</div>;
}

function StatusBadge({ status }: { status: DiscountStatus }) {
  const className = status === "active"
    ? "bg-[#DDF8EA] text-[#078752] before:bg-[#11A968]"
    : status === "draft" || status === "paused"
      ? "bg-[#FFF1CC] text-[#B87400] before:bg-[#E79A00]"
      : "bg-[#EEF0F5] text-[#667085] before:bg-[#667085]";
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold leading-4 before:size-1.5 before:rounded-full ${className}`}>{statusLabels[status]}</span>;
}

function FormSection({ children, step, title }: { children: React.ReactNode; step: string; title: string }) {
  return (
    <section className="mt-5 rounded-2xl bg-[#FBFBFD] p-4">
      <div className="flex items-center gap-3">
        <span className="grid size-8 place-items-center rounded-xl bg-white text-[13px] font-semibold leading-[18px] text-[#5B55F7] shadow-sm">{step}</span>
        <h3 className="text-[15px] font-semibold leading-[22px] text-[#151B32]">{title}</h3>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
}

function ReadonlyBox({ icon, text, title }: { icon: React.ReactNode; text: string; title: string }) {
  return (
    <div className="rounded-2xl border border-indigo-950/8 bg-white px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
        <span className="text-[#5e5bff]">{icon}</span>
        {title}
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">{text}</p>
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...inputProps } = props;
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-600">
      {label}
      <input className="h-12 rounded-xl border border-[#DFE2EA] bg-white px-4 text-[14px] font-normal leading-5 text-[#151B32] outline-none transition placeholder:text-[#9AA2B5] focus:border-[#5B55F7] focus:ring-4 focus:ring-[#5B55F7]/10" {...inputProps} />
    </label>
  );
}

function Select<T extends string>({ defaultValue, label, name, onChange, options }: { defaultValue: T; label: string; name: string; onChange?: (value: string) => void; options: Record<T, string> }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-600">
      {label}
      <select className="h-12 rounded-xl border border-[#DFE2EA] bg-white px-4 text-[14px] font-medium leading-5 text-[#596278] outline-none transition focus:border-[#5B55F7] focus:ring-4 focus:ring-[#5B55F7]/10" defaultValue={defaultValue} name={name} onChange={(event) => onChange?.(event.target.value)}>
        {Object.entries(options).map(([value, optionLabel]) => (
          <option key={value} value={value}>{optionLabel as string}</option>
        ))}
      </select>
    </label>
  );
}

function MultiSelect({ defaultValues, label, name, options }: { defaultValues: Set<string>; label: string; name: string; options: { value: string; label: string }[] }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-600">
      {label}
      <select className="min-h-36 rounded-xl border border-[#DFE2EA] bg-white px-4 py-3 text-[14px] font-normal leading-5 text-[#151B32] outline-none transition focus:border-[#5B55F7] focus:ring-4 focus:ring-[#5B55F7]/10" defaultValue={[...defaultValues]} multiple name={name}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function Toggle({ label, ...inputProps }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex h-12 items-center justify-between gap-3 rounded-xl border border-[#DFE2EA] bg-white px-4 text-[14px] font-medium leading-5 text-[#596278]">
      {label}
      <input className="size-5 accent-[#5e5bff]" type="checkbox" {...inputProps} />
    </label>
  );
}
