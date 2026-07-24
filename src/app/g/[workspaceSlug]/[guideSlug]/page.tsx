import { AssistantPanel } from "@/components/assistant/assistant-panel";
import { PageIntro, SectionCard } from "@/components/app/app-shell";
import { PlaceholderGuideAssistant } from "@/lib/assistant/placeholder-assistant";
import { requirePublishedGuideViewer } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { formatDateTime } from "@/lib/utils";

export default async function PublishedGuideViewer({ params, searchParams }: { params: Promise<{ workspaceSlug: string; guideSlug: string }>; searchParams: Promise<{ q?: string }> }) {
  const { workspaceSlug, guideSlug } = await params;
  const { q } = await searchParams;
  const context = await requirePublishedGuideViewer(workspaceSlug, guideSlug);
  const answer = q ? await new PlaceholderGuideAssistant(prisma).answer({ workspaceId: context.workspace.id, guideId: context.guide.id, question: q }) : null;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-5 py-10 xl:px-8">
      <PageIntro eyebrow={context.workspace.name} title={context.guide.title} description={context.guide.summary} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_360px]">
        <div className="space-y-6">
          <SectionCard title="Guide overview">
            <div className="grid gap-3 text-sm text-[var(--foreground-muted)] md:grid-cols-2">
              <p>Version {context.guide.version}</p>
              <p>Estimated time: {context.guide.estimatedMinutes ?? "Not set"} minutes</p>
              <p>Published: {context.guide.publishedAt ? formatDateTime(context.guide.publishedAt) : "Not yet"}</p>
              <p>Workspace: {context.workspace.name}</p>
            </div>
          </SectionCard>
          <SectionCard title="Prerequisites">
            {context.guide.prerequisites.length ? <ul className="space-y-2 text-sm text-[var(--foreground-muted)]">{context.guide.prerequisites.map((item) => <li key={item.id}>• {item.text}</li>)}</ul> : <p className="text-sm text-[var(--foreground-muted)]">No prerequisites listed for this guide.</p>}
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
                  <div className="mt-3 rounded-3xl border border-dashed border-[var(--border-strong)] p-4 text-sm text-[var(--foreground-subtle)]">Screenshot placeholder {step.screenshotUrl ? `• ${step.screenshotUrl}` : ""}</div>
                </li>
              ))}
            </ol>
          </SectionCard>
          <SectionCard title="Common mistakes">
            {context.guide.commonMistakes.length ? <ul className="space-y-2 text-sm text-[var(--foreground-muted)]">{context.guide.commonMistakes.map((item) => <li key={item.id}>• {item.text}</li>)}</ul> : <p className="text-sm text-[var(--foreground-muted)]">No common mistakes listed for this guide.</p>}
          </SectionCard>
          <SectionCard title="Related procedures">
            {context.guide.outgoingRelations.length ? <ul className="space-y-2 text-sm text-[var(--foreground-muted)]">{context.guide.outgoingRelations.map((relation) => <li key={relation.id}><a href={`/g/${workspaceSlug}/${relation.targetGuide.slug}`} className="text-[var(--accent-strong)]">{relation.targetGuide.title}</a></li>)}</ul> : <p className="text-sm text-[var(--foreground-muted)]">No related procedures linked yet.</p>}
          </SectionCard>
        </div>
        <AssistantPanel answer={answer} guideBasePath={`/g/${workspaceSlug}`} actionPath={`/g/${workspaceSlug}/${guideSlug}`} query={q} />
      </div>
    </div>
  );
}