import { strict as assert } from "node:assert";
import test from "node:test";
import {
  assertAssetOwnership,
  assertAssetStatus,
  buildScreenshotObjectKey,
  isPendingUploadExpired,
  validateScreenshotUpload,
} from "@/lib/capture/assets";

const WORKSPACE_A = "workspace1aaaaaaaaaaaaaaaa";
const WORKSPACE_B = "workspace2bbbbbbbbbbbbbbbb";
const CAPTURE_A = "capture1aaaaaaaaaaaaaaaaaa";
const CAPTURE_B = "capture2bbbbbbbbbbbbbbbbbb";
const ASSET_ID = "asset1aaaaaaaaaaaaaaaaaaaa";

test("validateScreenshotUpload accepts PNG, JPEG, and WebP within the size limit", () => {
  for (const mimeType of ["image/png", "image/jpeg", "image/webp"]) {
    const result = validateScreenshotUpload({ mimeType, byteSize: 1024 });
    assert.equal(result.ok, true);
  }
});

test("validateScreenshotUpload rejects an invalid MIME type", () => {
  const result = validateScreenshotUpload({ mimeType: "image/gif", byteSize: 1024 });
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.reason, /Unsupported file type/);
});

test("validateScreenshotUpload rejects a MIME type that isn't an image at all", () => {
  const result = validateScreenshotUpload({ mimeType: "application/pdf", byteSize: 1024 });
  assert.equal(result.ok, false);
});

test("validateScreenshotUpload rejects an oversized file", () => {
  const result = validateScreenshotUpload({ mimeType: "image/png", byteSize: 10 * 1024 * 1024 + 1 });
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.reason, /too large/);
});

test("validateScreenshotUpload accepts a file exactly at the size limit", () => {
  const result = validateScreenshotUpload({ mimeType: "image/png", byteSize: 10 * 1024 * 1024 });
  assert.equal(result.ok, true);
});

test("validateScreenshotUpload rejects a zero or negative byte size", () => {
  assert.equal(validateScreenshotUpload({ mimeType: "image/png", byteSize: 0 }).ok, false);
  assert.equal(validateScreenshotUpload({ mimeType: "image/png", byteSize: -5 }).ok, false);
});

test("buildScreenshotObjectKey produces the required workspaces/.../raw/{assetId}.{ext} shape", () => {
  const key = buildScreenshotObjectKey({
    workspaceId: WORKSPACE_A,
    captureId: CAPTURE_A,
    assetId: ASSET_ID,
    mimeType: "image/png",
  });
  assert.equal(key, `workspaces/${WORKSPACE_A}/captures/${CAPTURE_A}/raw/${ASSET_ID}.png`);
});

test("buildScreenshotObjectKey maps each allowed MIME type to its extension", () => {
  assert.match(buildScreenshotObjectKey({ workspaceId: WORKSPACE_A, captureId: CAPTURE_A, assetId: ASSET_ID, mimeType: "image/jpeg" }), /\.jpg$/);
  assert.match(buildScreenshotObjectKey({ workspaceId: WORKSPACE_A, captureId: CAPTURE_A, assetId: ASSET_ID, mimeType: "image/webp" }), /\.webp$/);
});

test("buildScreenshotObjectKey never uses an original filename as the key", () => {
  const key = buildScreenshotObjectKey({ workspaceId: WORKSPACE_A, captureId: CAPTURE_A, assetId: ASSET_ID, mimeType: "image/png" });
  assert.doesNotMatch(key, /my-secret-screenshot|\.exe|\s/);
});

test("buildScreenshotObjectKey rejects a path-traversal workspaceId", () => {
  assert.throws(() =>
    buildScreenshotObjectKey({ workspaceId: "../../etc", captureId: CAPTURE_A, assetId: ASSET_ID, mimeType: "image/png" }),
  );
});

test("buildScreenshotObjectKey rejects a captureId containing a slash", () => {
  assert.throws(() =>
    buildScreenshotObjectKey({ workspaceId: WORKSPACE_A, captureId: "a/b", assetId: ASSET_ID, mimeType: "image/png" }),
  );
});

test("buildScreenshotObjectKey rejects an assetId with unsafe characters", () => {
  assert.throws(() =>
    buildScreenshotObjectKey({ workspaceId: WORKSPACE_A, captureId: CAPTURE_A, assetId: "../../../etc/passwd", mimeType: "image/png" }),
  );
});

test("assertAssetOwnership passes when workspace and capture both match", () => {
  assert.doesNotThrow(() =>
    assertAssetOwnership({ workspaceId: WORKSPACE_A, captureId: CAPTURE_A }, { workspaceId: WORKSPACE_A, captureId: CAPTURE_A }),
  );
});

test("assertAssetOwnership blocks an unauthorized read across workspaces", () => {
  // Asset genuinely belongs to workspace B; someone authenticated into workspace A requests it.
  assert.throws(
    () => assertAssetOwnership({ workspaceId: WORKSPACE_B, captureId: CAPTURE_A }, { workspaceId: WORKSPACE_A, captureId: CAPTURE_A }),
    /not found/,
  );
});

test("assertAssetOwnership blocks an unauthorized deletion across workspaces", () => {
  assert.throws(
    () => assertAssetOwnership({ workspaceId: WORKSPACE_B, captureId: CAPTURE_B }, { workspaceId: WORKSPACE_A, captureId: CAPTURE_B }),
    /not found/,
  );
});

test("assertAssetOwnership enforces capture isolation within the same workspace", () => {
  // Same workspace, but the asset belongs to a different capture session - still must be rejected.
  assert.throws(
    () => assertAssetOwnership({ workspaceId: WORKSPACE_A, captureId: CAPTURE_B }, { workspaceId: WORKSPACE_A, captureId: CAPTURE_A }),
  );
});

test("assertAssetStatus passes when the status matches", () => {
  assert.doesNotThrow(() => assertAssetStatus({ status: "READY" }, "READY"));
});

test("assertAssetStatus rejects reading a screenshot that is not yet ready (invalid asset state)", () => {
  assert.throws(() => assertAssetStatus({ status: "PENDING" }, "READY"), /is pending, not ready/);
});

test("assertAssetStatus rejects completing an upload that already failed", () => {
  assert.throws(() => assertAssetStatus({ status: "FAILED" }, "PENDING"));
});

test("isPendingUploadExpired is false for a freshly created upload", () => {
  const now = new Date("2026-01-01T00:10:00Z");
  const createdAt = new Date("2026-01-01T00:00:00Z");
  assert.equal(isPendingUploadExpired(createdAt, now), false);
});

test("isPendingUploadExpired is true once the pending TTL has elapsed", () => {
  const now = new Date("2026-01-01T00:20:00Z");
  const createdAt = new Date("2026-01-01T00:00:00Z");
  assert.equal(isPendingUploadExpired(createdAt, now), true);
});
