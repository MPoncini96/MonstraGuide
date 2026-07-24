import { strict as assert } from "node:assert";
import test from "node:test";
import { formatDuration, totalPrivateDurationMs } from "@/lib/capture/recording";

test("formatDuration formats seconds under a minute", () => {
  assert.equal(formatDuration(45_000), "0:45");
});

test("formatDuration formats minutes and seconds", () => {
  assert.equal(formatDuration(125_000), "2:05");
});

test("formatDuration formats hours when present", () => {
  assert.equal(formatDuration(3_725_000), "1:02:05");
});

test("formatDuration clamps negative input to zero", () => {
  assert.equal(formatDuration(-500), "0:00");
});

test("totalPrivateDurationMs sums segment durations", () => {
  const total = totalPrivateDurationMs([
    { start: 0, end: 5000 },
    { start: 10000, end: 12000 },
  ]);
  assert.equal(total, 7000);
});

test("totalPrivateDurationMs returns zero for no segments", () => {
  assert.equal(totalPrivateDurationMs([]), 0);
});
