import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 340 64"
      role="img"
      aria-label="Monstra.Guide"
      className={cn("h-9 w-auto", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="brand-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1A2442" />
          <stop offset="100%" stopColor="#2F4CEB" />
        </linearGradient>
        <linearGradient id="brand-accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#BFD0FF" />
          <stop offset="100%" stopColor="#F6F8FF" />
        </linearGradient>
      </defs>

      <rect x="2" y="4" width="52" height="52" rx="16" fill="url(#brand-bg)" />
      <path
        d="M16 40V20h6.5l6.5 10 6.5-10H42v20h-4.75V27.9l-6.9 10.35h-2.7L20.75 27.9V40H16Z"
        fill="url(#brand-accent)"
      />
      <circle cx="41.5" cy="18.5" r="3" fill="#7D91FF" />

      <text
        x="70"
        y="30"
        fill="currentColor"
        fontSize="24"
        fontWeight="700"
        fontFamily="'Plus Jakarta Sans', Arial, sans-serif"
        letterSpacing="-0.04em"
      >
        Monstra
      </text>
      <text
        x="168"
        y="30"
        fill="#7D91FF"
        fontSize="24"
        fontWeight="700"
        fontFamily="'Plus Jakarta Sans', Arial, sans-serif"
        letterSpacing="-0.04em"
      >
        .Guide
      </text>
      <text
        x="70"
        y="48"
        fill="#7F8BA0"
        fontSize="9"
        fontWeight="600"
        fontFamily="'Plus Jakarta Sans', Arial, sans-serif"
        letterSpacing="0.26em"
      >
        WORKFLOW-LEARNING AND TRAINING PLATFORM
      </text>
    </svg>
  );
}

