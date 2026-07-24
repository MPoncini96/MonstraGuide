import { useCases } from "@/lib/site-content";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export function UseCases() {
  return (
    <section id="use-cases" className="py-20 lg:py-28">
      <Container>
        <SectionHeading
          badge="Use cases"
          title="Built for teams that rely on repeatable knowledge."
          description="Monstra Guide helps experienced employees turn demonstrations into reviewed documentation for the next person doing the work."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {useCases.map((useCase) => (
            <Card key={useCase.title} className="flex min-h-44 flex-col p-6">
              <div className="h-10 w-10 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)]" aria-hidden="true" />
              <h3 className="mt-6 text-2xl font-semibold text-[var(--foreground)]">{useCase.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--foreground-muted)]">
                {useCase.description}
              </p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
