import { privacyControls } from "@/lib/site-content";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export function PrivacyControls() {
  return (
    <section id="privacy" className="py-20 lg:py-28">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-6">
            <SectionHeading
              badge="Privacy"
              title="Capture should feel explicit, reviewable, and safe."
              description="Monstra Guide is designed for knowledge transfer, with visible capture states and human review before guides are shared."
            />
            <div className="max-w-2xl rounded-[28px] border border-[rgba(72,104,255,0.2)] bg-[rgba(72,104,255,0.07)] p-6">
              <p className="text-xl font-semibold text-[var(--foreground)]">
                Your employees should always know when capture is active.
              </p>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-[var(--foreground-muted)]">
              Lower-level controls can exclude applications, remove sensitive screenshots, and limit what becomes reusable knowledge after review.
            </p>
            <Badge className="w-fit border-[rgba(47,179,106,0.24)] bg-[rgba(47,179,106,0.08)] text-[var(--success)]">
              The product learns workflows, not employee productivity.
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {privacyControls.map((item) => (
              <Card key={item} className="bg-[var(--background)] p-5">
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--accent-strong)]" aria-hidden="true" />
                  <p className="text-sm font-medium leading-6 text-[var(--foreground)]">{item}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
