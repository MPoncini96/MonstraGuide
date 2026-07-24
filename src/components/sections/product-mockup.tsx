"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const phases = [
  {
    step: "01",
    title: "Observe the workflow",
    description: "Monstra Guide observes senior employees workflow.",
    details: ["Visible capture", "Approved task", "Context preserved"],
  },
  {
    step: "02",
    title: "Create the manual",
    description: "Monstra Guide creates an interactive training manual.",
    details: ["Step-by-step guides", "Annotated screenshots", "Grounded explanations"],
  },
  {
    step: "03",
    title: "Train with feedback",
    description: "Monstra Guide helps new hires, and provides immediate feedback.",
    details: ["Ask questions", "Spot mistakes early", "Learn in the flow of work"],
  },
];

const slides = [
  {
    badge: "Live phase view",
    title: "Workflow capture",
    subtitle: "Senior employees demonstrate how the work actually gets done.",
    mode: "phases",
  },
  {
    badge: "Learning loop",
    title: "From expert workflow to confident execution",
    subtitle:
      "Each stage moves knowledge forward until the next employee can do the work with confidence.",
    mode: "steps",
  },
] as const;

export function ProductMockup() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 8000);

    return () => window.clearInterval(interval);
  }, [isPaused]);

  const slide = slides[activeSlide];

  return (
    <Card className="relative overflow-hidden p-0">
      <div
        className="absolute inset-x-12 top-0 h-32 rounded-full bg-[radial-gradient(circle,rgba(72,104,255,0.18),transparent_72%)] blur-3xl"
        aria-hidden="true"
      />

      <div className="relative border-b border-[var(--border)] p-6 lg:p-8">
        <div className="flex items-center justify-between">
          <div className="flex gap-2" aria-label="Product story slides">
            {slides.map((item, index) => (
              <button
                key={item.title + index}
                type="button"
                aria-label={`Show slide ${index + 1}: ${item.title}`}
                aria-pressed={activeSlide === index}
                onClick={() => setActiveSlide(index)}
                className={
                  activeSlide === index
                    ? "h-2.5 w-8 rounded-full bg-[var(--accent-strong)] transition"
                    : "h-2.5 w-2.5 rounded-full bg-[var(--border-strong)] transition hover:bg-[var(--foreground-subtle)]"
                }
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setIsPaused((current) => !current)}
            className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 text-[11px] font-semibold leading-none text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
            aria-pressed={isPaused}
            aria-label={isPaused ? "Play slideshow" : "Pause slideshow"}
          >
            {isPaused ? "▶" : "||"}
          </button>
        </div>

        <Card className="mt-4 bg-[var(--background)] p-5 lg:p-6 transition-all duration-500">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">{slide.title}</p>
              <p className="mt-1 text-xs text-[var(--foreground-muted)]">{slide.subtitle}</p>
            </div>
            <Badge>{slide.badge}</Badge>
          </div>

          {slide.mode === "phases" ? (
            <div className="mt-5 space-y-4">
              {phases.map((phase, index) => (
                <div
                  key={phase.step}
                  className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4 lg:p-5"
                >
                  <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent-strong)]">
                      {phase.step}
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <p className="text-lg font-semibold text-[var(--foreground)]">{phase.title}</p>
                        <p className="text-sm leading-6 text-[var(--foreground-muted)]">{phase.description}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs font-medium text-[var(--foreground-muted)]">
                        {phase.details.map((detail) => (
                          <span
                            key={detail}
                            className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-2"
                          >
                            {detail}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {index < phases.length - 1 ? (
                    <div className="mt-4 flex items-center gap-3 pl-1 text-xs uppercase tracking-[0.24em] text-[var(--foreground-subtle)]">
                      <span className="h-px flex-1 bg-[var(--border)]" aria-hidden="true" />
                      Next phase
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {slide.mode === "steps" ? (
            <div className="mt-5 space-y-4">
              {[
                ["Observe", "Senior employee workflow"],
                ["Build", "Interactive training manual"],
                ["Assist", "Immediate feedback for new hires"],
              ].map(([title, copy], index) => (
                <div key={title}>
                  <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4">
                    <p className="text-sm font-semibold text-[var(--foreground)]">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">{copy}</p>
                  </div>
                  {index < 2 ? (
                    <div className="mt-4 flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-[var(--foreground-subtle)]">
                      <span className="h-px flex-1 bg-[var(--border)]" aria-hidden="true" />
                      Next step
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </Card>
      </div>
    </Card>
  );
}

