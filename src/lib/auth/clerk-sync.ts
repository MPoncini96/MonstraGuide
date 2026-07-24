import type { PrismaClient } from "@prisma/client";
import { normalizeEmail } from "@/lib/utils";

export type ClerkWebhookUserPayload = {
  id: string;
  emailAddresses: string[];
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  imageUrl?: string | null;
};

function getDisplayName(payload: ClerkWebhookUserPayload, fallbackEmail: string) {
  return [payload.firstName, payload.lastName].filter(Boolean).join(" ") || payload.username || fallbackEmail;
}

export async function syncClerkUserRecord(db: PrismaClient, payload: ClerkWebhookUserPayload) {
  const email = payload.emailAddresses[0];
  if (!email) {
    return null;
  }

  const normalizedEmail = normalizeEmail(email);
  const existing = await db.user.findFirst({
    where: {
      OR: [{ clerkUserId: payload.id }, { normalizedEmail }],
    },
  });

  const data = {
    clerkUserId: payload.id,
    email,
    normalizedEmail,
    displayName: getDisplayName(payload, email),
    avatarUrl: payload.imageUrl ?? null,
  };

  if (existing) {
    return db.user.update({ where: { id: existing.id }, data });
  }

  return db.user.create({ data });
}