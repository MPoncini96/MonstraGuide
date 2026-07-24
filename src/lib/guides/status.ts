import { GuideStatus, WorkspaceRole } from "@prisma/client";

export function canSeeGuide(role: WorkspaceRole, status: GuideStatus, isAuthor: boolean) {
  if (role === WorkspaceRole.ADMIN) return true;
  if (role === WorkspaceRole.TRAINEE) return status === GuideStatus.PUBLISHED;
  return status === GuideStatus.PUBLISHED || isAuthor;
}
