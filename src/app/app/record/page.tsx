import { WorkspaceRole } from "@prisma/client";
import { createCaptureAction } from "@/lib/app-actions";
import { requireWorkspaceRole } from "@/lib/auth/session";
import { PageIntro, SectionCard } from "@/components/app/app-shell";

export default async function RecordPage() {
  await requireWorkspaceRole([WorkspaceRole.ADMIN, WorkspaceRole.AUTHOR]);
  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Record a task"
        title="Start a manual capture session"
        description="Create the capture shell here, then start the on-screen recorder from the capture's detail page."
      />
      <SectionCard title="Manual capture draft">
        <form action={createCaptureAction} className="grid gap-4 max-w-3xl">
          <label className="grid gap-2 text-sm font-medium">
            Task title
            <input name="title" className="app-input" placeholder="Document contractor expense onboarding" />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Short description
            <textarea name="description" className="app-input min-h-28" placeholder="What is being documented, and what should reviewers pay attention to?" />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Capture mode
            <input className="app-input" value="Manual upload" readOnly />
          </label>
          <label className="flex items-start gap-3 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground-muted)]">
            <input type="checkbox" name="privacyAcknowledged" className="mt-1" />
            I have permission to document this task and will review captured material before publication.
          </label>
          <button type="submit" className="w-fit rounded-full bg-[var(--accent-strong)] px-5 py-3 text-sm font-semibold text-white">Create capture session</button>
        </form>
      </SectionCard>
    </div>
  );
}
