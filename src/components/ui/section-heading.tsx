import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  badge: string;
  title: string;
  description: string;
  level?: "h1" | "h2";
  className?: string;
};

export function SectionHeading({
  badge,
  title,
  description,
  level = "h2",
  className,
}: SectionHeadingProps) {
  const HeadingTag = level;

  return (
    <div className={cn("max-w-3xl space-y-4", className)}>
      <Badge>{badge}</Badge>
      <div className="space-y-3">
        <HeadingTag className="text-balance text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl lg:text-[2.85rem]">
          {title}
        </HeadingTag>
        <p className="max-w-2xl text-base leading-7 text-[var(--foreground-muted)] sm:text-lg">
          {description}
        </p>
      </div>
    </div>
  );
}
