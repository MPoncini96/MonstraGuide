import Link from "next/link";
import { navigation } from "@/lib/site-content";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color:color-mix(in_oklab,var(--background)_88%,transparent)] backdrop-blur-xl">
      <Container className="flex items-center justify-between gap-5 py-4">
        <Link className="flex items-center" href="/" aria-label="Monstra Guide home">
          <BrandLogo className="h-14 sm:h-16" />
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-[var(--foreground-muted)] lg:flex">
          {navigation.slice(0, 4).map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-[var(--foreground)]">
              {item.label}
            </Link>
          ))}
          <Link href="/login" className="transition hover:text-[var(--foreground)]">
            Sign In
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-[var(--foreground-muted)] transition hover:text-[var(--foreground)] sm:inline-flex lg:hidden"
          >
            Sign In
          </Link>
          <Button href="/early-access" className="px-4 py-2.5 text-sm">
            Request Early Access
          </Button>
        </div>
      </Container>
    </header>
  );
}

