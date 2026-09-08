"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Box, CalendarDays, ChevronDown, FileText, Link2, Package, Save, Settings2, ShieldCheck, ShoppingBag, Tag, Truck, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { CoreModuleShell, getAuthHeaders } from "@/components/erp/CoreModuleShell";

type Product = {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  categoryId?: string | null;
  category?: string | null;
  categoryPath?: string | null;
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
  stockBreakdown?: StockBreakdownLine[];
  externalData?: Record<string, unknown> | null;
  status: string;
};

type StockBreakdownLine = {
  warehouseUid?: string | null;
  warehouseName?: string | null;
  quantity?: number | string | null;
  reserve?: number | string | null;
  reservedQuantity?: number | string | null;
  seriesName?: string | null;
  series?: string | null;
  expiryDate?: string | null;
};

type ProductCategory = {
  id: string;
  parentId: string | null;
  name: string;
  path: string;
  level: number;
  status: string;
};

type ApiError = { code?: string; message?: string };

export default function ProductEditPage() {
  return (
    <Suspense fallback={null}>
      <ProductEditContent />
    </Suspense>
  );
}

function ProductEditContent() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [costPrice, setCostPrice] = useState("0");
  const [salePrice, setSalePrice] = useState("0");
  const [discountPercent, setDiscountPercent] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [currency, setCurrency] = useState("GEL");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void Promise.all([
        fetch(`/api/erp/products/${params.id}`, { headers: getAuthHeaders() }).then(async (response) => (response.ok ? ((await response.json()) as Product) : null)),
        fetch("/api/erp/products/categories", { headers: getAuthHeaders() }).then(async (response) => (response.ok ? ((await response.json()) as ProductCategory[]) : [])),
      ]).then(([nextProduct, nextCategories]) => {
        setProduct(nextProduct);
        setCategories(nextCategories);
        setCostPrice(String(nextProduct?.costPrice ?? "0"));
        setSalePrice(String(nextProduct?.salePrice ?? "0"));
        setDiscountPercent(String(nextProduct?.discountPercent ?? ""));
        setDiscountAmount(String(nextProduct?.discountAmount ?? ""));
        setCurrency(nextProduct?.currency ?? "GEL");
        setIsLoading(false);
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [params.id]);

  const salePriceAfterDiscount = useMemo(() => {
    const sale = Number(salePrice || 0);
    const percent = Number(discountPercent || 0);
    const amount = Number(discountAmount || 0);
    return Math.max(0, sale - sale * (percent / 100) - amount);
  }, [discountAmount, discountPercent, salePrice]);

  async function updateProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product) return;
    setError("");

    const response = await fetch(`/api/erp/products/${product.id}`, {
      method: "PATCH",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(productPayload(new FormData(event.currentTarget))),
    });

    if (!response.ok) {
      const apiError = (await response.json().catch(() => ({}))) as ApiError;
      setError(apiError.message ?? "პროდუქტის შენახვა ვერ მოხერხდა.");
      return;
    }

    router.push("/erp/products");
  }

  if (isLoading) {
    return (
      <CoreModuleShell activeRoute="/erp/products" eyebrow="Catalog" title="პროდუქტის რედაქტირება">
        <div className="rounded-2xl border border-[#E3E5EC] bg-white p-8 text-[14px] font-semibold text-[#707A91]">იტვირთება...</div>
      </CoreModuleShell>
    );
  }

  if (!product) {
    return (
      <CoreModuleShell activeRoute="/erp/products" eyebrow="Catalog" title="პროდუქტის რედაქტირება">
        <div className="rounded-2xl border border-[#E3E5EC] bg-white p-8 text-[14px] font-semibold text-rose-600">პროდუქტი ვერ მოიძებნა.</div>
      </CoreModuleShell>
    );
  }

  return (
    <CoreModuleShell
      activeRoute="/erp/products"
      actions={
        <div className="flex items-center gap-3">
          <button className="h-11 rounded-xl border border-[#BFC7DC] bg-white px-5 text-[14px] font-semibold leading-5 text-[#151B32] transition hover:bg-[#F7F8FC]" onClick={() => router.push("/erp/products")} type="button">
            გაუქმება
          </button>
          <button className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#5B55F7] px-5 text-[14px] font-semibold leading-5 text-white shadow-lg shadow-indigo-200 transition hover:bg-[#4D47E8]" form="product-edit-form" type="submit">
            <Save size={16} />
            ცვლილებების შენახვა
          </button>
        </div>
      }
      eyebrow="Catalog"
      title="პროდუქტის რედაქტირება"
    >
      <form className="grid gap-5 pb-20 text-[#151B32]" id="product-edit-form" onSubmit={updateProduct}>
        <p className="-mt-4 text-[14px] font-normal leading-5 text-[#707A91]">განაახლე პროდუქტის ინფორმაცია, ფასი და მარაგი</p>

        {error ? <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">{error}</div> : null}

        <section className="flex flex-wrap items-center gap-5 rounded-2xl border border-[#E3E5EC] bg-white p-5 shadow-sm shadow-indigo-950/5">
          <span className="grid size-[68px] place-items-center rounded-2xl bg-[#EFEDFF] text-[#5B55F7]"><Tag size={34} /></span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="truncate text-[22px] font-bold leading-8">{product.name}</h2>
              <StatusPill status={product.status} />
            </div>
          </div>
          <SummaryDivider />
          <SummaryItem label="SKU:" value={product.sku ?? "-"} />
          <SummaryDivider />
          <SummaryItem label="შტრიხკოდი:" value={product.barcode ?? "-"} />
        </section>

        <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_520px]">
          <div className="grid gap-5">
            <EditCard icon={<FileText size={20} />} title="ძირითადი ინფორმაცია">
              <Input defaultValue={product.name} help="სახელი გამოჩნდება კატალოგში, შეკვეთებსა და ანგარიშებში." label="დასახელება" name="name" required />
              <Input defaultValue={product.sku ?? ""} help="შიდა კოდი, რომლითაც პროდუქტი სწრაფად მოიძებნება." label="SKU / შიდა კოდი" name="sku" />
              <Input defaultValue={product.barcode ?? ""} help="სკანერის ან გარე სისტემის შტრიხკოდი." label="შტრიხკოდი" name="barcode" />
              <Select defaultValue={product.categoryId ?? ""} help="კატეგორია გამოიყენება ფილტრებში, ანგარიშებში და ფასდაკლებების წესებში." label="კატეგორია" name="categoryId">
                <option value="">კატეგორიის გარეშე</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.path}</option>)}
              </Select>
              <Input defaultValue={product.brand ?? ""} help="ბრენდი არჩევითია და ძებნას/დაჯგუფებას ეხმარება." label="ბრენდი" name="brand" placeholder="აირჩიე ბრენდი" />
              <Select defaultValue={product.unit ?? "ცალი"} help="რაოდენობის აღრიცხვის ერთეული." label="ერთეული" name="unit">
                <option value="ცალი">ცალი</option>
                <option value="კგ">კგ</option>
                <option value="ლ">ლ</option>
                <option value="მ">მ</option>
              </Select>
            </EditCard>

            <EditCard icon={<Tag size={20} />} title="ფასები და გადასახადები">
              <MoneyInput help="საშუალო/ბოლო შესყიდვის ფასი, მარჟისა და მარაგის ღირებულებისთვის." label="შესყიდვის ფასი" name="costPrice" onChange={(event) => setCostPrice(event.target.value)} value={costPrice} currency={currency} />
              <MoneyInput help="ძირითადი გასაყიდი ფასი ფასდაკლებამდე." label="გასაყიდი ფასი" name="salePrice" onChange={(event) => setSalePrice(event.target.value)} value={salePrice} currency={currency} />
              <Select defaultValue={product.currency ?? "GEL"} help="ფასების ვალუტა ამ პროდუქტისთვის." label="ვალუტა" name="currency" onChange={(event) => setCurrency(event.target.value)}>
                <option value="GEL">GEL</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </Select>
              <Select defaultValue={product.vatRate ?? "18"} help="გადასახადის განაკვეთი გაყიდვის დოკუმენტებისთვის." label="დღგ" name="vatRate">
                <option value="18">18%</option>
                <option value="0">0%</option>
              </Select>
              <Input help="პროდუქტზე მიბმული პროცენტული ფასდაკლება. Balance-იდან მოსული მნიშვნელობაც აქ ჩანს." label="ფასდაკლება %" name="discountPercent" onChange={(event) => setDiscountPercent(event.target.value)} type="number" step="0.01" value={discountPercent} />
              <MoneyInput help="ფიქსირებული თანხობრივი ფასდაკლება, თუ პროცენტის ნაცვლად თანხა გამოიყენება." label="ფასდაკლება თანხა" name="discountAmount" onChange={(event) => setDiscountAmount(event.target.value)} value={discountAmount} currency={currency} />
              <Input defaultValue={product.discountName ?? ""} help="ფასდაკლების აღწერითი სახელი ანგარიშებისა და შემოწმებისთვის." label="ფასდაკლების სახელი" name="discountName" />
              <div className="rounded-2xl bg-[#F3F1FF] p-4 md:col-span-2 xl:col-span-3">
                <div className="flex items-center gap-4">
                  <span className="grid size-12 place-items-center rounded-2xl bg-[#E7E2FF] text-[#5B55F7]"><Package size={22} /></span>
                  <div>
                    <p className="text-[14px] font-semibold leading-5 text-[#5B55F7]">საბოლოო გასაყიდი ფასი</p>
                    <p className="mt-1 text-[24px] font-bold leading-8 text-[#5B55F7]">{salePriceAfterDiscount.toFixed(2)} {currency}</p>
                  </div>
                  <span className="ml-auto text-[13px] font-medium leading-5 text-[#8A93A8]">ფასდაკლების შემდეგ</span>
                </div>
              </div>
            </EditCard>

            <EditCard icon={<Link2 size={20} />} title="Balance და იმპორტის მონაცემები">
              <ReadonlyInput help="აჩვენებს ხელით შექმნილია პროდუქტი თუ Balance import-ით." label="წყარო" value={product.source ?? "Manual"} />
              <ReadonlyInput help="გარე სისტემის უნიკალური იდენტიფიკატორი; არ უნდა შეიცვალოს ხელით." label="External UID / Balance ID" value={product.externalUid ?? "-"} />
              <ReadonlyInput help="ბოლო სინქრონიზაციის მდგომარეობა." label="Sync status" value={product.syncStatus ?? "-"} />
              <Input defaultValue={product.rsName ?? ""} help="სრული/საბუღალტრო დასახელება გარე სისტემიდან." label="RS დასახელება" name="rsName" />
              <Input defaultValue={product.supplierSku ?? ""} help="მომწოდებლის კოდი ან არტიკული." label="მომწოდებლის SKU" name="supplierSku" />
              <Input defaultValue={product.defaultWarehouseId ?? ""} help="საწყობის ID გამოიყენება ავტომატური ოპერაციების default მიმართულებად." label="ნაგულისხმევი საწყობი" name="defaultWarehouseId" />
              <ReadonlyText label="Balance ფასდაკლების პირობა" value={product.discountCondition ?? "-"} />
              <ReadonlyText label="Balance ფასდაკლების გრაფიკი" value={product.discountSchedule ?? "-"} />
              <TextArea defaultValue={product.description ?? ""} label="აღწერა" name="description" />
            </EditCard>

            <SettingsCard product={product} />
          </div>

          <div className="grid gap-5">
            <EditCard action={<span className="rounded-xl bg-[#FFF3D9] px-3 py-2 text-[12px] font-semibold leading-4 text-[#D98400]">{stockStatus(product)}</span>} columns="two" icon={<Box size={20} />} title="მარაგი">
              <Input defaultValue={product.minStock ?? "0"} help="ამ ზღვარზე ჩამოსვლისას პროდუქტი დაბალი მარაგის სტატუსს მიიღებს." label="მინიმალური მარაგი" name="minStock" type="number" step="0.01" />
              <Input defaultValue={product.reorderPoint ?? "0"} help="რეკომენდებული შესავსები რაოდენობა შესყიდვის დაგეგმვისთვის." label="შევსების რაოდენობა" name="reorderPoint" type="number" step="0.01" />
              <ReadonlyInput help="ფაქტობრივი ნაშთი ყველა საწყობში ერთად." label="ნაშთი" value={String(product.stockQuantity ?? 0)} />
              <ReadonlyInput help="უკვე დაჯავშნილი რაოდენობა, რომელიც ხელმისაწვდომში აღარ ითვლება." label="რეზერვი" value={String(product.reservedQuantity ?? 0)} />
              <ReadonlyInput help="დათვლილია ფორმულით: ნაშთი მინუს რეზერვი." label="ხელმისაწვდომი" value={String(Math.max(0, Number(product.stockQuantity ?? 0) - Number(product.reservedQuantity ?? 0)))} />
              <ReadonlyInput help="პარტიების/სერიების რაოდენობა, თუ პროდუქტი სერიებით აღირიცხება." label="სერიები" value={String(product.seriesCount ?? 0)} />
              <label className="grid gap-2 text-[13px] font-semibold leading-[18px] text-[#526078] md:col-span-2">
                ვარგისიანობის ვადა
                <span className="flex h-12 items-center gap-3 rounded-xl border border-[#DDE2EC] bg-white px-4 text-[14px] font-semibold leading-5 text-[#151B32]">
                  <CalendarDays size={18} className="text-[#64738F]" />
                  {product.nearestExpiryDate ? formatDate(product.nearestExpiryDate) : "ვადა არ არის მითითებული"}
                  <CalendarDays size={18} className="ml-auto text-[#64738F]" />
                </span>
              </label>
            </EditCard>

            <StockBreakdownCard lines={product.stockBreakdown ?? []} />
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#E3E6EE] bg-white/95 px-5 py-4 backdrop-blur lg:left-[260px]">
          <div className="flex justify-end gap-3">
            <button className="h-11 rounded-xl border border-[#BFC7DC] bg-white px-5 text-[14px] font-semibold leading-5 text-[#151B32]" onClick={() => router.push("/erp/products")} type="button">გაუქმება</button>
            <button className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#5B55F7] px-5 text-[14px] font-semibold leading-5 text-white shadow-lg shadow-indigo-200" type="submit">
              <Save size={16} />
              ცვლილებების შენახვა
            </button>
          </div>
        </div>
      </form>
    </CoreModuleShell>
  );
}

