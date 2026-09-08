"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowLeft, Banknote, Barcode, Boxes, Building2, ChartColumn, ChevronRight, CreditCard, LayoutGrid, List, Minus, MoreHorizontal, Plus, Printer, ReceiptText, RotateCcw, Search, ShieldCheck, ShoppingCart, Store, Trash2, UserRound, X } from "lucide-react";
import Link from "next/link";
import { RetailShell } from "./_components/retail-shell";

type RetailRole = "cashier" | "manager";

const initialProducts = [
  { id: "p1", name: "Coca-Cola 0.5L", barcode: "5449000000996", price: 1.5, stock: 38, category: "სასმელები", color: "rose", thumbnail: "🥤" },
  { id: "p2", name: "ბორჯომი 1.5L", barcode: "4860102030219", price: 2.7, stock: 12, category: "სასმელები", color: "blue", thumbnail: "🍾" },
  { id: "p3", name: "მინერალური წყალი 0.5L", barcode: "4860102030172", price: 1.2, stock: 41, category: "სასმელები", color: "blue", thumbnail: "💧" },
  { id: "p4", name: "Fanta 0.5L", barcode: "5449000046781", price: 1.5, stock: 25, category: "სასმელები", color: "amber", thumbnail: "🍊" },
  { id: "p5", name: "Sprite 0.5L", barcode: "5449000046774", price: 1.5, stock: 19, category: "სასმელები", color: "mint", thumbnail: "🟢" },
  { id: "p6", name: "Red Bull 250ml", barcode: "9002490227657", price: 2.7, stock: 8, category: "სასმელები", color: "blue", thumbnail: "🥫" },
  { id: "p7", name: "Lay's 90g", barcode: "4860102030127", price: 5.5, stock: 14, category: "სნექები", color: "amber", thumbnail: "🍟" },
  { id: "p8", name: "Marlboro Red", barcode: "7622100910002", price: 6.5, stock: 36, category: "სიგარეტი", color: "rose", thumbnail: "▣" },
  { id: "p9", name: "Orbit საღეჭი 14g", barcode: "4009900515377", price: 2.2, stock: 28, category: "ტკბილეული", color: "blue", thumbnail: "▤" },
  { id: "p10", name: "Snickers 50g", barcode: "4607065000343", price: 2.5, stock: 17, category: "ტკბილეული", color: "amber", thumbnail: "🍫" },
  { id: "p11", name: "Kinder Bueno 43g", barcode: "8000500003574", price: 3.9, stock: 11, category: "ტკბილეული", color: "rose", thumbnail: "🍫" },
  { id: "p12", name: "რძე 2.5% 1L", barcode: "4860102030171", price: 3.4, stock: 9, category: "რძის პროდუქტები", color: "blue", thumbnail: "🥛" },
  { id: "p13", name: "პური თეთრი", barcode: "486010203001", price: 1.0, stock: 42, category: "პურ-ფუნთუშეული", color: "amber", thumbnail: "🍞" },
  { id: "p14", name: "კვერცხი 10 ცალი", barcode: "4860102030203", price: 6.5, stock: 6, category: "რძის პროდუქტები", color: "amber", thumbnail: "🥚" },
  { id: "p15", name: "ბანანი 1კგ", barcode: "4860102030134", price: 4.8, stock: 18, category: "ხილ-ბოსტნეული", color: "amber", thumbnail: "🍌" },
  { id: "p16", name: "პომიდორი 1კგ", barcode: "4860102030456", price: 3.2, stock: 16, category: "ხილ-ბოსტნეული", color: "rose", thumbnail: "🍅" },
  { id: "p17", name: "კიტრი 1კგ", barcode: "4860102030457", price: 2.9, stock: 20, category: "ხილ-ბოსტნეული", color: "mint", thumbnail: "🥒" },
  { id: "p18", name: "ვაშლი 1კგ", barcode: "4860102030458", price: 2.2, stock: 24, category: "ხილ-ბოსტნეული", color: "rose", thumbnail: "🍎" },
  { id: "p19", name: "კარტოფილი 1კგ", barcode: "4860102030459", price: 1.8, stock: 33, category: "ხილ-ბოსტნეული", color: "amber", thumbnail: "🥔" },
  { id: "p20", name: "ხახვი 1კგ", barcode: "4860102030460", price: 1.5, stock: 27, category: "ხილ-ბოსტნეული", color: "amber", thumbnail: "🧅" },
];

