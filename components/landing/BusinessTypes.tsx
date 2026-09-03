const businesses = [
  { title: "Retail", modules: ["Products", "Sales", "Inventory", "Finance"] },
  { title: "Distribution", modules: ["Products", "Inventory", "Purchases", "Sales", "Finance"] },
  { title: "Services", modules: ["CRM", "Projects", "Invoices", "Finance"] },
  { title: "Technology / SaaS", modules: ["Projects", "CRM", "HR", "Finance"] },
];

export function BusinessTypes() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto w-full max-w-[1800px] px-5 sm:px-8 lg:px-12 2xl:px-16">
        <h2 className="text-center text-4xl font-black tracking-normal text-[#101936] sm:text-5xl">შექმნილია სხვადასხვა ტიპის ბიზნესისთვის</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {businesses.map((business) => (
            <article key={business.title} className="rounded-2xl border border-indigo-950/8 bg-white p-6 shadow-sm shadow-indigo-950/5">
              <h3 className="text-xl font-black">{business.title}</h3>
              <div className="mt-5 flex flex-wrap gap-2">
                {business.modules.map((module) => (
                  <span key={module} className="rounded-full bg-[#f0edff] px-3 py-1.5 text-sm font-bold text-[#5e5bff]">
                    {module}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
