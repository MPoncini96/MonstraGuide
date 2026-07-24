import { WorkspaceRole } from "@prisma/client";
import { PageIntro, SectionCard } from "@/components/app/app-shell";
import { StatusBadge } from "@/components/app/status-badge";
import { inviteMemberAction, removeMembershipAction, revokeInvitationAction, updateMembershipRoleAction } from "@/lib/app-actions";
import { requireWorkspaceRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { absoluteUrl, formatDateTime } from "@/lib/utils";

export default async function TeamPage() {
  const context = await requireWorkspaceRole([WorkspaceRole.ADMIN]);
  const [memberships, invitations] = await Promise.all([
    prisma.workspaceMembership.findMany({ where: { workspaceId: context.workspace.id }, include: { user: true }, orderBy: { createdAt: "asc" } }),
    prisma.workspaceInvitation.findMany({ where: { workspaceId: context.workspace.id }, include: { invitedBy: true }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="space-y-8">
      <PageIntro eyebrow="Team" title="Manage members and invitations" description="Invitation and role changes are enforced on the server and always scoped to the active workspace." />
      <SectionCard title="Invite teammate">
        <form action={inviteMemberAction} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px_auto]">
          <input name="email" className="app-input" placeholder="teammate@company.com" />
          <select name="role" className="app-input">
            <option value="AUTHOR">Author</option>
            <option value="TRAINEE">Trainee</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button type="submit" className="rounded-full bg-[var(--accent-strong)] px-5 py-3 text-sm font-semibold text-white">Create invitation</button>
        </form>
      </SectionCard>
      <SectionCard title="Members">
        <div className="space-y-4">
          {memberships.map((membership) => (
            <div key={membership.id} className="rounded-3xl border border-[var(--border)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="font-semibold">{membership.user.displayName || membership.user.email}</div>
                  <div className="mt-1 text-sm text-[var(--foreground-muted)]">{membership.user.email}</div>
                  <div className="mt-1 text-xs text-[var(--foreground-subtle)]">Joined {formatDateTime(membership.createdAt)}</div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge value={membership.role} />
                  <form action={updateMembershipRoleAction} className="flex items-center gap-2">
                    <input type="hidden" name="membershipId" value={membership.id} />
                    <select name="role" defaultValue={membership.role} className="app-input !w-auto">
                      <option value="ADMIN">Admin</option>
                      <option value="AUTHOR">Author</option>
                      <option value="TRAINEE">Trainee</option>
                    </select>
                    <button type="submit" className="rounded-full border border-[var(--border)] px-4 py-2 text-sm">Update</button>
                  </form>
                  <form action={removeMembershipAction}>
                    <input type="hidden" name="membershipId" value={membership.id} />
                    <button type="submit" className="text-sm font-semibold text-[var(--danger)]">Remove</button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Pending invitations">
        {invitations.length ? (
          <div className="space-y-4">
            {invitations.map((invite) => (
              <div key={invite.id} className="rounded-3xl border border-[var(--border)] p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{invite.email}</div>
                    <div className="mt-1 text-[var(--foreground-muted)]">Invited by {invite.invitedBy.displayName || invite.invitedBy.email}</div>
                  </div>
                  <StatusBadge value={invite.status} />
                </div>
                <div className="mt-3 grid gap-2 text-[var(--foreground-muted)] md:grid-cols-2">
                  <span>Sent {formatDateTime(invite.createdAt)}</span>
                  <span>Expires {formatDateTime(invite.expiresAt)}</span>
                </div>
                <div className="mt-3 break-all text-xs text-[var(--foreground-subtle)]">Invite link: {absoluteUrl(`/accept-invite?token=${invite.token}`)}</div>
                <form action={revokeInvitationAction} className="mt-3">
                  <input type="hidden" name="invitationId" value={invite.id} />
                  <button type="submit" className="text-sm font-semibold text-[var(--danger)]">Revoke invitation</button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--foreground-muted)]">There are no pending invitations for this workspace yet.</p>
        )}
      </SectionCard>
    </div>
  );
}