import { Braces, KeyRound, Radio, Workflow } from "lucide-react";

const apiItems = [
  ["REST API", Braces],
  ["Webhooks", Radio],
  ["API Keys", KeyRound],
  ["Integrations", Workflow],
];

export function ApiSection() {
  return (
    <section className="bg-[#fbfcff] py-20 sm:py-28">
      <div className="mx-auto grid w-full max-w-[1800px] gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:items-center lg:px-12 2xl:px-16">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#5e5bff]">API-first</p>
          <h2 className="mt-3 text-4xl font-black tracking-normal text-[#101936] sm:text-5xl">AZLA უკავშირდება შენს სისტემებს</h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            კომპანიებს შეეძლებათ საკუთარი ვებსაიტების, მობილური აპების და შიდა სისტემების დაკავშირება AZLA-სთან.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {apiItems.map(([label, Icon]) => (
              <div key={label as string} className="flex items-center gap-3 rounded-2xl border border-indigo-950/8 bg-white p-4 shadow-sm shadow-indigo-950/5">
                <Icon className="text-[#5e5bff]" size={20} />
                <span className="font-bold">{label as string}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[24px] border border-[#202a55] bg-[#101936] p-5 shadow-2xl shadow-[#6857ff]/16">
          <div className="mb-4 flex gap-2">
            <span className="size-3 rounded-full bg-rose-400" />
            <span className="size-3 rounded-full bg-amber-400" />
            <span className="size-3 rounded-full bg-emerald-400" />
          </div>
          <pre className="overflow-x-auto rounded-xl bg-black/30 p-5 text-sm leading-7 text-slate-100">
{`GET /api/v1/products

{
  "success": true,
  "data": [
    {
      "id": "prd_2048",
      "name": "Premium Plan",
      "stock": 124,
      "currency": "GEL"
    }
  ]
}`}
          </pre>
        </div>
      </div>
    </section>
  );
}
