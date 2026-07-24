export const navigation = [
  { href: "/#product", label: "Product" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#privacy", label: "Privacy" },
  { href: "/#use-cases", label: "Use Cases" },
  { href: "/login", label: "Sign In" },
  { href: "/early-access", label: "Request Early Access" },
] as const;

export const processSteps = [
  {
    title: "Record",
    eyebrow: "01",
    description:
      "Capture an approved task with visible start, pause, private, and stop controls.",
    bullets: ["Visible capture state", "Application exclusions", "Private-step controls"],
  },
  {
    title: "Generate",
    eyebrow: "02",
    description:
      "Turn the task into structured instructions, screenshots, warnings, and prerequisites.",
    bullets: ["Numbered instructions", "Annotated screenshots", "Prerequisites and cautions"],
  },
  {
    title: "Review",
    eyebrow: "03",
    description:
      "Remove sensitive details, edit the guide, and approve what becomes shared knowledge.",
    bullets: ["Sensitive screenshot removal", "Reviewer sign-off", "Controlled publication"],
  },
  {
    title: "Train",
    eyebrow: "04",
    description:
      "Let employees search approved procedures and ask grounded follow-up questions.",
    bullets: ["Ask-the-guide assistant", "Related procedures", "Searchable team knowledge"],
  },
] as const;

export const privacyControls = [
  "Visible recording state",
  "Pause and private controls",
  "Application exclusions",
  "Screenshot removal",
  "Restricted-app blocking",
  "Human review before publication",
] as const;

export const useCases = [
  {
    title: "Employee onboarding",
    description: "Turn expert demonstrations into repeatable training for new hires.",
  },
  {
    title: "Customer support",
    description: "Document escalation paths, account workflows, and common exceptions.",
  },
  {
    title: "Finance operations",
    description: "Capture reviewed procedures without exposing restricted data unnecessarily.",
  },
  {
    title: "Insurance operations",
    description: "Preserve claims, underwriting, and servicing workflows across teams.",
  },
  {
    title: "IT procedures",
    description: "Create visual guides for access, configuration, and troubleshooting tasks.",
  },
  {
    title: "Internal software training",
    description: "Teach employees how to use company-specific tools and systems.",
  },
] as const;

export const footerLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "mailto:hello@monstra.guide", label: "Contact" },
] as const;
