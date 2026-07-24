import Link from "next/link";
import { AssistantPanel } from "@/components/assistant/assistant-panel";
import { PageIntro, SectionCard } from "@/components/app/app-shell";
import { StatusBadge } from "@/components/app/status-badge";
import { PlaceholderGuideAssistant } from "@/lib/assistant/placeholder-assistant";
import { canEditGuide } from "@/lib/auth/permissions";
import { requireGuideAccess } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { formatDateTime } from "@/lib/utils";

export default async function GuideDetailPage({ params, searchParams }: { params: Promise<{ guideId: string }>; searchParams: Promise<{ q?: string }> }) {
  const { guideId } = await params;
  const { q } = await searchParams;
  const context = await requireGuideAccess(guideId);
  const answer = q ? await new PlaceholderGuideAssistant(prisma).answer({ workspaceId: context.workspace.id, guideId: context.guide.id, question: q }) : null;
  const editable = canEditGuide(context.membership.role, context.guide.createdById, context.user.id);

  return (
    <div className="space-y-8">
      <PageIntro eyebrow="Guide detail" title={context.guide.title} description={context.guide.summary} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_360px]">
        <div className="space-y-6">
          <SectionCard title="Overview" action={editable ? <Link href={`/app/guides/${context.guide.id}/edit`} className="text-sm font-semibold text-[var(--accent-strong)]">Edit guide</Link> : null}>
            <div className="grid gap-4 text-sm text-[var(--foreground-muted)] md:grid-cols-2">
              <div><div className="text-[var(--foreground-subtle)]">Status</div><div className="mt-1"><StatusBadge value={context.guide.status} /></div></div>
              <div><div className="text-[var(--foreground-subtle)]">Version</div><div className="mt-1">{context.guide.version}</div></div>
              <div><div className="text-[var(--foreground-subtle)]">Author</div><div className="mt-1">{context.guide.createdBy.displayName || context.guide.createdBy.email}</div></div>
              <div><div className="text-[var(--foreground-subtle)]">Reviewer</div><div className="mt-1">{context.guide.reviewedBy?.displayName || context.guide.reviewedBy?.email || "Not yet"}</div></div>
              <div><div className="text-[var(--foreground-subtle)]">Estimated time</div><div className="mt-1">{context.guide.estimatedMinutes ?? "Not set"} minutes</div></div>
              <div><div className="text-[var(--foreground-subtle)]">Source capture</div><div className="mt-1">{context.guide.sourceCapture ? <Link href={`/app/captures/${context.guide.sourceCapture.id}`} className="text-[var(--accent-strong)]">{context.guide.sourceCapture.title}</Link> : "Manual guide"}</div></div>
              <div><div className="text-[var(--foreground-subtle)]">Updated</div><div className="mt-1">{formatDateTime(context.guide.updatedAt)}</div></div>
              <div><div className="text-[var(--foreground-subtle)]">Published</div><div className="mt-1">{context.guide.publishedAt ? formatDateTime(context.guide.publishedAt) : "Not yet"}</div></div>
            </div>
          </SectionCard>
          <SectionCard title="Prerequisites">
            {context.guide.prerequisites.length ? <ul className="space-y-2 text-sm text-[var(--foreground-muted)]">{context.guide.prerequisites.map((item) => <li key={item.id}>• {item.text}</li>)}</ul> : <p className="text-sm text-[var(--foreground-muted)]">No prerequisites added yet.</p>}
          </SectionCard>
          <SectionCard title="Steps">
            <ol className="space-y-4">
              {context.guide.steps.map((step) => (
                <li key={step.id} className="rounded-3xl border border-[var(--border)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground-subtle)]">Step {step.position}</p>
                  <p className="mt-2 font-semibold">{step.title}</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--foreground-muted)]">{step.instruction}</p>
                  {step.explanation ? <p className="mt-2 text-sm text-[var(--foreground-muted)]">{step.explanation}</p> : null}
                  {step.warning ? <p className="mt-2 text-sm font-medium text-[var(--warning)]">Warning: {step.warning}</p> : null}
                </li>
              ))}
            </ol>
          </SectionCard>
          <SectionCard title="Common mistakes">
            {context.guide.commonMistakes.length ? <ul className="space-y-2 text-sm text-[var(--foreground-muted)]">{context.guide.commonMistakes.map((item) => <li key={item.id}>• {item.text}</li>)}</ul> : <p className="text-sm text-[var(--foreground-muted)]">No common mistakes listed yet.</p>}
          </SectionCard>
          <SectionCard title="Related procedures">
            {context.guide.outgoingRelations.length ? <ul className="space-y-2 text-sm text-[var(--foreground-muted)]">{context.guide.outgoingRelations.map((relation) => <li key={relation.id}><Link href={`/app/guides/${relation.targetGuide.id}`} className="text-[var(--accent-strong)]">{relation.targetGuide.title}</Link></li>)}</ul> : <p className="text-sm text-[var(--foreground-muted)]">No related procedures linked yet.</p>}
          </SectionCard>
        </div>
        <AssistantPanel answer={answer} actionPath={`/app/guides/${context.guide.id}`} guideBasePath={`/g/${context.workspace.slug}`} query={q} />
      </div>
    </div>
  );
}