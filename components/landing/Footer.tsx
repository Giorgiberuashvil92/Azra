const columns = [
  ["პროდუქტი", "შესაძლებლობები", "მოდულები", "ფასები", "ინტეგრაციები"],
  ["კომპანია", "ჩვენ შესახებ", "კონტაქტი"],
  ["რესურსები", "დოკუმენტაცია", "API", "დახმარება"],
  ["Legal", "კონფიდენციალურობა", "პირობები"],
];

export function Footer() {
  return (
    <footer className="border-t border-indigo-950/6 bg-white py-14">
      <div className="mx-auto grid w-full max-w-[1800px] gap-10 px-5 sm:px-8 lg:grid-cols-[1.2fr_2fr] lg:px-12 2xl:px-16">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#5e5bff] to-[#d968e8] text-lg font-black text-white">A</span>
            <span className="text-xl font-black tracking-[0.16em]">AZLA</span>
          </div>
          <p className="mt-5 max-w-sm leading-7 text-slate-600">თანამედროვე მოდულური ERP პლატფორმა ქართული ბიზნესისთვის.</p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map(([title, ...links]) => (
            <div key={title}>
              <h3 className="font-black text-slate-950">{title}</h3>
              <div className="mt-4 grid gap-3 text-sm text-slate-600">
                {links.map((link) => (
                  <a key={link} href="#" className="transition hover:text-violet-700">
                    {link}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-10 w-full max-w-[1800px] border-t border-indigo-950/6 px-5 pt-6 text-sm text-slate-500 sm:px-8 lg:px-12 2xl:px-16">
        © AZLA
      </div>
    </footer>
  );
}