function EditCard({ action, children, columns = "three", icon, title }: { action?: React.ReactNode; children: React.ReactNode; columns?: "two" | "three"; icon: React.ReactNode; title: string }) {
  const gridClass = columns === "two" ? "grid gap-4 md:grid-cols-2" : "grid gap-4 md:grid-cols-2 xl:grid-cols-3";

  return (
    <section className="rounded-2xl border border-[#E3E5EC] bg-white p-5 shadow-sm shadow-indigo-950/5">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-[#EFEDFF] text-[#5B55F7]">{icon}</span>
        <h2 className="text-[18px] font-bold leading-7">{title}</h2>
        <div className="ml-auto">{action}</div>
      </div>
      <div className={gridClass}>{children}</div>
    </section>
  );
}

function SettingsCard({ product }: { product: Product }) {
  return (
    <section className="rounded-2xl border border-[#E3E5EC] bg-white p-5 shadow-sm shadow-indigo-950/5">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-[#EFEDFF] text-[#5B55F7]"><Settings2 size={20} /></span>
        <div>
          <h2 className="text-[18px] font-bold leading-7">პარამეტრები</h2>
          <p className="text-[12px] font-normal leading-[18px] text-[#8A93A8]">პროდუქტის გამოყენება შესყიდვაში, გაყიდვაში და მარაგის აღრიცხვაში</p>
        </div>
        <span className="ml-auto rounded-xl bg-[#E4F8EF] px-3 py-2 text-[12px] font-semibold leading-4 text-[#07945B]">კონფიგურაცია</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Select defaultValue={product.type ?? "stocked"} label="პროდუქტის ტიპი" name="type">
          <option value="stocked">საქონელი</option>
          <option value="service">სერვისი</option>
          <option value="expense">ხარჯი</option>
        </Select>
        <Select defaultValue={product.status ?? "active"} label="სტატუსი" name="status">
          <option value="active">აქტიური</option>
          <option value="inactive">არააქტიური</option>
          <option value="draft">შავი</option>
        </Select>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <ToggleCard defaultChecked={product.isPurchasable} description="ჩანს შესყიდვის ორდერებში და მიღებებში" icon={<Truck size={18} />} label="შესყიდვადია" name="isPurchasable" />
        <ToggleCard defaultChecked={product.isSellable} description="გამოიყენება გაყიდვებში და ფასდაკლებებში" icon={<ShoppingBag size={18} />} label="გაყიდვადია" name="isSellable" />
        <ToggleCard defaultChecked={product.tracksInventory} description="ნაშთი, რეზერვი და საწყობი კონტროლდება" icon={<Box size={18} />} label="მარაგი აღირიცხება" name="tracksInventory" />
        <ToggleCard defaultChecked={product.tracksLots} description="სერიები/პარტიები შეინახება საწყობების ჭრილში" icon={<Package size={18} />} label="პარტიებით აღრიცხვა" name="tracksLots" />
        <ToggleCard defaultChecked={product.tracksExpiry} description="ვარგისიანობის ვადის კონტროლი აქტიურდება" icon={<CalendarDays size={18} />} label="ვადის კონტროლი" name="tracksExpiry" />
        <div className="flex min-h-[76px] items-center gap-3 rounded-xl border border-dashed border-[#DDE2EC] bg-[#FBFCFF] px-4 py-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#F3F5FA] text-[#64738F]"><ShieldCheck size={18} /></span>
          <div>
            <p className="text-[13px] font-semibold leading-[18px] text-[#526078]">უსაფრთხო შენახვა</p>
            <p className="mt-1 text-[12px] font-normal leading-[18px] text-[#8A93A8]">Balance-ის readonly ველები არ გადაიწერება</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { help?: string; label: string }) {
  const { help, label, ...inputProps } = props;
  return (
    <label className="grid gap-2 text-[13px] font-semibold leading-[18px] text-[#526078]">
      <FieldLabel help={help} label={label} />
      <input className="h-12 rounded-xl border border-[#DDE2EC] bg-white px-4 text-[14px] font-medium leading-5 text-[#151B32] outline-none focus:border-[#5B55F7] focus:ring-4 focus:ring-[#5B55F7]/10" {...inputProps} />
    </label>
  );
}

function MoneyInput(props: React.InputHTMLAttributes<HTMLInputElement> & { currency?: string; help?: string; label: string }) {
  const { currency = "GEL", help, label, ...inputProps } = props;
  return (
    <label className="grid gap-2 text-[13px] font-semibold leading-[18px] text-[#526078]">
      <FieldLabel help={help} label={label} />
      <span className="flex h-12 overflow-hidden rounded-xl border border-[#DDE2EC] bg-white">
        <input className="min-w-0 flex-1 px-4 text-[14px] font-medium leading-5 text-[#151B32] outline-none" type="number" step="0.01" {...inputProps} />
        <span className="grid w-16 place-items-center bg-[#F3F5FA] text-[14px] font-semibold text-[#526078]">{currency}</span>
      </span>
    </label>
  );
}

function Select({ children, help, label, ...selectProps }: React.SelectHTMLAttributes<HTMLSelectElement> & { help?: string; label: string }) {
  return (
    <label className="grid gap-2 text-[13px] font-semibold leading-[18px] text-[#526078]">
      <FieldLabel help={help} label={label} />
      <span className="relative">
        <select className="h-12 w-full appearance-none rounded-xl border border-[#DDE2EC] bg-white px-4 pr-10 text-[14px] font-medium leading-5 text-[#151B32] outline-none focus:border-[#5B55F7] focus:ring-4 focus:ring-[#5B55F7]/10" {...selectProps}>
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#64738F]" />
      </span>
    </label>
  );
}

function ReadonlyInput({ help, label, value }: { help?: string; label: string; value: string }) {
  return (
    <label className="grid gap-2 text-[13px] font-semibold leading-[18px] text-[#526078]">
      <FieldLabel help={help} label={label} />
      <span className="flex h-12 items-center rounded-xl border border-[#DDE2EC] bg-white px-4 text-[14px] font-medium leading-5 text-[#151B32]">{value}</span>
    </label>
  );
}

function FieldLabel({ help, label }: { help?: string; label: string }) {
  return (
    <span>
      <span className="block">{label}</span>
      {help ? <span className="mt-0.5 block text-[11px] font-normal leading-4 text-[#8A93A8]">{help}</span> : null}
    </span>
  );
}

function ReadonlyText({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 text-[13px] font-semibold leading-[18px] text-[#526078] md:col-span-2 xl:col-span-3">
      {label}
      <div className="max-h-28 overflow-y-auto rounded-xl border border-[#DDE2EC] bg-[#FBFCFF] px-4 py-3 text-[13px] font-normal leading-5 text-[#596278]">
        {value}
      </div>
    </div>
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const { label, ...textareaProps } = props;
  return (
    <label className="grid gap-2 text-[13px] font-semibold leading-[18px] text-[#526078] md:col-span-2 xl:col-span-3">
      {label}
      <textarea className="min-h-24 rounded-xl border border-[#DDE2EC] bg-white px-4 py-3 text-[14px] font-medium leading-5 text-[#151B32] outline-none focus:border-[#5B55F7] focus:ring-4 focus:ring-[#5B55F7]/10" {...textareaProps} />
    </label>
  );
}

function ToggleCard({ description, icon, label, ...inputProps }: React.InputHTMLAttributes<HTMLInputElement> & { description: string; icon: React.ReactNode; label: string }) {
  return (
    <label className="group flex min-h-[76px] cursor-pointer items-center gap-3 rounded-xl border border-[#DDE2EC] bg-white px-4 py-3 transition hover:border-[#CFCBFF] hover:bg-[#FAF9FF]">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#EFEDFF] text-[#5B55F7] transition group-hover:bg-[#E4E1FF]">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold leading-[18px] text-[#151B32]">{label}</span>
        <span className="mt-1 block text-[12px] font-normal leading-[18px] text-[#8A93A8]">{description}</span>
      </span>
      <input className="size-5 shrink-0 accent-[#5B55F7]" type="checkbox" {...inputProps} />
    </label>
  );
}

function StockBreakdownCard({ lines }: { lines: StockBreakdownLine[] }) {
  const totalQuantity = lines.reduce((sum, line) => sum + Number(line.quantity ?? 0), 0);
  const totalReserved = lines.reduce((sum, line) => sum + Number(line.reservedQuantity ?? line.reserve ?? 0), 0);
  const available = Math.max(0, totalQuantity - totalReserved);

  return (
    <section className="rounded-2xl border border-[#E3E5EC] bg-white p-5 shadow-sm shadow-indigo-950/5">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-[#EFEDFF] text-[#5B55F7]"><Package size={20} /></span>
        <div>
          <h2 className="text-[18px] font-bold leading-7">საწყობების ჭრილი</h2>
          <p className="text-[12px] font-normal leading-[18px] text-[#8A93A8]">Balance-იდან მოსული ნაშთები საწყობის, სერიის და ვადის მიხედვით</p>
        </div>
        <span className="ml-auto rounded-xl bg-[#F3F5FA] px-3 py-2 text-[12px] font-semibold leading-4 text-[#64738F]">{lines.length} ხაზი</span>
      </div>

      {lines.length ? (
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <StockSummary label="ნაშთი" tone="green" value={totalQuantity} />
            <StockSummary label="რეზერვი" tone="orange" value={totalReserved} />
            <StockSummary label="ხელმისაწვდომი" tone="violet" value={available} />
          </div>

          <div className="grid gap-3">
            {lines.map((line, index) => {
              const reserved = Number(line.reservedQuantity ?? line.reserve ?? 0);
              const quantity = Number(line.quantity ?? 0);
              const lineAvailable = Math.max(0, quantity - reserved);
              return (
                <article className="rounded-2xl border border-[#E8EAF1] bg-[#FBFCFF] p-4 transition hover:border-[#CFCBFF] hover:bg-[#FAF9FF]" key={`${line.warehouseUid ?? line.warehouseName ?? "warehouse"}-${index}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-bold leading-[22px] text-[#151B32]">{line.warehouseName ?? "უცნობი საწყობი"}</p>
                      <p className="mt-1 truncate text-[12px] font-normal leading-[18px] text-[#8A93A8]">{line.warehouseUid ?? "Balance UID არ არის მითითებული"}</p>
                    </div>
                    <span className="rounded-lg bg-[#DFF8EC] px-3 py-1.5 text-[12px] font-semibold leading-4 text-[#078752]">{lineAvailable} ხელმისაწვდომი</span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <MiniFact label="ნაშთი" value={String(line.quantity ?? 0)} />
                    <MiniFact label="რეზერვი" value={String(line.reservedQuantity ?? line.reserve ?? 0)} />
                    <MiniFact label="სერია" value={line.seriesName ?? line.series ?? "-"} />
                    <MiniFact label="ვადა" value={line.expiryDate ? formatDate(String(line.expiryDate)) : "-"} />
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-[#DDE2EC] bg-[#FBFCFF] p-6 text-center">
          <div>
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#EFEDFF] text-[#5B55F7]"><Package size={22} /></span>
            <p className="mt-4 text-[15px] font-bold leading-[22px] text-[#151B32]">საწყობების ჭრილი ცარიელია</p>
            <p className="mt-1 text-[13px] font-normal leading-5 text-[#8A93A8]">ეს მონაცემი გამოჩნდება Balance სინქრონიზაციის ან მარაგის მოძრაობის შემდეგ.</p>
          </div>
        </div>
      )}
    </section>
  );
}

function StockSummary({ label, tone, value }: { label: string; tone: "green" | "orange" | "violet"; value: number }) {
  const tones = {
    green: "bg-[#DFF8EC] text-[#078752]",
    orange: "bg-[#FFF3D9] text-[#D98400]",
    violet: "bg-[#EFEDFF] text-[#5B55F7]",
  };
  return (
    <div className="rounded-xl border border-[#E8EAF1] bg-white p-3">
      <p className="text-[12px] font-normal leading-[18px] text-[#8A93A8]">{label}</p>
      <p className={`mt-1 inline-flex rounded-lg px-2.5 py-1 text-[13px] font-bold leading-5 ${tones[tone]}`}>{value.toLocaleString("ka-GE")}</p>
    </div>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white px-3 py-2">
      <p className="text-[11px] font-semibold uppercase leading-4 text-[#9AA2B5]">{label}</p>
      <p className="mt-0.5 truncate text-[13px] font-semibold leading-5 text-[#526078]">{value}</p>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-32">
      <p className="text-[13px] font-semibold leading-[18px] text-[#6B7590]">{label}</p>
      <p className="mt-1 text-[15px] font-bold leading-[22px] text-[#263251]">{value}</p>
    </div>
  );
}

function SummaryDivider() {
  return <span className="hidden h-10 w-px bg-[#DDE2EC] md:block" />;
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-[#DFF8EC] px-3 py-1.5 text-[12px] font-semibold leading-4 text-[#078752]">
      <span className="size-2 rounded-full bg-[#0DA766]" />
      {status === "active" ? "აქტიური" : status}
    </span>
  );
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

function stockStatus(product: Product) {
  const stock = Number(product.stockQuantity ?? 0);
  const minStock = Number(product.minStock ?? 0);
  if (minStock > 0 && stock <= minStock) return "დაბალი მარაგი";
  return "მარაგი OK";
}

function nullableNumber(value: FormDataEntryValue | null) {
  if (value === null || String(value).trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ka-GE", { day: "2-digit", month: "long", year: "numeric" });
}
