import Link from "next/link";
import { AssistantPanel } from "@/components/assistant/assistant-panel";
import { EmptyState, PageIntro, SectionCard } from "@/components/app/app-shell";
import { PlaceholderGuideAssistant } from "@/lib/assistant/placeholder-assistant";
import { requireActiveWorkspace } from "@/lib/auth/session";
import { buildKnowledgeSearchWhere } from "@/lib/guides/policy";
import { prisma } from "@/lib/db/prisma";
import { formatDateTime } from "@/lib/utils";

export default async function KnowledgePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const context = await requireActiveWorkspace();
  const [guides, answer] = await Promise.all([
    prisma.guide.findMany({
      where: buildKnowledgeSearchWhere(context.workspace.id, q),
      include: { outgoingRelations: { include: { targetGuide: true } } },
      orderBy: { updatedAt: "desc" },
      take: 24,
    }),
    q ? new PlaceholderGuideAssistant(prisma).answer({ workspaceId: context.workspace.id, question: q }) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-8">
      <PageIntro eyebrow="Knowledge" title="Search approved workspace guidance" description="This page acts as the active workspace textbook index and only surfaces published guide content." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_360px]">
        <div className="space-y-6">
          <SectionCard title="Search knowledge">
            <form className="flex gap-3">
              <input name="q" defaultValue={q} className="app-input" placeholder="Search titles, summaries, steps, prerequisites, or common mistakes" />
              <button type="submit" className="rounded-full bg-[var(--accent-strong)] px-5 py-3 text-sm font-semibold text-white">Search</button>
            </form>
          </SectionCard>
          <SectionCard title="Published guides">
            {guides.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {guides.map((guide) => (
                  <div key={guide.id} className="rounded-3xl border border-[var(--border)] p-4">
                    <Link href={`/g/${context.workspace.slug}/${guide.slug}`} className="font-semibold">{guide.title}</Link>
                    <p className="mt-2 text-sm text-[var(--foreground-muted)]">{guide.summary}</p>
                    <p className="mt-3 text-xs text-[var(--foreground-subtle)]">Updated {formatDateTime(guide.updatedAt)}</p>
                    <p className="mt-2 text-xs text-[var(--foreground-subtle)]">Related procedures: {guide.outgoingRelations.map((entry) => entry.targetGuide.title).join(", ") || "None yet"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No published guides found" body={q ? "Try a broader search term or ask an author to document the workflow." : "Published workspace guides will appear here after review and publication."} />
            )}
          </SectionCard>
        </div>
        <AssistantPanel answer={answer} guideBasePath={`/g/${context.workspace.slug}`} actionPath="/app/knowledge" query={q} />
      </div>
    </div>
  );
}