import { InvitationStatus, WorkspaceRole } from "@prisma/client";

export function evaluateInvitationAcceptance(status: InvitationStatus, expiresAt: Date, acceptedAt: Date | null = null) {
  if (status === InvitationStatus.REVOKED) return { valid: false, reason: "This invitation was revoked." };
  if (status === InvitationStatus.ACCEPTED || acceptedAt) return { valid: false, reason: "This invitation has already been accepted." };
  if (status === InvitationStatus.EXPIRED || expiresAt <= new Date()) return { valid: false, reason: "This invitation has expired." };
  if (status !== InvitationStatus.PENDING) return { valid: false, reason: "This invitation is no longer available." };
  return { valid: true, reason: null };
}

export function evaluateMembershipRemoval(params: { adminCount: number; targetRole: WorkspaceRole; isSelf: boolean }) {
  const { adminCount, targetRole, isSelf } = params;
  if (targetRole === WorkspaceRole.ADMIN && adminCount <= 1) {
    return {
      allowed: false,
      reason: isSelf ? "You cannot remove your own final admin access." : "A workspace must retain at least one admin.",
    };
  }
  return { allowed: true, reason: null };
}

export function evaluateMembershipRoleChange(params: { adminCount: number; currentRole: WorkspaceRole; nextRole: WorkspaceRole; isSelf: boolean }) {
  const { adminCount, currentRole, nextRole, isSelf } = params;
  if (currentRole === WorkspaceRole.ADMIN && nextRole !== WorkspaceRole.ADMIN && adminCount <= 1) {
    return {
      allowed: false,
      reason: isSelf ? "You cannot demote your own final admin access." : "A workspace must retain at least one admin.",
    };
  }
  return { allowed: true, reason: null };
}