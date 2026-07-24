import { createWorkspaceAction } from "@/lib/app-actions";
import { PageIntro, SectionCard } from "@/components/app/app-shell";

export default function OnboardingPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      <PageIntro
        eyebrow="Workspace onboarding"
        title="Create your first Monstra Guide workspace"
        description="New users land here when they do not yet belong to a workspace. The creator becomes the first admin automatically."
      />
      <SectionCard title="Create workspace">
        <form action={createWorkspaceAction} className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            Workspace or company name
            <input name="name" className="app-input" placeholder="Northwind Operations" />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Preferred slug (optional)
            <input name="preferredSlug" className="app-input" placeholder="northwind-ops" />
          </label>
          <button type="submit" className="w-fit rounded-full bg-[var(--accent-strong)] px-5 py-3 text-sm font-semibold text-white">Create workspace</button>
        </form>
      </SectionCard>
    </div>
  );
}
