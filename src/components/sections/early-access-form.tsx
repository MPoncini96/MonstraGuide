"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

const initialForm = {
  name: "",
  email: "",
  company: "",
  teamSize: "",
  challenge: "",
};

export function EarlyAccessForm({
  standalone = false,
  headingLevel = "h2",
}: {
  standalone?: boolean;
  headingLevel?: "h1" | "h2";
}) {
  const [formData, setFormData] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className={standalone ? "py-14 lg:py-20" : "py-20 lg:py-28"}>
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div className="max-w-2xl space-y-5">
            <SectionHeading
              badge="Early access"
              title="Bring better training into the flow of work."
              description="Tell us where your team struggles with onboarding, documentation, or repeated software procedures."
              level={headingLevel}
            />
            <p className="text-sm leading-7 text-[var(--foreground-muted)]">
              We review each request with care and focus on workflows that need clear, privacy-conscious documentation.
            </p>
          </div>

          <Card className="p-6 lg:p-7">
            {submitted ? (
              <div className="space-y-4 rounded-[24px] border border-[rgba(47,179,106,0.24)] bg-[rgba(47,179,106,0.08)] p-6">
                <p className="text-xl font-semibold text-[var(--foreground)]">Request received</p>
                <p className="text-sm leading-6 text-[var(--foreground-muted)]">
                  Thanks for reaching out. We&apos;ll use your note to understand where better documentation and training could help most.
                </p>
              </div>
            ) : (
              <form
                className="grid gap-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  setSubmitted(true);
                  setFormData(initialForm);
                }}
              >
                <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
                  Name
                  <input
                    required
                    value={formData.name}
                    onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                    className="min-h-12 rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--foreground-subtle)] focus:border-[var(--accent-strong)]"
                    placeholder="Alex Morgan"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
                  Work email
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                    className="min-h-12 rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--foreground-subtle)] focus:border-[var(--accent-strong)]"
                    placeholder="alex@company.com"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
                    Company
                    <input
                      required
                      value={formData.company}
                      onChange={(event) => setFormData({ ...formData, company: event.target.value })}
                      className="min-h-12 rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--foreground-subtle)] focus:border-[var(--accent-strong)]"
                      placeholder="Northwind Health"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
                    Team size
                    <select
                      required
                      value={formData.teamSize}
                      onChange={(event) => setFormData({ ...formData, teamSize: event.target.value })}
                      className="min-h-12 rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent-strong)]"
                    >
                      <option value="">Select a range</option>
                      <option value="1-20">1-20</option>
                      <option value="21-100">21-100</option>
                      <option value="101-500">101-500</option>
                      <option value="500+">500+</option>
                    </select>
                  </label>
                </div>
                <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
                  Main training or documentation challenge
                  <textarea
                    required
                    rows={5}
                    value={formData.challenge}
                    onChange={(event) =>
                      setFormData({ ...formData, challenge: event.target.value })
                    }
                    className="rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--foreground-subtle)] focus:border-[var(--accent-strong)]"
                    placeholder="We need a better way to document software procedures across teams and systems."
                  />
                </label>
                <div className="pt-2">
                  <Button type="submit">Request Early Access</Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </Container>
    </section>
  );
}
