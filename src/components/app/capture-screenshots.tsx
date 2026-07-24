"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  completeScreenshotUploadAction,
  createScreenshotUploadAction,
  deleteScreenshotAction,
  reorderScreenshotsAction,
  toggleScreenshotPrivateAction,
  updateScreenshotNoteAction,
} from "@/lib/capture/asset-actions";
import { ALLOWED_SCREENSHOT_MIME_TYPES, MAX_SCREENSHOT_BYTES } from "@/lib/capture/assets";

export type ScreenshotAssetView = {
  id: string;
  status: "PENDING" | "READY" | "FAILED";
  mimeType: string;
  byteSize: number;
  position: number;
  note: string | null;
  isPrivate: boolean;
  previewUrl: string | null;
};

type UploadItem = {
  clientId: string;
  fileName: string;
  progress: number;
  error: string | null;
};

function uploadWithProgress(url: string, file: File, onProgress: (percent: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed (${xhr.status}).`));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
    xhr.send(file);
  });
}

function formatBytes(byteSize: number) {
  if (byteSize < 1024) return `${byteSize} B`;
  if (byteSize < 1024 * 1024) return `${(byteSize / 1024).toFixed(1)} KB`;
  return `${(byteSize / (1024 * 1024)).toFixed(1)} MB`;
}

export function CaptureScreenshots({
  captureId,
  initialAssets,
  storageConfigured,
}: {
  captureId: string;
  initialAssets: ScreenshotAssetView[];
  storageConfigured: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [assets, setAssets] = useState(initialAssets);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const notesDraftRef = useRef<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    startTransition(() => router.refresh());
  }, [router]);

  const uploadFile = useCallback(
    async (file: File) => {
      const clientId = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setUploads((current) => [...current, { clientId, fileName: file.name, progress: 0, error: null }]);

      try {
        if (!(ALLOWED_SCREENSHOT_MIME_TYPES as readonly string[]).includes(file.type)) {
          throw new Error("Only PNG, JPEG, and WebP screenshots are allowed.");
        }
        if (file.size > MAX_SCREENSHOT_BYTES) {
          throw new Error(`File is too large. Maximum size is ${MAX_SCREENSHOT_BYTES / (1024 * 1024)} MB.`);
        }

        const { assetId, uploadUrl } = await createScreenshotUploadAction({
          captureId,
          mimeType: file.type,
          byteSize: file.size,
        });

        await uploadWithProgress(uploadUrl, file, (percent) => {
          setUploads((current) => current.map((item) => (item.clientId === clientId ? { ...item, progress: percent } : item)));
        });

        await completeScreenshotUploadAction({ captureId, assetId });

        setUploads((current) => current.filter((item) => item.clientId !== clientId));
        refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed.";
        setUploads((current) => current.map((item) => (item.clientId === clientId ? { ...item, error: message } : item)));
      }
    },
    [captureId, refresh],
  );

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      Array.from(fileList).forEach((file) => {
        void uploadFile(file);
      });
    },
    [uploadFile],
  );

  const handleDelete = useCallback(
    async (assetId: string) => {
      setAssets((current) => current.filter((asset) => asset.id !== assetId));
      await deleteScreenshotAction({ captureId, assetId });
      refresh();
    },
    [captureId, refresh],
  );

  const handleNoteSave = useCallback(
    async (assetId: string) => {
      const note = notesDraftRef.current[assetId];
      if (note === undefined) return;
      await updateScreenshotNoteAction({ captureId, assetId, note });
      refresh();
    },
    [captureId, refresh],
  );

  const handleTogglePrivate = useCallback(
    async (assetId: string, isPrivate: boolean) => {
      setAssets((current) => current.map((asset) => (asset.id === assetId ? { ...asset, isPrivate } : asset)));
      await toggleScreenshotPrivateAction({ captureId, assetId, isPrivate });
      refresh();
    },
    [captureId, refresh],
  );

  const handleMove = useCallback(
    async (index: number, direction: -1 | 1) => {
      const target = index + direction;
      if (target < 0 || target >= assets.length) return;
      const reordered = [...assets];
      const [item] = reordered.splice(index, 1);
      reordered.splice(target, 0, item);
      setAssets(reordered);
      await reorderScreenshotsAction({ captureId, orderedAssetIds: reordered.map((asset) => asset.id) });
      refresh();
    },
    [assets, captureId, refresh],
  );

  if (!storageConfigured) {
    return (
      <div className="rounded-3xl border border-dashed border-[var(--border-strong)] p-4 text-sm text-[var(--foreground-muted)]">
        Screenshot storage isn&apos;t configured yet. Add the R2 credentials described in <code>.env.example</code> to enable
        uploads.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className="rounded-3xl border border-dashed border-[var(--border-strong)] p-4 text-center text-sm text-[var(--foreground-muted)]"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          handleFiles(event.dataTransfer.files);
        }}
      >
        <p>Drag screenshots here, or</p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-2 rounded-full border border-[var(--border-strong)] px-4 py-2 text-xs font-semibold"
        >
          Choose files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <p className="mt-2 text-xs text-[var(--foreground-subtle)]">PNG, JPEG, or WebP. Up to 10 MB each.</p>
      </div>

      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((upload) => (
            <div key={upload.clientId} className="rounded-2xl border border-[var(--border)] p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="truncate">{upload.fileName}</span>
                <span>{upload.error ? "Failed" : `${upload.progress}%`}</span>
              </div>
              {!upload.error ? (
                <div className="mt-2 h-1.5 rounded-full bg-[var(--surface)]">
                  <div className="h-1.5 rounded-full bg-[var(--accent-strong)] transition-all" style={{ width: `${upload.progress}%` }} />
                </div>
              ) : (
                <p className="mt-1 text-rose-600">{upload.error}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {assets.length === 0 ? (
        <p className="text-sm text-[var(--foreground-muted)]">No screenshots yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset, index) => (
            <div key={asset.id} className="space-y-2 rounded-3xl border border-[var(--border)] p-3">
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-[var(--surface)]">
                {asset.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- direct-to-R2 presigned URL, must not proxy through next/image
                  <img src={asset.previewUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-[var(--foreground-subtle)]">
                    {asset.status === "FAILED" ? "Upload failed" : "Processing…"}
                  </div>
                )}
                {asset.isPrivate && (
                  <span className="absolute left-2 top-2 rounded-full bg-slate-900/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Private
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-[var(--foreground-subtle)]">
                <span>{formatBytes(asset.byteSize)}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleMove(index, -1)}
                    disabled={index === 0}
                    className="rounded-full border border-[var(--border)] px-2 py-1 disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(index, 1)}
                    disabled={index === assets.length - 1}
                    className="rounded-full border border-[var(--border)] px-2 py-1 disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>
              </div>

              <textarea
                defaultValue={asset.note ?? ""}
                placeholder="Add a note…"
                className="app-input min-h-16 text-xs"
                onChange={(event) => {
                  notesDraftRef.current[asset.id] = event.target.value;
                }}
                onBlur={() => handleNoteSave(asset.id)}
              />

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleTogglePrivate(asset.id, !asset.isPrivate)}
                  className="rounded-full border border-[var(--border-strong)] px-3 py-1.5 text-xs font-semibold"
                >
                  {asset.isPrivate ? "Unmark private" : "Mark private"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(asset.id)}
                  className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
