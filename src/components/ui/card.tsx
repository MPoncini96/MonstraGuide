import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_12px_36px_rgba(8,15,35,0.06)] backdrop-blur",
        className,
      )}
    >
      {children}
    </div>
  );
}
