import { ApiSection } from "@/components/landing/ApiSection";
import { BusinessTypes } from "@/components/landing/BusinessTypes";
import { DashboardShowcase } from "@/components/landing/DashboardShowcase";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { ModularPlatform } from "@/components/landing/ModularPlatform";
import { Modules } from "@/components/landing/Modules";
import { SocialProof } from "@/components/landing/SocialProof";

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-[#fbfcff] text-[#101936]">
      <Header />
      <Hero />
      <SocialProof />
      <Modules />
      <ModularPlatform />
      <BusinessTypes />
      <ApiSection />
      <DashboardShowcase />
      <FinalCTA />
      <Footer />
    </main>
  );
}
