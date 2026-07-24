import { prisma } from "@/lib/db/prisma";

export function getCaptureAssets(workspaceId: string, captureId: string) {
  return prisma.captureAsset.findMany({
    where: { workspaceId, captureId },
    orderBy: { position: "asc" },
  });
}
