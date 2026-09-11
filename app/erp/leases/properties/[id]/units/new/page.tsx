"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { getAuthHeaders } from "@/components/erp/CoreModuleShell";
import { LeaseModuleShell } from "../../../../_components/lease-module-shell";

type LeaseProperty = {
  id: string;
  name: string;
  code?: string | null;
  address?: string | null;
};

const assetTypes = [
  ["apartment", "ბინა"],
  ["office", "ოფისი"],
  ["commercial_space", "კომერციული ფართი"],
  ["warehouse", "საწყობი"],
  ["room", "ოთახი"],
  ["workspace", "სამუშაო სივრცე"],
  ["parking_space", "პარკინგის ადგილი"],
  ["advertising_space", "სარეკლამო ადგილი"],
  ["other", "სხვა"],
];

export default function NewPropertyUnitPage() {
  return <Suspense fallback={null}><NewPropertyUnitContent /></Suspense>;
}

function NewPropertyUnitContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [property, setProperty] = useState<LeaseProperty | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    void fetch(`/api/erp/leases/properties/${params.id}`, { headers: getAuthHeaders(), cache: "no-store" })
      .then(async (response) => {
        if (!ignore) setProperty(response.ok ? await response.json() : null);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [params.id]);

  async function createUnit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/erp/leases/properties/${params.id}/units`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.message ?? "ერთეულის დამატება ვერ მოხერხდა.");
      return;
    }

    router.push("/erp/leases/assets");
  }

  return (
    <LeaseModuleShell
      activeRoute="/erp/leases/assets"
      actions={<Link className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#DDE3EE] bg-white px-5 text-[14px] font-bold text-[#4C5875]" href="/erp/leases/assets"><ArrowLeft size={16} /> უკან</Link>}
      subtitle="დაამატეთ ოფისი, კომერციული ფართი, საწყობი, პარკინგი ან სხვა გასაქირავებელი ერთეული არჩეულ ობიექტში."
      title="ახალი ერთეულის დამატება"
    >
      {isLoading ? <div className="rounded-2xl border border-[#E1E5EF] bg-white p-6 text-[14px] font-bold text-[#7D88A2]">იტვირთება...</div> : null}
      {!isLoading && !property ? <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-[14px] font-bold text-rose-700">მშობელი ობიექტი ვერ მოიძებნა.</div> : null}
      {property ? <UnitForm error={error} onSubmit={createUnit} property={property} /> : null}
    </LeaseModuleShell>
  );
}

function UnitForm({ error, onSubmit, property }: { error: string; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; property: LeaseProperty }) {
  const [assetType, setAssetType] = useState("office");
  const [status, setStatus] = useState("available");
  const [vatMode, setVatMode] = useState("added");
  const [hasDifferentAddress, setHasDifferentAddress] = useState(false);
  const [name, setName] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [code, setCode] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const showRoomFields = !["parking_space", "advertising_space"].includes(assetType);
  const generatedCode = code || buildUnitCode(assetType, unitNumber, name);

  return (
    <form className="grid gap-5 pb-12 text-[#111A3A]" onSubmit={onSubmit}>
      <section className="rounded-2xl border border-[#DCD7FF] bg-[#FBFAFF] p-5 shadow-sm shadow-violet-100/70">
        <div className="flex items-start gap-4">
          <span className="grid size-12 place-items-center rounded-xl bg-[#F0ECFF] text-[#6849F5]"><Building2 size={24} /></span>
          <div>
            <p className="text-[13px] font-black text-[#6849F5]">მშობელი ობიექტი</p>
            <h2 className="mt-1 text-[21px] font-black">{property.name}</h2>
            <p className="mt-1 text-[14px] font-semibold text-[#6F7B96]">{property.address ?? "მისამართი არ არის მითითებული"}</p>
          </div>
        </div>
      </section>

      {error ? <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-[13px] font-bold text-rose-700">{error}</div> : null}

      <FormSection description="ერთეულის იდენტიფიკაცია და მიმდინარე მდგომარეობა." title="ძირითადი ინფორმაცია">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="ერთეულის დასახელება" name="name" onChange={(value) => { setName(value); if (!codeTouched) setCode(buildUnitCode(assetType, unitNumber, value)); }} placeholder="მაგ. ოფისი 205" required />
          <Field label="ერთეულის კოდი" name="code" onChange={(value) => { setCodeTouched(true); setCode(value); }} placeholder={generatedCode} required value={codeTouched ? code : generatedCode} />
          <Select label="ერთეულის ტიპი" name="assetType" onChange={(value) => { setAssetType(value); if (!codeTouched) setCode(buildUnitCode(value, unitNumber, name)); }} value={assetType}>{assetTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
          <Select label="სტატუსი" name="status" onChange={setStatus} value={status}>
            <option value="available">თავისუფალია</option>
            <option value="reserved">დაჯავშნილი</option>
            <option value="leased">გაქირავებული</option>
            <option value="maintenance">რემონტზე</option>
            <option value="unavailable">დროებით მიუწვდომელი</option>
            <option value="inactive">არააქტიური</option>
          </Select>
        </div>
      </FormSection>

      <FormSection description="მშობელი ობიექტის მისამართი უკვე შენახულია; აქ მიუთითეთ შიდა მდებარეობა." title="მდებარეობა">
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="კორპუსი / ბლოკი" name="block" placeholder="კორპუსი A" />
          <Field label="სადარბაზო" name="entrance" placeholder="1" />
          <Field label="სართული" name="floor" placeholder="2" />
          <Field label="ერთეულის ნომერი" name="unitNumber" onChange={(value) => { setUnitNumber(value); if (!codeTouched) setCode(buildUnitCode(assetType, value, name)); }} placeholder="205" required />
          <Field className="md:col-span-2" label="ზონა / ფლიგელი" name="zone" placeholder="აღმოსავლეთი ფლიგელი" />
          <label className="grid gap-1 text-[13px] font-bold text-[#4C5875] md:col-span-2">
            ზუსტი მდებარეობის აღწერა
            <input className="h-11 rounded-xl border border-[#DDE3EE] px-3 text-[14px] font-semibold outline-none focus:border-[#6849F5]" name="locationNote" placeholder="მაგ. ლიფტიდან მარჯვნივ" />
          </label>
          <Checkbox checked={hasDifferentAddress} label="ერთეულს განსხვავებული მისამართი აქვს" name="hasDifferentAddress" onChange={setHasDifferentAddress} />
          {hasDifferentAddress ? <Field className="md:col-span-4" label="განსხვავებული მისამართი" name="address" placeholder="ქალაქი, ქუჩა, ნომერი" /> : null}
        </div>
      </FormSection>

      <FormSection description="ფართობი და ის მახასიათებლები, რომლებიც კონკრეტულ ტიპს შეესაბამება." title="ფართობი და მახასიათებლები">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="საერთო ფართობი (მ²)" name="area" placeholder="0.00" required type="number" />
          <Field label="გასაქირავებელი ფართობი (მ²)" name="rentableArea" placeholder="0.00" type="number" />
          {showRoomFields ? <Field label="ოთახების რაოდენობა" name="rooms" placeholder="0" type="number" /> : null}
          {showRoomFields ? <Field label="სველი წერტილები" name="bathrooms" placeholder="0" type="number" /> : null}
          {showRoomFields ? <Field label="ჭერის სიმაღლე" name="ceilingHeight" placeholder="3.20" type="number" /> : null}
          <Field label="პარკინგის ადგილები" name="parkingSpaces" placeholder="0" type="number" />
          {showRoomFields ? <Checkbox label="ავეჯით არის უზრუნველყოფილი" name="furnished" /> : null}
          <Checkbox label="ინდივიდუალური მრიცხველები აქვს" name="hasIndividualMeters" />
          <Checkbox label="ხელმისაწვდომია შშმ პირებისთვის" name="accessible" />
        </div>
      </FormSection>

      <FormSection description="აქ ინახება მხოლოდ ერთეულის საბაზისო შეთავაზების ფასი; ხელშეკრულების საბოლოო პირობები ცალკე შეივსება." title="ფასი და პირობები">
        <div className="grid gap-4 md:grid-cols-3">
          <Select label="ფასის დათვლის ტიპი" name="pricingType">
            <option value="fixed_monthly">ფიქსირებული ყოველთვიური</option>
            <option value="per_square_meter">ფასი მ²-ზე</option>
            <option value="daily">დღიური</option>
            <option value="hourly">საათობრივი</option>
            <option value="negotiable">შეთანხმებით</option>
          </Select>
          <Field label="საბაზისო ფასი" name="monthlyRent" placeholder="0.00" required type="number" />
          <Select label="ვალუტა" name="currency">
            <option value="GEL">GEL</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </Select>
          <Select label="დღგ" name="vatMode" onChange={setVatMode} value={vatMode}>
            <option value="exempt">არ იბეგრება</option>
            <option value="included">ფასში შედის</option>
            <option value="added">ფასს ემატება</option>
          </Select>
          {vatMode !== "exempt" ? <Field defaultValue="18" label="დღგ-ის განაკვეთი" name="vatRate" placeholder="18" type="number" /> : null}
          <Field label="საერთო მომსახურების საფასური" name="serviceFee" placeholder="0.00" type="number" />
          <Field label="მინიმალური იჯარის პერიოდი" name="minLeasePeriod" placeholder="მაგ. 6 თვე" />
          <Checkbox label="კომუნალური ხარჯები შედის ფასში" name="utilitiesIncluded" />
        </div>
      </FormSection>

      <FormSection title="ხელმისაწვდომობა">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="ხელმისაწვდომია თარიღიდან" name="availableFrom" placeholder="" type="date" />
          <Field label="მაქსიმალური იჯარის პერიოდი" name="maxLeasePeriod" placeholder="მაგ. 3 წელი" />
          <Checkbox label="შესაძლებელია ნაწილობრივ გაქირავება" name="partiallyRentable" />
          <Checkbox label="ონლაინ კატალოგში გამოჩენა" name="listedOnline" />
          {status === "maintenance" ? (
            <>
              <Field label="რემონტის დასრულების თარიღი" name="renovationEndDate" placeholder="" type="date" />
              <Field label="პასუხისმგებელი პირი" name="renovationOwner" placeholder="თანამშრომლის სახელი" />
              <Field className="md:col-span-3" label="კომენტარი" name="renovationNote" placeholder="რემონტის დეტალები" />
            </>
          ) : null}
        </div>
      </FormSection>

      <FormSection description="MVP-ში ფაილის ატვირთვის ნაცვლად ბმულებს ვინახავთ; ატვირთვის კომპონენტს შემდეგ ეტაპზე დავამატებთ." title="ფოტოები და დოკუმენტები">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="მთავარი ფოტო" name="mainPhotoUrl" placeholder="ფოტოს ბმული" />
          <Field label="ვიდეოს ბმული" name="videoUrl" placeholder="https://..." />
        </div>
      </FormSection>

      <FormSection title="პასუხისმგებელი პირი და შენიშვნა">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="პასუხისმგებელი თანამშრომელი" name="responsibleEmployee" placeholder="სახელი და გვარი" />
          <Field label="ტეგები" name="tags" placeholder="პრემიუმ, ქუჩის მხარე, ავეჯით" />
          <label className="grid gap-1 text-[13px] font-bold text-[#4C5875] md:col-span-2">
            აღწერა
            <textarea className="min-h-24 rounded-xl border border-[#DDE3EE] px-3 py-3 text-[14px] font-semibold outline-none focus:border-[#6849F5]" name="description" placeholder="მდგომარეობა, აღჭურვილობა, მნიშვნელოვანი დეტალები..." />
          </label>
          <label className="grid gap-1 text-[13px] font-bold text-[#4C5875] md:col-span-2">
            შიდა შენიშვნა
            <textarea className="min-h-20 rounded-xl border border-[#DDE3EE] px-3 py-3 text-[14px] font-semibold outline-none focus:border-[#6849F5]" name="internalNote" placeholder="შიდა კომენტარი გუნდისთვის" />
          </label>
        </div>
      </FormSection>

      <div className="flex justify-end gap-3">
        <Link className="inline-flex h-12 items-center rounded-xl border border-[#DDE3EE] bg-white px-5 text-[14px] font-bold text-[#4C5875]" href="/erp/leases/assets">გაუქმება</Link>
        <button className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#6849F5] px-6 text-[14px] font-black text-white shadow-lg shadow-violet-500/25" type="submit">
          <Plus size={18} />
          ერთეულის დამატება
        </button>
      </div>
    </form>
  );
}

function FormSection({ children, description, title }: { children: React.ReactNode; description?: string; title: string }) {
  return (
    <section className="rounded-2xl border border-[#E1E5EF] bg-white p-6 shadow-sm shadow-slate-200/70">
      <div className="mb-5">
        <h2 className="text-[19px] font-black text-[#111A3A]">{title}</h2>
        {description ? <p className="mt-1 text-[13px] font-semibold leading-6 text-[#7D88A2]">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Field({ className = "", defaultValue, label, name, onChange, placeholder, required, type = "text", value }: { className?: string; defaultValue?: string; label: string; name: string; onChange?: (value: string) => void; placeholder: string; required?: boolean; type?: string; value?: string }) {
  return (
    <label className={`grid gap-1 text-[13px] font-bold text-[#4C5875] ${className}`}>
      {label}
      <input
        className="h-11 rounded-xl border border-[#DDE3EE] px-3 text-[14px] font-semibold outline-none focus:border-[#6849F5]"
        defaultValue={value === undefined ? defaultValue : undefined}
        name={name}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        placeholder={placeholder}
        required={required}
        step={type === "number" ? "0.01" : undefined}
        type={type}
        value={value}
      />
    </label>
  );
}