const categories = [
  { label: "ყველა", count: initialProducts.length },
  { label: "სასმელები", count: 6 },
  { label: "სნექები", count: 1 },
  { label: "ტკბილეული", count: 3 },
  { label: "სიგარეტი", count: 1 },
  { label: "რძის პროდუქტები", count: 2 },
  { label: "პურ-ფუნთუშეული", count: 1 },
  { label: "ხილ-ბოსტნეული", count: 6 },
];

const initialCart = [
  { id: "p1", qty: 2 },
  { id: "p7", qty: 1 },
  { id: "p3", qty: 3 },
];

type Product = (typeof initialProducts)[number];
type CartLine = { id: string; qty: number };
type PaymentMethod = "cash" | "card" | "other";
type SaleReceipt = {
  cashier: string;
  createdAt: Date;
  discount: number;
  discountPercent: number;
  items: Array<{ barcode: string; name: string; price: number; qty: number; total: number }>;
  number: string;
  payment: PaymentMethod;
  subtotal: number;
  total: number;
};

const managerCards = [
  { label: "დღეს გაყიდვები", value: "1,284 ₾", change: "+12%", icon: ChartColumn },
  { label: "ჩეკები", value: "86", change: "+8", icon: ReceiptText },
  { label: "დაბალი ნაშთი", value: "14", change: "საყურადღებო", icon: Boxes },
  { label: "ფილიალები", value: "3", change: "აქტიური", icon: Building2 },
];

export default function RetailPage() {
  const [role, setRole] = useState<RetailRole | null>(null);

  if (!role) return <RetailEntry onSelect={setRole} />;

  return (
    <RetailShell active={role === "cashier" ? "checkout" : "manager"} title={role === "cashier" ? "სალარო" : "მენეჯერი"}>
      {role === "cashier" ? <CashierBoard /> : <ManagerBoard />}
    </RetailShell>
  );
}

function RetailEntry({ onSelect }: { onSelect: (role: RetailRole) => void }) {
  return (
    <main className="grid min-h-screen place-items-center overflow-hidden bg-[#F6F7FB] px-5 py-8 text-[#202436]">
      <div className="absolute inset-x-0 top-0 h-1 bg-[#2563EB]" />
      <Link className="absolute left-5 top-5 inline-flex h-11 items-center gap-2 rounded-2xl border border-[#E1E6F0] bg-white px-4 text-[13px] font-bold text-[#627381] shadow-sm transition hover:text-[#2563EB]" href="/erp/dashboard">
        <ArrowLeft size={16} />
        ERP
      </Link>

      <section className="w-full max-w-[920px]">
        <div className="text-center">
          <LogoMark size="large" />
          <p className="mt-8 text-[12px] font-bold uppercase tracking-[0.26em] text-[#28CFA3]">Retail workspace</p>
          <h1 className="mt-3 text-[38px] font-bold leading-[46px] sm:text-[52px] sm:leading-[62px]">ვინ შედის სისტემაში?</h1>
          <p className="mx-auto mt-3 max-w-[620px] text-[15px] font-medium leading-7 text-[#6D788B]">
            აირჩიე სამუშაო სივრცე. სალარო სწრაფი გაყიდვისთვისაა, მენეჯერი კი დღის კონტროლისა და რეპორტებისთვის.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <RoleCard accent="green" description="პროდუქტის ძებნა, კალათა, შტრიხკოდი, ნაღდი და ბარათი ერთ ეკრანზე." icon={<ShoppingCart size={28} />} label="სალარო" meta="გაყიდვის ბორდი" onClick={() => onSelect("cashier")} />
          <RoleCard accent="blue" description="დღიური გაყიდვები, ფილიალები, დაბალი ნაშთები და მენეჯერის alerts." icon={<ChartColumn size={28} />} label="მენეჯერი" meta="კონტროლის ბორდი" onClick={() => onSelect("manager")} />
        </div>

        <div className="mx-auto mt-8 flex w-fit items-center gap-2 rounded-full border border-[#E1E6F0] bg-white px-4 py-2 text-[12px] font-bold text-[#7A869A] shadow-sm">
          <ShieldCheck size={15} className="text-[#28CFA3]" />
          მთავარი ფილიალი · ცვლა ღიაა · ინტეგრაცია არჩევითია
        </div>
      </section>
    </main>
  );
}

