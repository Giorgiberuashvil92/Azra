"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Download, Filter, Grid2X2, List, MoreHorizontal, Search, SlidersHorizontal, Upload } from "lucide-react";
import { RetailShell } from "../_components/retail-shell";

type Product = (typeof initialProducts)[number];
type StatKey = "all" | "low" | "out" | "active";
type ViewMode = "list" | "grid";

const initialProducts = [
  { name: "ჭვავის პური - დიეტური", sku: "BRD-001", barcode: "002007682", category: "პურ-ფუნთუშეული", cost: "0.90 ₾", price: "1.50 ₾", stock: 20, status: "აქტიური", thumb: "🥖", level: "healthy" },
  { name: "სიმინდის ფქვილი 1კგ", sku: "MLK-001", barcode: "4860102030141", category: "რძის პროდუქტები", cost: "4.20 ₾", price: "6.50 ₾", stock: 32, status: "აქტიური", thumb: "🥛", level: "healthy" },
  { name: "კოკა კოლა 250გ", sku: "COL-250", barcode: "4860102030196", category: "სასმელები", cost: "12.00 ₾", price: "18.90 ₾", stock: 12, status: "აქტიური", thumb: "🥤", level: "low" },
  { name: "მინერალური წყალი 0.5ლ", sku: "WAT-001", barcode: "4860102030172", category: "სასმელები", cost: "2.10 ₾", price: "3.40 ₾", stock: 41, status: "აქტიური", thumb: "💧", level: "healthy" },
  { name: "ქართული ყველი 200გ", sku: "CHS-200", barcode: "4860102030127", category: "რძის პროდუქტები", cost: "5.20 ₾", price: "7.90 ₾", stock: 14, status: "აქტიური", thumb: "🧀", level: "low" },
  { name: "შოკოლადი მუქი 100გ", sku: "CHC-100", barcode: "4860102030158", category: "ტკბილეული", cost: "3.80 ₾", price: "5.60 ₾", stock: 28, status: "აქტიური", thumb: "🍫", level: "healthy" },
  { name: "ბრინჯი 1კგ", sku: "RIC-001", barcode: "4860102030226", category: "ბაკალეა", cost: "4.30 ₾", price: "6.90 ₾", stock: 0, status: "არააქტიური", thumb: "🍚", level: "critical" },
  { name: "ყავა ნესკაფე 100გ", sku: "COF-100", barcode: "4860102030189", category: "სასმელები", cost: "12.50 ₾", price: "19.90 ₾", stock: 22, status: "აქტიური", thumb: "☕", level: "healthy" },
  { name: "ფორთოხლის წვენი 1ლ", sku: "JUC-001", barcode: "4860102030210", category: "სასმელები", cost: "4.80 ₾", price: "7.20 ₾", stock: 5, status: "აქტიური", thumb: "🧃", level: "critical" },
  { name: "კვერცხი 10 ცალი", sku: "EGG-010", barcode: "4860102030203", category: "კვერცხი", cost: "6.30 ₾", price: "9.50 ₾", stock: 36, status: "აქტიური", thumb: "🥚", level: "healthy" },
];

