-- CreateEnum
CREATE TYPE "public"."CaptureAssetKind" AS ENUM ('SCREENSHOT');

-- CreateEnum
CREATE TYPE "public"."CaptureAssetStatus" AS ENUM ('PENDING', 'READY', 'FAILED');

-- CreateTable
CREATE TABLE "public"."CaptureAsset" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "captureId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "kind" "public"."CaptureAssetKind" NOT NULL DEFAULT 'SCREENSHOT',
    "status" "public"."CaptureAssetStatus" NOT NULL DEFAULT 'PENDING',
    "objectKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "note" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "readyAt" TIMESTAMP(3),

    CONSTRAINT "CaptureAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CaptureAsset_objectKey_key" ON "public"."CaptureAsset"("objectKey");

-- CreateIndex
CREATE INDEX "CaptureAsset_workspaceId_captureId_status_idx" ON "public"."CaptureAsset"("workspaceId", "captureId", "status");

-- CreateIndex
CREATE INDEX "CaptureAsset_captureId_position_idx" ON "public"."CaptureAsset"("captureId", "position");

-- AddForeignKey
ALTER TABLE "public"."CaptureAsset" ADD CONSTRAINT "CaptureAsset_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CaptureAsset" ADD CONSTRAINT "CaptureAsset_captureId_fkey" FOREIGN KEY ("captureId") REFERENCES "public"."CaptureSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CaptureAsset" ADD CONSTRAINT "CaptureAsset_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
