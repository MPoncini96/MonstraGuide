import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2Bucket, getR2Client } from "@/lib/storage/r2-client";
import type { ObjectMetadata, ObjectStorage, PutUrlRequest, SignedUrl } from "@/lib/storage/types";

export const PUT_URL_TTL_SECONDS = 5 * 60;
export const GET_URL_TTL_SECONDS = 15 * 60;

function isNotFoundError(error: unknown) {
  const name = (error as { name?: string } | undefined)?.name;
  const status = (error as { $metadata?: { httpStatusCode?: number } } | undefined)?.$metadata?.httpStatusCode;
  return name === "NotFound" || name === "NoSuchKey" || status === 404;
}

export class R2ObjectStorage implements ObjectStorage {
  async createPutUrl({ key, contentType }: PutUrlRequest): Promise<SignedUrl> {
    const client = getR2Client();
    const command = new PutObjectCommand({ Bucket: getR2Bucket(), Key: key, ContentType: contentType });
    const url = await getSignedUrl(client, command, { expiresIn: PUT_URL_TTL_SECONDS });
    return { url, expiresAt: new Date(Date.now() + PUT_URL_TTL_SECONDS * 1000) };
  }

  async createGetUrl(key: string, expiresInSeconds: number = GET_URL_TTL_SECONDS): Promise<SignedUrl> {
    const client = getR2Client();
    const command = new GetObjectCommand({ Bucket: getR2Bucket(), Key: key });
    const url = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
    return { url, expiresAt: new Date(Date.now() + expiresInSeconds * 1000) };
  }

  async headObject(key: string): Promise<ObjectMetadata | null> {
    const client = getR2Client();
    try {
      const result = await client.send(new HeadObjectCommand({ Bucket: getR2Bucket(), Key: key }));
      return {
        size: result.ContentLength ?? 0,
        contentType: result.ContentType ?? null,
        etag: result.ETag ?? null,
      };
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  async deleteObject(key: string): Promise<void> {
    const client = getR2Client();
    await client.send(new DeleteObjectCommand({ Bucket: getR2Bucket(), Key: key }));
  }
}

let cachedStorage: ObjectStorage | null = null;

export function getObjectStorage(): ObjectStorage {
  if (!cachedStorage) {
    cachedStorage = new R2ObjectStorage();
  }
  return cachedStorage;
}
