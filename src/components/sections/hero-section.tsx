import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { ProductMockup } from "@/components/sections/product-mockup";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      <div className="absolute inset-x-0 top-[-12rem] h-[28rem] bg-[radial-gradient(circle,rgba(72,104,255,0.16),transparent_55%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(72,104,255,0.02),transparent)]" />
      <Container>
        <div className="grid gap-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center">
          <div className="space-y-8">
            <Badge>Workflow-Learning and Training Platform</Badge>
            <div className="max-w-2xl space-y-5">
              <h1 className="text-balance text-[3.15rem] font-semibold leading-[0.95] tracking-[-0.05em] text-[var(--foreground)] sm:text-[4.2rem] lg:max-w-[10.5ch] lg:text-[4.8rem]">
                Turn everyday work into a living AI textbook.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-[var(--foreground-muted)]">
                Record an approved task and turn it into a visual, step-by-step guide your team can review, search, and learn from.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button href="/early-access">Request Early Access</Button>
              <Button href="/#how-it-works" variant="secondary">
                See How It Works
              </Button>
            </div>
          </div>

          <ProductMockup />
        </div>
      </Container>
    </section>
  );
}

