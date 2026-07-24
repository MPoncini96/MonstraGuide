'use server';

import crypto from "node:crypto";
import { GuideStatus, InvitationStatus, WorkspaceRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { buildGuideSnapshot } from "@/lib/guides/snapshots";
import { buildGuideReadyState } from "@/lib/guides/policy";
import { getGuideGenerator } from "@/lib/guides/generation";
import { requireActiveWorkspace, requireGuideEditor, requireUser, requireWorkspaceRole } from "@/lib/auth/session";
import { allowedGuideTransitions, canManageTeam, canPublishGuide } from "@/lib/auth/permissions";
import { evaluateInvitationAcceptance, evaluateMembershipRemoval, evaluateMembershipRoleChange } from "@/lib/team/guards";
import { normalizeEmail } from "@/lib/utils";
import { generateUniqueWorkspaceSlug, isReservedWorkspaceSlug, slugifyWorkspaceName } from "@/lib/workspace/slug";
import { setActiveWorkspaceCookie } from "@/lib/workspace/active-workspace";
import { createCaptureSchema } from "@/lib/validation/capture";
import { addGuideStepSchema, addListItemSchema, changeGuideStatusSchema, createGuideSchema, saveGuideMetadataSchema, updateGuideStepSchema, updateListItemSchema } from "@/lib/validation/guide";
import { workspaceSchema } from "@/lib/validation/workspace";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function reindexItems(kind: "prerequisite" | "mistake" | "step", guideId: string) {
  if (kind === "prerequisite") {
    const items = await prisma.guidePrerequisite.findMany({ where: { guideId }, orderBy: { position: "asc" } });
    await Promise.all(items.map((item, index) => prisma.guidePrerequisite.update({ where: { id: item.id }, data: { position: index + 1 } })));
  }
  if (kind === "mistake") {
    const items = await prisma.guideCommonMistake.findMany({ where: { guideId }, orderBy: { position: "asc" } });
    await Promise.all(items.map((item, index) => prisma.guideCommonMistake.update({ where: { id: item.id }, data: { position: index + 1 } })));
  }
  if (kind === "step") {
    const items = await prisma.guideStep.findMany({ where: { guideId }, orderBy: { position: "asc" } });
    await Promise.all(items.map((item, index) => prisma.guideStep.update({ where: { id: item.id }, data: { position: index + 1 } })));
  }
}

async function getUniqueGuideSlug(workspaceId: string, rawTitle: string, excludeGuideId?: string) {
  const baseSlug = slugifyWorkspaceName(rawTitle) || "guide";
  return generateUniqueWorkspaceSlug(baseSlug, async (candidate) => {
    const existing = await prisma.guide.findUnique({
      where: { workspaceId_slug: { workspaceId, slug: candidate } },
    });
    return Boolean(existing && existing.id !== excludeGuideId);
  });
}

function revalidateGuidePaths(guideId: string, workspaceSlug?: string, guideSlug?: string) {
  revalidatePath("/app");
  revalidatePath("/app/guides");
  revalidatePath("/app/knowledge");
  revalidatePath(`/app/guides/${guideId}`);
  revalidatePath(`/app/guides/${guideId}/edit`);
  if (workspaceSlug && guideSlug) {
    revalidatePath(`/g/${workspaceSlug}/${guideSlug}`);
  }
}

export async function createWorkspaceAction(formData: FormData) {
  const { localUser } = await requireUser();
  const parsed = workspaceSchema.parse({
    name: getString(formData, "name"),
    preferredSlug: getString(formData, "preferredSlug"),
  });

  const slug = await generateUniqueWorkspaceSlug(parsed.preferredSlug || parsed.name, async (candidate) => {
    return Boolean(await prisma.workspace.findUnique({ where: { slug: candidate } }));
  });

  const workspace = await prisma.workspace.create({
    data: {
      name: parsed.name,
      slug,
      createdById: localUser.id,
      memberships: {
        create: {
          userId: localUser.id,
          role: WorkspaceRole.ADMIN,
        },
      },
    },
  });

  await setActiveWorkspaceCookie(workspace.id);
  redirect("/app");
}

export async function switchWorkspaceAction(formData: FormData) {
  const { user, memberships } = await requireActiveWorkspace();
  const workspaceId = getString(formData, "workspaceId");
  const allowed = memberships.some((entry) => entry.workspaceId === workspaceId && entry.userId === user.id);
  if (!allowed) {
    throw new Error("You do not belong to that workspace.");
  }
  await setActiveWorkspaceCookie(workspaceId);
  redirect("/app");
}

export async function createCaptureAction(formData: FormData) {
  const context = await requireWorkspaceRole([WorkspaceRole.ADMIN, WorkspaceRole.AUTHOR]);
  const parsed = createCaptureSchema.parse({
    title: getString(formData, "title"),
    description: getString(formData, "description"),
    privacyAcknowledged: getString(formData, "privacyAcknowledged"),
  });

  const capture = await prisma.captureSession.create({
    data: {
      workspaceId: context.workspace.id,
      createdById: context.user.id,
      title: parsed.title,
      description: parsed.description,
      startedAt: new Date(),
    },
  });

  redirect(`/app/captures/${capture.id}`);
}

export async function generateGuideFromCaptureAction(formData: FormData) {
  const context = await requireWorkspaceRole([WorkspaceRole.ADMIN, WorkspaceRole.AUTHOR]);
  const captureId = getString(formData, "captureId");
  const capture = await prisma.captureSession.findFirst({
    where: { id: captureId, workspaceId: context.workspace.id },
  });
  if (!capture) throw new Error("Capture not found.");

  const draft = await getGuideGenerator().generate({
    title: capture.title,
    description: capture.description ?? "",
  });

  const slug = await getUniqueGuideSlug(context.workspace.id, draft.title);
  const guide = await prisma.guide.create({
    data: {
      workspaceId: context.workspace.id,
      createdById: context.user.id,
      sourceCaptureId: capture.id,
      title: draft.title,
      slug,
      summary: draft.summary,
      steps: {
        create: draft.steps.map((step, index) => ({
          position: index + 1,
          title: step.title,
          instruction: step.instruction,
          explanation: step.explanation || null,
          warning: step.warning || null,
        })),
      },
      prerequisites: {
        create: draft.prerequisites.map((text, index) => ({ position: index + 1, text })),
      },
      commonMistakes: {
        create: draft.commonMistakes.map((text, index) => ({ position: index + 1, text })),
      },
    },
  });

  revalidateGuidePaths(guide.id);
  redirect(`/app/guides/${guide.id}/edit`);
}

export async function createGuideAction(formData: FormData) {
  const context = await requireWorkspaceRole([WorkspaceRole.ADMIN, WorkspaceRole.AUTHOR]);
  const parsed = createGuideSchema.parse({
    title: getString(formData, "title"),
    summary: getString(formData, "summary"),
    estimatedMinutes: getString(formData, "estimatedMinutes") || undefined,
    initialPrerequisite: getString(formData, "initialPrerequisite"),
    initialCommonMistake: getString(formData, "initialCommonMistake"),
    initialStepTitle: getString(formData, "initialStepTitle"),
    initialStepInstruction: getString(formData, "initialStepInstruction"),
  });

  const slug = await getUniqueGuideSlug(context.workspace.id, parsed.title);
  const guide = await prisma.guide.create({
    data: {
      workspaceId: context.workspace.id,
      createdById: context.user.id,
      title: parsed.title,
      summary: parsed.summary,
      estimatedMinutes: parsed.estimatedMinutes,
      slug,
      prerequisites: parsed.initialPrerequisite ? {
        create: { position: 1, text: parsed.initialPrerequisite },
      } : undefined,
      commonMistakes: parsed.initialCommonMistake ? {
        create: { position: 1, text: parsed.initialCommonMistake },
      } : undefined,
      steps: {
        create: {
          position: 1,
          title: parsed.initialStepTitle,
          instruction: parsed.initialStepInstruction,
        },
      },
    },
  });

  revalidateGuidePaths(guide.id);
  redirect(`/app/guides/${guide.id}/edit`);
}

export async function saveGuideMetadataAction(formData: FormData) {
  const parsed = saveGuideMetadataSchema.parse({
    guideId: getString(formData, "guideId"),
    title: getString(formData, "title"),
    summary: getString(formData, "summary"),
    estimatedMinutes: getString(formData, "estimatedMinutes") || undefined,
  });
  const context = await requireGuideEditor(parsed.guideId);
  const slug = await getUniqueGuideSlug(context.workspace.id, parsed.title, parsed.guideId);

  const guide = await prisma.guide.update({
    where: { id: parsed.guideId },
    data: {
      title: parsed.title,
      summary: parsed.summary,
      estimatedMinutes: parsed.estimatedMinutes,
      slug,
    },
  });
  revalidateGuidePaths(guide.id, context.workspace.slug, guide.slug);
}

export async function addGuidePrerequisiteAction(formData: FormData) {
  const parsed = addListItemSchema.parse({ guideId: getString(formData, "guideId"), text: getString(formData, "text") });
  await requireGuideEditor(parsed.guideId);
  const count = await prisma.guidePrerequisite.count({ where: { guideId: parsed.guideId } });
  await prisma.guidePrerequisite.create({ data: { guideId: parsed.guideId, text: parsed.text, position: count + 1 } });
  revalidateGuidePaths(parsed.guideId);
}

export async function updateGuidePrerequisiteAction(formData: FormData) {
  const parsed = updateListItemSchema.parse({ guideId: getString(formData, "guideId"), itemId: getString(formData, "itemId"), text: getString(formData, "text") });
  await requireGuideEditor(parsed.guideId);
  await prisma.guidePrerequisite.update({ where: { id: parsed.itemId }, data: { text: parsed.text } });
  revalidateGuidePaths(parsed.guideId);
}

export async function removeGuidePrerequisiteAction(formData: FormData) {
  const guideId = getString(formData, "guideId");
  const itemId = getString(formData, "itemId");
  await requireGuideEditor(guideId);
  await prisma.guidePrerequisite.deleteMany({ where: { id: itemId, guideId } });
  await reindexItems("prerequisite", guideId);
  revalidateGuidePaths(guideId);
}

export async function addGuideMistakeAction(formData: FormData) {
  const parsed = addListItemSchema.parse({ guideId: getString(formData, "guideId"), text: getString(formData, "text") });
  await requireGuideEditor(parsed.guideId);
  const count = await prisma.guideCommonMistake.count({ where: { guideId: parsed.guideId } });
  await prisma.guideCommonMistake.create({ data: { guideId: parsed.guideId, text: parsed.text, position: count + 1 } });
  revalidateGuidePaths(parsed.guideId);
}

export async function updateGuideMistakeAction(formData: FormData) {
  const parsed = updateListItemSchema.parse({ guideId: getString(formData, "guideId"), itemId: getString(formData, "itemId"), text: getString(formData, "text") });
  await requireGuideEditor(parsed.guideId);
  await prisma.guideCommonMistake.update({ where: { id: parsed.itemId }, data: { text: parsed.text } });
  revalidateGuidePaths(parsed.guideId);
}

export async function removeGuideMistakeAction(formData: FormData) {
  const guideId = getString(formData, "guideId");
  const itemId = getString(formData, "itemId");
  await requireGuideEditor(guideId);
  await prisma.guideCommonMistake.deleteMany({ where: { id: itemId, guideId } });
  await reindexItems("mistake", guideId);
  revalidateGuidePaths(guideId);
}

export async function moveGuideItemAction(formData: FormData) {
  const guideId = getString(formData, "guideId");
  const itemId = getString(formData, "itemId");
  const kind = getString(formData, "kind");
  const direction = getString(formData, "direction") === "up" ? -1 : 1;
  await requireGuideEditor(guideId);

  if (kind === "prerequisite") {
    const items = await prisma.guidePrerequisite.findMany({ where: { guideId }, orderBy: { position: "asc" } });
    const index = items.findIndex((item) => item.id === itemId);
    const swap = items[index + direction];
    if (index >= 0 && swap) {
      await prisma.$transaction([
        prisma.guidePrerequisite.update({ where: { id: items[index].id }, data: { position: swap.position } }),
        prisma.guidePrerequisite.update({ where: { id: swap.id }, data: { position: items[index].position } }),
      ]);
    }
  }

  if (kind === "mistake") {
    const items = await prisma.guideCommonMistake.findMany({ where: { guideId }, orderBy: { position: "asc" } });
    const index = items.findIndex((item) => item.id === itemId);
    const swap = items[index + direction];
    if (index >= 0 && swap) {
      await prisma.$transaction([
        prisma.guideCommonMistake.update({ where: { id: items[index].id }, data: { position: swap.position } }),
        prisma.guideCommonMistake.update({ where: { id: swap.id }, data: { position: items[index].position } }),
      ]);
    }
  }

  if (kind === "step") {
    const items = await prisma.guideStep.findMany({ where: { guideId }, orderBy: { position: "asc" } });
    const index = items.findIndex((item) => item.id === itemId);
    const swap = items[index + direction];
    if (index >= 0 && swap) {
      await prisma.$transaction([
        prisma.guideStep.update({ where: { id: items[index].id }, data: { position: swap.position } }),
        prisma.guideStep.update({ where: { id: swap.id }, data: { position: items[index].position } }),
      ]);
    }
  }

  revalidateGuidePaths(guideId);
}

export async function addGuideStepAction(formData: FormData) {
  const parsed = addGuideStepSchema.parse({
    guideId: getString(formData, "guideId"),
    title: getString(formData, "title"),
    instruction: getString(formData, "instruction"),
    explanation: getString(formData, "explanation"),
    warning: getString(formData, "warning"),
    screenshotUrl: getString(formData, "screenshotUrl"),
  });
  await requireGuideEditor(parsed.guideId);
  const count = await prisma.guideStep.count({ where: { guideId: parsed.guideId } });
  await prisma.guideStep.create({
    data: {
      guideId: parsed.guideId,
      position: count + 1,
      title: parsed.title,
      instruction: parsed.instruction,
      explanation: parsed.explanation || null,
      warning: parsed.warning || null,
      screenshotUrl: parsed.screenshotUrl || null,
    },
  });
  revalidateGuidePaths(parsed.guideId);
}

export async function updateGuideStepAction(formData: FormData) {
  const parsed = updateGuideStepSchema.parse({
    guideId: getString(formData, "guideId"),
    stepId: getString(formData, "stepId"),
    title: getString(formData, "title"),
    instruction: getString(formData, "instruction"),
    explanation: getString(formData, "explanation"),
    warning: getString(formData, "warning"),
    screenshotUrl: getString(formData, "screenshotUrl"),
  });
  await requireGuideEditor(parsed.guideId);
  await prisma.guideStep.update({
    where: { id: parsed.stepId },
    data: {
      title: parsed.title,
      instruction: parsed.instruction,
      explanation: parsed.explanation || null,
      warning: parsed.warning || null,
      screenshotUrl: parsed.screenshotUrl || null,
    },
  });
  revalidateGuidePaths(parsed.guideId);
}

export async function removeGuideStepAction(formData: FormData) {
  const guideId = getString(formData, "guideId");
  const stepId = getString(formData, "stepId");
  await requireGuideEditor(guideId);
  await prisma.guideStep.deleteMany({ where: { id: stepId, guideId } });
  await reindexItems("step", guideId);
  revalidateGuidePaths(guideId);
}

export async function changeGuideStatusAction(formData: FormData) {
  const parsed = changeGuideStatusSchema.parse({
    guideId: getString(formData, "guideId"),
    nextStatus: getString(formData, "nextStatus"),
  });
  const context = await requireGuideEditor(parsed.guideId);
  const allowed = allowedGuideTransitions(context.membership.role, context.guide.status);
  if (!(allowed as GuideStatus[]).includes(parsed.nextStatus)) {
    throw new Error("That status change is not allowed.");
  }

  if (([GuideStatus.IN_REVIEW, GuideStatus.PUBLISHED] as GuideStatus[]).includes(parsed.nextStatus)) {
    const latestGuide = await prisma.guide.findFirst({
      where: { id: parsed.guideId, workspaceId: context.workspace.id },
      include: { steps: true },
    });
    if (!latestGuide) {
      throw new Error("Guide not found.");
    }
    const readyState = buildGuideReadyState({
      title: latestGuide.title,
      summary: latestGuide.summary,
      steps: latestGuide.steps,
    });
    if (!readyState.ready) {
      throw new Error("Add a title, summary, and at least one step before submitting or publishing.");
    }
  }

  if (parsed.nextStatus === GuideStatus.PUBLISHED) {
    if (!canPublishGuide(context.membership.role)) {
      throw new Error("Only admins can publish guides.");
    }

    const result = await prisma.$transaction(async (tx) => {
      const guide = await tx.guide.findFirst({
        where: { id: parsed.guideId, workspaceId: context.workspace.id },
        include: { steps: true },
      });
      if (!guide) {
        throw new Error("Guide not found.");
      }

      const nextVersion = guide.publishedAt ? guide.version + 1 : guide.version;
      const updated = await tx.guide.update({
        where: { id: guide.id },
        data: {
          status: GuideStatus.PUBLISHED,
          reviewedById: context.user.id,
          reviewSubmittedAt: guide.reviewSubmittedAt ?? new Date(),
          publishedAt: new Date(),
          version: nextVersion,
        },
      });
      const snapshot = await buildGuideSnapshot(tx as typeof prisma, guide.id, context.user.id);
      await tx.guideVersion.upsert({
        where: { guideId_version: { guideId: guide.id, version: nextVersion } },
        update: { snapshot, createdById: context.user.id },
        create: { guideId: guide.id, version: nextVersion, snapshot, createdById: context.user.id },
      });
      return updated;
    });

    revalidateGuidePaths(result.id, context.workspace.slug, result.slug);
    return;
  }

  const updated = await prisma.guide.update({
    where: { id: parsed.guideId },
    data: {
      status: parsed.nextStatus,
      reviewSubmittedAt: parsed.nextStatus === GuideStatus.IN_REVIEW ? new Date() : parsed.nextStatus === GuideStatus.DRAFT ? null : context.guide.reviewSubmittedAt,
    },
  });
  revalidateGuidePaths(updated.id, context.workspace.slug, updated.slug);
}

export async function inviteMemberAction(formData: FormData) {
  const context = await requireWorkspaceRole([WorkspaceRole.ADMIN]);
  if (!canManageTeam(context.membership.role)) throw new Error("Unauthorized.");

  const email = normalizeEmail(getString(formData, "email"));
  const role = getString(formData, "role") as WorkspaceRole;
  if (!email) throw new Error("Enter an email address.");
  if (![WorkspaceRole.ADMIN, WorkspaceRole.AUTHOR, WorkspaceRole.TRAINEE].includes(role)) {
    throw new Error("Choose a valid role.");
  }

  const activeInvite = await prisma.workspaceInvitation.findFirst({
    where: {
      workspaceId: context.workspace.id,
      normalizedEmail: email,
      status: InvitationStatus.PENDING,
      expiresAt: { gt: new Date() },
    },
  });
  if (activeInvite) throw new Error("That person already has an active invitation.");

  await prisma.workspaceInvitation.create({
    data: {
      workspaceId: context.workspace.id,
      email,
      normalizedEmail: email,
      role,
      invitedById: context.user.id,
      token: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });
  revalidatePath("/app/team");
}

export async function revokeInvitationAction(formData: FormData) {
  const context = await requireWorkspaceRole([WorkspaceRole.ADMIN]);
  const invitationId = getString(formData, "invitationId");
  await prisma.workspaceInvitation.updateMany({
    where: { id: invitationId, workspaceId: context.workspace.id },
    data: { status: InvitationStatus.REVOKED },
  });
  revalidatePath("/app/team");
}

export async function updateMembershipRoleAction(formData: FormData) {
  const context = await requireWorkspaceRole([WorkspaceRole.ADMIN]);
  const membershipId = getString(formData, "membershipId");
  const role = getString(formData, "role") as WorkspaceRole;
  const membership = await prisma.workspaceMembership.findFirst({
    where: { id: membershipId, workspaceId: context.workspace.id },
  });
  if (!membership) throw new Error("Membership not found.");

  const adminCount = await prisma.workspaceMembership.count({
    where: { workspaceId: context.workspace.id, role: WorkspaceRole.ADMIN },
  });
  const decision = evaluateMembershipRoleChange({
    adminCount,
    currentRole: membership.role,
    nextRole: role,
    isSelf: membership.userId === context.user.id,
  });
  if (!decision.allowed) throw new Error(decision.reason ?? "That role change is not allowed.");

  await prisma.workspaceMembership.update({ where: { id: membership.id }, data: { role } });
  revalidatePath("/app/team");
}

export async function removeMembershipAction(formData: FormData) {
  const context = await requireWorkspaceRole([WorkspaceRole.ADMIN]);
  const membershipId = getString(formData, "membershipId");
  const membership = await prisma.workspaceMembership.findFirst({
    where: { id: membershipId, workspaceId: context.workspace.id },
  });
  if (!membership) throw new Error("Membership not found.");

  const adminCount = await prisma.workspaceMembership.count({
    where: { workspaceId: context.workspace.id, role: WorkspaceRole.ADMIN },
  });
  const decision = evaluateMembershipRemoval({
    adminCount,
    targetRole: membership.role,
    isSelf: membership.userId === context.user.id,
  });
  if (!decision.allowed) throw new Error(decision.reason ?? "That removal is not allowed.");

  await prisma.workspaceMembership.delete({ where: { id: membership.id } });
  revalidatePath("/app/team");
}

export async function acceptInvitationAction(formData: FormData) {
  const { localUser } = await requireUser();
  const token = getString(formData, "token");
  const invitation = await prisma.workspaceInvitation.findUnique({ where: { token } });
  if (!invitation) {
    throw new Error("That invitation is no longer available.");
  }

  const invitationState = evaluateInvitationAcceptance(invitation.status, invitation.expiresAt, invitation.acceptedAt);
  if (!invitationState.valid) {
    throw new Error(invitationState.reason ?? "That invitation is no longer available.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.workspaceMembership.upsert({
      where: { workspaceId_userId: { workspaceId: invitation.workspaceId, userId: localUser.id } },
      update: { role: invitation.role },
      create: { workspaceId: invitation.workspaceId, userId: localUser.id, role: invitation.role },
    });
    await tx.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.ACCEPTED, acceptedAt: new Date() },
    });
  });

  await setActiveWorkspaceCookie(invitation.workspaceId);
  redirect("/app");
}

export async function updatePersonalSettingsAction(formData: FormData) {
  const { localUser } = await requireUser();
  await prisma.user.update({
    where: { id: localUser.id },
    data: { displayName: getString(formData, "displayName") },
  });
  revalidatePath("/app/settings");
}

export async function updateWorkspaceSettingsAction(formData: FormData) {
  const context = await requireWorkspaceRole([WorkspaceRole.ADMIN]);
  const name = getString(formData, "name");
  const requestedSlug = slugifyWorkspaceName(getString(formData, "slug") || name);
  if (isReservedWorkspaceSlug(requestedSlug)) {
    throw new Error("That workspace slug is reserved.");
  }

  const slug = await generateUniqueWorkspaceSlug(requestedSlug, async (candidate) => {
    const existing = await prisma.workspace.findUnique({ where: { slug: candidate } });
    return Boolean(existing && existing.id !== context.workspace.id);
  });

  await prisma.workspace.update({
    where: { id: context.workspace.id },
    data: { name, slug },
  });
  revalidatePath("/app/settings");
}