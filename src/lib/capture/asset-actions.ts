"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireCaptureAccess } from "@/lib/auth/session";
import { getObjectStorage } from "@/lib/storage/r2-storage";
import {
  assertAssetOwnership,
  assertAssetStatus,
  buildScreenshotObjectKey,
  isPendingUploadExpired,
  validateScreenshotUpload,
} from "@/lib/capture/assets";

function generateAssetId() {
  return randomBytes(16).toString("hex");
}

async function loadOwnedAsset(workspaceId: string, captureId: string, assetId: string) {
  const asset = await prisma.captureAsset.findFirst({ where: { id: assetId } });
  if (!asset) {
    throw new Error("Screenshot not found.");
  }
  assertAssetOwnership(asset, { workspaceId, captureId });
  return asset;
}

function revalidateCapture(captureId: string) {
  revalidatePath(`/app/captures/${captureId}`);
}

export async function createScreenshotUploadAction(input: { captureId: string; mimeType: string; byteSize: number }) {
  const context = await requireCaptureAccess(input.captureId);

  const validation = validateScreenshotUpload({ mimeType: input.mimeType, byteSize: input.byteSize });
  if (!validation.ok) {
    throw new Error(validation.reason);
  }

  const assetId = generateAssetId();
  const objectKey = buildScreenshotObjectKey({
    workspaceId: context.workspace.id,
    captureId: context.capture.id,
    assetId,
    mimeType: validation.mimeType,
  });

  const position = (await prisma.captureAsset.count({ where: { captureId: context.capture.id } })) + 1;

  await prisma.captureAsset.create({
    data: {
      id: assetId,
      workspaceId: context.workspace.id,
      captureId: context.capture.id,
      createdById: context.user.id,
      mimeType: validation.mimeType,
      byteSize: input.byteSize,
      position,
      objectKey,
    },
  });

  const signed = await getObjectStorage().createPutUrl({ key: objectKey, contentType: validation.mimeType });

  return {
    assetId,
    uploadUrl: signed.url,
    expiresAt: signed.expiresAt.toISOString(),
  };
}

export async function completeScreenshotUploadAction(input: { captureId: string; assetId: string }) {
  const context = await requireCaptureAccess(input.captureId);
  const asset = await loadOwnedAsset(context.workspace.id, context.capture.id, input.assetId);

  if (asset.status !== "PENDING") {
    assertAssetStatus(asset, "PENDING");
  }

  if (isPendingUploadExpired(asset.createdAt)) {
    await prisma.captureAsset.updateMany({
      where: { id: asset.id, workspaceId: context.workspace.id },
      data: { status: "FAILED" },
    });
    throw new Error("This upload has expired. Please start a new upload.");
  }

  const metadata = await getObjectStorage().headObject(asset.objectKey);
  if (!metadata) {
    await prisma.captureAsset.updateMany({
      where: { id: asset.id, workspaceId: context.workspace.id },
      data: { status: "FAILED" },
    });
    throw new Error("The uploaded file could not be found. Please try uploading again.");
  }

  const revalidation = validateScreenshotUpload({
    mimeType: metadata.contentType ?? asset.mimeType,
    byteSize: metadata.size,
  });
  if (!revalidation.ok) {
    await prisma.captureAsset.updateMany({
      where: { id: asset.id, workspaceId: context.workspace.id },
      data: { status: "FAILED" },
    });
    throw new Error(revalidation.reason);
  }

  await prisma.captureAsset.updateMany({
    where: { id: asset.id, workspaceId: context.workspace.id },
    data: { status: "READY", readyAt: new Date(), byteSize: metadata.size },
  });

  revalidateCapture(context.capture.id);
  return { status: "READY" as const };
}

export async function createScreenshotGetUrlAction(input: { captureId: string; assetId: string }) {
  const context = await requireCaptureAccess(input.captureId);
  const asset = await loadOwnedAsset(context.workspace.id, context.capture.id, input.assetId);
  assertAssetStatus(asset, "READY");

  const signed = await getObjectStorage().createGetUrl(asset.objectKey);
  return { url: signed.url, expiresAt: signed.expiresAt.toISOString() };
}

export async function deleteScreenshotAction(input: { captureId: string; assetId: string }) {
  const context = await requireCaptureAccess(input.captureId);
  const asset = await loadOwnedAsset(context.workspace.id, context.capture.id, input.assetId);

  await getObjectStorage().deleteObject(asset.objectKey);
  await prisma.captureAsset.deleteMany({
    where: { id: asset.id, captureId: context.capture.id, workspaceId: context.workspace.id },
  });

  revalidateCapture(context.capture.id);
}

export async function updateScreenshotNoteAction(input: { captureId: string; assetId: string; note: string }) {
  const context = await requireCaptureAccess(input.captureId);
  await loadOwnedAsset(context.workspace.id, context.capture.id, input.assetId);

  const note = input.note.trim().slice(0, 500);
  await prisma.captureAsset.updateMany({
    where: { id: input.assetId, captureId: context.capture.id, workspaceId: context.workspace.id },
    data: { note: note || null },
  });

  revalidateCapture(context.capture.id);
}

export async function toggleScreenshotPrivateAction(input: { captureId: string; assetId: string; isPrivate: boolean }) {
  const context = await requireCaptureAccess(input.captureId);
  await loadOwnedAsset(context.workspace.id, context.capture.id, input.assetId);

  await prisma.captureAsset.updateMany({
    where: { id: input.assetId, captureId: context.capture.id, workspaceId: context.workspace.id },
    data: { isPrivate: input.isPrivate },
  });

  revalidateCapture(context.capture.id);
}

export async function reorderScreenshotsAction(input: { captureId: string; orderedAssetIds: string[] }) {
  const context = await requireCaptureAccess(input.captureId);

  const existing = await prisma.captureAsset.findMany({
    where: { captureId: context.capture.id, workspaceId: context.workspace.id },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((item) => item.id));
  const requestedIds = new Set(input.orderedAssetIds);
  if (existingIds.size !== requestedIds.size || [...existingIds].some((id) => !requestedIds.has(id))) {
    throw new Error("Screenshot list is out of date. Refresh and try again.");
  }

  await prisma.$transaction(
    input.orderedAssetIds.map((id, index) =>
      prisma.captureAsset.updateMany({
        where: { id, captureId: context.capture.id, workspaceId: context.workspace.id },
        data: { position: index + 1 },
      }),
    ),
  );

  revalidateCapture(context.capture.id);
}
