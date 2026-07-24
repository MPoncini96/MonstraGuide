"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Bell, BookOpen, FolderKanban, LayoutDashboard, Library, Search, Settings, Upload, Users } from "lucide-react";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand/brand-logo";
import { switchWorkspaceAction } from "@/lib/app-actions";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
  { href: "/app/record", label: "Record a Task", icon: Upload, key: "record" },
  { href: "/app/captures", label: "Capture Sessions", icon: FolderKanban, key: "captures" },
  { href: "/app/guides", label: "Guides", icon: BookOpen, key: "guides" },
  { href: "/app/knowledge", label: "Knowledge", icon: Library, key: "knowledge" },
  { href: "/app/team", label: "Team", icon: Users, key: "team" },
  { href: "/app/settings", label: "Settings", icon: Settings, key: "settings" },
] as const;

function canCreateCapture(role: string) {
  return role === "ADMIN" || role === "AUTHOR";
}

function canManageTeam(role: string) {
  return role === "ADMIN";
}

export function AppShell({
  role,
  workspace,
  memberships,
  children,
}: {
  role: string;
  workspace: { id: string; name: string; slug: string };
  memberships: Array<{ workspaceId: string; role: string; workspace: { id: string; name: string } }>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const filteredNav = nav.filter((item) => {
    if (["record", "captures"].includes(item.key) && !canCreateCapture(role)) return false;
    if (item.key === "team" && !canManageTeam(role)) return false;
    return true;
  });

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="border-r border-[var(--border)] bg-[color:color-mix(in_oklab,var(--background)_90%,white)] p-5 lg:min-h-screen">
        <div className="flex items-center justify-between gap-3 lg:block">
          <Link href="/app" className="inline-flex items-center">
            <BrandLogo className="h-9" />
          </Link>
          <details className="lg:hidden">
            <summary className="cursor-pointer rounded-full border border-[var(--border)] px-3 py-2 text-sm">Menu</summary>
            <nav className="mt-3 grid gap-2">
              {filteredNav.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-2xl px-3 py-2 text-sm text-[var(--foreground-muted)]">
                  {item.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
        <div className="mt-6 hidden lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground-subtle)]">Workspace</p>
          <form action={switchWorkspaceAction} className="mt-3">
            <select name="workspaceId" defaultValue={workspace.id} className="app-input">
              {memberships.map((entry) => (
                <option key={entry.workspaceId} value={entry.workspaceId}>
                  {entry.workspace.name}
                </option>
              ))}
            </select>
          </form>
          <nav className="mt-6 grid gap-2">
            {filteredNav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                    active ? "bg-[var(--accent-soft)] text-[var(--foreground)]" : "text-[var(--foreground-muted)] hover:bg-[var(--surface)]",
                  )}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[color:color-mix(in_oklab,var(--background)_88%,transparent)] px-5 py-4 backdrop-blur xl:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground-subtle)]">{workspace.name}</p>
              <h1 className="mt-1 text-2xl font-semibold">Operational knowledge for approved work</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--foreground-muted)] md:flex">
                <Search size={16} /> Search and command bar placeholder
              </div>
              <button type="button" className="hidden rounded-full border border-[var(--border)] bg-[var(--surface)] p-2.5 md:inline-flex">
                <Bell size={16} />
              </button>
              <div className="rounded-full border border-[var(--border)] bg-[var(--surface)] p-1.5">
                <UserButton />
              </div>
            </div>
          </div>
        </header>
        <main className="px-5 py-6 xl:px-8">{children}</main>
      </div>
    </div>
  );
}

export function StatCard({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className="app-card space-y-2 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground-subtle)]">{label}</p>
      <p className="text-3xl font-semibold">{value}</p>
      <p className="text-sm text-[var(--foreground-muted)]">{detail}</p>
    </div>
  );
}

export function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground-subtle)]">{eyebrow}</p>
      <h2 className="text-3xl font-semibold">{title}</h2>
      <p className="max-w-3xl text-sm leading-7 text-[var(--foreground-muted)]">{description}</p>
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="app-card flex flex-col items-start gap-4 p-6">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm leading-7 text-[var(--foreground-muted)]">{body}</p>
      </div>
      {action}
    </div>
  );
}

export function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="app-card p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-xl font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}