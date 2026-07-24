import { strict as assert } from "node:assert";
import test from "node:test";
import { InvitationStatus, WorkspaceRole } from "@prisma/client";
import { evaluateInvitationAcceptance, evaluateMembershipRemoval, evaluateMembershipRoleChange } from "@/lib/team/guards";

test("invitation acceptance rejects revoked expired and accepted invites", () => {
  assert.equal(evaluateInvitationAcceptance(InvitationStatus.REVOKED, new Date(Date.now() + 1000)).valid, false);
  assert.equal(evaluateInvitationAcceptance(InvitationStatus.ACCEPTED, new Date(Date.now() + 1000), new Date()).valid, false);
  assert.equal(evaluateInvitationAcceptance(InvitationStatus.PENDING, new Date(Date.now() - 1000)).valid, false);
  assert.equal(evaluateInvitationAcceptance(InvitationStatus.PENDING, new Date(Date.now() + 1000)).valid, true);
});

test("final admin cannot be removed", () => {
  const result = evaluateMembershipRemoval({ adminCount: 1, targetRole: WorkspaceRole.ADMIN, isSelf: false });
  assert.equal(result.allowed, false);
});

test("final admin cannot be demoted", () => {
  const result = evaluateMembershipRoleChange({ adminCount: 1, currentRole: WorkspaceRole.ADMIN, nextRole: WorkspaceRole.AUTHOR, isSelf: true });
  assert.equal(result.allowed, false);
});