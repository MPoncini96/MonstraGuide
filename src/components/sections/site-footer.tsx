import Link from "next/link";
import { footerLinks } from "@/lib/site-content";
import { Container } from "@/components/ui/container";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] py-8 lg:py-10">
      <Container className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-[var(--foreground)]">Monstra Guide</p>
          <p className="text-sm text-[var(--foreground-muted)]">A product of Monstra LLC</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--foreground-muted)]">
          {footerLinks.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-[var(--foreground)]">
              {item.label}
            </Link>
          ))}
          <span>monstra.guide</span>
          <span>{new Date().getFullYear()}</span>
        </div>
      </Container>
    </footer>
  );
}