export default function RetailProductsPage() {
  const router = useRouter();
  const [productItems, setProductItems] = useState<Product[]>(initialProducts);
  const [activeStat, setActiveStat] = useState<StatKey>("all");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ყველა");
  const [stockFilter, setStockFilter] = useState("ყველა");
  const [statusFilter, setStatusFilter] = useState("ყველა");
  const [sort, setSort] = useState("სახელი");
  const [view, setView] = useState<ViewMode>("list");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState<string[]>(["WAT-001"]);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [notice, setNotice] = useState("მონიშვნა, ფილტრები და მოქმედებები უკვე აქტიურია");

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return productItems
      .filter((product) => {
        if (activeStat === "low" && !["low", "critical"].includes(product.level)) return false;
        if (activeStat === "out" && product.stock > 0) return false;
        if (activeStat === "active" && product.status !== "აქტიური") return false;
        if (category !== "ყველა" && product.category !== category) return false;
        if (stockFilter === "დაბალი" && !["low", "critical"].includes(product.level)) return false;
        if (stockFilter === "მარაგშია" && product.stock <= 0) return false;
        if (statusFilter !== "ყველა" && product.status !== statusFilter) return false;
        if (!normalized) return true;
        return [product.name, product.sku, product.barcode, product.category].some((value) => value.toLowerCase().includes(normalized));
      })
      .sort((a, b) => {
        if (sort === "მარაგი") return a.stock - b.stock;
        if (sort === "ფასი") return parseFloat(b.price) - parseFloat(a.price);
        return a.name.localeCompare(b.name, "ka");
      });
  }, [activeStat, category, productItems, query, sort, statusFilter, stockFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const visibleProducts = filteredProducts.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const allVisibleSelected = visibleProducts.length > 0 && visibleProducts.every((product) => selected.includes(product.sku));
  const stats = buildStats(productItems, activeStat);

  function resetPage() {
    setPage(1);
    setOpenMenu(null);
  }

  function toggleSelected(sku: string) {
    setSelected((current) => current.includes(sku) ? current.filter((item) => item !== sku) : [...current, sku]);
  }

  function toggleVisibleSelection() {
    setSelected((current) => {
      if (allVisibleSelected) return current.filter((sku) => !visibleProducts.some((product) => product.sku === sku));
      return Array.from(new Set([...current, ...visibleProducts.map((product) => product.sku)]));
    });
  }

  function clearFilters() {
    setQuery("");
    setCategory("ყველა");
    setStockFilter("ყველა");
    setStatusFilter("ყველა");
    setSort("სახელი");
    setActiveStat("all");
    setPage(1);
  }

  function deleteSelected() {
    setProductItems((current) => current.filter((product) => !selected.includes(product.sku)));
    setNotice(`${selected.length} პროდუქტი წაიშალა`);
    setSelected([]);
    setOpenMenu(null);
  }

  function changeSelectedCategory() {
    setProductItems((current) => current.map((product) => selected.includes(product.sku) ? { ...product, category: "სხვა" } : product));
    setNotice(`${selected.length} პროდუქტს კატეგორია შეეცვალა`);
  }

  function toggleSelectedStatus() {
    setProductItems((current) => current.map((product) => selected.includes(product.sku) ? { ...product, status: product.status === "აქტიური" ? "არააქტიური" : "აქტიური" } : product));
    setNotice(`${selected.length} პროდუქტს სტატუსი შეეცვალა`);
  }

  function deleteOne(sku: string) {
    setProductItems((current) => current.filter((product) => product.sku !== sku));
    setSelected((current) => current.filter((item) => item !== sku));
    setOpenMenu(null);
    setNotice("პროდუქტი წაიშალა");
  }

  function duplicateOne(product: Product) {
    const copy: Product = {
      ...product,
      name: `${product.name} ასლი`,
      sku: `${product.sku}-COPY`,
      barcode: `${product.barcode}9`,
    };
    setProductItems((current) => [copy, ...current]);
    setSelected([copy.sku]);
    setOpenMenu(null);
    setNotice("პროდუქტის ასლი დაემატა");
    resetPage();
  }

  return (
    <RetailShell active="products" title="პროდუქტები">
      <div className="grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] gap-3">
        <PageHeading activeStat={activeStat} onAdd={() => router.push("/erp/retail/products/new")} onExport={() => setNotice("ექსპორტი მომზადდა")} onImport={() => setNotice("იმპორტის ფანჯარა გაიხსნა")} onStatChange={(value) => { setActiveStat(value); resetPage(); }} stats={stats} />
        <FilterToolbar category={category} notice={notice} onCategoryChange={(value) => { setCategory(value); resetPage(); }} onClear={clearFilters} onQueryChange={(value) => { setQuery(value); resetPage(); }} onSortChange={(value) => { setSort(value); resetPage(); }} onStatusFilterChange={(value) => { setStatusFilter(value); resetPage(); }} onStockFilterChange={(value) => { setStockFilter(value); resetPage(); }} onViewChange={setView} query={query} sort={sort} statusFilter={statusFilter} stockFilter={stockFilter} view={view} />
        <ProductTable allVisibleSelected={allVisibleSelected} onBulkCategory={changeSelectedCategory} onBulkDelete={deleteSelected} onBulkStatus={toggleSelectedStatus} onDeleteOne={deleteOne} onDuplicateOne={duplicateOne} onEditOne={(product) => router.push(`/erp/retail/products/${product.sku}/edit`)} onMenuToggle={setOpenMenu} onPageChange={setPage} onRowsPerPageChange={(rows) => { setRowsPerPage(rows); resetPage(); }} onSelectAll={toggleVisibleSelection} onSelectOne={toggleSelected} openMenu={openMenu} page={currentPage} products={visibleProducts} rowsPerPage={rowsPerPage} selected={selected} total={filteredProducts.length} totalPages={totalPages} view={view} />
      </div>
    </RetailShell>
  );
}

