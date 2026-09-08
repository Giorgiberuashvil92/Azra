"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Barcode, CheckCircle2, ImagePlus, Package, Percent, Save, Settings2, Store, Tag, Warehouse } from "lucide-react";
import { RetailShell } from "../../../_components/retail-shell";

const products = [
  { name: "ჭვავის პური - დიეტური", sku: "BRD-001", barcode: "002007682", category: "პურ-ფუნთუშეული", cost: "0.90", price: "1.50", stock: "20", status: "აქტიური", thumb: "🥖", unit: "ცალი", minStock: "10", discount: "0", posVisible: true },
  { name: "სიმინდის ფქვილი 1კგ", sku: "MLK-001", barcode: "4860102030141", category: "რძის პროდუქტები", cost: "4.20", price: "6.50", stock: "32", status: "აქტიური", thumb: "🥛", unit: "ცალი", minStock: "8", discount: "0", posVisible: true },
  { name: "კოკა კოლა 250გ", sku: "COL-250", barcode: "4860102030196", category: "სასმელები", cost: "12.00", price: "18.90", stock: "12", status: "აქტიური", thumb: "🥤", unit: "ცალი", minStock: "18", discount: "5", posVisible: true },
  { name: "მინერალური წყალი 0.5ლ", sku: "WAT-001", barcode: "4860102030172", category: "სასმელები", cost: "2.10", price: "3.40", stock: "41", status: "აქტიური", thumb: "💧", unit: "ცალი", minStock: "12", discount: "0", posVisible: true },
];

type ProductForm = (typeof products)[number];

