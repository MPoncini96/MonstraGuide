import { strict as assert } from "node:assert";
import test from "node:test";
import { syncClerkUserRecord, type ClerkWebhookUserPayload } from "@/lib/auth/clerk-sync";

type MockDb = {
  user: {
    findFirst: (args: unknown) => Promise<{ id: string } | null>;
    update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
    create: (args: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
  };
};

const payload: ClerkWebhookUserPayload = {
  id: "clerk_123",
  emailAddresses: ["Ada.Admin@example.com"],
  firstName: "Ada",
  lastName: "Admin",
  username: null,
  imageUrl: null,
};

test("syncClerkUserRecord creates a user when none exists", async () => {
  let created: Record<string, unknown> | null = null;
  const db: MockDb = {
    user: {
      findFirst: async () => null,
      update: async () => { throw new Error("update should not be called"); },
      create: async ({ data }) => {
        created = data;
        return data;
      },
    },
  };

  await syncClerkUserRecord(db as never, payload);
  assert.equal(created?.normalizedEmail, "ada.admin@example.com");
});

test("syncClerkUserRecord updates an existing user idempotently", async () => {
  let updated: Record<string, unknown> | null = null;
  const db: MockDb = {
    user: {
      findFirst: async () => ({ id: "local_1" }),
      update: async ({ data }) => {
        updated = data;
        return data;
      },
      create: async () => { throw new Error("create should not be called"); },
    },
  };

  await syncClerkUserRecord(db as never, payload);
  assert.equal(updated?.clerkUserId, "clerk_123");
  assert.equal(updated?.displayName, "Ada Admin");
});

test("syncClerkUserRecord ignores payloads without an email", async () => {
  const db: MockDb = {
    user: {
      findFirst: async () => { throw new Error("findFirst should not be called"); },
      update: async () => { throw new Error("update should not be called"); },
      create: async () => { throw new Error("create should not be called"); },
    },
  };

  const result = await syncClerkUserRecord(db as never, { ...payload, emailAddresses: [] });
  assert.equal(result, null);
});