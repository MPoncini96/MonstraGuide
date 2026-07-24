import { strict as assert } from "node:assert";
import test from "node:test";
import { rankGuideMatches } from "@/lib/assistant/placeholder-assistant";

test("assistant ranking returns published guide matches with step excerpts", () => {
  const results = rankGuideMatches("contractor access", [
    {
      id: "guide-1",
      title: "Add a contractor to the expense platform",
      slug: "add-a-contractor",
      summary: "Provision contractor access safely.",
      prerequisites: [{ text: "Approved request" }],
      commonMistakes: [{ text: "Using a personal email" }],
      steps: [
        { position: 1, title: "Open request", instruction: "Open the approved contractor request.", explanation: null },
        { position: 2, title: "Assign access", instruction: "Assign contractor access and skip reimbursement card setup.", explanation: null },
      ],
    },
    {
      id: "guide-2",
      title: "Archive a completed request",
      slug: "archive-request",
      summary: "Archive the record after completion.",
      prerequisites: [],
      commonMistakes: [],
      steps: [{ position: 1, title: "Archive", instruction: "Archive the request.", explanation: null }],
    },
  ]);

  assert.equal(results.length > 0, true);
  assert.equal(results[0]?.guideId, "guide-1");
  assert.equal(results[0]?.stepNumber, 2);
  assert.match(results[0]?.excerpt ?? "", /Assign contractor access/i);
});

test("assistant ranking returns no results when no approved answer exists", () => {
  const results = rankGuideMatches("unrelated question", []);
  assert.deepEqual(results, []);
});