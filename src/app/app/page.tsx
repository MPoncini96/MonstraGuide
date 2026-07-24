import Link from "next/link";
import { GuideStatus, WorkspaceRole } from "@prisma/client";
import { AssistantPanel } from "@/components/assistant/assistant-panel";
import { EmptyState, PageIntro, SectionCard, StatCard } from "@/components/app/app-shell";
import { prisma } from "@/lib/db/prisma";
import { requireActiveWorkspace } from "@/lib/auth/session";
import { PlaceholderGuideAssistant } from "@/lib/assistant/placeholder-assistant";
import { formatDateTime } from "@/lib/utils";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const context = await requireActiveWorkspace();
  const [guides, captures, members] = await Promise.all([
    prisma.guide.findMany({ where: { workspaceId: context.workspace.id }, orderBy: { updatedAt: "desc" }, take: 5, include: { createdBy: true } }),
    prisma.captureSession.findMany({ where: { workspaceId: context.workspace.id }, orderBy: { updatedAt: "desc" }, take: 5, include: { createdBy: true } }),
    prisma.workspaceMembership.count({ where: { workspaceId: context.workspace.id } }),
  ]);

  const assistant = q ? await new PlaceholderGuideAssistant(prisma).answer({ workspaceId: context.workspace.id, question: q }) : null;
  const publishedCount = guides.filter((guide) => guide.status === GuideStatus.PUBLISHED).length;
  const draftCount = guides.filter((guide) => guide.status === GuideStatus.DRAFT).length;
  const reviewCount = guides.filter((guide) => guide.status === GuideStatus.IN_REVIEW).length;

  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Dashboard"
        title={context.membership.role === WorkspaceRole.TRAINEE ? "Keep learning from approved procedures" : "Build and review trusted operational guidance"}
        description="The dashboard surfaces only the guidance, captures, and team actions allowed by your current workspace role."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Published guides" value={publishedCount} detail="Approved procedures available now" />
        <StatCard label="Draft guides" value={draftCount} detail="Guides still being authored" />
        <StatCard label="Awaiting review" value={reviewCount} detail="Guides not yet published" />
        <StatCard label="Team members" value={members} detail="Workspace members with access" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <SectionCard title="Recent guides" action={<Link href="/app/guides" className="text-sm font-semibold text-[var(--accent-strong)]">View all</Link>}>
            {guides.length > 0 ? (
              <div className="space-y-4">
                {guides.map((guide) => (
                  <div key={guide.id} className="rounded-3xl border border-[var(--border)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <Link href={`/app/guides/${guide.id}`} className="font-semibold">{guide.title}</Link>
                        <p className="mt-1 text-sm text-[var(--foreground-muted)]">{guide.summary}</p>
                      </div>
                      <div className="text-sm text-[var(--foreground-muted)]">{guide.status}</div>
                    </div>
                    <div className="mt-3 text-xs text-[var(--foreground-subtle)]">Updated {formatDateTime(guide.updatedAt)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No guides yet" body="Create your first approved workflow from a manual capture or a blank guide." action={<Link href="/app/guides/new" className="rounded-full bg-[var(--accent-strong)] px-4 py-2 text-sm font-semibold text-white">Create guide</Link>} />
            )}
          </SectionCard>
          <SectionCard title="Recent capture sessions" action={<Link href="/app/captures" className="text-sm font-semibold text-[var(--accent-strong)]">Browse captures</Link>}>
            {captures.length > 0 ? (
              <div className="space-y-4">
                {captures.map((capture) => (
                  <div key={capture.id} className="rounded-3xl border border-[var(--border)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Link href={`/app/captures/${capture.id}`} className="font-semibold">{capture.title}</Link>
                      <span className="text-sm text-[var(--foreground-muted)]">{capture.status}</span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--foreground-muted)]">{capture.description || "No description added yet."}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No captures yet" body="Start a manual capture session when you have permission to document the task." action={<Link href="/app/record" className="rounded-full bg-[var(--accent-strong)] px-4 py-2 text-sm font-semibold text-white">Record a task</Link>} />
            )}
          </SectionCard>
        </div>
        <AssistantPanel answer={assistant} />
      </div>
    </div>
  );
}
