import type { NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { prisma } from "@/lib/db/prisma";
import { syncClerkUserRecord } from "@/lib/auth/clerk-sync";

export async function POST(request: NextRequest) {
  try {
    const event = await verifyWebhook(request);

    if (event.type === "user.created" || event.type === "user.updated") {
      await syncClerkUserRecord(prisma, {
        id: event.data.id,
        emailAddresses: event.data.email_addresses?.map((entry) => entry.email_address).filter(Boolean) ?? [],
        firstName: event.data.first_name,
        lastName: event.data.last_name,
        username: event.data.username,
        imageUrl: event.data.image_url,
      });
    }

    if (event.type === "user.deleted" && event.data.id) {
      await prisma.user.updateMany({
        where: { clerkUserId: event.data.id },
        data: { clerkUserId: null },
      });
    }

    return new Response("Webhook received", { status: 200 });
  } catch {
    return new Response("Webhook verification failed", { status: 400 });
  }
}