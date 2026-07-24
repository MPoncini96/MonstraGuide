import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonProps = {
  href?: string;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  type?: "button" | "submit" | "reset";
};

const buttonStyles = {
  primary:
    "bg-[var(--accent-strong)] text-white shadow-[0_14px_32px_rgba(58,92,255,0.22)] hover:bg-[var(--accent)]",
  secondary:
    "border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-strong)]",
  ghost:
    "text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
};

const baseClassName =
  "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]";

export function Button({
  href,
  children,
  className,
  variant = "primary",
  type = "button",
}: ButtonProps) {
  const styles = cn(baseClassName, buttonStyles[variant], className);

  if (href) {
    return (
      <Link className={styles} href={href}>
        {children}
      </Link>
    );
  }

  return (
    <button className={styles} type={type}>
      {children}
    </button>
  );
}
