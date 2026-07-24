import { strict as assert } from "node:assert";
import test from "node:test";
import { GuideStatus, WorkspaceRole } from "@prisma/client";
import { allowedGuideTransitions, canCreateCapture, canCreateGuide, canEditGuide, canManageTeam, canPublishGuide } from "@/lib/auth/permissions";
import { buildGuideLibraryWhere, buildGuideReadyState } from "@/lib/guides/policy";

test("role permissions are enforced", () => {
  assert.equal(canCreateCapture(WorkspaceRole.ADMIN), true);
  assert.equal(canCreateCapture(WorkspaceRole.TRAINEE), false);
  assert.equal(canCreateGuide(WorkspaceRole.AUTHOR), true);
  assert.equal(canPublishGuide(WorkspaceRole.AUTHOR), false);
  assert.equal(canManageTeam(WorkspaceRole.AUTHOR), false);
  assert.equal(canEditGuide(WorkspaceRole.AUTHOR, "author-1", "author-1"), true);
  assert.equal(canEditGuide(WorkspaceRole.AUTHOR, "author-1", "author-2"), false);
});

test("guide transitions follow the phase 1 lifecycle", () => {
  assert.deepEqual(allowedGuideTransitions(WorkspaceRole.AUTHOR, GuideStatus.DRAFT), [GuideStatus.IN_REVIEW]);
  assert.deepEqual(allowedGuideTransitions(WorkspaceRole.AUTHOR, GuideStatus.IN_REVIEW), [GuideStatus.DRAFT]);
  assert.deepEqual(allowedGuideTransitions(WorkspaceRole.ADMIN, GuideStatus.IN_REVIEW), [GuideStatus.DRAFT, GuideStatus.PUBLISHED]);
  assert.deepEqual(allowedGuideTransitions(WorkspaceRole.ADMIN, GuideStatus.PUBLISHED), [GuideStatus.ARCHIVED]);
  assert.deepEqual(allowedGuideTransitions(WorkspaceRole.ADMIN, GuideStatus.ARCHIVED), [GuideStatus.DRAFT]);
});

test("guide readiness requires title summary and one meaningful step", () => {
  assert.equal(buildGuideReadyState({ title: "Guide", summary: "Summary", steps: [{ title: "Step", instruction: "Do the thing" }] }).ready, true);
  assert.equal(buildGuideReadyState({ title: "", summary: "Summary", steps: [{ title: "Step", instruction: "Do the thing" }] }).ready, false);
  assert.equal(buildGuideReadyState({ title: "Guide", summary: "", steps: [{ title: "Step", instruction: "Do the thing" }] }).ready, false);
  assert.equal(buildGuideReadyState({ title: "Guide", summary: "Summary", steps: [{ title: "", instruction: "" }] }).ready, false);
});
test("guide library where scopes trainees to published guides", () => {
  const where = buildGuideLibraryWhere({ workspaceId: "workspace-1", role: "TRAINEE", userId: "user-1" });
  assert.equal(where.workspaceId, "workspace-1");
  assert.equal(where.status, GuideStatus.PUBLISHED);
});

test("guide library where scopes authors to published guides or their own drafts", () => {
  const where = buildGuideLibraryWhere({ workspaceId: "workspace-1", role: "AUTHOR", userId: "user-1" });
  assert.deepEqual(where.OR, [{ status: GuideStatus.PUBLISHED }, { createdById: "user-1" }]);
});