"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { markCaptureRecordedAction } from "@/lib/app-actions";
import { formatDuration, totalPrivateDurationMs, type PrivateSegment } from "@/lib/capture/recording";
import { cn } from "@/lib/utils";

type Phase = "idle" | "starting" | "recording" | "paused" | "private" | "stopped" | "error";

const PHASE_LABEL: Record<Phase, string> = {
  idle: "Not recording",
  starting: "Requesting screen access…",
  recording: "Recording",
  paused: "Paused",
  private: "Private — not recording",
  stopped: "Stopped",
  error: "Recording error",
};

const PHASE_DOT: Record<Phase, string> = {
  idle: "bg-[var(--foreground-subtle)]",
  starting: "bg-amber-400 animate-pulse",
  recording: "bg-rose-500 animate-pulse",
  paused: "bg-amber-500",
  private: "bg-slate-500",
  stopped: "bg-emerald-500",
  error: "bg-rose-600",
};

const ACTIVE_PHASES: Phase[] = ["recording", "paused", "private"];

function pickMimeType() {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate));
}

export function CaptureRecorder({ captureId }: { captureId: string }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shareLabel, setShareLabel] = useState<string | null>(null);
  const [displaySurface, setDisplaySurface] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [privateSegments, setPrivateSegments] = useState<PrivateSegment[]>([]);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const accumulatedMsRef = useRef(0);
  const segmentStartRef = useRef<number | null>(null);
  const privateStartRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const commitElapsed = useCallback(() => {
    if (segmentStartRef.current !== null) {
      accumulatedMsRef.current += performance.now() - segmentStartRef.current;
      segmentStartRef.current = null;
    }
  }, []);

  const startTicking = useCallback(() => {
    if (tickRef.current) return;
    tickRef.current = setInterval(() => {
      if (segmentStartRef.current !== null) {
        setElapsedMs(accumulatedMsRef.current + (performance.now() - segmentStartRef.current));
      }
    }, 250);
  }, []);

  const stopTicking = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const handleStop = useCallback(async () => {
    setPhase((current) => {
      if (current === "idle" || current === "stopped") return current;

      if (current === "private" && privateStartRef.current !== null) {
        setPrivateSegments((segments) => [
          ...segments,
          { start: privateStartRef.current as number, end: accumulatedMsRef.current },
        ]);
        privateStartRef.current = null;
      }
      commitElapsed();
      stopTicking();
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") recorder.stop();
      stopTracks();
      return "stopped";
    });

    setSaving(true);
    try {
      const formData = new FormData();
      formData.set("captureId", captureId);
      await markCaptureRecordedAction(formData);
    } finally {
      setSaving(false);
    }
  }, [commitElapsed, stopTicking, stopTracks, captureId]);

  const handleStopRef = useRef(handleStop);
  useEffect(() => {
    handleStopRef.current = handleStop;
  }, [handleStop]);

  useEffect(() => stopTracks, [stopTracks]);

  const handleStart = useCallback(async () => {
    setErrorMessage(null);
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setPhase("error");
      setErrorMessage("Screen recording isn't supported in this browser.");
      return;
    }

    setPhase("starting");
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      streamRef.current = stream;
      const [track] = stream.getVideoTracks();
      setShareLabel(track?.label || "Shared screen");
      setDisplaySurface((track?.getSettings() as MediaTrackSettings & { displaySurface?: string })?.displaySurface ?? null);
      track?.addEventListener("ended", () => {
        void handleStopRef.current?.();
      });

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType ?? "video/webm" });
        setRecordingUrl(URL.createObjectURL(blob));
      };
      recorderRef.current = recorder;

      accumulatedMsRef.current = 0;
      setElapsedMs(0);
      setPrivateSegments([]);
      setRecordingUrl(null);
      recorder.start(1000);
      segmentStartRef.current = performance.now();
      startTicking();
      setPhase("recording");
    } catch (error) {
      setPhase("error");
      setErrorMessage(error instanceof Error ? error.message : "Screen sharing was cancelled or denied.");
    }
  }, [startTicking]);

  const handlePauseToggle = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (phase === "recording") {
      commitElapsed();
      stopTicking();
      recorder.pause();
      setPhase("paused");
    } else if (phase === "paused") {
      segmentStartRef.current = performance.now();
      startTicking();
      recorder.resume();
      setPhase("recording");
    }
  }, [phase, commitElapsed, stopTicking, startTicking]);

  const handlePrivateToggle = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (phase === "recording") {
      commitElapsed();
      stopTicking();
      recorder.pause();
      privateStartRef.current = accumulatedMsRef.current;
      setPhase("private");
    } else if (phase === "private") {
      const start = privateStartRef.current ?? accumulatedMsRef.current;
      setPrivateSegments((segments) => [...segments, { start, end: accumulatedMsRef.current }]);
      privateStartRef.current = null;
      segmentStartRef.current = performance.now();
      startTicking();
      recorder.resume();
      setPhase("recording");
    }
  }, [phase, commitElapsed, stopTicking, startTicking]);

  const isActive = ACTIVE_PHASES.includes(phase);

  return (
    <div className="rounded-3xl border border-[var(--border-strong)] p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
        <span className={cn("h-2.5 w-2.5 rounded-full", PHASE_DOT[phase])} aria-hidden />
        {PHASE_LABEL[phase]}
        {isActive && <span className="font-normal text-[var(--foreground-subtle)]">{formatDuration(elapsedMs)}</span>}
      </div>

      {phase === "idle" && (
        <p className="text-xs leading-6 text-[var(--foreground-muted)]">
          You&apos;ll be asked what to share. Choose a specific <strong>Window</strong> or <strong>Tab</strong> rather
          than &quot;Entire screen&quot; to keep other applications out of the recording.
        </p>
      )}

      {shareLabel && (
        <p className="text-xs text-[var(--foreground-muted)]">
          Currently sharing: <span className="font-medium text-[var(--foreground)]">{displaySurface ?? "screen"}</span>
          {" — "}
          {shareLabel}
        </p>
      )}

      {errorMessage && <p className="text-xs text-rose-600">{errorMessage}</p>}

      <div className="flex flex-wrap gap-2">
        {phase === "idle" || phase === "stopped" || phase === "error" ? (
          <button
            type="button"
            onClick={handleStart}
            className="rounded-full bg-[var(--accent-strong)] px-4 py-2 text-xs font-semibold text-white"
          >
            {phase === "stopped" ? "Record again" : "Start recording"}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handlePauseToggle}
              disabled={phase === "private" || phase === "starting"}
              className="rounded-full border border-[var(--border-strong)] px-4 py-2 text-xs font-semibold disabled:opacity-40"
            >
              {phase === "paused" ? "Resume" : "Pause"}
            </button>
            <button
              type="button"
              onClick={handlePrivateToggle}
              disabled={phase === "paused" || phase === "starting"}
              className="rounded-full border border-[var(--border-strong)] px-4 py-2 text-xs font-semibold disabled:opacity-40"
            >
              {phase === "private" ? "End private step" : "Mark private step"}
            </button>
            <button type="button" onClick={handleStop} className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white">
              Stop
            </button>
          </>
        )}
      </div>

      {privateSegments.length > 0 && (
        <p className="text-xs text-[var(--foreground-muted)]">
          {privateSegments.length} private step{privateSegments.length > 1 ? "s" : ""} excluded (
          {formatDuration(totalPrivateDurationMs(privateSegments))} total)
        </p>
      )}

      {phase === "stopped" && recordingUrl && (
        <div className="space-y-3">
          <video src={recordingUrl} controls className="w-full rounded-2xl border border-[var(--border)]" />
          <a
            href={recordingUrl}
            download={`capture-${captureId}.webm`}
            className="inline-flex rounded-full border border-[var(--border-strong)] px-4 py-2 text-xs font-semibold"
          >
            Download recording
          </a>
          <p className="text-xs text-[var(--foreground-subtle)]">
            {saving ? "Saving capture status…" : "Recording kept on this device only — upload storage isn't wired up yet."}
          </p>
        </div>
      )}
    </div>
  );
}
