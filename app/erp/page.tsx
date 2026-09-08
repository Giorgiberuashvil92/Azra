import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { LoginForm } from "@/components/erp/LoginForm";

const requestBenefits = [
  "დემო გარემოს მომზადება შენი ბიზნესის ტიპზე",
  "საჭირო მოდულების შერჩევა დანერგვამდე",
  "ტექნიკური კონსულტაცია ინტეგრაციებზე",
];

export default function ErpPage() {
  return (
    <main className="min-h-screen w-full overflow-hidden bg-[#fbfcff] text-[#101936]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_16%_12%,rgba(95,99,255,0.15),transparent_30%),radial-gradient(circle_at_88%_20%,rgba(217,104,232,0.20),transparent_32%),linear-gradient(180deg,#ffffff_0%,#f7f9ff_100%)]" />

      <div className="mx-auto flex min-h-screen w-full max-w-[1800px] flex-col px-5 py-6 sm:px-8 lg:px-12 2xl:px-16">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3" aria-label="AZLA მთავარი">
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#5f63ff] to-[#d968e8] text-lg font-bold text-white shadow-lg shadow-violet-500/25">
              A
            </span>
            <span className="text-xl font-bold tracking-[0.16em]">AZLA</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-indigo-950/10 bg-white px-4 py-2 text-sm font-bold shadow-sm transition hover:bg-indigo-50">
            <ArrowLeft size={16} />
            მთავარზე დაბრუნება
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:py-16">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#6d5cff]/15 bg-white px-4 py-2 text-sm font-bold text-[#5e5bff] shadow-sm">
              <Sparkles size={15} />
              AZLA ERP
            </div>
            <h1 className="max-w-3xl text-5xl font-bold leading-[1.08] tracking-normal sm:text-6xl xl:text-7xl">
              სისტემაში შესვლა
              <span className="block bg-gradient-to-r from-[#5d5bff] via-[#765cff] to-[#d06ce7] bg-clip-text text-transparent">
                ან წვდომის მოთხოვნა
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-600">
              AZLA-ს ERP გარემო გაიხსნება ავტორიზაციის შემდეგ. ახალი კომპანიებისთვის რეგისტრაცია არის წვდომის მოთხოვნა, რათა თავიდანვე სწორად შეირჩეს მოდულები.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {requestBenefits.map((benefit) => (
                <article key={benefit} className="rounded-2xl border border-indigo-950/8 bg-white/80 p-4 shadow-sm shadow-indigo-950/5 backdrop-blur">
                  <CheckCircle2 className="text-[#5e5bff]" size={20} />
                  <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{benefit}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <LoginForm />

            <section className="rounded-[28px] border border-indigo-950/8 bg-white p-6 shadow-2xl shadow-[#6857ff]/12 sm:p-8">
              <div className="mb-7 flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#fff1f8] to-[#f0edff] text-[#d455b8]">
                  <Building2 size={22} />
                </span>
                <div>
                  <h2 className="text-2xl font-bold">წვდომის მოთხოვნა</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">ახალი კომპანიებისთვის</p>
                </div>
              </div>

              <div className="grid gap-3 text-sm font-medium leading-6 text-slate-500">
                <p>კომპანიის კოდი, დასახელება, საკონტაქტო პირი და საწყისი ERP მოდულები ცალკე ფორმაში ივსება.</p>
                <p>მოთხოვნის შემდეგ გუნდი დაგიკავშირდება და გარემოს მოგიმზადებს.</p>
              </div>

              <Link href="/erp/request" className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#6d5cff]/20 bg-[#f7f5ff] px-5 py-4 font-semibold text-[#5e5bff] transition hover:bg-[#f0edff]">
                წვდომის მოთხოვნა
                  <ArrowRight size={18} />
              </Link>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
