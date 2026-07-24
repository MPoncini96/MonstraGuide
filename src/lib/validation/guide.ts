import { z } from "zod";
import { GuideStatus } from "@prisma/client";

export const createGuideSchema = z.object({
  title: z.string().trim().min(3).max(140),
  summary: z.string().trim().min(10).max(400),
  estimatedMinutes: z.coerce.number().int().min(1).max(240).optional(),
  initialPrerequisite: z.string().trim().max(240).optional().default(""),
  initialCommonMistake: z.string().trim().max(240).optional().default(""),
  initialStepTitle: z.string().trim().min(2).max(140),
  initialStepInstruction: z.string().trim().min(4).max(2000),
});

export const saveGuideMetadataSchema = z.object({
  guideId: z.string().min(1),
  title: z.string().trim().min(3).max(140),
  summary: z.string().trim().min(10).max(400),
  estimatedMinutes: z.coerce.number().int().min(1).max(240).optional(),
});

export const addListItemSchema = z.object({
  guideId: z.string().min(1),
  text: z.string().trim().min(2).max(240),
});

export const updateListItemSchema = z.object({
  guideId: z.string().min(1),
  itemId: z.string().min(1),
  text: z.string().trim().min(2).max(240),
});

export const addGuideStepSchema = z.object({
  guideId: z.string().min(1),
  title: z.string().trim().min(2).max(140),
  instruction: z.string().trim().min(4).max(2000),
  explanation: z.string().trim().max(2000).optional().default(""),
  warning: z.string().trim().max(500).optional().default(""),
  screenshotUrl: z.string().trim().url().optional().or(z.literal("")),
});

export const updateGuideStepSchema = addGuideStepSchema.extend({
  stepId: z.string().min(1),
});

export const changeGuideStatusSchema = z.object({
  guideId: z.string().min(1),
  nextStatus: z.nativeEnum(GuideStatus),
});

export const generatedGuideStepSchema = z.object({
  title: z.string().trim().min(2).max(140),
  instruction: z.string().trim().min(4).max(2000),
  explanation: z.string().trim().max(2000).optional(),
  warning: z.string().trim().max(500).optional(),
});

export const generatedGuideDraftSchema = z.object({
  title: z.string().trim().min(3).max(140),
  summary: z.string().trim().min(10).max(400),
  steps: z.array(generatedGuideStepSchema).min(1).max(20),
  prerequisites: z.array(z.string().trim().min(2).max(240)).max(10).optional().default([]),
  commonMistakes: z.array(z.string().trim().min(2).max(240)).max(10).optional().default([]),
});

export type GeneratedGuideDraft = z.infer<typeof generatedGuideDraftSchema>;