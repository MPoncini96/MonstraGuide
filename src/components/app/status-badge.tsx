import { CaptureStatus, GuideStatus, InvitationStatus, WorkspaceRole } from "@prisma/client";
import { cn } from "@/lib/utils";

function toneForValue(value: string) {
  switch (value) {
    case GuideStatus.DRAFT:
    case CaptureStatus.DRAFT:
      return "bg-slate-100 text-slate-700 border-slate-200";
    case GuideStatus.IN_REVIEW:
    case InvitationStatus.EXPIRED:
      return "bg-amber-100 text-amber-800 border-amber-200";
    case GuideStatus.PUBLISHED:
    case CaptureStatus.COMPLETED:
    case InvitationStatus.ACCEPTED:
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case GuideStatus.ARCHIVED:
    case CaptureStatus.ARCHIVED:
    case InvitationStatus.REVOKED:
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
    case CaptureStatus.READY:
    case InvitationStatus.PENDING:
      return "bg-sky-100 text-sky-800 border-sky-200";
    case CaptureStatus.PROCESSING:
      return "bg-violet-100 text-violet-800 border-violet-200";
    case CaptureStatus.FAILED:
      return "bg-rose-100 text-rose-800 border-rose-200";
    case WorkspaceRole.ADMIN:
      return "bg-slate-900 text-white border-slate-900";
    case WorkspaceRole.AUTHOR:
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case WorkspaceRole.TRAINEE:
      return "bg-cyan-100 text-cyan-800 border-cyan-200";
    default:
      return "bg-[var(--surface)] text-[var(--foreground-muted)] border-[var(--border)]";
  }
}

export function StatusBadge({ value }: { value: string }) {
  return (
    <span className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]", toneForValue(value))}>
      {value.replaceAll("_", " ")}
    </span>
  );
}