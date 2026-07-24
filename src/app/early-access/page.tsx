import { EarlyAccessForm } from "@/components/sections/early-access-form";
import { PageShell } from "@/components/sections/page-shell";

export default function EarlyAccessPage() {
  return (
    <PageShell>
      <EarlyAccessForm standalone headingLevel="h1" />
    </PageShell>
  );
}

