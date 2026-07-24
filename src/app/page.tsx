import { AutomationPreview } from "@/components/sections/automation-preview";
import { EarlyAccessForm } from "@/components/sections/early-access-form";
import { GuidePreview } from "@/components/sections/guide-preview";
import { HeroSection } from "@/components/sections/hero-section";
import { HowItWorks } from "@/components/sections/how-it-works";
import { PageShell } from "@/components/sections/page-shell";
import { PrivacyControls } from "@/components/sections/privacy-controls";
import { UseCases } from "@/components/sections/use-cases";

export default function Home() {
  return (
    <PageShell>
      <HeroSection />
      <PrivacyControls />
      <HowItWorks />
      <GuidePreview />
      <AutomationPreview />
      <UseCases />
      <EarlyAccessForm />
    </PageShell>
  );
}
