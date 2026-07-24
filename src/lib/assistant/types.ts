export type AssistantInput = {
  workspaceId: string;
  question: string;
  guideId?: string;
};

export type AssistantAnswerSource = {
  guideId: string;
  guideTitle: string;
  guideSlug: string;
  stepNumber?: number;
  excerpt: string;
};

export type AssistantAnswer = {
  message: string;
  sources: AssistantAnswerSource[];
};

export interface GuideAssistant {
  answer(input: AssistantInput): Promise<AssistantAnswer>;
}
