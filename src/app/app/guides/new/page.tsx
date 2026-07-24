import { WorkspaceRole } from "@prisma/client";
import { createGuideAction } from "@/lib/app-actions";
import { requireWorkspaceRole } from "@/lib/auth/session";
import { PageIntro, SectionCard } from "@/components/app/app-shell";

export default async function NewGuidePage() {
  await requireWorkspaceRole([WorkspaceRole.ADMIN, WorkspaceRole.AUTHOR]);

  return (
    <div className="space-y-8">
      <PageIntro eyebrow="Create guide" title="Create a manual guide shell" description="Phase 1 starts with a real draft, one approved first step, and optional supporting context for prerequisites and common mistakes." />
      <SectionCard title="Guide details">
        <form action={createGuideAction} className="grid gap-4 max-w-3xl">
          <input name="title" className="app-input" placeholder="Guide title" />
          <textarea name="summary" className="app-input min-h-24" placeholder="Summary" />
          <input name="estimatedMinutes" type="number" className="app-input" placeholder="Estimated completion time in minutes" />
          <input name="initialPrerequisite" className="app-input" placeholder="Initial prerequisite (optional)" />
          <input name="initialCommonMistake" className="app-input" placeholder="Initial common mistake (optional)" />
          <input name="initialStepTitle" className="app-input" placeholder="Initial step title" />
          <textarea name="initialStepInstruction" className="app-input min-h-28" placeholder="Initial step instruction" />
          <button type="submit" className="w-fit rounded-full bg-[var(--accent-strong)] px-5 py-3 text-sm font-semibold text-white">Create draft guide</button>
        </form>
      </SectionCard>
    </div>
  );
}