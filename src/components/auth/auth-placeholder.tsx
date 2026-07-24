import Link from "next/link";
import { Card } from "@/components/ui/card";

export function AuthPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <Card className="max-w-xl space-y-4">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="text-sm leading-7 text-[var(--foreground-muted)]">{description}</p>
      <p className="text-sm leading-7 text-[var(--foreground-muted)]">
        Add Clerk keys to <code>.env.local</code> using the variables listed in <code>.env.example</code>, then reload the app.
      </p>
      <Link href="/" className="text-sm font-semibold text-[var(--accent-strong)]">
        Return to the marketing site
      </Link>
    </Card>
  );
}