export default function RetailProductEditPage() {
  const router = useRouter();
  const params = useParams<{ sku: string }>();
  const product = useMemo(() => products.find((item) => item.sku === decodeURIComponent(params.sku)) ?? products[0], [params.sku]);
  const [form, setForm] = useState<ProductForm>(product);
  const [saved, setSaved] = useState(false);

  const margin = Math.max(0, Number(form.price || 0) - Number(form.cost || 0));
  const lowStock = Number(form.stock || 0) <= Number(form.minStock || 0);

  function updateField(field: keyof ProductForm, value: string | boolean) {
    setSaved(false);
    setForm((current) => ({ ...current, [field]: value }));
  }

  function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(true);
  }

  return (
    <RetailShell active="products" title="პროდუქტის რედაქტირება">
      <form className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-4" onSubmit={saveProduct}>
        <header className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <Link className="grid size-10 shrink-0 place-items-center rounded-[12px] border border-[#E8E5EC] bg-white text-[#6F687A] hover:bg-[#EFF6FF] hover:text-[#1D4ED8]" href="/erp/retail/products" aria-label="უკან">
              <ArrowLeft size={18} strokeWidth={1.75} />
            </Link>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-[#7D7787]">მაღაზიის კატალოგი</p>
              <h1 className="mt-1 truncate text-[28px] font-bold leading-8 text-[#19161F]">პროდუქტის რედაქტირება</h1>
              <p className="mt-1 text-[14px] font-medium text-[#7D7787]">ფასი, შტრიხკოდი, მარაგი და POS-ში გამოჩენა ერთ ადგილზე</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saved ? <span className="inline-flex h-10 items-center gap-2 rounded-[12px] bg-[#E6F8F0] px-3 text-[13px] font-semibold text-[#087C58]"><CheckCircle2 size={16} />შენახულია</span> : null}
            <button className="h-11 rounded-[12px] border border-[#E8E5EC] bg-white px-4 text-[13px] font-semibold text-[#19161F]" onClick={() => router.push("/erp/retail/products")} type="button">გაუქმება</button>
            <button className="inline-flex h-11 items-center gap-2 rounded-[12px] bg-[#2563EB] px-5 text-[13px] font-semibold text-white shadow-[0_10px_22px_rgba(37,99,235,0.18)]" type="submit">
              <Save size={16} strokeWidth={1.75} />
              შენახვა
            </button>
          </div>
        </header>

        <div className="grid min-h-0 gap-4 overflow-auto xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid content-start gap-4">
            <EditSection icon={<Package size={18} />} title="ძირითადი ინფორმაცია">
              <Field label="პროდუქტის დასახელება" value={form.name} onChange={(value) => updateField("name", value)} />
              <SelectField label="კატეგორია" value={form.category} onChange={(value) => updateField("category", value)} options={["პურ-ფუნთუშეული", "სასმელები", "რძის პროდუქტები", "ტკბილეული", "ბაკალეა", "სხვა"]} />
              <Field label="SKU" value={form.sku} onChange={(value) => updateField("sku", value)} />
              <Field label="ერთეული" value={form.unit} onChange={(value) => updateField("unit", value)} />
              <Field className="md:col-span-2" label="შტრიხკოდი" value={form.barcode} onChange={(value) => updateField("barcode", value)} prefix={<Barcode size={17} />} />
            </EditSection>

            <EditSection icon={<Tag size={18} />} title="ფასი და ფასდაკლება">
              <Field label="შესყიდვის ფასი" value={form.cost} onChange={(value) => updateField("cost", value)} suffix="₾" type="number" />
              <Field label="გაყიდვის ფასი" value={form.price} onChange={(value) => updateField("price", value)} suffix="₾" type="number" />
              <Field label="ფასდაკლება" value={form.discount} onChange={(value) => updateField("discount", value)} prefix={<Percent size={16} />} suffix="%" type="number" />
              <ReadonlyMetric label="მარჟა" value={`${margin.toFixed(2)} ₾`} />
            </EditSection>

            <EditSection icon={<Warehouse size={18} />} title="მარაგი">
              <Field label="მიმდინარე ნაშთი" value={form.stock} onChange={(value) => updateField("stock", value)} suffix={form.unit} type="number" />
              <Field label="მინიმალური ნაშთი" value={form.minStock} onChange={(value) => updateField("minStock", value)} suffix={form.unit} type="number" />
              <SelectField label="სტატუსი" value={form.status} onChange={(value) => updateField("status", value)} options={["აქტიური", "არააქტიური"]} />
              <ReadonlyMetric label="მარაგის მდგომარეობა" tone={lowStock ? "red" : "green"} value={lowStock ? "დაბალი მარაგი" : "ნორმალური"} />
            </EditSection>
          </div>

          <aside className="grid content-start gap-4">
            <section className="rounded-[18px] border border-[#E8E5EC] bg-white p-5">
              <div className="flex items-center gap-4">
                <span className="grid size-16 place-items-center rounded-[16px] bg-[#F7F6F9] text-[30px]">{form.thumb}</span>
                <button className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-[#E8E5EC] px-3 text-[13px] font-semibold text-[#1D4ED8]" type="button">
                  <ImagePlus size={16} strokeWidth={1.75} />
                  სურათი
                </button>
              </div>
              <div className="mt-5 rounded-[14px] border border-[#E8E5EC] bg-[#F7F6F9] p-4">
                <p className="text-[12px] font-semibold text-[#7D7787]">POS Preview</p>
                <p className="mt-3 text-[15px] font-bold text-[#19161F]">{form.name}</p>
                <p className="mt-1 text-[12px] font-medium text-[#7D7787]">{form.barcode}</p>
                <div className="mt-4 flex items-end justify-between">
                  <strong className="text-[24px] text-[#19161F]">{Number(form.price || 0).toFixed(2)} ₾</strong>
                  <span className="grid size-10 place-items-center rounded-[12px] bg-[#2563EB] text-[22px] font-light text-white">+</span>
                </div>
              </div>
            </section>

            <EditSection compact icon={<Settings2 size={18} />} title="POS პარამეტრები">
              <Toggle label="სალაროში გამოჩენა" checked={form.posVisible} onChange={(checked) => updateField("posVisible", checked)} />
              <Toggle label="გაყიდვადია" checked={form.status === "აქტიური"} onChange={(checked) => updateField("status", checked ? "აქტიური" : "არააქტიური")} />
              <Toggle label="მარაგის კონტროლი" checked />
            </EditSection>

            <section className="rounded-[18px] border border-[#DBEAFE] bg-[#EFF6FF] p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-10 place-items-center rounded-[12px] bg-white text-[#2563EB]"><Store size={18} /></span>
                <div>
                  <h2 className="text-[15px] font-bold text-[#19161F]">ფილიალის მონაცემი</h2>
                  <p className="mt-1 text-[13px] font-medium leading-5 text-[#6F687A]">ცვლილება ეხება თბილისის, ვარკეთილის ფილიალის მაღაზიის კატალოგს.</p>
                </div>
              </div>
            </section>
          </aside>
        </div>

        <footer className="flex items-center justify-between rounded-[14px] border border-[#E8E5EC] bg-white px-4 py-3">
          <p className="text-[13px] font-medium text-[#7D7787]">ცვლილებები ჯერ frontend state-ში ინახება. Backend API-ს მიბმა შემდეგი ეტაპია.</p>
          <button className="inline-flex h-10 items-center gap-2 rounded-[12px] bg-[#2563EB] px-4 text-[13px] font-semibold text-white" type="submit">
            <Save size={16} />
            ცვლილებების შენახვა
          </button>
        </footer>
      </form>
    </RetailShell>
  );
}

