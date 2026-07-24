import { z } from "zod";

export const createCaptureSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(500).optional().default(""),
  privacyAcknowledged: z.literal("on"),
});
