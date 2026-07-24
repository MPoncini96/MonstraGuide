import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { AssistantAnswer } from "@/lib/assistant/types";

export function AssistantPanel({
  answer,
  guideBasePath,
  actionPath,
  query,
}: {
  answer?: AssistantAnswer | null;
  guideBasePath?: string;
  actionPath?: string;
  query?: string;
}) {
  return (
    <Card className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Ask Monstra Guide</h3>
        <p className="text-sm leading-6 text-[var(--foreground-muted)]">
          Phase 1 uses deterministic text matching against approved published guides only.
        </p>
      </div>
      <form action={actionPath ?? ""} className="space-y-3">
        <textarea
          name="q"
          defaultValue={query}
          placeholder="Ask about an approved procedure"
          className="min-h-28 w-full rounded-3xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none focus:border-[var(--accent)]"
        />
        <button type="submit" className="inline-flex rounded-full bg-[var(--accent-strong)] px-4 py-2 text-sm font-semibold text-white">
          Search approved guidance
        </button>
      </form>
      {answer ? (
        <div className="space-y-3 rounded-3xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 text-sm leading-7">
          <p>{answer.message}</p>
          {answer.sources.map((source) => (
            <div key={`${source.guideId}-${source.stepNumber ?? 0}`}>
              <Link
                href={guideBasePath ? `${guideBasePath}/${source.guideSlug}` : `/app/guides/${source.guideId}`}
                className="font-semibold text-[var(--foreground)]"
              >
                {source.guideTitle}
              </Link>
              {source.stepNumber ? `, Step ${source.stepNumber}` : ""}
              <div className="text-[var(--foreground-muted)]">{source.excerpt}</div>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}