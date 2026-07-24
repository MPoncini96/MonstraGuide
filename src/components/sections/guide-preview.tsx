import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

const guideSteps = [
  "Open the software access workspace and choose employee setup.",
  "Assign the right apps, role, and approval path.",
  "Review the confirmation screen before publishing the guide.",
];

export function GuidePreview() {
  return (
    <section id="product" className="py-20 lg:py-28">
      <Container>
        <SectionHeading
          badge="AI textbook preview"
          title="The clearest version of how work gets done."
          description="A generated guide stays visual, structured, and grounded in the approved version of the workflow."
        />

        <Card className="mt-12 grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:p-8">
          <div className="space-y-5">
            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--background)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--foreground-subtle)]">
                Example task
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                Grant a new employee software access
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="bg-[var(--background)] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-subtle)]">Estimated time</p>
                <p className="mt-2 text-sm font-medium text-[var(--foreground)]">10 minutes</p>
              </Card>
              <Card className="bg-[var(--background)] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-subtle)]">Required access</p>
                <p className="mt-2 text-sm font-medium text-[var(--foreground)]">IT admin workspace</p>
              </Card>
            </div>

            <Card className="bg-[var(--background)] p-5">
              <p className="text-sm font-semibold text-[var(--foreground)]">Common mistake</p>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                Assigning default access without checking the employee&apos;s role and location.
              </p>
            </Card>

            <Card className="bg-[var(--background)] p-5">
              <p className="text-sm font-semibold text-[var(--foreground)]">Related procedures</p>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                Contractor access, device enrollment, and manager approval follow-up.
              </p>
            </Card>
          </div>

          <div className="space-y-4">
            {guideSteps.map((step, index) => (
              <div key={step} className="rounded-[24px] border border-[var(--border)] bg-[var(--background)] p-5">
                <div className="grid gap-4 lg:grid-cols-[auto_1fr_180px] lg:items-start">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-soft)] font-semibold text-[var(--accent-strong)]">
                    {index + 1}
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm leading-6 text-[var(--foreground)]">{step}</p>
                    {index === 1 ? (
                      <div className="rounded-2xl border border-[rgba(240,166,84,0.26)] bg-[rgba(240,166,84,0.1)] px-4 py-3 text-sm text-[var(--foreground-muted)]">
                        Warning: verify role-based access before saving changes.
                      </div>
                    ) : null}
                  </div>
                  <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-3">
                    <div className="h-28 rounded-2xl bg-[linear-gradient(135deg,rgba(82,113,255,0.2),rgba(82,113,255,0.02))]" aria-hidden="true" />
                    <p className="mt-3 text-xs text-[var(--foreground-muted)]">Screenshot placeholder</p>
                  </div>
                </div>
              </div>
            ))}

            <Card className="bg-[var(--surface-strong)] p-5">
              <p className="text-sm font-semibold text-[var(--foreground)]">Ask Monstra Guide</p>
              <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground-muted)]">
                What changes for a contractor or temporary employee?
              </div>
            </Card>
          </div>
        </Card>
      </Container>
    </section>
  );
}
