import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { AccessRequestForm } from "@/components/erp/AccessRequestForm";

const steps = [
  "კომპანიის მონაცემები",
  "საწყისი მოდულები",
  "დემო გარემოს მომზადება",
];

export default function AccessRequestPage() {
  return (
    <main className="min-h-screen w-full overflow-hidden bg-[#fbfcff] text-[#101936]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_8%,rgba(95,99,255,0.13),transparent_32%),radial-gradient(circle_at_90%_18%,rgba(217,104,232,0.18),transparent_30%),linear-gradient(180deg,#ffffff_0%,#f7f9ff_100%)]" />

      <div className="mx-auto w-full max-w-[1500px] px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3" aria-label="AZLA მთავარი">
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#5f63ff] to-[#d968e8] text-lg font-semibold text-white shadow-lg shadow-violet-500/25">
              A
            </span>
            <span className="text-xl font-semibold tracking-[0.16em]">AZLA</span>
          </Link>
          <Link href="/erp" className="inline-flex items-center gap-2 rounded-xl border border-indigo-950/10 bg-white px-4 py-2 text-sm font-semibold shadow-sm transition hover:bg-indigo-50">
            <ArrowLeft size={16} />
            ERP შესვლაზე დაბრუნება
          </Link>
        </header>

        <section className="grid gap-8 py-10 lg:grid-cols-[0.72fr_1.28fr] lg:py-14">
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#6d5cff]/15 bg-white px-4 py-2 text-sm font-semibold text-[#5e5bff] shadow-sm">
              <Sparkles size={15} />
              წვდომის მოთხოვნა
            </div>
            <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
              მოვამზადოთ AZLA შენი კომპანიისთვის
            </h1>
            <p className="mt-5 max-w-xl text-base font-medium leading-8 text-slate-600">
              შეავსე კომპანიის ინფორმაცია, აირჩიე საწყისი მოდულები და გუნდი დაგიკავშირდება სამუშაო გარემოს გასახსნელად.
            </p>

            <div className="mt-8 grid gap-3">
              {steps.map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-2xl border border-indigo-950/8 bg-white/80 p-4 shadow-sm shadow-indigo-950/5">
                  <span className="grid size-9 place-items-center rounded-xl bg-[#f0edff] text-sm font-semibold text-[#5e5bff]">
                    {index + 1}
                  </span>
                  <span className="text-sm font-semibold text-slate-600">{step}</span>
                </div>
              ))}
            </div>
          </aside>

          <AccessRequestForm />
        </section>
      </div>
    </main>
  );
}
