import { prisma } from "@/lib/db/prisma";
import { PageShell } from "@/components/sections/page-shell";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card } from "@/components/ui/card";
import { acceptInvitationAction } from "@/lib/app-actions";
import { formatDateTime } from "@/lib/utils";
import { evaluateInvitationAcceptance } from "@/lib/team/guards";

export default async function AcceptInvitePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const invitation = token
    ? await prisma.workspaceInvitation.findUnique({ where: { token }, include: { workspace: true } })
    : null;

  const invitationState = invitation
    ? evaluateInvitationAcceptance(invitation.status, invitation.expiresAt, invitation.acceptedAt)
    : { valid: false, reason: "This invite link is missing or no longer valid." };

  return (
    <PageShell>
      <section className="py-20 lg:py-28">
        <Container className="space-y-12">
          <SectionHeading
            badge="Accept invite"
            title="Join a Monstra Guide workspace"
            description="Invitation acceptance is workspace-scoped and validates the invite token on the server."
            level="h1"
          />
          <Card className="max-w-2xl space-y-6">
            {invitation && invitationState.valid ? (
              <>
                <div className="space-y-2">
                  <p className="text-lg font-semibold">{invitation.workspace.name}</p>
                  <p className="text-sm text-[var(--foreground-muted)]">Role: {invitation.role}</p>
                  <p className="text-sm text-[var(--foreground-muted)]">Expires: {formatDateTime(invitation.expiresAt)}</p>
                </div>
                <form action={acceptInvitationAction}>
                  <input type="hidden" name="token" value={token} />
                  <button type="submit" className="rounded-full bg-[var(--accent-strong)] px-5 py-3 text-sm font-semibold text-white">Accept invitation</button>
                </form>
              </>
            ) : (
              <p className="text-sm leading-7 text-[var(--foreground-muted)]">{invitationState.reason}</p>
            )}
          </Card>
        </Container>
      </section>
    </PageShell>
  );
}