import { GuideStatus, PrismaClient } from "@prisma/client";
import type { AssistantAnswer, AssistantInput, GuideAssistant, AssistantAnswerSource } from "./types";

const FALLBACK =
  "I couldn't find an approved guide that answers that question. Ask a workspace author or administrator to document the procedure.";

export type AssistantGuideDocument = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  steps: Array<{ position: number; title: string; instruction: string; explanation: string | null }>;
  prerequisites: Array<{ text: string }>;
  commonMistakes: Array<{ text: string }>;
};

function tokenize(input: string) {
  return input.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

export function rankGuideMatches(question: string, guides: AssistantGuideDocument[]) {
  const terms = tokenize(question);
  if (terms.length === 0) return [] as AssistantAnswerSource[];

  const scored = guides.flatMap((guide) => {
    const supportingText = [guide.title, guide.summary, ...guide.prerequisites.map((item) => item.text), ...guide.commonMistakes.map((item) => item.text)].join(" ").toLowerCase();
    return guide.steps.map((step) => {
      const stepText = `${step.title} ${step.instruction} ${step.explanation ?? ""}`.toLowerCase();
      const score = terms.reduce((total, term) => {
        const stepWeight = stepText.includes(term) ? 3 : 0;
        const supportingWeight = supportingText.includes(term) ? 1 : 0;
        return total + stepWeight + supportingWeight;
      }, 0);

      return score > 0
        ? {
            guideId: guide.id,
            guideTitle: guide.title,
            guideSlug: guide.slug,
            stepNumber: step.position,
            excerpt: step.instruction,
            score,
          }
        : null;
    }).filter(Boolean);
  }).filter(Boolean) as Array<AssistantAnswerSource & { score: number }>;

  return scored
    .sort((a, b) => b.score - a.score || a.stepNumber! - b.stepNumber!)
    .slice(0, 3)
    .map((item) => ({
      guideId: item.guideId,
      guideTitle: item.guideTitle,
      guideSlug: item.guideSlug,
      stepNumber: item.stepNumber,
      excerpt: item.excerpt,
    }));
}

export class PlaceholderGuideAssistant implements GuideAssistant {
  constructor(private readonly db: PrismaClient) {}

  async answer(input: AssistantInput): Promise<AssistantAnswer> {
    const question = input.question.trim();
    if (!question) return { message: FALLBACK, sources: [] };

    const guides = await this.db.guide.findMany({
      where: {
        workspaceId: input.workspaceId,
        status: GuideStatus.PUBLISHED,
        ...(input.guideId ? { id: input.guideId } : {}),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        steps: { orderBy: { position: "asc" }, select: { position: true, title: true, instruction: true, explanation: true } },
        prerequisites: { orderBy: { position: "asc" }, select: { text: true } },
        commonMistakes: { orderBy: { position: "asc" }, select: { text: true } },
      },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      take: input.guideId ? 1 : 12,
    });

    const sources = rankGuideMatches(question, guides);
    if (sources.length === 0) {
      return { message: FALLBACK, sources: [] };
    }

    const primary = sources[0];
    return {
      message: `The closest approved procedure is "${primary.guideTitle}," Step ${primary.stepNumber}: "${primary.excerpt}"`,
      sources,
    };
  }
}