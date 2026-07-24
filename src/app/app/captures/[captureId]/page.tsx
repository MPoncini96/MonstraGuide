import Link from "next/link";
import { generateGuideFromCaptureAction } from "@/lib/app-actions";
import { requireCaptureAccess } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/utils";
import { PageIntro, SectionCard } from "@/components/app/app-shell";
import { StatusBadge } from "@/components/app/status-badge";
import { CaptureRecorder } from "@/components/app/capture-recorder";
import { CaptureScreenshots, type ScreenshotAssetView } from "@/components/app/capture-screenshots";
import { getCaptureAssets } from "@/lib/capture/asset-queries";
import { getObjectStorage } from "@/lib/storage/r2-storage";
import { isR2Configured } from "@/lib/env";

export default async function CaptureDetailPage({ params }: { params: Promise<{ captureId: string }> }) {
  const { captureId } = await params;
  const context = await requireCaptureAccess(captureId);

  const storageConfigured = isR2Configured();
  const rawAssets = await getCaptureAssets(context.workspace.id, context.capture.id);
  const assetViews: ScreenshotAssetView[] = await Promise.all(
    rawAssets.map(async (asset) => {
      let previewUrl: string | null = null;
      if (storageConfigured && asset.status === "READY") {
        const signed = await getObjectStorage().createGetUrl(asset.objectKey);
        previewUrl = signed.url;
      }
      return {
        id: asset.id,
        status: asset.status,
        mimeType: asset.mimeType,
        byteSize: asset.byteSize,
        position: asset.position,
        note: asset.note,
        isPrivate: asset.isPrivate,
        previewUrl,
      };
    }),
  );

  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Capture detail"
        title={context.capture.title}
        description={context.capture.description || "Capture notes and placeholder generation tools for the current phase."}
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <SectionCard title="Capture workspace">
          <CaptureRecorder captureId={context.capture.id} />
          <div className="mt-4 rounded-3xl border border-dashed border-[var(--border-strong)] p-4 text-sm text-[var(--foreground-muted)]">AI drafts a structured guide from this capture&apos;s title and notes. Review and edit everything before publishing.</div>
          <div className="mt-6 flex flex-wrap gap-3">
            <form action={generateGuideFromCaptureAction}>
              <input type="hidden" name="captureId" value={context.capture.id} />
              <button type="submit" className="rounded-full bg-[var(--accent-strong)] px-5 py-3 text-sm font-semibold text-white">Generate draft guide</button>
            </form>
            <Link href="/app/guides/new" className="rounded-full border border-[var(--border-strong)] px-5 py-3 text-sm font-semibold">Create guide manually</Link>
          </div>
        </SectionCard>
        <SectionCard title="Session details">
          <dl className="grid gap-4 text-sm">
            <div>
              <dt className="text-[var(--foreground-subtle)]">Status</dt>
              <dd className="mt-1"><StatusBadge value={context.capture.status} /></dd>
            </div>
            <div>
              <dt className="text-[var(--foreground-subtle)]">Creator</dt>
              <dd className="mt-1">{context.capture.createdBy.displayName || context.capture.createdBy.email}</dd>
            </div>
            <div>
              <dt className="text-[var(--foreground-subtle)]">Created</dt>
              <dd className="mt-1">{formatDateTime(context.capture.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-[var(--foreground-subtle)]">Updated</dt>
              <dd className="mt-1">{formatDateTime(context.capture.updatedAt)}</dd>
            </div>
            <div>
              <dt className="text-[var(--foreground-subtle)]">Linked guide</dt>
              <dd className="mt-1">{context.capture.guides[0] ? <Link href={`/app/guides/${context.capture.guides[0].id}`} className="text-[var(--accent-strong)]">{context.capture.guides[0].title}</Link> : "No guide linked yet"}</dd>
            </div>
          </dl>
        </SectionCard>
      </div>
      <SectionCard title="Screenshots">
        <CaptureScreenshots captureId={context.capture.id} initialAssets={assetViews} storageConfigured={storageConfigured} />
      </SectionCard>
    </div>
  );
}