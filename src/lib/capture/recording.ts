export type PrivateSegment = { start: number; end: number };

export function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => value.toString().padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

export function totalPrivateDurationMs(segments: PrivateSegment[]) {
  return segments.reduce((total, segment) => total + Math.max(0, segment.end - segment.start), 0);
}
