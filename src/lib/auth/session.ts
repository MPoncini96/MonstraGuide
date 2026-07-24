import { auth, currentUser } from "@clerk/nextjs/server";
import { GuideStatus, WorkspaceRole } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { isClerkConfigured } from "@/lib/env";
import { normalizeEmail } from "@/lib/utils";
import { getActiveWorkspaceCookie, setActiveWorkspaceCookie } from "@/lib/workspace/active-workspace";
import { canCreateCapture, canEditGuide, canViewGuide } from "./permissions";

export async function requireUser() {
  if (!isClerkConfigured()) {
    redirect("/login?reason=clerk");
  }

  const session = await auth();
  if (!session.userId) {
    redirect("/login?redirect_url=/app");
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect("/login");
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) {
    throw new Error("Authenticated Clerk user is missing an email address.");
  }

  const normalizedEmail = normalizeEmail(email);
  const displayName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || clerkUser.username || email;

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ clerkUserId: clerkUser.id }, { normalizedEmail }],
    },
  });

  const localUser = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          clerkUserId: clerkUser.id,
          email,
          normalizedEmail,
          displayName,
          avatarUrl: clerkUser.imageUrl,
        },
      })
    : await prisma.user.create({
        data: {
          clerkUserId: clerkUser.id,
          email,
          normalizedEmail,
          displayName,
          avatarUrl: clerkUser.imageUrl,
        },
      });

  return { clerkUser, localUser };
}

export async function requireWorkspaceMembership(workspaceId: string) {
  const { localUser } = await requireUser();
  const membership = await prisma.workspaceMembership.findFirst({
    where: { workspaceId, userId: localUser.id },
    include: { workspace: true },
  });

  if (!membership) {
    notFound();
  }

  return { user: localUser, membership, workspace: membership.workspace };
}

export async function requireActiveWorkspace() {
  const { localUser, clerkUser } = await requireUser();
  const memberships = await prisma.workspaceMembership.findMany({
    where: { userId: localUser.id },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });

  if (memberships.length === 0) {
    redirect("/app/onboarding");
  }

  const requestedId = await getActiveWorkspaceCookie();
  const membership = memberships.find((entry) => entry.workspaceId === requestedId) ?? memberships[0];
  await setActiveWorkspaceCookie(membership.workspaceId);

  return { user: localUser, clerkUser, membership, workspace: membership.workspace, memberships };
}

export async function requireWorkspaceRole(roles: WorkspaceRole[]) {
  const context = await requireActiveWorkspace();
  if (!roles.includes(context.membership.role)) {
    notFound();
  }
  return context;
}

export async function requireCaptureAccess(captureId: string) {
  const context = await requireWorkspaceRole([WorkspaceRole.ADMIN, WorkspaceRole.AUTHOR]);
  const capture = await prisma.captureSession.findFirst({
    where: {
      id: captureId,
      workspaceId: context.workspace.id,
    },
    include: {
      createdBy: true,
      guides: true,
    },
  });
  if (!capture || !canCreateCapture(context.membership.role)) notFound();
  return { ...context, capture };
}

export async function requireGuideAccess(guideId: string) {
  const context = await requireActiveWorkspace();
  const guide = await prisma.guide.findFirst({
    where: {
      id: guideId,
      workspaceId: context.workspace.id,
    },
    include: {
      createdBy: true,
      reviewedBy: true,
      sourceCapture: true,
      steps: { orderBy: { position: "asc" } },
      prerequisites: { orderBy: { position: "asc" } },
      commonMistakes: { orderBy: { position: "asc" } },
      outgoingRelations: { include: { targetGuide: true } },
      versions: { orderBy: { version: "desc" } },
    },
  });

  if (!guide || !canViewGuide(context.membership.role, guide.status, guide.createdById, context.user.id)) {
    notFound();
  }

  return { ...context, guide };
}

export async function requireGuideEditor(guideId: string) {
  const context = await requireGuideAccess(guideId);
  if (!canEditGuide(context.membership.role, context.guide.createdById, context.user.id)) {
    notFound();
  }
  return context;
}

export async function requirePublishedGuideViewer(workspaceSlug: string, guideSlug: string) {
  const context = await requireActiveWorkspace();
  if (context.workspace.slug !== workspaceSlug) {
    notFound();
  }

  const guide = await prisma.guide.findFirst({
    where: {
      workspaceId: context.workspace.id,
      slug: guideSlug,
      status: GuideStatus.PUBLISHED,
    },
    include: {
      prerequisites: { orderBy: { position: "asc" } },
      commonMistakes: { orderBy: { position: "asc" } },
      steps: { orderBy: { position: "asc" } },
      outgoingRelations: { include: { targetGuide: true } },
      createdBy: true,
      reviewedBy: true,
    },
  });

  if (!guide) {
    notFound();
  }

  return { ...context, guide };
}