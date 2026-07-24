import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export function AutomationPreview() {
  return (
    <section id="future-automation" className="py-20 lg:py-28">
      <Container>
        <SectionHeading
          badge="Future automation"
          title="Documentation first. Assisted workflows later."
          description="Repetitive procedures may eventually become guided actions, but every step should remain visible, reviewable, and grounded in an approved guide."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <Card className="bg-[var(--background)] p-6 lg:p-7">
            <p className="text-sm font-semibold text-[var(--foreground)]">Monstra Guide has prepared the next step.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              {[
                { label: "Cancel", style: "border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--foreground)]" },
                { label: "Review", style: "border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--foreground)]" },
                { label: "Confirm", style: "bg-[var(--accent-strong)] text-white" },
              ].map((action) => (
                <span key={action.label} className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${action.style}`}>
                  {action.label}
                </span>
              ))}
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {[
              "Based on approved guides",
              "Visible before execution",
              "Requires human confirmation",
            ].map((item) => (
              <Card key={item} className="bg-[var(--background)] p-5 text-sm leading-6 text-[var(--foreground-muted)]">
                {item}
              </Card>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
