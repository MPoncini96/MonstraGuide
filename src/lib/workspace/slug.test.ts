import { strict as assert } from "node:assert";
import test from "node:test";
import { generateUniqueWorkspaceSlug, isReservedWorkspaceSlug, slugifyWorkspaceName } from "@/lib/workspace/slug";

test("slugifyWorkspaceName normalizes names", () => {
  assert.equal(slugifyWorkspaceName(" Northwind Operations! "), "northwind-operations");
});

test("reserved slugs are rejected by helper", () => {
  assert.equal(isReservedWorkspaceSlug("app"), true);
  assert.equal(isReservedWorkspaceSlug("northwind"), false);
});

test("generateUniqueWorkspaceSlug increments when needed", async () => {
  const taken = new Set(["northwind", "northwind-2"]);
  const slug = await generateUniqueWorkspaceSlug("Northwind", async (candidate) => taken.has(candidate));
  assert.equal(slug, "northwind-3");
});

test("generateUniqueWorkspaceSlug avoids reserved base slugs", async () => {
  const slug = await generateUniqueWorkspaceSlug("app", async () => false);
  assert.equal(slug, "app-team");
});