function EditSection({ children, compact = false, icon, title }: { children: React.ReactNode; compact?: boolean; icon: React.ReactNode; title: string }) {
  return (
    <section className="rounded-[18px] border border-[#E8E5EC] bg-white p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-[12px] bg-[#EFF6FF] text-[#2563EB]">{icon}</span>
        <h2 className="text-[16px] font-bold text-[#19161F]">{title}</h2>
      </div>
      <div className={compact ? "grid gap-3" : "grid gap-4 md:grid-cols-2"}>{children}</div>
    </section>
  );
}

function Field({ className = "", label, onChange, prefix, suffix, type = "text", value }: { className?: string; label: string; onChange: (value: string) => void; prefix?: React.ReactNode; suffix?: string; type?: string; value: string }) {
  return (
    <label className={`grid gap-2 text-[13px] font-semibold text-[#6F687A] ${className}`}>
      {label}
      <span className="flex h-11 items-center gap-2 rounded-[12px] border border-[#E8E5EC] bg-white px-3 focus-within:border-[#2563EB] focus-within:ring-4 focus-within:ring-[#2563EB]/10">
        {prefix ? <span className="text-[#7D7787]">{prefix}</span> : null}
        <input className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-[#19161F] outline-none" onChange={(event) => onChange(event.target.value)} type={type} value={value} />
        {suffix ? <span className="text-[13px] font-bold text-[#7D7787]">{suffix}</span> : null}
      </span>
    </label>
  );
}

function SelectField({ label, onChange, options, value }: { label: string; onChange: (value: string) => void; options: string[]; value: string }) {
  return (
    <label className="grid gap-2 text-[13px] font-semibold text-[#6F687A]">
      {label}
      <select className="h-11 rounded-[12px] border border-[#E8E5EC] bg-white px-3 text-[14px] font-semibold text-[#19161F] outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10" onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function ReadonlyMetric({ label, tone = "blue", value }: { label: string; tone?: "blue" | "green" | "red"; value: string }) {
  const colors = {
    blue: "bg-[#EFF6FF] text-[#1D4ED8]",
    green: "bg-[#E6F8F0] text-[#087C58]",
    red: "bg-[#FFF0F3] text-[#D7264B]",
  };
  return (
    <div className="grid gap-2 text-[13px] font-semibold text-[#6F687A]">
      {label}
      <span className={`inline-flex h-11 items-center rounded-[12px] px-3 text-[14px] font-bold ${colors[tone]}`}>{value}</span>
    </div>
  );
}

function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange?: (checked: boolean) => void }) {
  return (
    <label className="flex h-12 items-center justify-between rounded-[12px] border border-[#E8E5EC] px-3 text-[13px] font-semibold text-[#19161F]">
      {label}
      <input className="size-4 accent-[#2563EB]" checked={checked} onChange={(event) => onChange?.(event.target.checked)} type="checkbox" />
    </label>
  );
}
