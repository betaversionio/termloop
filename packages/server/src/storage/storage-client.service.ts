import { Injectable, Inject } from "@nestjs/common";
import {
  S3Client,
  ListBucketsCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { Storage } from "@google-cloud/storage";
import { StorageService } from "./storage.service.js";
import type {
  S3StorageCredential,
  GCSStorageCredential,
  StorageCredential,
  StorageCredentialInput,
  BucketInfo,
  BucketObject,
  BucketObjectListing,
  BucketStats,
} from "@termloop/shared";

interface CachedClient {
  client: S3Client | Storage;
  createdAt: number;
}

const CLIENT_TTL = 30 * 60 * 1000; // 30 minutes

@Injectable()
export class StorageClientService {
  private clientCache = new Map<string, CachedClient>();

  constructor(
    @Inject(StorageService) private readonly storageService: StorageService
  ) {}

  private getCredential(credentialId: string): StorageCredential {
    const cred = this.storageService.get(credentialId);
    if (!cred) throw new Error("Storage credential not found");
    return cred;
  }

  private getS3Client(credential: S3StorageCredential): S3Client {
    const cached = this.clientCache.get(credential.id);
    if (cached && Date.now() - cached.createdAt < CLIENT_TTL) {
      return cached.client as S3Client;
    }

    const client = new S3Client({
      endpoint: credential.endpointUrl,
      region: credential.region || "auto",
      credentials: {
        accessKeyId: credential.accessKeyId,
        secretAccessKey: credential.secretAccessKey!,
      },
      forcePathStyle: true,
    });

    this.clientCache.set(credential.id, { client, createdAt: Date.now() });
    return client;
  }

  private getGCSStorage(credential: GCSStorageCredential): Storage {
    const cached = this.clientCache.get(credential.id);
    if (cached && Date.now() - cached.createdAt < CLIENT_TTL) {
      return cached.client as Storage;
    }

    const serviceAccount = JSON.parse(credential.serviceAccountJson!);
    const storage = new Storage({
      projectId: serviceAccount.project_id,
      credentials: serviceAccount,
    });

    this.clientCache.set(credential.id, {
      client: storage,
      createdAt: Date.now(),
    });
    return storage;
  }

  async testDirect(input: StorageCredentialInput): Promise<void> {
    if (input.type === "s3") {
      const client = new S3Client({
        endpoint: input.endpointUrl,
        region: input.region || "auto",
        credentials: {
          accessKeyId: input.accessKeyId,
          secretAccessKey: input.secretAccessKey!,
        },
        forcePathStyle: true,
      });
      try {
        await client.send(new ListBucketsCommand({}));
      } finally {
        client.destroy();
      }
    } else {
      const serviceAccount = JSON.parse(input.serviceAccountJson!);
      const storage = new Storage({
        projectId: serviceAccount.project_id,
        credentials: serviceAccount,
      });
      await storage.getBuckets({ maxResults: 1 });
    }
  }

  async listBuckets(credentialId: string): Promise<BucketInfo[]> {
    const cred = this.getCredential(credentialId);

    if (cred.type === "s3") {
      const client = this.getS3Client(cred);
      const result = await client.send(new ListBucketsCommand({}));
      return (result.Buckets ?? []).map((b) => ({
        name: b.Name!,
        creationDate: b.CreationDate?.toISOString(),
      }));
    }

    const storage = this.getGCSStorage(cred);
    const [buckets] = await storage.getBuckets();
    return buckets.map((b) => ({
      name: b.name,
      creationDate: b.metadata.timeCreated,
    }));
  }

  async listObjects(
    credentialId: string,
    bucket: string,
    prefix?: string,
    continuationToken?: string
  ): Promise<BucketObjectListing> {
    const cred = this.getCredential(credentialId);

    if (cred.type === "s3") {
      return this.listObjectsS3(cred, bucket, prefix, continuationToken);
    }
    return this.listObjectsGCS(cred, bucket, prefix, continuationToken);
  }

  private async listObjectsS3(
    cred: S3StorageCredential,
    bucket: string,
    prefix?: string,
    continuationToken?: string
  ): Promise<BucketObjectListing> {
    const client = this.getS3Client(cred);
    const result = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix || undefined,
        Delimiter: "/",
        MaxKeys: 200,
        ContinuationToken: continuationToken || undefined,
      })
    );

    const objects: BucketObject[] = (result.Contents ?? [])
      .filter((o) => o.Key !== prefix) // Exclude the prefix itself
      .map((o) => ({
        key: o.Key!,
        name: o.Key!.split("/").filter(Boolean).pop()!,
        size: o.Size ?? 0,
        lastModified: o.LastModified?.toISOString() ?? "",
        etag: o.ETag,
        storageClass: o.StorageClass,
        isFolder: false,
      }));

    const folders = (result.CommonPrefixes ?? []).map((p) => p.Prefix!);

    return {
      objects,
      folders,
      isTruncated: result.IsTruncated ?? false,
      nextContinuationToken: result.NextContinuationToken,
    };
  }

  private async listObjectsGCS(
    cred: GCSStorageCredential,
    bucket: string,
    prefix?: string,
    pageToken?: string
  ): Promise<BucketObjectListing> {
    const storage = this.getGCSStorage(cred);
    const [files, , apiResponse] = await storage.bucket(bucket).getFiles({
      prefix: prefix || undefined,
      delimiter: "/",
      maxResults: 200,
      pageToken: pageToken || undefined,
      autoPaginate: false,
    });

    const objects: BucketObject[] = files
      .filter((f) => f.name !== prefix)
      .map((f) => ({
        key: f.name,
        name: f.name.split("/").filter(Boolean).pop()!,
        size: Number(f.metadata.size ?? 0),
        lastModified: f.metadata.updated ?? "",
        etag: f.metadata.etag,
        storageClass: f.metadata.storageClass,
        isFolder: false,
      }));

    const folders = ((apiResponse as any)?.prefixes as string[]) ?? [];

    return {
      objects,
      folders,
      isTruncated: !!(apiResponse as any)?.nextPageToken,
      nextContinuationToken: (apiResponse as any)?.nextPageToken,
    };
  }

  async getPresignedDownloadUrl(
    credentialId: string,
    bucket: string,
    key: string
  ): Promise<string> {
    const cred = this.getCredential(credentialId);

    if (cred.type === "s3") {
      const client = this.getS3Client(cred);
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        ResponseContentDisposition: `attachment; filename="${key.split("/").pop()}"`,
      });
      return getSignedUrl(client, command, { expiresIn: 3600 });
    }

    const storage = this.getGCSStorage(cred);
    const [url] = await storage
      .bucket(bucket)
      .file(key)
      .getSignedUrl({
        action: "read",
        expires: Date.now() + 3600 * 1000,
        responseDisposition: `attachment; filename="${key.split("/").pop()}"`,
      });
    return url;
  }

  async getPresignedViewUrl(
    credentialId: string,
    bucket: string,
    key: string
  ): Promise<string> {
    const cred = this.getCredential(credentialId);

    if (cred.type === "s3") {
      const client = this.getS3Client(cred);
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        ResponseContentDisposition: "inline",
      });
      return getSignedUrl(client, command, { expiresIn: 3600 });
    }

    const storage = this.getGCSStorage(cred);
    const [url] = await storage
      .bucket(bucket)
      .file(key)
      .getSignedUrl({
        action: "read",
        expires: Date.now() + 3600 * 1000,
        responseDisposition: "inline",
      });
    return url;
  }

  async deleteObject(
    credentialId: string,
    bucket: string,
    key: string
  ): Promise<void> {
    const cred = this.getCredential(credentialId);

    if (cred.type === "s3") {
      const client = this.getS3Client(cred);
      await client.send(
        new DeleteObjectCommand({ Bucket: bucket, Key: key })
      );
      return;
    }

    const storage = this.getGCSStorage(cred);
    await storage.bucket(bucket).file(key).delete();
  }

  async deleteObjects(
    credentialId: string,
    bucket: string,
    keys: string[]
  ): Promise<void> {
    const cred = this.getCredential(credentialId);

    if (cred.type === "s3") {
      const client = this.getS3Client(cred);
      await client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: {
            Objects: keys.map((k) => ({ Key: k })),
          },
        })
      );
      return;
    }

    const storage = this.getGCSStorage(cred);
    await Promise.all(
      keys.map((k) => storage.bucket(bucket).file(k).delete())
    );
  }

  async deleteFolder(
    credentialId: string,
    bucket: string,
    prefix: string
  ): Promise<void> {
    const allKeys = await this.listAllKeys(credentialId, bucket, prefix);
    if (allKeys.length === 0) return;

    // Delete in batches of 1000 (S3 limit)
    const batchSize = 1000;
    for (let i = 0; i < allKeys.length; i += batchSize) {
      const batch = allKeys.slice(i, i + batchSize);
      await this.deleteObjects(credentialId, bucket, batch);
    }
  }

  async getObjectBuffer(
    credentialId: string,
    bucket: string,
    key: string
  ): Promise<Buffer> {
    const cred = this.getCredential(credentialId);

    if (cred.type === "s3") {
      const client = this.getS3Client(cred);
      const result = await client.send(
        new GetObjectCommand({ Bucket: bucket, Key: key })
      );
      const stream = result.Body as import("stream").Readable;
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    }

    const storage = this.getGCSStorage(cred);
    const [contents] = await storage.bucket(bucket).file(key).download();
    return contents;
  }

  async listAllKeys(
    credentialId: string,
    bucket: string,
    prefix: string
  ): Promise<string[]> {
    const cred = this.getCredential(credentialId);
    const allKeys: string[] = [];

    if (cred.type === "s3") {
      const client = this.getS3Client(cred);
      let token: string | undefined;
      do {
        const result = await client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: prefix,
            ContinuationToken: token,
          })
        );
        for (const obj of result.Contents ?? []) {
          if (obj.Key) allKeys.push(obj.Key);
        }
        token = result.NextContinuationToken;
      } while (token);
    } else {
      const storage = this.getGCSStorage(cred);
      const [files] = await storage.bucket(bucket).getFiles({ prefix });
      for (const f of files) {
        allKeys.push(f.name);
      }
    }

    return allKeys;
  }

  async uploadObject(
    credentialId: string,
    bucket: string,
    key: string,
    body: Buffer,
    contentType: string
  ): Promise<void> {
    const cred = this.getCredential(credentialId);

    if (cred.type === "s3") {
      const client = this.getS3Client(cred);
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        })
      );
      return;
    }

    const storage = this.getGCSStorage(cred);
    const file = storage.bucket(bucket).file(key);
    await file.save(body, { contentType });
  }

  async getBucketStats(
    credentialId: string,
    bucket: string
  ): Promise<BucketStats> {
    const cred = this.getCredential(credentialId);

    if (cred.type === "s3") {
      return this.getBucketStatsS3(cred, bucket);
    }
    return this.getBucketStatsGCS(cred, bucket);
  }

  private async getBucketStatsS3(
    cred: S3StorageCredential,
    bucket: string
  ): Promise<BucketStats> {
    const client = this.getS3Client(cred);
    let totalObjects = 0;
    let totalSize = 0;
    let token: string | undefined;

    do {
      const result = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          ContinuationToken: token,
        })
      );
      for (const obj of result.Contents ?? []) {
        totalObjects++;
        totalSize += obj.Size ?? 0;
      }
      token = result.NextContinuationToken;
    } while (token);

    return { totalObjects, totalSize };
  }

  private async getBucketStatsGCS(
    cred: GCSStorageCredential,
    bucket: string
  ): Promise<BucketStats> {
    const storage = this.getGCSStorage(cred);
    const [files] = await storage.bucket(bucket).getFiles();
    let totalSize = 0;
    for (const f of files) {
      totalSize += Number(f.metadata.size ?? 0);
    }
    return { totalObjects: files.length, totalSize };
  }
}
