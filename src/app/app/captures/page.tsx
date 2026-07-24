import Link from "next/link";
import { WorkspaceRole } from "@prisma/client";
import { EmptyState, PageIntro, SectionCard } from "@/components/app/app-shell";
import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceRole } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/utils";

export default async function CapturesPage() {
  const context = await requireWorkspaceRole([WorkspaceRole.ADMIN, WorkspaceRole.AUTHOR]);
  const captures = await prisma.captureSession.findMany({
    where: { workspaceId: context.workspace.id },
    include: { createdBy: true, guides: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <PageIntro eyebrow="Capture sessions" title="Review capture drafts and handoff notes" description="Capture sessions stay workspace-scoped and preserve the bridge between approved documentation and future guide generation." />
      <SectionCard title="All capture sessions" action={<Link href="/app/record" className="text-sm font-semibold text-[var(--accent-strong)]">New capture</Link>}>
        {captures.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-[var(--foreground-subtle)]">
                <tr><th className="pb-3">Title</th><th className="pb-3">Status</th><th className="pb-3">Creator</th><th className="pb-3">Updated</th><th className="pb-3">Guide</th></tr>
              </thead>
              <tbody>
                {captures.map((capture) => (
                  <tr key={capture.id} className="border-t border-[var(--border)]">
                    <td className="py-3"><Link href={`/app/captures/${capture.id}`} className="font-semibold">{capture.title}</Link></td>
                    <td className="py-3">{capture.status}</td>
                    <td className="py-3">{capture.createdBy.displayName || capture.createdBy.email}</td>
                    <td className="py-3">{formatDateTime(capture.updatedAt)}</td>
                    <td className="py-3">{capture.guides[0] ? <Link href={`/app/guides/${capture.guides[0].id}`} className="text-[var(--accent-strong)]">{capture.guides[0].title}</Link> : "Not yet"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No capture sessions yet" body="Create a capture session when an author or admin has permission to document a task." action={<Link href="/app/record" className="rounded-full bg-[var(--accent-strong)] px-4 py-2 text-sm font-semibold text-white">Start a capture</Link>} />
        )}
      </SectionCard>
    </div>
  );
}
