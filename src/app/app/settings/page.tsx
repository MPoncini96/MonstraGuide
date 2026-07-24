import { SignOutButton } from "@clerk/nextjs";
import { WorkspaceRole } from "@prisma/client";
import { PageIntro, SectionCard } from "@/components/app/app-shell";
import { updatePersonalSettingsAction, updateWorkspaceSettingsAction } from "@/lib/app-actions";
import { requireActiveWorkspace } from "@/lib/auth/session";

export default async function SettingsPage() {
  const context = await requireActiveWorkspace();
  const memberCount = context.memberships.length;

  return (
    <div className="space-y-8">
      <PageIntro eyebrow="Settings" title="Personal and workspace settings" description="Personal settings are available to everyone. Workspace-level controls stay restricted to admins and clearly mark future functionality." />
      <SectionCard title="Personal settings">
        <form action={updatePersonalSettingsAction} className="grid gap-4 max-w-2xl">
          <input name="displayName" defaultValue={context.user.displayName ?? ""} className="app-input" />
          <input value={context.user.email} readOnly className="app-input opacity-70" />
          <input value={context.membership.role} readOnly className="app-input opacity-70" />
          <input value={context.workspace.name} readOnly className="app-input opacity-70" />
          <button type="submit" className="w-fit rounded-full bg-[var(--accent-strong)] px-5 py-3 text-sm font-semibold text-white">Save personal settings</button>
        </form>
        <div className="mt-4"><SignOutButton><button type="button" className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold">Sign out</button></SignOutButton></div>
      </SectionCard>
      {context.membership.role === WorkspaceRole.ADMIN ? (
        <SectionCard title="Workspace settings">
          <form action={updateWorkspaceSettingsAction} className="grid gap-4 max-w-2xl">
            <input name="name" defaultValue={context.workspace.name} className="app-input" />
            <input name="slug" defaultValue={context.workspace.slug} className="app-input" />
            <input value={String(memberCount)} readOnly className="app-input opacity-70" />
            <input value={new Date(context.workspace.createdAt).toLocaleDateString()} readOnly className="app-input opacity-70" />
            <div className="rounded-3xl border border-dashed border-[var(--border-strong)] p-4 text-sm text-[var(--foreground-muted)]">Default guide visibility, raw capture retention, restricted applications, and approved AI provider settings are coming in a later phase.</div>
            <button type="submit" className="w-fit rounded-full bg-[var(--accent-strong)] px-5 py-3 text-sm font-semibold text-white">Save workspace settings</button>
          </form>
        </SectionCard>
      ) : null}
    </div>
  );
}