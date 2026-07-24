import { S3Client } from "@aws-sdk/client-s3";
import { env, isR2Configured } from "@/lib/env";

let cachedClient: S3Client | null = null;

export function getR2Client(): S3Client {
  if (!isR2Configured()) {
    throw new Error("R2 storage is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET.");
  }
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: env.r2Region || "auto",
      endpoint: `https://${env.r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.r2AccessKeyId,
        secretAccessKey: env.r2SecretAccessKey,
      },
    });
  }
  return cachedClient;
}

export function getR2Bucket(): string {
  if (!isR2Configured()) {
    throw new Error("R2 storage is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET.");
  }
  return env.r2Bucket;
}
