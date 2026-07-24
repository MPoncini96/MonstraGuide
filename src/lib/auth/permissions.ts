import { GuideStatus, WorkspaceRole } from "@prisma/client";

export function canCreateCapture(role: WorkspaceRole) {
  return role === WorkspaceRole.ADMIN || role === WorkspaceRole.AUTHOR;
}

export function canCreateGuide(role: WorkspaceRole) {
  return role === WorkspaceRole.ADMIN || role === WorkspaceRole.AUTHOR;
}

export function canManageTeam(role: WorkspaceRole) {
  return role === WorkspaceRole.ADMIN;
}

export function canPublishGuide(role: WorkspaceRole) {
  return role === WorkspaceRole.ADMIN;
}

export function canSubmitGuideForReview(role: WorkspaceRole) {
  return role === WorkspaceRole.ADMIN || role === WorkspaceRole.AUTHOR;
}

export function canEditGuide(role: WorkspaceRole, createdById: string, currentUserId: string) {
  return role === WorkspaceRole.ADMIN || (role === WorkspaceRole.AUTHOR && createdById === currentUserId);
}

export function canViewGuide(role: WorkspaceRole, guideStatus: GuideStatus, createdById: string, currentUserId: string) {
  if (role === WorkspaceRole.ADMIN) return true;
  if (role === WorkspaceRole.TRAINEE) return guideStatus === GuideStatus.PUBLISHED;
  return guideStatus === GuideStatus.PUBLISHED || createdById === currentUserId;
}

export function allowedGuideTransitions(role: WorkspaceRole, status: GuideStatus) {
  switch (status) {
    case GuideStatus.DRAFT:
      return canSubmitGuideForReview(role) ? [GuideStatus.IN_REVIEW] : [];
    case GuideStatus.IN_REVIEW:
      return [
        ...(canSubmitGuideForReview(role) ? [GuideStatus.DRAFT] : []),
        ...(canPublishGuide(role) ? [GuideStatus.PUBLISHED] : []),
      ];
    case GuideStatus.PUBLISHED:
      return canPublishGuide(role) ? [GuideStatus.ARCHIVED] : [];
    case GuideStatus.ARCHIVED:
      return canPublishGuide(role) ? [GuideStatus.DRAFT] : [];
    default:
      return [];
  }
}