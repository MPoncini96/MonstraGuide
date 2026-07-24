import type { CaptureAssetStatus } from "@prisma/client";

export const ALLOWED_SCREENSHOT_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export type AllowedScreenshotMimeType = (typeof ALLOWED_SCREENSHOT_MIME_TYPES)[number];

export const MAX_SCREENSHOT_BYTES = 10 * 1024 * 1024;

export const PENDING_UPLOAD_TTL_MS = 15 * 60 * 1000;

const EXTENSION_BY_MIME: Record<AllowedScreenshotMimeType, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const SAFE_ID_PATTERN = /^[a-z0-9]+$/i;

export function isAllowedScreenshotMimeType(mimeType: string): mimeType is AllowedScreenshotMimeType {
  return (ALLOWED_SCREENSHOT_MIME_TYPES as readonly string[]).includes(mimeType);
}

export type ScreenshotValidationResult =
  | { ok: true; mimeType: AllowedScreenshotMimeType }
  | { ok: false; reason: string };

export function validateScreenshotUpload(input: { mimeType: string; byteSize: number }): ScreenshotValidationResult {
  if (!isAllowedScreenshotMimeType(input.mimeType)) {
    return {
      ok: false,
      reason: `Unsupported file type "${input.mimeType}". Only PNG, JPEG, and WebP screenshots are allowed.`,
    };
  }
  if (!Number.isFinite(input.byteSize) || input.byteSize <= 0) {
    return { ok: false, reason: "File size is invalid." };
  }
  if (input.byteSize > MAX_SCREENSHOT_BYTES) {
    return { ok: false, reason: `File is too large. Maximum size is ${MAX_SCREENSHOT_BYTES / (1024 * 1024)} MB.` };
  }
  return { ok: true, mimeType: input.mimeType };
}

export function buildScreenshotObjectKey(input: {
  workspaceId: string;
  captureId: string;
  assetId: string;
  mimeType: AllowedScreenshotMimeType;
}): string {
  for (const [label, value] of [
    ["workspaceId", input.workspaceId],
    ["captureId", input.captureId],
    ["assetId", input.assetId],
  ] as const) {
    if (!value || !SAFE_ID_PATTERN.test(value)) {
      throw new Error(`Unsafe ${label} for object key generation.`);
    }
  }
  const extension = EXTENSION_BY_MIME[input.mimeType];
  return `workspaces/${input.workspaceId}/captures/${input.captureId}/raw/${input.assetId}.${extension}`;
}

export function assertAssetOwnership(
  asset: { workspaceId: string; captureId: string },
  expected: { workspaceId: string; captureId: string },
) {
  if (asset.workspaceId !== expected.workspaceId || asset.captureId !== expected.captureId) {
    throw new Error("Screenshot not found.");
  }
}

export function assertAssetStatus(asset: { status: CaptureAssetStatus }, expected: CaptureAssetStatus) {
  if (asset.status !== expected) {
    throw new Error(`This screenshot is ${asset.status.toLowerCase()}, not ${expected.toLowerCase()}.`);
  }
}

export function isPendingUploadExpired(createdAt: Date, now: Date = new Date()): boolean {
  return now.getTime() - createdAt.getTime() > PENDING_UPLOAD_TTL_MS;
}
