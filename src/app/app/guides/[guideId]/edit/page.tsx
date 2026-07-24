import {
  addGuideMistakeAction,
  addGuidePrerequisiteAction,
  addGuideStepAction,
  changeGuideStatusAction,
  moveGuideItemAction,
  removeGuideMistakeAction,
  removeGuidePrerequisiteAction,
  removeGuideStepAction,
  saveGuideMetadataAction,
  updateGuideMistakeAction,
  updateGuidePrerequisiteAction,
  updateGuideStepAction,
} from "@/lib/app-actions";
import { allowedGuideTransitions } from "@/lib/auth/permissions";
import { requireGuideEditor } from "@/lib/auth/session";
import { PageIntro, SectionCard } from "@/components/app/app-shell";
import { StatusBadge } from "@/components/app/status-badge";

export default async function GuideEditorPage({ params }: { params: Promise<{ guideId: string }> }) {
  const { guideId } = await params;
  const context = await requireGuideEditor(guideId);
  const transitions = allowedGuideTransitions(context.membership.role, context.guide.status);

  return (
    <div className="space-y-8">
      <PageIntro eyebrow="Guide editor" title={context.guide.title} description="Edit approved content structure, then move the guide through the review lifecycle with server-enforced transitions." />
      <SectionCard title="Metadata">
        <form action={saveGuideMetadataAction} className="grid gap-4">
          <input type="hidden" name="guideId" value={context.guide.id} />
          <input name="title" defaultValue={context.guide.title} className="app-input" />
          <textarea name="summary" defaultValue={context.guide.summary} className="app-input min-h-24" />
          <input name="estimatedMinutes" type="number" defaultValue={context.guide.estimatedMinutes ?? undefined} className="app-input" />
          <div className="flex items-center gap-3"><StatusBadge value={context.guide.status} /><button type="submit" className="rounded-full bg-[var(--accent-strong)] px-5 py-3 text-sm font-semibold text-white">Save draft</button></div>
        </form>
      </SectionCard>
      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Prerequisites">
          <div className="space-y-3">
            {context.guide.prerequisites.map((item) => (
              <div key={item.id} className="rounded-3xl border border-[var(--border)] p-4 space-y-3">
                <form action={updateGuidePrerequisiteAction} className="space-y-3">
                  <input type="hidden" name="guideId" value={context.guide.id} />
                  <input type="hidden" name="itemId" value={item.id} />
                  <input name="text" defaultValue={item.text} className="app-input" />
                  <button type="submit" className="rounded-full border border-[var(--border)] px-4 py-2 text-sm">Save</button>
                </form>
                <div className="flex flex-wrap gap-3 text-sm">
                  <form action={moveGuideItemAction}><input type="hidden" name="guideId" value={context.guide.id} /><input type="hidden" name="itemId" value={item.id} /><input type="hidden" name="kind" value="prerequisite" /><input type="hidden" name="direction" value="up" /><button type="submit" className="text-[var(--accent-strong)]">Move up</button></form>
                  <form action={moveGuideItemAction}><input type="hidden" name="guideId" value={context.guide.id} /><input type="hidden" name="itemId" value={item.id} /><input type="hidden" name="kind" value="prerequisite" /><input type="hidden" name="direction" value="down" /><button type="submit" className="text-[var(--accent-strong)]">Move down</button></form>
                  <form action={removeGuidePrerequisiteAction}><input type="hidden" name="guideId" value={context.guide.id} /><input type="hidden" name="itemId" value={item.id} /><button type="submit" className="text-[var(--danger)]">Delete</button></form>
                </div>
              </div>
            ))}
          </div>
          <form action={addGuidePrerequisiteAction} className="mt-4 flex gap-3"><input type="hidden" name="guideId" value={context.guide.id} /><input name="text" className="app-input" placeholder="Add prerequisite" /><button type="submit" className="rounded-full bg-[var(--accent-strong)] px-4 py-2 text-sm font-semibold text-white">Add</button></form>
        </SectionCard>
        <SectionCard title="Common mistakes">
          <div className="space-y-3">
            {context.guide.commonMistakes.map((item) => (
              <div key={item.id} className="rounded-3xl border border-[var(--border)] p-4 space-y-3">
                <form action={updateGuideMistakeAction} className="space-y-3">
                  <input type="hidden" name="guideId" value={context.guide.id} />
                  <input type="hidden" name="itemId" value={item.id} />
                  <input name="text" defaultValue={item.text} className="app-input" />
                  <button type="submit" className="rounded-full border border-[var(--border)] px-4 py-2 text-sm">Save</button>
                </form>
                <div className="flex flex-wrap gap-3 text-sm">
                  <form action={moveGuideItemAction}><input type="hidden" name="guideId" value={context.guide.id} /><input type="hidden" name="itemId" value={item.id} /><input type="hidden" name="kind" value="mistake" /><input type="hidden" name="direction" value="up" /><button type="submit" className="text-[var(--accent-strong)]">Move up</button></form>
                  <form action={moveGuideItemAction}><input type="hidden" name="guideId" value={context.guide.id} /><input type="hidden" name="itemId" value={item.id} /><input type="hidden" name="kind" value="mistake" /><input type="hidden" name="direction" value="down" /><button type="submit" className="text-[var(--accent-strong)]">Move down</button></form>
                  <form action={removeGuideMistakeAction}><input type="hidden" name="guideId" value={context.guide.id} /><input type="hidden" name="itemId" value={item.id} /><button type="submit" className="text-[var(--danger)]">Delete</button></form>
                </div>
              </div>
            ))}
          </div>
          <form action={addGuideMistakeAction} className="mt-4 flex gap-3"><input type="hidden" name="guideId" value={context.guide.id} /><input name="text" className="app-input" placeholder="Add common mistake" /><button type="submit" className="rounded-full bg-[var(--accent-strong)] px-4 py-2 text-sm font-semibold text-white">Add</button></form>
        </SectionCard>
      </div>
      <SectionCard title="Steps">
        <div className="space-y-4">
          {context.guide.steps.map((step) => (
            <div key={step.id} className="rounded-3xl border border-[var(--border)] p-4 space-y-3">
              <form action={updateGuideStepAction} className="space-y-3">
                <input type="hidden" name="guideId" value={context.guide.id} />
                <input type="hidden" name="stepId" value={step.id} />
                <input name="title" defaultValue={step.title} className="app-input" />
                <textarea name="instruction" defaultValue={step.instruction} className="app-input min-h-24" />
                <textarea name="explanation" defaultValue={step.explanation ?? ""} className="app-input min-h-20" placeholder="Explanation" />
                <input name="warning" defaultValue={step.warning ?? ""} className="app-input" placeholder="Warning" />
                <input name="screenshotUrl" defaultValue={step.screenshotUrl ?? ""} className="app-input" placeholder="Screenshot URL placeholder" />
                <button type="submit" className="rounded-full border border-[var(--border)] px-4 py-2 text-sm">Save step</button>
              </form>
              <div className="flex flex-wrap gap-3 text-sm">
                <form action={moveGuideItemAction}><input type="hidden" name="guideId" value={context.guide.id} /><input type="hidden" name="itemId" value={step.id} /><input type="hidden" name="kind" value="step" /><input type="hidden" name="direction" value="up" /><button type="submit" className="text-[var(--accent-strong)]">Move up</button></form>
                <form action={moveGuideItemAction}><input type="hidden" name="guideId" value={context.guide.id} /><input type="hidden" name="itemId" value={step.id} /><input type="hidden" name="kind" value="step" /><input type="hidden" name="direction" value="down" /><button type="submit" className="text-[var(--accent-strong)]">Move down</button></form>
                <form action={removeGuideStepAction}><input type="hidden" name="guideId" value={context.guide.id} /><input type="hidden" name="stepId" value={step.id} /><button type="submit" className="text-[var(--danger)]">Delete</button></form>
              </div>
            </div>
          ))}
        </div>
        <form action={addGuideStepAction} className="mt-6 grid gap-3">
          <input type="hidden" name="guideId" value={context.guide.id} />
          <input name="title" className="app-input" placeholder="New step title" />
          <textarea name="instruction" className="app-input min-h-24" placeholder="New step instruction" />
          <textarea name="explanation" className="app-input min-h-20" placeholder="Explanation (optional)" />
          <input name="warning" className="app-input" placeholder="Warning (optional)" />
          <input name="screenshotUrl" className="app-input" placeholder="Screenshot URL placeholder" />
          <button type="submit" className="w-fit rounded-full bg-[var(--accent-strong)] px-4 py-2 text-sm font-semibold text-white">Add step</button>
        </form>
      </SectionCard>
      <SectionCard title="Status transitions">
        <div className="flex flex-wrap gap-3">
          {transitions.length ? transitions.map((status) => (
            <form key={status} action={changeGuideStatusAction}>
              <input type="hidden" name="guideId" value={context.guide.id} />
              <input type="hidden" name="nextStatus" value={status} />
              <button type="submit" className="rounded-full bg-[var(--accent-strong)] px-4 py-2 text-sm font-semibold text-white">Move to {status.replaceAll("_", " ")}</button>
            </form>
          )) : <p className="text-sm text-[var(--foreground-muted)]">No additional status transitions are available for your role.</p>}
        </div>
      </SectionCard>
    </div>
  );
}