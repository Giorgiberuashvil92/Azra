import {
  ArrowRight,
  Boxes,
  Headphones,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import Link from "next/link";
import { DashboardPreview } from "./DashboardPreview";

const values = [
  {
    title: "ერთიანი სისტემა",
    description: "გაყიდვები, საწყობი, ფინანსები და HR ერთ სამუშაო სივრცეში.",
    icon: Boxes,
    accent: "from-[#eef0ff] to-[#f8f4ff] text-[#5e5bff]",
  },
  {
    title: "მოქნილი მოდულები",
    description: "ჩართე მხოლოდ ის ნაწილი, რაც შენს გუნდს დღეს სჭირდება.",
    icon: WandSparkles,
    accent: "from-[#fff1f8] to-[#f6f1ff] text-[#d455b8]",
  },
  {
    title: "დაცული წვდომა",
    description: "როლები, ნებართვები და აუდიტის ისტორია კონტროლისათვის.",
    icon: ShieldCheck,
    accent: "from-[#eefdf6] to-[#f5fbff] text-[#16a36a]",
  },
  {
    title: "მხარდაჭერა 24/7",
    description: "სწრაფი დახმარება დანერგვისა და ყოველდღიური მუშაობისას.",
    icon: Headphones,
    accent: "from-[#fff7ed] to-[#fff2fa] text-[#f07835]",
  },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#fbfcff] pt-28 text-[#101936] sm:pt-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_86%_18%,rgba(216,104,232,0.22),transparent_30%),radial-gradient(circle_at_56%_8%,rgba(91,113,255,0.16),transparent_34%),linear-gradient(180deg,#ffffff_0%,#f7f9ff_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-white to-transparent" />
      <div className="relative mx-auto grid w-full max-w-[1800px] gap-12 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:px-12 lg:pb-24 2xl:px-16">
        <div className="flex flex-col justify-center">
          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-[#6d5cff]/15 bg-white px-4 py-2 text-sm font-bold text-[#5e5bff] shadow-sm">
            <Sparkles size={15} />
            ახალი თაობის ERP სისტემა
          </div>
          <h1 className="max-w-4xl text-5xl font-black leading-[1.08] tracking-normal sm:text-6xl lg:text-7xl 2xl:text-8xl">
            მართე ბიზნესი
            <span className="block bg-gradient-to-r from-[#5d5bff] via-[#765cff] to-[#d06ce7] bg-clip-text text-transparent">
              ერთ სივრცეში
            </span>
          </h1>
          <p className="mt-7 max-w-xl text-lg font-medium leading-8 text-slate-600 sm:text-xl">
            აირჩიე მხოლოდ ის მოდულები, რომლებიც შენს კომპანიას სჭირდება. გაყიდვები, საწყობი, ფინანსები, HR და სხვა.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5e5bff] to-[#8d55f7] px-6 py-4 text-center font-bold text-white shadow-xl shadow-[#6857ff]/25 transition hover:brightness-110" href="/erp">
              სისტემაში შესვლა
              <ArrowRight size={18} />
            </Link>
            <a className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#6d5cff]/25 bg-white px-6 py-4 font-bold text-[#101936] shadow-sm transition hover:border-[#6d5cff]/45 hover:bg-indigo-50" href="#">
              <PlayCircle className="text-[#5e5bff]" size={20} />
              ნახე დემო 2 წუთში
            </a>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {values.map((value) => {
              const Icon = value.icon;

              return (
                <article
                  key={value.title}
                  className="group rounded-2xl border border-indigo-950/8 bg-white/78 p-4 shadow-sm shadow-indigo-950/5 backdrop-blur transition hover:-translate-y-0.5 hover:border-[#7b68ff]/25 hover:bg-white hover:shadow-xl hover:shadow-[#6857ff]/10"
                >
                  <div className={`grid size-11 place-items-center rounded-2xl bg-gradient-to-br ${value.accent}`}>
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-4 text-sm font-black text-[#101936]">{value.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{value.description}</p>
                </article>
              );
            })}
          </div>
        </div>
        <div className="min-w-0 lg:pt-8">
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}