function CashierBoard() {
  const [productItems, setProductItems] = useState<Product[]>(initialProducts);
  const [activeCategory, setActiveCategory] = useState("ყველა");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>(initialCart);
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [lastReceipt, setLastReceipt] = useState<SaleReceipt | null>(null);
  const [receiptSeq, setReceiptSeq] = useState(787);
  const [saleMessage, setSaleMessage] = useState("");

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return productItems.filter((product) => {
      const matchesCategory = activeCategory === "ყველა" || product.category === activeCategory;
      const matchesQuery = !normalized || [product.name, product.barcode, product.category].some((value) => value.toLowerCase().includes(normalized));
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, productItems, query]);

  const cartItems = cart.map((item) => ({ ...item, product: productItems.find((product) => product.id === item.id) })).filter((item): item is { id: string; qty: number; product: Product } => Boolean(item.product));
  const subtotal = cartItems.reduce((sum, item) => sum + item.qty * item.product.price, 0);
  const discount = subtotal * (discountPercent / 100);
  const total = subtotal - discount;

  function addToCart(productId: string) {
    const product = productItems.find((item) => item.id === productId);
    const currentQty = cart.find((item) => item.id === productId)?.qty ?? 0;
    if (!product || product.stock <= currentQty) {
      setSaleMessage("მარაგი არ არის საკმარისი");
      return;
    }
    setSaleMessage("");
    setCart((current) => {
      const existing = current.find((item) => item.id === productId);
      if (existing) return current.map((item) => item.id === productId ? { ...item, qty: item.qty + 1 } : item);
      return [...current, { id: productId, qty: 1 }];
    });
  }

  function changeQty(productId: string, delta: number) {
    const product = productItems.find((item) => item.id === productId);
    setCart((current) => current.map((item) => {
      if (item.id !== productId) return item;
      const nextQty = Math.max(1, item.qty + delta);
      if (product && nextQty > product.stock) {
        setSaleMessage("მარაგი არ არის საკმარისი");
        return item;
      }
      setSaleMessage("");
      return { ...item, qty: nextQty };
    }));
  }

  function removeFromCart(productId: string) {
    setCart((current) => current.filter((item) => item.id !== productId));
  }

  function completeSale() {
    if (cartItems.length === 0) return;
    const unavailable = cartItems.find((item) => item.qty > item.product.stock);
    if (unavailable) {
      setSaleMessage(`${unavailable.product.name}: მარაგი არ არის საკმარისი`);
      return;
    }
    const receipt: SaleReceipt = {
      cashier: "ნინო კალანდაძე",
      createdAt: new Date(),
      discount,
      discountPercent,
      items: cartItems.map((item) => ({
        barcode: item.product.barcode,
        name: item.product.name,
        price: item.product.price,
        qty: item.qty,
        total: item.qty * item.product.price,
      })),
      number: `AZ-${new Date().getFullYear()}-${String(receiptSeq).padStart(6, "0")}`,
      payment,
      subtotal,
      total,
    };

    setProductItems((current) => current.map((product) => {
      const sold = cart.find((item) => item.id === product.id)?.qty ?? 0;
      return sold > 0 ? { ...product, stock: Math.max(0, product.stock - sold) } : product;
    }));
    setCart([]);
    setDiscountPercent(0);
    setReceiptSeq((current) => current + 1);
    setSaleMessage(`გაყიდვა დასრულდა · ჩეკი ${receipt.number}`);
    setLastReceipt(receipt);
  }

  return (
    <section className="grid h-full min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_372px]">
      <div className="grid min-h-0 min-w-0 grid-rows-[auto_auto_minmax(0,1fr)] gap-3 overflow-hidden">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_156px]">
          <label className="flex h-[48px] items-center gap-3 rounded-[12px] border border-[#E1E6F0] bg-white px-4 text-[14px] text-[#817B8D] shadow-[0_1px_2px_rgba(24,21,31,0.03)] focus-within:border-[#2563EB] focus-within:ring-4 focus-within:ring-[#2563EB]/10">
            <Search size={21} className="text-[#18151F]" strokeWidth={1.8} />
            <input className="w-full bg-transparent font-normal outline-none placeholder:text-[#9A94A6]" onChange={(event) => setQuery(event.target.value)} placeholder="პროდუქტის სახელი, SKU ან შტრიხკოდი..." value={query} />
          </label>
          <button className="inline-flex h-[48px] items-center justify-center gap-2 rounded-[12px] bg-white px-4 text-[13px] font-medium text-[#1D4ED8] ring-1 ring-[#DBEAFE] transition hover:bg-[#EFF6FF]" onClick={() => setQuery("")} type="button">
            <Barcode size={20} strokeWidth={1.8} />
            სკანერი
          </button>
        </div>

        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 gap-2 overflow-x-auto">
            {categories.map((category) => (
              <button className={activeCategory === category.label ? "inline-flex h-10 shrink-0 items-center gap-2 rounded-[12px] bg-[#2563EB] px-4 text-[13px] font-medium text-white shadow-[0_8px_18px_rgba(37,99,235,0.18)]" : "inline-flex h-10 shrink-0 items-center gap-2 rounded-[12px] border border-[#E9E6EE] bg-white px-4 text-[13px] font-medium text-[#5F5870] transition hover:bg-[#EFF6FF] hover:text-[#1D4ED8]"} key={category.label} onClick={() => setActiveCategory(category.label)} type="button">
                {category.label === "ყველა" ? <LayoutGrid size={15} /> : null}
                {category.label}
              </button>
            ))}
            <button className="grid h-10 w-12 shrink-0 place-items-center rounded-[12px] border border-[#E9E6EE] bg-white text-[#5F5870]" type="button" aria-label="მეტი კატეგორია"><MoreHorizontal size={18} /></button>
          </div>
          <div className="hidden h-10 shrink-0 items-center gap-2 text-[13px] font-medium text-[#817B8D] lg:flex">
            <span className="grid size-9 place-items-center rounded-[12px] bg-[#EFF6FF] text-[#2563EB]"><LayoutGrid size={18} strokeWidth={1.8} /></span>
            <span className="grid size-9 place-items-center rounded-[12px] bg-white text-[#817B8D] ring-1 ring-[#E9E6EE]"><List size={18} strokeWidth={1.8} /></span>
          </div>
        </div>

        <div className="grid min-h-0 min-w-0 content-start gap-2.5 overflow-y-auto pr-2 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7">
          {filteredProducts.map((product) => (
            <ProductButton key={product.id} onAdd={() => addToCart(product.id)} product={product} />
          ))}
        </div>
      </div>

      <aside className="flex min-h-0 rounded-[16px] border border-[#E9E6EE] bg-white shadow-[0_12px_34px_rgba(24,21,31,0.05)] xl:h-full xl:flex-col">
        <div className="border-b border-[#E9E6EE] px-4 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-8">
                <h2 className="relative h-8 text-[17px] font-semibold leading-8 text-[#2563EB] after:absolute after:inset-x-0 after:bottom-[-15px] after:h-0.5 after:bg-[#2563EB]">ჩეკი ({cartItems.length})</h2>
                <span className="h-9 text-[15px] font-medium leading-9 text-[#817B8D]">კლიენტი</span>
              </div>
            </div>
            <button className="grid size-9 place-items-center rounded-[10px] text-[#817B8D] transition hover:bg-[#FFF0F3] hover:text-[#D7264B]" onClick={() => setCart([])} type="button" aria-label="კალათის გასუფთავება">
              <Trash2 size={19} strokeWidth={1.8} />
            </button>
          </div>
        </div>
        <div className="grid gap-0 px-4 xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
          {cartItems.map((item) => (
            <div className="border-b border-[#E9E6EE] py-3" key={item.id}>
              <div className="grid grid-cols-[38px_minmax(0,1fr)_auto] gap-3">
                <span className={`grid size-[38px] place-items-center rounded-[10px] text-[20px] ${productTone(item.product.color)}`}>
                  {item.product.thumbnail}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium leading-5 text-[#18151F]">{item.product.name}</p>
                  <p className="mt-1 text-[12px] font-medium text-[#817B8D]">{item.product.price.toFixed(2)} ₾ / ც</p>
                  <div className="mt-2 inline-grid grid-cols-[30px_34px_30px] items-center rounded-[9px] border border-[#E9E6EE] bg-white">
                    <button className="grid size-[30px] place-items-center text-[#817B8D]" onClick={() => changeQty(item.id, -1)} type="button"><Minus size={13} strokeWidth={1.8} /></button>
                    <span className="grid h-[30px] place-items-center border-x border-[#E9E6EE] text-[13px] font-medium">{item.qty}</span>
                    <button className="grid size-[30px] place-items-center text-[#2563EB]" onClick={() => changeQty(item.id, 1)} type="button"><Plus size={14} strokeWidth={1.8} /></button>
                  </div>
                </div>
                <div className="grid justify-items-end gap-2">
                  <button className="text-[#817B8D] transition hover:text-[#D7264B]" onClick={() => removeFromCart(item.id)} type="button" aria-label="წაშლა"><Trash2 size={16} strokeWidth={1.8} /></button>
                  <p className="text-[14px] font-semibold text-[#18151F]">{(item.qty * item.product.price).toFixed(2)} ₾</p>
                </div>
              </div>
            </div>
          ))}
          {cartItems.length === 0 ? <div className="grid h-48 place-items-center text-center text-[14px] font-semibold text-[#817B8D]">კალათა ცარიელია</div> : null}
        </div>
        <div className="px-4 py-3.5">
          <div className="mb-3 grid grid-cols-[1fr_48px_96px] gap-2">
            <Link className="inline-flex h-10 items-center justify-center gap-2 rounded-[11px] bg-[#EFF6FF] px-3 text-[12px] font-medium text-[#1D4ED8]" href="/erp/retail/products/new">
              <Plus size={16} />
              დამატება
            </Link>
            <button className="grid h-10 place-items-center rounded-[11px] bg-[#EFF6FF] text-[#2563EB]" onClick={() => setSaleMessage("სკანერი მზადაა: ჩასქანე barcode ან აკრიფე ძებნაში")} type="button" aria-label="სკანირება"><Barcode size={18} /></button>
            <button className={discountPercent > 0 ? "h-10 rounded-[11px] border border-[#BFDBFE] bg-[#EFF6FF] px-2 text-[12px] font-medium text-[#1D4ED8]" : "h-10 rounded-[11px] border border-[#E9E6EE] bg-white px-2 text-[12px] font-medium text-[#817B8D]"} onClick={() => setDiscountPercent((current) => current === 0 ? 5 : current === 5 ? 10 : 0)} type="button">{discountPercent > 0 ? `-${discountPercent}%` : "ფასდაკლ."}</button>
          </div>
          <div className="grid gap-1.5 border-b border-[#E9E6EE] pb-3 text-[13px]">
            <div className="flex justify-between gap-3 text-[#817B8D]"><span>ჯამი ({cartItems.reduce((sum, item) => sum + item.qty, 0)} ც)</span><span className="font-medium text-[#18151F]">{subtotal.toFixed(2)} ₾</span></div>
            <div className="flex justify-between gap-3 text-[#817B8D]"><span>ფასდაკლება {discountPercent > 0 ? `${discountPercent}%` : ""}</span><span className="font-medium text-[#18151F]">{discount.toFixed(2)} ₾</span></div>
          </div>
          <div className="flex items-end justify-between gap-3 py-3">
            <span className="pb-1 text-[14px] font-semibold text-[#18151F]">სულ გადასახდელი</span>
            <span className="text-[28px] font-bold leading-8 text-[#18151F]">{total.toFixed(2)} ₾</span>
          </div>
          <div className="grid grid-cols-[1fr_1fr_84px] gap-2">
            <button className={payment === "cash" ? "inline-flex h-10 items-center justify-center gap-2 rounded-[11px] bg-[#2563EB] px-4 text-[13px] font-medium text-white" : "inline-flex h-10 items-center justify-center gap-2 rounded-[11px] border border-[#E9E6EE] px-4 text-[13px] font-medium text-[#817B8D]"} onClick={() => setPayment("cash")} type="button">
              <Banknote size={18} strokeWidth={1.8} />
              ნაღდი
            </button>
            <button className={payment === "card" ? "inline-flex h-10 items-center justify-center gap-2 rounded-[11px] bg-[#2563EB] px-4 text-[13px] font-medium text-white" : "inline-flex h-10 items-center justify-center gap-2 rounded-[11px] border border-[#E9E6EE] px-4 text-[13px] font-medium text-[#817B8D]"} onClick={() => setPayment("card")} type="button">
              <CreditCard size={18} strokeWidth={1.8} />
              ბარათი
            </button>
            <button className={payment === "other" ? "inline-flex h-10 items-center justify-center gap-2 rounded-[11px] bg-[#2563EB] px-4 text-[13px] font-medium text-white" : "inline-flex h-10 items-center justify-center gap-2 rounded-[11px] border border-[#E9E6EE] px-4 text-[13px] font-medium text-[#817B8D]"} onClick={() => setPayment("other")} type="button">სხვა</button>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {["5 ₾", "10 ₾", "20 ₾", "50 ₾"].map((amount) => <button className="h-9 rounded-[10px] border border-[#E9E6EE] text-[13px] font-medium text-[#5F5870]" key={amount} type="button">{amount}</button>)}
          </div>
          {saleMessage ? <p className={saleMessage.includes("არ არის") ? "mt-2 rounded-[10px] bg-[#FFF0F3] px-3 py-2 text-[12px] font-medium text-[#D7264B]" : "mt-2 rounded-[10px] bg-[#E6F8F0] px-3 py-2 text-[12px] font-medium text-[#087C58]"}>{saleMessage}</p> : null}
          <button className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[13px] bg-[#2563EB] px-5 text-[14px] font-semibold text-white shadow-[0_12px_24px_rgba(37,99,235,0.2)] transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:bg-[#B9C7E8] disabled:shadow-none" disabled={cartItems.length === 0} onClick={completeSale} type="button">
            გაყიდვის დასრულება {total.toFixed(2)} ₾
            <ChevronRight size={20} strokeWidth={1.8} />
          </button>
          <button className="mt-3 inline-flex w-full items-center justify-center gap-2 text-[13px] font-medium text-[#817B8D] transition hover:text-[#1D4ED8]" type="button">
            <RotateCcw size={16} strokeWidth={1.8} />
            შეკვეთის შეჩერება
          </button>
        </div>
      </aside>
      {lastReceipt ? <ReceiptDialog onClose={() => setLastReceipt(null)} receipt={lastReceipt} /> : null}
    </section>
  );
}

function ProductButton({ onAdd, product }: { onAdd: () => void; product: Product }) {
  return (
    <button className="group grid min-h-[148px] min-w-0 grid-rows-[54px_auto_auto] rounded-[10px] border border-[#E9E6EE] bg-white p-2.5 text-center shadow-[0_1px_2px_rgba(24,21,31,0.03)] transition hover:-translate-y-0.5 hover:border-[#BFDBFE] hover:shadow-[0_8px_20px_rgba(37,99,235,0.08)]" onClick={onAdd} type="button">
      <div className="grid place-items-center">
        <span className={`grid size-[52px] shrink-0 place-items-center rounded-[12px] text-[29px] ${productTone(product.color)}`}>
          {product.thumbnail}
        </span>
      </div>
      <div className="min-w-0 self-end">
        <h3 className="truncate text-[12px] font-semibold leading-4 text-[#18151F]">{product.name}</h3>
        <p className="mt-0.5 truncate text-[12px] font-medium leading-4 text-[#817B8D]">{product.barcode}</p>
      </div>
      <div className="grid gap-1 self-end">
        <span className="text-[16px] font-semibold leading-5 tracking-normal text-[#18151F]">{product.price.toFixed(2)} ₾</span>
        <span className={product.stock < 10 ? "inline-flex items-center justify-center gap-2 text-[12px] font-semibold text-[#F59E0B]" : "inline-flex items-center justify-center gap-2 text-[12px] font-semibold text-[#16B982]"}>
          <span className={product.stock < 10 ? "size-2 rounded-full bg-[#F59E0B]" : "size-2 rounded-full bg-[#16B982]"} />
          მარაგი: {product.stock}
        </span>
      </div>
    </button>
  );
}

function ReceiptDialog({ onClose, receipt }: { onClose: () => void; receipt: SaleReceipt }) {
  const paymentLabel = {
    cash: "ნაღდი",
    card: "ბარათი",
    other: "სხვა",
  }[receipt.payment];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#18151F]/24 p-4">
      <section className="w-full max-w-[420px] overflow-hidden rounded-[18px] border border-[#E9E6EE] bg-white shadow-[0_24px_70px_rgba(24,21,31,0.18)]">
        <header className="flex items-start justify-between gap-4 border-b border-[#E9E6EE] px-5 py-4">
          <div>
            <p className="text-[12px] font-medium text-[#817B8D]">გაყიდვა დასრულდა</p>
            <h2 className="mt-1 text-[22px] font-semibold text-[#18151F]">ჩეკი {receipt.number}</h2>
            <p className="mt-1 text-[12px] font-medium text-[#817B8D]">{formatReceiptDate(receipt.createdAt)} · {paymentLabel}</p>
          </div>
          <button className="grid size-9 place-items-center rounded-[10px] text-[#817B8D] hover:bg-[#F6F5F8]" onClick={onClose} type="button" aria-label="დახურვა">
            <X size={18} strokeWidth={1.8} />
          </button>
        </header>

        <div className="px-5 py-4">
          <div className="rounded-[14px] border border-dashed border-[#DCE2EC] bg-[#FBFAFC] p-4">
            <div className="mb-3 text-center">
              <p className="text-[17px] font-semibold text-[#18151F]">AZLA Retail</p>
              <p className="mt-1 text-[12px] font-medium text-[#817B8D]">თბილისი, ვარკეთილის ფილიალი</p>
            </div>
            <div className="grid gap-2 border-y border-dashed border-[#DCE2EC] py-3">
              {receipt.items.map((item) => (
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 text-[12px]" key={`${item.barcode}-${item.name}`}>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[#18151F]">{item.name}</p>
                    <p className="mt-0.5 text-[#817B8D]">{item.qty} x {item.price.toFixed(2)} ₾</p>
                  </div>
                  <span className="font-semibold text-[#18151F]">{item.total.toFixed(2)} ₾</span>
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-1.5 text-[13px]">
              <div className="flex justify-between text-[#817B8D]"><span>შუალედური ჯამი</span><span>{receipt.subtotal.toFixed(2)} ₾</span></div>
              <div className="flex justify-between text-[#817B8D]"><span>ფასდაკლება {receipt.discountPercent}%</span><span>{receipt.discount.toFixed(2)} ₾</span></div>
              <div className="mt-2 flex justify-between border-t border-dashed border-[#DCE2EC] pt-3 text-[18px] font-semibold text-[#18151F]"><span>სულ</span><span>{receipt.total.toFixed(2)} ₾</span></div>
            </div>
          </div>
        </div>

        <footer className="grid grid-cols-2 gap-2 border-t border-[#E9E6EE] px-5 py-4">
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-[12px] border border-[#E9E6EE] text-[13px] font-medium text-[#18151F]" onClick={() => window.print()} type="button">
            <Printer size={17} strokeWidth={1.8} />
            დაბეჭდვა
          </button>
          <button className="h-11 rounded-[12px] bg-[#2563EB] text-[13px] font-semibold text-white" onClick={onClose} type="button">დახურვა</button>
        </footer>
      </section>
    </div>
  );
}

function formatReceiptDate(date: Date) {
  return new Intl.DateTimeFormat("ka-GE", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function ManagerBoard() {
  return (
    <section className="grid gap-5">
      <div className="rounded-[22px] border border-[#E1E6F0] bg-white p-5 shadow-[0_10px_30px_rgba(23,35,70,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-[#2563EB]">დღის კონტროლი</p>
            <h2 className="mt-2 text-[30px] font-semibold leading-10">მენეჯერის სამუშაო სივრცე</h2>
          </div>
          <button className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#2563EB] px-5 text-[14px] font-semibold text-white shadow-lg shadow-blue-200" type="button">
            რეპორტები
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {managerCards.map((card) => {
          const Icon = card.icon;
          return (
            <article className="rounded-[22px] border border-[#E1E6F0] bg-white p-5 shadow-[0_10px_30px_rgba(23,35,70,0.05)]" key={card.label}>
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-12 place-items-center rounded-2xl bg-[#EEF2FF] text-[#2563EB]">
                  <Icon size={22} />
                </span>
                <span className="rounded-full bg-[#F6F7FB] px-3 py-1 text-[12px] font-semibold text-[#64738F]">{card.change}</span>
              </div>
              <p className="mt-5 text-[13px] font-bold text-[#707A91]">{card.label}</p>
              <p className="mt-1 text-[30px] font-semibold leading-10">{card.value}</p>
            </article>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.75fr)]">
        <section className="rounded-[22px] border border-[#E1E6F0] bg-white p-5 shadow-[0_10px_30px_rgba(23,35,70,0.05)]">
          <h2 className="text-[20px] font-semibold leading-7">ფილიალების მდგომარეობა</h2>
          <div className="mt-5 grid gap-3">
            {["მთავარი ფილიალი", "ვაკე", "საბურთალო"].map((branch, index) => (
              <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#E8EAF1] bg-[#FBFCFF] p-4" key={branch}>
                <span className="grid size-11 place-items-center rounded-xl bg-white text-[#2563EB]"><Store size={19} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold">{branch}</p>
                  <p className="mt-1 text-[12px] font-bold text-[#8A93A8]">{index === 0 ? "სალარო ღიაა" : "სინქრონიზებულია"}</p>
                </div>
                <span className="text-[15px] font-semibold">{[742, 318, 224][index]} ₾</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[22px] border border-[#E1E6F0] bg-white p-5 shadow-[0_10px_30px_rgba(23,35,70,0.05)]">
          <h2 className="text-[20px] font-semibold leading-7">საყურადღებო</h2>
          <div className="mt-5 grid gap-3">
            <AlertRow label="14 პროდუქტი დაბალ ნაშთზეა" value="მარაგი" />
            <AlertRow label="2 ჩეკი გაუქმებულია" value="გაყიდვები" />
            <AlertRow label="ინტეგრაცია გამორთულია" value="არჩევითი რეჟიმი" />
          </div>
        </section>
      </div>
    </section>
  );
}

function RoleCard({ accent, description, icon, label, meta, onClick }: { accent: "blue" | "green"; description: string; icon: ReactNode; label: string; meta: string; onClick: () => void }) {
  const accentClass = accent === "blue" ? "bg-[#EEF2FF] text-[#2563EB]" : "bg-[#E4F8EF] text-[#28A978]";
  return (
    <button className="group rounded-[26px] border border-[#E1E6F0] bg-white p-6 text-left shadow-[0_18px_50px_rgba(23,35,70,0.08)] transition hover:-translate-y-1 hover:border-[#C8D1FF] hover:shadow-[0_24px_60px_rgba(37,99,235,0.14)]" onClick={onClick} type="button">
      <span className={`grid size-16 place-items-center rounded-[22px] ${accentClass}`}>{icon}</span>
      <p className="mt-6 text-[12px] font-bold uppercase tracking-[0.2em] text-[#8A96A8]">{meta}</p>
      <div className="mt-2 flex items-center gap-3">
        <h2 className="text-[28px] font-semibold leading-9">{label}</h2>
        <span className="ml-auto grid size-10 place-items-center rounded-full bg-[#2563EB] text-white opacity-90 transition group-hover:translate-x-1">
          <ChevronRight size={20} />
        </span>
      </div>
      <p className="mt-3 text-[14px] font-medium leading-6 text-[#6D788B]">{description}</p>
    </button>
  );
}

function LogoMark({ size = "normal" }: { size?: "normal" | "large" }) {
  const boxSize = size === "large" ? "mx-auto size-20 rounded-[28px] text-[30px]" : "size-12 rounded-2xl text-[18px]";
  return (
    <div className={size === "large" ? "grid justify-center" : "flex items-center gap-3"}>
      <span className={`grid place-items-center bg-[#2563EB] font-semibold text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)] ${boxSize}`}>
        A
      </span>
      {size === "normal" ? (
        <div>
          <p className="text-[17px] font-bold leading-6">AZLA Retail</p>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A96A8]">Store OS</p>
        </div>
      ) : null}
    </div>
  );
}

function productTone(color: string) {
  if (color === "mint") return "bg-[#E4F8EF] text-[#28A978]";
  if (color === "blue") return "bg-[#EEF2FF] text-[#2563EB]";
  if (color === "rose") return "bg-[#FFF0F3] text-[#E53555]";
  return "bg-[#FFF3D9] text-[#D98400]";
}

function AlertRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#FBFCFF] p-4">
      <span className="grid size-10 place-items-center rounded-xl bg-white text-[#2563EB]"><UserRound size={18} /></span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold">{label}</p>
        <p className="mt-0.5 text-[12px] font-bold text-[#8A93A8]">{value}</p>
      </div>
    </div>
  );
}
