import crypto from "node:crypto";
import { PrismaClient, CaptureMode, CaptureStatus, GuideRelationType, GuideStatus, InvitationStatus, WorkspaceRole } from "@prisma/client";
import { buildGuideSnapshot } from "@/lib/guides/snapshots";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { normalizedEmail: "ada.admin@fictional-monstra.test" },
    update: { displayName: "Ada Admin" },
    create: { email: "ada.admin@fictional-monstra.test", normalizedEmail: "ada.admin@fictional-monstra.test", displayName: "Ada Admin", clerkUserId: "seed_admin" },
  });
  const author = await prisma.user.upsert({
    where: { normalizedEmail: "avery.author@fictional-monstra.test" },
    update: { displayName: "Avery Author" },
    create: { email: "avery.author@fictional-monstra.test", normalizedEmail: "avery.author@fictional-monstra.test", displayName: "Avery Author", clerkUserId: "seed_author" },
  });
  const trainee = await prisma.user.upsert({
    where: { normalizedEmail: "taylor.trainee@fictional-monstra.test" },
    update: { displayName: "Taylor Trainee" },
    create: { email: "taylor.trainee@fictional-monstra.test", normalizedEmail: "taylor.trainee@fictional-monstra.test", displayName: "Taylor Trainee", clerkUserId: "seed_trainee" },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: "northwind-ops" },
    update: { name: "Northwind Operations" },
    create: { name: "Northwind Operations", slug: "northwind-ops", createdById: admin.id },
  });

  await prisma.workspaceMembership.upsert({ where: { workspaceId_userId: { workspaceId: workspace.id, userId: admin.id } }, update: { role: WorkspaceRole.ADMIN }, create: { workspaceId: workspace.id, userId: admin.id, role: WorkspaceRole.ADMIN } });
  await prisma.workspaceMembership.upsert({ where: { workspaceId_userId: { workspaceId: workspace.id, userId: author.id } }, update: { role: WorkspaceRole.AUTHOR }, create: { workspaceId: workspace.id, userId: author.id, role: WorkspaceRole.AUTHOR } });
  await prisma.workspaceMembership.upsert({ where: { workspaceId_userId: { workspaceId: workspace.id, userId: trainee.id } }, update: { role: WorkspaceRole.TRAINEE }, create: { workspaceId: workspace.id, userId: trainee.id, role: WorkspaceRole.TRAINEE } });

  await prisma.workspaceInvitation.deleteMany({ where: { workspaceId: workspace.id } });
  await prisma.guideVersion.deleteMany({ where: { guide: { workspaceId: workspace.id } } });
  await prisma.guideRelation.deleteMany({ where: { OR: [{ sourceGuide: { workspaceId: workspace.id } }, { targetGuide: { workspaceId: workspace.id } }] } });
  await prisma.guideStep.deleteMany({ where: { guide: { workspaceId: workspace.id } } });
  await prisma.guidePrerequisite.deleteMany({ where: { guide: { workspaceId: workspace.id } } });
  await prisma.guideCommonMistake.deleteMany({ where: { guide: { workspaceId: workspace.id } } });
  await prisma.assistantMessage.deleteMany({ where: { conversation: { workspaceId: workspace.id } } });
  await prisma.assistantConversation.deleteMany({ where: { workspaceId: workspace.id } });
  await prisma.guide.deleteMany({ where: { workspaceId: workspace.id } });
  await prisma.captureSession.deleteMany({ where: { workspaceId: workspace.id } });

  const captureOne = await prisma.captureSession.create({
    data: {
      workspaceId: workspace.id,
      createdById: author.id,
      title: "Document the vendor intake workflow",
      description: "Manual screenshots and notes for the approved vendor intake process.",
      status: CaptureStatus.READY,
      captureMode: CaptureMode.MANUAL_UPLOAD,
      startedAt: new Date("2026-07-20T16:00:00.000Z"),
    },
  });

  const captureTwo = await prisma.captureSession.create({
    data: {
      workspaceId: workspace.id,
      createdById: admin.id,
      title: "Quarterly expense platform access review",
      description: "Phase 1 placeholder capture with timeline notes.",
      status: CaptureStatus.DRAFT,
      captureMode: CaptureMode.MANUAL_UPLOAD,
      startedAt: new Date("2026-07-21T17:00:00.000Z"),
    },
  });

  const draftGuide = await prisma.guide.create({
    data: {
      workspaceId: workspace.id,
      createdById: author.id,
      sourceCaptureId: captureOne.id,
      title: "Prepare a vendor profile",
      slug: "prepare-a-vendor-profile",
      summary: "Create a reviewed vendor record before procurement submits the request.",
      status: GuideStatus.DRAFT,
      estimatedMinutes: 8,
    },
  });

  const reviewGuide = await prisma.guide.create({
    data: {
      workspaceId: workspace.id,
      createdById: author.id,
      reviewedById: admin.id,
      sourceCaptureId: captureTwo.id,
      title: "Review contractor expense access",
      slug: "review-contractor-expense-access",
      summary: "Validate manager approval and least-privilege access before access renewal.",
      status: GuideStatus.IN_REVIEW,
      estimatedMinutes: 10,
      reviewSubmittedAt: new Date("2026-07-21T19:30:00.000Z"),
    },
  });

  const publishedOne = await prisma.guide.create({
    data: {
      workspaceId: workspace.id,
      createdById: admin.id,
      reviewedById: admin.id,
      sourceCaptureId: captureOne.id,
      title: "Add a contractor to the expense platform",
      slug: "add-a-contractor-to-the-expense-platform",
      summary: "Approve and provision a new contractor without exposing restricted finance data.",
      status: GuideStatus.PUBLISHED,
      estimatedMinutes: 12,
      publishedAt: new Date("2026-07-19T18:00:00.000Z"),
    },
  });

  const publishedTwo = await prisma.guide.create({
    data: {
      workspaceId: workspace.id,
      createdById: admin.id,
      reviewedById: admin.id,
      title: "Archive a completed contractor request",
      slug: "archive-a-completed-contractor-request",
      summary: "Close the request record and retain only the approved documentation.",
      status: GuideStatus.PUBLISHED,
      estimatedMinutes: 6,
      publishedAt: new Date("2026-07-18T21:00:00.000Z"),
    },
  });

  await prisma.guideStep.createMany({
    data: [
      { guideId: draftGuide.id, position: 1, title: "Open the vendor intake form", instruction: "Open the procurement workspace and start a new vendor intake draft.", explanation: "Use the reviewed queue, not the unrestricted search page." },
      { guideId: reviewGuide.id, position: 1, title: "Check the approval ticket", instruction: "Confirm the access review ticket includes a manager approval and expiration date." },
      { guideId: publishedOne.id, position: 1, title: "Open the approved contractor request", instruction: "Open the contractor request from the reviewed requests queue." },
      { guideId: publishedOne.id, position: 2, title: "Verify the manager approval", instruction: "Check the attached approval note before creating the account." },
      { guideId: publishedOne.id, position: 3, title: "Create the contractor account", instruction: "Assign contractor access and skip reimbursement card setup.", warning: "Do not grant the default employee admin role." },
      { guideId: publishedTwo.id, position: 1, title: "Confirm the request is complete", instruction: "Make sure the contractor onboarding checklist has been fully signed off." },
    ],
  });

  await prisma.guidePrerequisite.createMany({
    data: [
      { guideId: publishedOne.id, position: 1, text: "Approved contractor request number" },
      { guideId: publishedTwo.id, position: 1, text: "Completed onboarding checklist" },
    ],
  });

  await prisma.guideCommonMistake.createMany({
    data: [
      { guideId: publishedOne.id, position: 1, text: "Using a personal email instead of the contractor work email" },
      { guideId: publishedTwo.id, position: 1, text: "Archiving the request before finance confirms completion" },
    ],
  });

  await prisma.guideRelation.create({ data: { sourceGuideId: publishedOne.id, targetGuideId: publishedTwo.id, relationType: GuideRelationType.FOLLOW_UP } });
  await prisma.workspaceInvitation.create({ data: { workspaceId: workspace.id, email: "pending.member@fictional-monstra.test", normalizedEmail: "pending.member@fictional-monstra.test", role: WorkspaceRole.TRAINEE, token: crypto.randomUUID(), invitedById: admin.id, status: InvitationStatus.PENDING, expiresAt: new Date("2026-07-29T19:00:00.000Z") } });
  await prisma.assistantConversation.create({ data: { workspaceId: workspace.id, userId: trainee.id, guideId: publishedOne.id, title: "Contractor access question" } });

  const snapshot = await buildGuideSnapshot(prisma, publishedOne.id, admin.id);
  await prisma.guideVersion.create({ data: { guideId: publishedOne.id, version: publishedOne.version, snapshot, createdById: admin.id } });
}

main().finally(async () => prisma.$disconnect());