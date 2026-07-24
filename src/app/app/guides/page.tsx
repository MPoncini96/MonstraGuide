import Link from "next/link";
import { GuideStatus } from "@prisma/client";
import { EmptyState, PageIntro, SectionCard } from "@/components/app/app-shell";
import { StatusBadge } from "@/components/app/status-badge";
import { prisma } from "@/lib/db/prisma";
import { requireActiveWorkspace } from "@/lib/auth/session";
import { buildGuideLibraryWhere } from "@/lib/guides/policy";
import { canCreateGuide } from "@/lib/auth/permissions";
import { formatDateTime } from "@/lib/utils";

export default async function GuidesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; author?: string }> }) {
  const { q, status, author } = await searchParams;
  const context = await requireActiveWorkspace();

  const [guides, authors] = await Promise.all([
    prisma.guide.findMany({
      where: buildGuideLibraryWhere({
        workspaceId: context.workspace.id,
        role: context.membership.role,
        userId: context.user.id,
        search: q,
        status: (status as GuideStatus | "") || "",
        authorId: author,
      }),
      include: { createdBy: true, sourceCapture: true },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: 50,
    }),
    prisma.workspaceMembership.findMany({
      where: { workspaceId: context.workspace.id },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <PageIntro eyebrow="Guides" title="Search and manage workspace procedures" description="The guide library stays scoped to the active workspace and respects role-based visibility at query time." />
      <SectionCard title="Filters">
        <form className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_220px_auto]">
          <input name="q" defaultValue={q} className="app-input" placeholder="Search guide title or summary" />
          <select name="status" defaultValue={status} className="app-input">
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="IN_REVIEW">In review</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <select name="author" defaultValue={author} className="app-input">
            <option value="">All authors</option>
            {authors.map((entry) => (
              <option key={entry.userId} value={entry.userId}>{entry.user.displayName || entry.user.email}</option>
            ))}
          </select>
          <button type="submit" className="rounded-full bg-[var(--accent-strong)] px-5 py-3 text-sm font-semibold text-white">Apply</button>
        </form>
      </SectionCard>
      <SectionCard title="Guide library" action={canCreateGuide(context.membership.role) ? <Link href="/app/guides/new" className="text-sm font-semibold text-[var(--accent-strong)]">Create guide</Link> : null}>
        {guides.length ? (
          <div className="space-y-4">
            {guides.map((guide) => (
              <div key={guide.id} className="rounded-3xl border border-[var(--border)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Link href={`/app/guides/${guide.id}`} className="font-semibold">{guide.title}</Link>
                    <p className="mt-1 text-sm text-[var(--foreground-muted)]">{guide.summary}</p>
                  </div>
                  <StatusBadge value={guide.status} />
                </div>
                <div className="mt-4 grid gap-2 text-sm text-[var(--foreground-muted)] md:grid-cols-2 xl:grid-cols-3">
                  <span>Version {guide.version}</span>
                  <span>Author: {guide.createdBy.displayName || guide.createdBy.email}</span>
                  <span>Updated: {formatDateTime(guide.updatedAt)}</span>
                  <span>Published: {guide.publishedAt ? formatDateTime(guide.publishedAt) : "Not yet"}</span>
                  <span>Capture: {guide.sourceCapture?.title ?? "Manual guide"}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No guides matched this view" body="Try a broader filter or create a new guide for the active workspace." action={canCreateGuide(context.membership.role) ? <Link href="/app/guides/new" className="rounded-full bg-[var(--accent-strong)] px-4 py-2 text-sm font-semibold text-white">Create guide</Link> : null} />
        )}
      </SectionCard>
    </div>
  );
}