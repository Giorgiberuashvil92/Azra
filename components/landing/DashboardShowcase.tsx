import { DashboardPreview } from "./DashboardPreview";

export function DashboardShowcase() {
  return (
    <section className="bg-[#fbfcff] py-20 sm:py-28">
      <div className="mx-auto w-full max-w-[1800px] px-5 sm:px-8 lg:px-12 2xl:px-16">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#5e5bff]">Dashboard</p>
          <h2 className="mt-3 text-4xl font-black tracking-normal text-[#101936] sm:text-5xl">სრული სურათი ერთ ეკრანზე</h2>
          <p className="mt-5 text-lg font-medium leading-8 text-slate-600">
            KPI ბარათები, გრაფიკები, აქტივობები და მოდულების სწრაფი წვდომა ერთიან სამუშაო გარემოში.
          </p>
        </div>
        <div className="mt-12">
          <DashboardPreview large />
        </div>
      </div>
    </section>
  );
}
