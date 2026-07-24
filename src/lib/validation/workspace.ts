import { z } from "zod";
import { isReservedWorkspaceSlug, slugifyWorkspaceName } from "@/lib/workspace/slug";

export const workspaceSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    preferredSlug: z.string().trim().max(80).optional().default(""),
  })
  .superRefine((input, ctx) => {
    const slug = slugifyWorkspaceName(input.preferredSlug || input.name);
    if (!slug) {
      ctx.addIssue({ code: "custom", message: "Enter a valid workspace name." });
    }
    if (slug && isReservedWorkspaceSlug(slug)) {
      ctx.addIssue({ code: "custom", message: "That workspace slug is reserved." });
    }
  });
