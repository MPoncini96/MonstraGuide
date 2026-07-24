import { processSteps } from "@/lib/site-content";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28">
      <Container>
        <SectionHeading
          badge="How it works"
          title="A four-stage workflow from capture to confident execution."
          description="Each stage moves a demonstrated task toward an approved guide employees can search, review, and learn from."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-4">
          {processSteps.map((step) => (
            <Card key={step.title} className="flex h-full flex-col gap-5 p-6 lg:p-7">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--foreground-subtle)]">
                  {step.eyebrow}
                </span>
                <div className="h-10 w-10 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)]" aria-hidden="true" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold text-[var(--foreground)]">{step.title}</h3>
                <p className="text-sm leading-6 text-[var(--foreground-muted)]">{step.description}</p>
              </div>
              <div className="mt-auto flex flex-wrap gap-2 text-xs font-medium text-[var(--foreground-muted)]">
                {step.bullets.map((bullet) => (
                  <span key={bullet} className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-2">
                    {bullet}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
