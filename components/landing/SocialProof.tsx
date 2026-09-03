const categories = ["Retail", "Distribution", "Services", "Technology", "Finance"];

export function SocialProof() {
  return (
    <section className="border-b border-indigo-950/6 bg-white py-14">
      <div className="mx-auto w-full max-w-[1800px] px-5 sm:px-8 lg:px-12 2xl:px-16">
        <h2 className="text-center text-2xl font-black text-[#101936] sm:text-3xl">
          სანდო პარტნიორი თანამედროვე ბიზნესისთვის
        </h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((category) => (
            <div key={category} className="rounded-2xl border border-indigo-950/8 bg-[#fbfcff] px-5 py-4 text-center font-black text-slate-500 shadow-sm shadow-indigo-950/5">
              {category}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
