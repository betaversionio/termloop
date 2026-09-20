import { eq } from 'drizzle-orm';
import type { SSHKey } from '@termloop/shared';
import { sshKeys } from '../schema.js';
import { BaseRepository } from './base.repository.js';

/**
 * Repository for managing SSH keys
 */
export class KeychainRepository extends BaseRepository {
  private rowToSSHKey(row: typeof sshKeys.$inferSelect): SSHKey {
    return {
      ...row,
      keyPath: row.keyPath ?? undefined,
      keyContent: row.keyContent ?? undefined,
      passphrase: row.passphrase ?? undefined,
    };
  }

  findAll(): SSHKey[] {
    const rows = this.db.select().from(sshKeys).all();
    return rows.map((r: typeof sshKeys.$inferSelect) => this.rowToSSHKey(r));
  }

  findById(id: string): SSHKey | undefined {
    const row = this.db
      .select()
      .from(sshKeys)
      .where(eq(sshKeys.id, id))
      .get();
    return row ? this.rowToSSHKey(row) : undefined;
  }

  insert(key: SSHKey): SSHKey {
    this.db
      .insert(sshKeys)
      .values({
        id: key.id,
        name: key.name,
        type: key.type,
        keyPath: key.keyPath ?? null,
        keyContent: key.keyContent ?? null,
        passphrase: key.passphrase ?? null,
        createdAt: key.createdAt,
        updatedAt: key.updatedAt,
      })
      .run();
    this.persistToDisk();
    return key;
  }

  update(id: string, updates: Partial<SSHKey>): SSHKey | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const merged = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.db
      .update(sshKeys)
      .set({
        name: merged.name,
        type: merged.type,
        keyPath: merged.keyPath ?? null,
        keyContent: merged.keyContent ?? null,
        passphrase: merged.passphrase ?? null,
        updatedAt: merged.updatedAt,
      })
      .where(eq(sshKeys.id, id))
      .run();

    this.persistToDisk();
    return merged;
  }

  delete(id: string): boolean {
    const existing = this.findById(id);
    if (!existing) return false;
    this.db.delete(sshKeys).where(eq(sshKeys.id, id)).run();
    this.persistToDisk();
    return true;
  }
}