function PageHeading({ activeStat, onAdd, onExport, onImport, onStatChange, stats }: { activeStat: StatKey; onAdd: () => void; onExport: () => void; onImport: () => void; onStatChange: (stat: StatKey) => void; stats: ReturnType<typeof buildStats> }) {
  return (
    <div className="grid gap-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[28px] font-bold leading-8 tracking-normal text-[#19161F]">პროდუქტები</h2>
          <p className="mt-1 text-[14px] font-medium text-[#7D7787]">პროდუქტების კატალოგი და მარაგების მართვა</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex h-11 items-center gap-2 rounded-[12px] border border-[#E8E5EC] bg-white px-4 text-[13px] font-semibold text-[#1D4ED8]" onClick={onImport} type="button">
            <Download size={17} strokeWidth={1.75} />
            იმპორტი
          </button>
          <button className="inline-flex h-11 items-center gap-2 rounded-[12px] border border-[#E8E5EC] bg-white px-4 text-[13px] font-semibold text-[#1D4ED8]" onClick={onExport} type="button">
            <Upload size={17} strokeWidth={1.75} />
            ექსპორტი
          </button>
          <button className="inline-flex h-11 items-center gap-2 rounded-[12px] bg-[#2563EB] px-4 text-[13px] font-semibold text-white shadow-[0_10px_22px_rgba(37,99,235,0.18)]" onClick={onAdd} type="button">
            + პროდუქტის დამატება
          </button>
        </div>
      </div>
      <nav className="flex items-center gap-7 border-b border-[#E8E5EC]">
        {stats.map((item) => (
          <button className={activeStat === item.key ? "relative h-10 text-[14px] font-semibold text-[#2563EB] after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:rounded-full after:bg-[#2563EB]" : "flex h-10 items-center gap-2 text-[14px] font-semibold text-[#7D7787]"} key={item.label} onClick={() => onStatChange(item.key)} type="button">
            {activeStat !== item.key ? <span className={`size-2 rounded-full ${dotClass(item.tone)}`} /> : null}
            {item.label} <span className={activeStat === item.key ? "text-[#2563EB]" : "text-[#19161F]"}>{item.value}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function FilterToolbar({ category, notice, onCategoryChange, onClear, onQueryChange, onSortChange, onStatusFilterChange, onStockFilterChange, onViewChange, query, sort, statusFilter, stockFilter, view }: {
  category: string;
  notice: string;
  onCategoryChange: (value: string) => void;
  onClear: () => void;
  onQueryChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onStockFilterChange: (value: string) => void;
  onViewChange: (value: ViewMode) => void;
  query: string;
  sort: string;
  statusFilter: string;
  stockFilter: string;
  view: ViewMode;
}) {
  const activeFilterCount = [category !== "ყველა", stockFilter !== "ყველა", statusFilter !== "ყველა"].filter(Boolean).length;
  return (
    <div className="rounded-[14px] border border-[#E8E5EC] bg-white p-3">
      <div className="grid gap-2 xl:grid-cols-[minmax(360px,1fr)_136px_116px_116px_138px_76px_auto]">
        <label className="flex h-11 items-center gap-3 rounded-[10px] border border-[#E8E5EC] px-3 text-[13px] text-[#7D7787]">
          <Search size={18} strokeWidth={1.75} />
          <input className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#9A94A6]" onChange={(event) => onQueryChange(event.target.value)} placeholder="მოძებნე პროდუქტი, SKU ან შტრიხკოდი" value={query} />
        </label>
        <FilterSelect label="კატეგორია" onChange={onCategoryChange} options={["ყველა", "სასმელები", "ტკბილეული", "რძის პროდუქტები", "პურ-ფუნთუშეული"]} value={category} />
        <FilterSelect label="მარაგი" onChange={onStockFilterChange} options={["ყველა", "მარაგშია", "დაბალი"]} value={stockFilter} />
        <FilterSelect label="სტატუსი" onChange={onStatusFilterChange} options={["ყველა", "აქტიური", "არააქტიური"]} value={statusFilter} />
        <FilterSelect icon={<SlidersHorizontal size={17} />} label="სორტირება" onChange={onSortChange} options={["სახელი", "მარაგი", "ფასი"]} value={sort} />
        <button className="relative inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-[#E8E5EC] text-[#7D7787]" type="button">
          <Filter size={18} strokeWidth={1.75} />
          {activeFilterCount > 0 ? <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#2563EB] text-[11px] font-bold text-white">{activeFilterCount}</span> : null}
        </button>
        <div className="flex h-11 rounded-[10px] border border-[#E8E5EC] p-1">
          <button className={view === "list" ? "grid size-9 place-items-center rounded-[8px] bg-[#EFF6FF] text-[#2563EB]" : "grid size-9 place-items-center rounded-[8px] text-[#7D7787]"} onClick={() => onViewChange("list")} type="button" aria-label="სიის ხედი"><List size={17} /></button>
          <button className={view === "grid" ? "grid size-9 place-items-center rounded-[8px] bg-[#EFF6FF] text-[#2563EB]" : "grid size-9 place-items-center rounded-[8px] text-[#7D7787]"} onClick={() => onViewChange("grid")} type="button" aria-label="grid ხედი"><Grid2X2 size={17} /></button>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 text-[12px] font-semibold">
        <span className="inline-flex items-center gap-1.5 text-[#22C58B]"><CheckCircle2 size={14} />{notice}</span>
        {category !== "ყველა" ? <span className="rounded-[8px] bg-[#EFF6FF] px-3 py-1.5 text-[#1D4ED8]">კატეგორია: {category}</span> : null}
        {statusFilter !== "ყველა" ? <span className="rounded-[8px] bg-[#EFF6FF] px-3 py-1.5 text-[#1D4ED8]">სტატუსი: {statusFilter}</span> : null}
        {stockFilter !== "ყველა" ? <span className="rounded-[8px] bg-[#EFF6FF] px-3 py-1.5 text-[#1D4ED8]">მარაგი: {stockFilter}</span> : null}
        <button className="ml-2 text-[#2563EB]" onClick={onClear} type="button">ფილტრების გასუფთავება</button>
      </div>
    </div>
  );
}

function ProductTable({ allVisibleSelected, onBulkCategory, onBulkDelete, onBulkStatus, onDeleteOne, onDuplicateOne, onEditOne, onMenuToggle, onPageChange, onRowsPerPageChange, onSelectAll, onSelectOne, openMenu, page, products, rowsPerPage, selected, total, totalPages, view }: {
  allVisibleSelected: boolean;
  onBulkCategory: () => void;
  onBulkDelete: () => void;
  onBulkStatus: () => void;
  onDeleteOne: (sku: string) => void;
  onDuplicateOne: (product: Product) => void;
  onEditOne: (product: Product) => void;
  onMenuToggle: (sku: string | null) => void;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  onSelectAll: () => void;
  onSelectOne: (sku: string) => void;
  openMenu: string | null;
  page: number;
  products: Product[];
  rowsPerPage: number;
  selected: string[];
  total: number;
  totalPages: number;
  view: ViewMode;
}) {
  if (view === "grid") return <ProductGrid products={products} selected={selected} onSelectOne={onSelectOne} />;

  const start = total === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const end = Math.min(page * rowsPerPage, total);
  return (
    <section className="relative grid min-h-0 grid-rows-[minmax(0,1fr)_auto] overflow-hidden rounded-[14px] border border-[#E8E5EC] bg-white shadow-[0_1px_2px_rgba(25,22,31,0.03)]">
      <div className="min-h-0 overflow-auto pb-14">
        <table className="min-w-full table-fixed border-separate border-spacing-0">
          <colgroup>
            <col className="w-10" />
            <col className="w-[270px]" />
            <col className="w-[150px]" />
            <col className="w-[150px]" />
            <col className="w-[120px]" />
            <col className="w-[120px]" />
            <col className="w-[170px]" />
            <col className="w-[116px]" />
            <col className="w-14" />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-[#FBFAFC]">
            <tr className="text-left text-[12px] font-semibold text-[#7D7787]">
              <th className="border-b border-[#E8E5EC] px-4 py-3"><input aria-label="ყველას არჩევა" checked={allVisibleSelected} className="size-4 accent-[#2563EB]" onChange={onSelectAll} type="checkbox" /></th>
              <th className="border-b border-[#E8E5EC] px-2 py-3">პროდუქტი</th>
              <th className="border-b border-[#E8E5EC] px-2 py-3">შტრიხკოდი / SKU</th>
              <th className="border-b border-[#E8E5EC] px-2 py-3">კატეგორია</th>
              <th className="border-b border-[#E8E5EC] px-2 py-3 text-right">შესყიდვის ფასი</th>
              <th className="border-b border-[#E8E5EC] px-2 py-3 text-right">გაყიდვის ფასი</th>
              <th className="border-b border-[#E8E5EC] px-2 py-3">მარაგი</th>
              <th className="border-b border-[#E8E5EC] px-2 py-3">სტატუსი</th>
              <th className="border-b border-[#E8E5EC] px-4 py-3 text-right">•••</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr className={selected.includes(product.sku) ? "h-[62px] bg-[#EFF6FF] text-[13px]" : "h-[62px] bg-white text-[13px]"} key={product.sku}>
                <td className="border-b border-[#F0EEF4] px-4"><input aria-label={`${product.name} არჩევა`} checked={selected.includes(product.sku)} className="size-4 accent-[#2563EB]" onChange={() => onSelectOne(product.sku)} type="checkbox" /></td>
                <td className="border-b border-[#F0EEF4] px-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[#F7F6F9] text-[21px]">{product.thumb}</span>
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-bold text-[#19161F]">{product.name}</p>
                      <p className="mt-0.5 text-[12px] font-medium text-[#7D7787]">{product.sku}</p>
                    </div>
                  </div>
                </td>
                <td className="border-b border-[#F0EEF4] px-2 font-medium tabular-nums text-[#6F687A]">{product.barcode}</td>
                <td className="truncate border-b border-[#F0EEF4] px-2 font-medium text-[#6F687A]">{product.category}</td>
                <td className="border-b border-[#F0EEF4] px-2 text-right font-bold tabular-nums text-[#19161F]">{product.cost}</td>
                <td className="border-b border-[#F0EEF4] px-2 text-right font-bold tabular-nums text-[#19161F]">{product.price}</td>
                <td className="border-b border-[#F0EEF4] px-2">
                  <div className="grid gap-1.5">
                    <span className="font-semibold tabular-nums text-[#19161F]">{product.stock} ც</span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-[#EEEAF2]"><span className={`block h-full rounded-full ${stockBarClass(product.level)}`} style={{ width: `${Math.min(product.stock * 2.4, 86)}%` }} /></span>
                  </div>
                </td>
                <td className="border-b border-[#F0EEF4] px-2"><span className="inline-flex items-center gap-2 font-medium text-[#6F687A]"><span className="size-2 rounded-full bg-[#22C58B]" />{product.status}</span></td>
                <td className="relative border-b border-[#F0EEF4] px-4 text-right">
                  <button className="ml-auto grid size-9 place-items-center rounded-[10px] text-[#7D7787] transition hover:bg-[#EFF6FF] hover:text-[#1D4ED8]" onClick={() => onMenuToggle(openMenu === product.sku ? null : product.sku)} type="button" aria-label="მოქმედებები">
                    <MoreHorizontal size={19} strokeWidth={1.75} />
                  </button>
                  {openMenu === product.sku ? <RowMenu onDelete={() => onDeleteOne(product.sku)} onDuplicate={() => onDuplicateOne(product)} onEdit={() => onEditOne(product)} /> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-t border-[#E8E5EC] px-4 py-3">
        <div className="flex items-center gap-4 text-[13px] font-medium text-[#7D7787]">
          <span>{start}–{end} / {total.toLocaleString("ka-GE")} პროდუქტი</span>
          <span className="ml-auto">გვერდზე:</span>
          <button className="inline-flex h-9 items-center gap-3 rounded-[10px] border border-[#E8E5EC] px-3 text-[#19161F]" onClick={() => onRowsPerPageChange(rowsPerPage === 10 ? 5 : 10)} type="button">{rowsPerPage} <ChevronDown size={15} /></button>
        </div>
        <div className="flex items-center gap-1">
          <button className="grid size-9 place-items-center rounded-[10px] border border-[#E8E5EC] text-[#A7A1AE] disabled:opacity-40" disabled={page === 1} onClick={() => onPageChange(Math.max(1, page - 1))} type="button"><ChevronLeft size={17} /></button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1).map((pageNumber) => <button className={pageNumber === page ? "grid size-9 place-items-center rounded-[10px] bg-[#2563EB] text-[13px] font-bold text-white" : "grid size-9 place-items-center rounded-[10px] text-[13px] font-semibold text-[#7D7787]"} key={pageNumber} onClick={() => onPageChange(pageNumber)} type="button">{pageNumber}</button>)}
          <span className="px-2 text-[#7D7787]">...</span>
          <button className="grid size-9 place-items-center rounded-[10px] text-[13px] font-semibold text-[#7D7787]" onClick={() => onPageChange(totalPages)} type="button">{totalPages}</button>
          <button className="grid size-9 place-items-center rounded-[10px] border border-[#E8E5EC] text-[#19161F] disabled:opacity-40" disabled={page === totalPages} onClick={() => onPageChange(Math.min(totalPages, page + 1))} type="button"><ChevronRight size={17} /></button>
        </div>
      </div>
      {selected.length > 0 ? <div className="absolute bottom-[58px] left-4 flex h-11 items-center gap-6 rounded-[12px] border border-[#DBEAFE] bg-white px-4 text-[13px] font-semibold text-[#1D4ED8] shadow-[0_10px_28px_rgba(25,22,31,0.08)]">
        <span className="text-[#19161F]">{selected.length} არჩეული</span>
        <button onClick={onBulkCategory} type="button">კატეგორიის შეცვლა</button>
        <button onClick={onBulkStatus} type="button">სტატუსის შეცვლა</button>
        <button className="text-[#D7264B]" onClick={onBulkDelete} type="button">წაშლა</button>
      </div> : null}
    </section>
  );
}

function FilterSelect({ icon, label, onChange, options, value }: { icon?: React.ReactNode; label: string; onChange: (value: string) => void; options: string[]; value: string }) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select className={icon ? "h-11 w-full appearance-none rounded-[10px] border border-[#E8E5EC] bg-white px-9 pr-8 text-[13px] font-semibold text-[#6F687A] outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10" : "h-11 w-full appearance-none rounded-[10px] border border-[#E8E5EC] bg-white px-3 pr-8 text-[13px] font-semibold text-[#6F687A] outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10"} onChange={(event) => onChange(event.target.value)} value={value} aria-label={label}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
      {icon ? <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">{icon}</span> : null}
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7D7787]" size={15} strokeWidth={1.75} />
    </label>
  );
}

function ProductGrid({ onSelectOne, products, selected }: { onSelectOne: (sku: string) => void; products: Product[]; selected: string[] }) {
  return (
    <section className="min-h-0 overflow-y-auto rounded-[14px] border border-[#E8E5EC] bg-white p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <button className={selected.includes(product.sku) ? "rounded-[14px] border border-[#BFDBFE] bg-[#EFF6FF] p-4 text-left" : "rounded-[14px] border border-[#E8E5EC] bg-white p-4 text-left"} key={product.sku} onClick={() => onSelectOne(product.sku)} type="button">
            <div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-[10px] bg-[#F7F6F9] text-[22px]">{product.thumb}</span>{selected.includes(product.sku) ? <CheckCircle2 className="text-[#2563EB]" size={18} /> : null}</div>
            <p className="mt-4 truncate text-[14px] font-bold">{product.name}</p>
            <p className="mt-1 text-[12px] font-medium text-[#7D7787]">{product.barcode}</p>
            <div className="mt-4 flex items-end justify-between"><strong className="text-[20px]">{product.price}</strong><span className="text-[12px] font-semibold text-[#7D7787]">{product.stock} ც</span></div>
          </button>
        ))}
      </div>
    </section>
  );
}

function RowMenu({ onDelete, onDuplicate, onEdit }: { onDelete: () => void; onDuplicate: () => void; onEdit: () => void }) {
  return (
    <div className="absolute right-8 z-20 mt-2 w-40 rounded-[12px] border border-[#E8E5EC] bg-white p-2 text-left text-[13px] font-semibold shadow-[0_12px_28px_rgba(25,22,31,0.12)]">
      <button className="block w-full rounded-[8px] px-3 py-2 text-left hover:bg-[#F7F6F9]" onClick={onEdit} type="button">რედაქტირება</button>
      <button className="block w-full rounded-[8px] px-3 py-2 text-left hover:bg-[#F7F6F9]" onClick={onDuplicate} type="button">დუბლირება</button>
      <button className="block w-full rounded-[8px] px-3 py-2 text-left text-[#D7264B] hover:bg-[#FFF0F3]" onClick={onDelete} type="button">წაშლა</button>
    </div>
  );
}

function buildStats(products: Product[], activeStat: StatKey) {
  const low = products.filter((product) => ["low", "critical"].includes(product.level)).length;
  const out = products.filter((product) => product.stock === 0).length;
  const active = products.filter((product) => product.status === "აქტიური").length;
  return [
    { key: "all" as const, label: "ყველა", value: products.length.toLocaleString("ka-GE"), tone: "blue", active: activeStat === "all" },
    { key: "low" as const, label: "დაბალი მარაგი", value: low.toString(), tone: "amber", active: activeStat === "low" },
    { key: "out" as const, label: "მარაგში არ არის", value: out.toString(), tone: "red", active: activeStat === "out" },
    { key: "active" as const, label: "აქტიური", value: active.toString(), tone: "green", active: activeStat === "active" },
  ];
}

function dotClass(tone: string) {
  if (tone === "amber") return "bg-[#F59E0B]";
  if (tone === "red") return "bg-[#F04438]";
  if (tone === "green") return "bg-[#22C58B]";
  return "bg-[#2563EB]";
}

function stockBarClass(level: string) {
  if (level === "critical") return "bg-[#F04438]";
  if (level === "low") return "bg-[#F59E0B]";
  return "bg-[#22C58B]";
}
