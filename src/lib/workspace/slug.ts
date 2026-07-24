const RESERVED_SLUGS = new Set([
  "app",
  "api",
  "login",
  "sign-up",
  "privacy",
  "terms",
  "admin",
  "settings",
  "guides",
]);

export function slugifyWorkspaceName(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function isReservedWorkspaceSlug(slug: string) {
  return RESERVED_SLUGS.has(slug);
}

export async function generateUniqueWorkspaceSlug(
  rawInput: string,
  exists: (slug: string) => Promise<boolean>,
) {
  const base = slugifyWorkspaceName(rawInput) || "workspace";
  const safeBase = isReservedWorkspaceSlug(base) ? `${base}-team` : base;
  let candidate = safeBase;
  let suffix = 1;
  while (await exists(candidate)) {
    suffix += 1;
    candidate = `${safeBase}-${suffix}`;
  }
  return candidate;
}
