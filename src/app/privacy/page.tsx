import { PageShell } from "@/components/sections/page-shell";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export default function PrivacyPage() {
  return (
    <PageShell>
      <section className="py-20 lg:py-28">
        <Container className="space-y-12">
          <SectionHeading
            badge="Privacy"
            title="Monstra Guide is built around explicit capture and human review."
            description="This page describes product philosophy and intended controls. It is not a legal promise, certification statement, or compliance claim."
            level="h1"
          />

          <div className="grid gap-5 max-w-3xl">
            {[
              {
                title: "Capture should be visible",
                body: "The product is designed so employees know when recording is active and can distinguish active capture from paused or private states.",
              },
              {
                title: "Review comes before publication",
                body: "Guides can be checked by a human reviewer before they are shared with trainees or used as a source for AI assistance.",
              },
              {
                title: "Sensitive contexts should be controllable",
                body: "Teams should be able to exclude applications, domains, or workflows that are inappropriate for capture and remove sensitive screenshots before publishing.",
              },
              {
                title: "Workflow knowledge matters more than surveillance",
                body: "Monstra Guide focuses on helping teams document how work is done, not on measuring employee productivity in the background.",
              },
            ].map((section) => (
              <Card key={section.title}>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">{section.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)]">{section.body}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>
    </PageShell>
  );
}
