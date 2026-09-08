import Link from "next/link";

export function FinalCTA() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto w-full max-w-[1800px] px-5 sm:px-8 lg:px-12 2xl:px-16">
        <div className="overflow-hidden rounded-[24px] bg-gradient-to-r from-[#ff5f9f] via-[#8b5cf6] to-[#6c7cff] px-6 py-14 text-center text-white shadow-2xl shadow-[#6857ff]/20 sm:px-10">
          <h2 className="text-4xl font-black tracking-normal sm:text-5xl">შენი ბიზნესი. ერთი სისტემა.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/88">
            დაიწყე AZLA-ს გამოყენება და დაამატე მხოლოდ ის მოდულები, რომლებიც გჭირდება.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/erp" className="rounded-xl bg-white px-6 py-4 font-bold text-[#5e5bff] transition hover:bg-indigo-50">
              სისტემაში შესვლა
            </Link>
            <a href="#" className="rounded-xl border border-white/35 px-6 py-4 font-bold text-white transition hover:bg-white/12">
              დაგვიკავშირდი
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