function Select({ children, label, name, onChange, value }: { children: React.ReactNode; label: string; name: string; onChange?: (value: string) => void; value?: string }) {
  return (
    <label className="grid gap-1 text-[13px] font-bold text-[#4C5875]">
      {label}
      <select className="h-11 rounded-xl border border-[#DDE3EE] bg-white px-3 text-[14px] font-semibold outline-none focus:border-[#6849F5]" name={name} onChange={onChange ? (event) => onChange(event.target.value) : undefined} value={value}>
        {children}
      </select>
    </label>
  );
}

function Checkbox({ checked, label, name, onChange }: { checked?: boolean; label: string; name: string; onChange?: (checked: boolean) => void }) {
  return (
    <label className="flex min-h-11 items-center gap-3 rounded-xl border border-[#DDE3EE] px-3 text-[13px] font-bold text-[#4C5875]">
      <input checked={checked} className="size-4 accent-[#6849F5]" name={name} onChange={onChange ? (event) => onChange(event.target.checked) : undefined} type="checkbox" />
      {label}
    </label>
  );
}

function buildUnitCode(type: string, unitNumber: string, name: string) {
  const prefixes: Record<string, string> = {
    apartment: "APT",
    office: "OFF",
    commercial_space: "RET",
    warehouse: "WH",
    room: "RM",
    workspace: "WS",
    parking_space: "P",
    advertising_space: "ADV",
    other: "UNIT",
  };
  const suffix = unitNumber.trim() || name.trim().split(/\s+/).at(-1) || "001";
  return `${prefixes[type] ?? "UNIT"}-${suffix.toUpperCase()}`;
}
