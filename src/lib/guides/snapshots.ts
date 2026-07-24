import { PrismaClient } from "@prisma/client";

export async function buildGuideSnapshot(db: PrismaClient, guideId: string, publishedById?: string) {
  const guide = await db.guide.findUniqueOrThrow({
    where: { id: guideId },
    include: {
      prerequisites: { orderBy: { position: "asc" } },
      commonMistakes: { orderBy: { position: "asc" } },
      steps: { orderBy: { position: "asc" } },
      outgoingRelations: { include: { targetGuide: true } },
    },
  });

  return {
    metadata: {
      id: guide.id,
      title: guide.title,
      summary: guide.summary,
      slug: guide.slug,
      status: guide.status,
      version: guide.version,
      estimatedMinutes: guide.estimatedMinutes,
      publishedAt: guide.publishedAt,
      publishedById: publishedById ?? null,
      reviewedById: guide.reviewedById,
      sourceCaptureId: guide.sourceCaptureId,
    },
    prerequisites: guide.prerequisites.map((item) => ({ position: item.position, text: item.text })),
    commonMistakes: guide.commonMistakes.map((item) => ({ position: item.position, text: item.text })),
    steps: guide.steps.map((step) => ({
      position: step.position,
      title: step.title,
      instruction: step.instruction,
      explanation: step.explanation,
      warning: step.warning,
      screenshotUrl: step.screenshotUrl,
    })),
    relatedGuides: guide.outgoingRelations.map((relation) => ({
      id: relation.targetGuide.id,
      title: relation.targetGuide.title,
      slug: relation.targetGuide.slug,
      relationType: relation.relationType,
    })),
  };
}