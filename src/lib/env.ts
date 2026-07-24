export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "",
  clerkSecretKey: process.env.CLERK_SECRET_KEY ?? "",
  clerkWebhookSecret: process.env.CLERK_WEBHOOK_SECRET ?? "",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  r2AccountId: process.env.R2_ACCOUNT_ID ?? "",
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  r2Bucket: process.env.R2_BUCKET ?? "",
  r2Region: process.env.R2_REGION ?? "auto",
};

export function isClerkConfigured() {
  return Boolean(env.clerkPublishableKey && env.clerkSecretKey);
}

export function isR2Configured() {
  return Boolean(env.r2AccountId && env.r2AccessKeyId && env.r2SecretAccessKey && env.r2Bucket);
}
