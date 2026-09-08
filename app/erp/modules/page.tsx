import { ModuleActivationPanel } from "@/components/erp/ModuleActivationPanel";
import { CompanySwitcher } from "@/components/erp/CompanySwitcher";
import { ErpSidebar } from "@/components/erp/ErpSidebar";
import { demoCompany } from "@/lib/erp/company-modules";

export default function ErpModulesPage() {
  return (
    <main className="min-h-screen bg-[#f7f8ff] text-[#101936]">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <ErpSidebar activeRoute="/erp/modules" initialCompany={demoCompany} />
        <section className="min-w-0 px-4 py-5 sm:px-6 lg:px-8">
          <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5e5bff]">
                Company Modules
              </p>
              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                მოდულების მართვა
              </h1>
              <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-slate-500">
                თითოეულ კომპანიას აქვს საკუთარი ჩართული მოდულები. დამოკიდებული
                მოდულები ერთიანად უნდა ჩაირთოს, ხოლო არასწორი გამორთვა იბლოკება.
              </p>
            </div>
            <CompanySwitcher className="max-w-xs bg-white lg:hidden" companyName={demoCompany.name} />
          </header>
          <ModuleActivationPanel />
        </section>
      </div>
    </main>
  );
}
