export type PutUrlRequest = {
  key: string;
  contentType: string;
};

export type SignedUrl = {
  url: string;
  expiresAt: Date;
};

export type ObjectMetadata = {
  size: number;
  contentType: string | null;
  etag: string | null;
};

export interface ObjectStorage {
  createPutUrl(request: PutUrlRequest): Promise<SignedUrl>;
  createGetUrl(key: string, expiresInSeconds?: number): Promise<SignedUrl>;
  headObject(key: string): Promise<ObjectMetadata | null>;
  deleteObject(key: string): Promise<void>;
}
