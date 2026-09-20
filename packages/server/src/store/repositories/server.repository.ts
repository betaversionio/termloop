import { eq } from 'drizzle-orm';
import type { ServerConnection, ServerSystemInfo } from '@termloop/shared';
import { connections } from '../schema.js';
import { BaseRepository } from './base.repository.js';

/**
 * Repository for managing server connections
 */
export class ServerRepository extends BaseRepository {
  private rowToConnection(
    row: typeof connections.$inferSelect,
  ): ServerConnection {
    return {
      ...row,
      password: row.password ?? undefined,
      privateKey: row.privateKey ?? undefined,
      passphrase: row.passphrase ?? undefined,
      keychainKeyId: row.keychainKeyId ?? undefined,
      color: row.color ?? undefined,
      tags: row.tags ?? undefined,
      systemInfo: row.systemInfo ? JSON.parse(row.systemInfo) : undefined,
    };
  }

  findAll(): ServerConnection[] {
    const rows = this.db.select().from(connections).all();
    return rows.map((r: typeof connections.$inferSelect) =>
      this.rowToConnection(r),
    );
  }

  findById(id: string): ServerConnection | undefined {
    const row = this.db
      .select()
      .from(connections)
      .where(eq(connections.id, id))
      .get();
    return row ? this.rowToConnection(row) : undefined;
  }

  insert(connection: ServerConnection): ServerConnection {
    this.db
      .insert(connections)
      .values({
        id: connection.id,
        name: connection.name,
        host: connection.host,
        port: connection.port,
        username: connection.username,
        authMethod: connection.authMethod,
        password: connection.password ?? null,
        privateKey: connection.privateKey ?? null,
        passphrase: connection.passphrase ?? null,
        keychainKeyId: connection.keychainKeyId ?? null,
        color: connection.color ?? null,
        tags: connection.tags ?? null,
        createdAt: connection.createdAt,
        updatedAt: connection.updatedAt,
      })
      .run();
    this.persistToDisk();
    return connection;
  }

  update(
    id: string,
    updates: Partial<ServerConnection>,
  ): ServerConnection | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const merged = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.db
      .update(connections)
      .set({
        name: merged.name,
        host: merged.host,
        port: merged.port,
        username: merged.username,
        authMethod: merged.authMethod,
        password: merged.password ?? null,
        privateKey: merged.privateKey ?? null,
        passphrase: merged.passphrase ?? null,
        keychainKeyId: merged.keychainKeyId ?? null,
        color: merged.color ?? null,
        tags: merged.tags ?? null,
        updatedAt: merged.updatedAt,
      })
      .where(eq(connections.id, id))
      .run();

    this.persistToDisk();
    return merged;
  }

  delete(id: string): boolean {
    const existing = this.findById(id);
    if (!existing) return false;
    this.db.delete(connections).where(eq(connections.id, id)).run();
    this.persistToDisk();
    return true;
  }

  updateSystemInfo(id: string, info: ServerSystemInfo): void {
    this.db
      .update(connections)
      .set({ systemInfo: JSON.stringify(info) })
      .where(eq(connections.id, id))
      .run();
    this.persistToDisk();
  }
}
