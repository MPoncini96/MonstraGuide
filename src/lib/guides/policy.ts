import { GuideStatus, type Prisma } from "@prisma/client";

export function buildGuideReadyState(input: { title: string; summary: string; steps: Array<{ title: string; instruction: string }> }) {
  const hasTitle = input.title.trim().length > 0;
  const hasSummary = input.summary.trim().length > 0;
  const hasStep = input.steps.some((step) => step.title.trim().length > 0 && step.instruction.trim().length > 0);
  return {
    ready: hasTitle && hasSummary && hasStep,
    hasTitle,
    hasSummary,
    hasStep,
  };
}

export function buildGuideLibraryWhere(params: {
  workspaceId: string;
  role: "ADMIN" | "AUTHOR" | "TRAINEE";
  userId: string;
  search?: string;
  status?: GuideStatus | "";
  authorId?: string;
}): Prisma.GuideWhereInput {
  const search = params.search?.trim();
  const where: Prisma.GuideWhereInput = {
    workspaceId: params.workspaceId,
  };

  if (params.role === "TRAINEE") {
    where.status = GuideStatus.PUBLISHED;
  } else if (params.role === "AUTHOR") {
    where.OR = [
      { status: GuideStatus.PUBLISHED },
      { createdById: params.userId },
    ];
  }

  if (params.status) {
    where.status = params.status;
  }

  if (params.authorId) {
    where.createdById = params.authorId;
  }

  if (search) {
    where.AND = [
      {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { summary: { contains: search, mode: "insensitive" } },
        ],
      },
    ];
  }

  return where;
}

export function buildKnowledgeSearchWhere(workspaceId: string, search?: string): Prisma.GuideWhereInput {
  const query = search?.trim();
  return {
    workspaceId,
    status: GuideStatus.PUBLISHED,
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { summary: { contains: query, mode: "insensitive" } },
            { steps: { some: { OR: [
              { title: { contains: query, mode: "insensitive" } },
              { instruction: { contains: query, mode: "insensitive" } },
              { explanation: { contains: query, mode: "insensitive" } },
            ] } } },
            { prerequisites: { some: { text: { contains: query, mode: "insensitive" } } } },
            { commonMistakes: { some: { text: { contains: query, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };
}