import { eq } from 'drizzle-orm';
import type { StorageCredential } from '@termloop/shared';
import { storageCredentials } from '../schema.js';
import { BaseRepository } from './base.repository.js';

/**
 * Repository for managing storage credentials
 */
export class StorageRepository extends BaseRepository {
  private rowToStorageCredential(
    row: typeof storageCredentials.$inferSelect,
  ): StorageCredential {
    if (row.type === 'gcs') {
      return {
        id: row.id,
        name: row.name,
        type: 'gcs',
        provider: 'gcs',
        serviceAccountJson: row.serviceAccountJson ?? undefined,
        defaultBucket: row.defaultBucket ?? undefined,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    }
    return {
      id: row.id,
      name: row.name,
      type: 's3',
      provider: row.provider as 's3' | 'r2' | 'minio' | 'other',
      endpointUrl: row.endpointUrl ?? '',
      region: row.region ?? '',
      accessKeyId: row.accessKeyId ?? '',
      secretAccessKey: row.secretAccessKey ?? undefined,
      defaultBucket: row.defaultBucket ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  findAll(): StorageCredential[] {
    const rows = this.db.select().from(storageCredentials).all();
    return rows.map((r: typeof storageCredentials.$inferSelect) =>
      this.rowToStorageCredential(r),
    );
  }

  findById(id: string): StorageCredential | undefined {
    const row = this.db
      .select()
      .from(storageCredentials)
      .where(eq(storageCredentials.id, id))
      .get();
    return row ? this.rowToStorageCredential(row) : undefined;
  }

  insert(cred: StorageCredential): StorageCredential {
    this.db
      .insert(storageCredentials)
      .values({
        id: cred.id,
        name: cred.name,
        type: cred.type,
        provider: cred.provider,
        endpointUrl: cred.type === 's3' ? cred.endpointUrl : null,
        region: cred.type === 's3' ? cred.region : null,
        accessKeyId: cred.type === 's3' ? cred.accessKeyId : null,
        secretAccessKey:
          cred.type === 's3' ? cred.secretAccessKey ?? null : null,
        serviceAccountJson:
          cred.type === 'gcs' ? cred.serviceAccountJson ?? null : null,
        defaultBucket: cred.defaultBucket ?? null,
        createdAt: cred.createdAt,
        updatedAt: cred.updatedAt,
      })
      .run();
    this.persistToDisk();
    return cred;
  }

  update(
    id: string,
    updates: Partial<StorageCredential>,
  ): StorageCredential | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const merged = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    } as StorageCredential;

    this.db
      .update(storageCredentials)
      .set({
        name: merged.name,
        type: merged.type,
        provider: merged.provider,
        endpointUrl: merged.type === 's3' ? merged.endpointUrl : null,
        region: merged.type === 's3' ? merged.region : null,
        accessKeyId: merged.type === 's3' ? merged.accessKeyId : null,
        secretAccessKey:
          merged.type === 's3' ? merged.secretAccessKey ?? null : null,
        serviceAccountJson:
          merged.type === 'gcs' ? merged.serviceAccountJson ?? null : null,
        defaultBucket: merged.defaultBucket ?? null,
        updatedAt: merged.updatedAt,
      })
      .where(eq(storageCredentials.id, id))
      .run();

    this.persistToDisk();
    return merged;
  }

  delete(id: string): boolean {
    const existing = this.findById(id);
    if (!existing) return false;
    this.db
      .delete(storageCredentials)
      .where(eq(storageCredentials.id, id))
      .run();
    this.persistToDisk();
    return true;
  }
}
