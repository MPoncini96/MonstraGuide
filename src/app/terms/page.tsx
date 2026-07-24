import { PageShell } from "@/components/sections/page-shell";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export default function TermsPage() {
  return (
    <PageShell>
      <section className="py-20 lg:py-28">
        <Container className="space-y-12">
          <SectionHeading
            badge="Terms"
            title="Placeholder terms page for the initial product site."
            description="This page is intentionally polished but provisional. It should be replaced with final legal copy before public launch."
            level="h1"
          />

          <Card className="max-w-3xl space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Use of this site</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)]">
                The current website is for product information and early-access interest only. Any future service terms should define account use, acceptable use, support, and data handling in detail.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Product availability</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)]">
                Features described on the site reflect current product direction and may change during development, review, and enterprise onboarding.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Next step</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)]">
                Replace this placeholder with attorney-reviewed terms before collecting production customer data or enabling self-serve use.
              </p>
            </div>
          </Card>
        </Container>
      </section>
    </PageShell>
  );
}
