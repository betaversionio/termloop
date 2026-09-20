import { eq, sql } from 'drizzle-orm';
import type { Project } from '@termloop/shared';
import { projects, projectServers, projectStorageCredentials } from '../schema.js';
import { BaseRepository } from './base.repository.js';

/**
 * Repository for managing projects and their associations
 */
export class ProjectRepository extends BaseRepository {
  /**
   * Hydrate project with serverIds and storageCredentialIds from join tables
   */
  private hydrateProject(projectId: string): {
    serverIds: string[];
    storageCredentialIds: string[];
  } {
    // Get all server associations
    const serverRows = this.db
      .select({ serverId: projectServers.serverId })
      .from(projectServers)
      .where(eq(projectServers.projectId, projectId))
      .all();

    // Get all storage credential associations
    const storageRows = this.db
      .select({ credentialId: projectStorageCredentials.credentialId })
      .from(projectStorageCredentials)
      .where(eq(projectStorageCredentials.projectId, projectId))
      .all();

    return {
      serverIds: serverRows.map((r) => r.serverId),
      storageCredentialIds: storageRows.map((r) => r.credentialId),
    };
  }

  private rowToProject(row: typeof projects.$inferSelect): Project {
    const associations = this.hydrateProject(row.id);
    return {
      ...row,
      description: row.description ?? undefined,
      color: row.color ?? undefined,
      serverIds: associations.serverIds,
      storageCredentialIds: associations.storageCredentialIds,
    };
  }

  findAll(): Project[] {
    const rows = this.db.select().from(projects).all();
    return rows.map((r: typeof projects.$inferSelect) =>
      this.rowToProject(r),
    );
  }

  findById(id: string): Project | undefined {
    const row = this.db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .get();
    return row ? this.rowToProject(row) : undefined;
  }

  /**
   * Find all projects that use a specific server
   */
  findByServerId(serverId: string): Project[] {
    const projectIds = this.db
      .select({ projectId: projectServers.projectId })
      .from(projectServers)
      .where(eq(projectServers.serverId, serverId))
      .all()
      .map((r) => r.projectId);

    if (projectIds.length === 0) return [];

    const rows = this.db
      .select()
      .from(projects)
      .where(sql`${projects.id} IN ${projectIds}`)
      .all();

    return rows.map((r) => this.rowToProject(r));
  }

  /**
   * Find all projects that use a specific storage credential
   */
  findByStorageCredentialId(credentialId: string): Project[] {
    const projectIds = this.db
      .select({ projectId: projectStorageCredentials.projectId })
      .from(projectStorageCredentials)
      .where(eq(projectStorageCredentials.credentialId, credentialId))
      .all()
      .map((r) => r.projectId);

    if (projectIds.length === 0) return [];

    const rows = this.db
      .select()
      .from(projects)
      .where(sql`${projects.id} IN ${projectIds}`)
      .all();

    return rows.map((r) => this.rowToProject(r));
  }

  insert(project: Project): Project {
    // Insert project record
    this.db
      .insert(projects)
      .values({
        id: project.id,
        name: project.name,
        description: project.description ?? null,
        color: project.color ?? null,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      })
      .run();

    // Insert server associations
    if (project.serverIds && project.serverIds.length > 0) {
      const uniqueServerIds = [...new Set(project.serverIds)];
      for (const serverId of uniqueServerIds) {
        this.db
          .insert(projectServers)
          .values({
            projectId: project.id,
            serverId,
            createdAt: new Date().toISOString(),
          })
          .run();
      }
    }

    // Insert storage credential associations
    if (
      project.storageCredentialIds &&
      project.storageCredentialIds.length > 0
    ) {
      const uniqueCredentialIds = [...new Set(project.storageCredentialIds)];
      for (const credentialId of uniqueCredentialIds) {
        this.db
          .insert(projectStorageCredentials)
          .values({
            projectId: project.id,
            credentialId,
            createdAt: new Date().toISOString(),
          })
          .run();
      }
    }

    this.persistToDisk();
    return this.findById(project.id)!;
  }

  update(id: string, updates: Partial<Project>): Project | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const merged = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Update project record
    this.db
      .update(projects)
      .set({
        name: merged.name,
        description: merged.description ?? null,
        color: merged.color ?? null,
        updatedAt: merged.updatedAt,
      })
      .where(eq(projects.id, id))
      .run();

    // Update server associations if provided
    if (updates.serverIds !== undefined) {
      this.setProjectServers(id, updates.serverIds);
    }

    // Update storage credential associations if provided
    if (updates.storageCredentialIds !== undefined) {
      this.setProjectStorageCredentials(id, updates.storageCredentialIds);
    }

    this.persistToDisk();
    return this.findById(id) ?? null;
  }

  delete(id: string): boolean {
    const existing = this.findById(id);
    if (!existing) return false;

    // CASCADE DELETE will automatically remove join table entries
    this.db.delete(projects).where(eq(projects.id, id)).run();
    this.persistToDisk();
    return true;
  }

  /**
   * Replace all server associations for a project
   */
  setProjectServers(projectId: string, serverIds: string[]): void {
    // Remove all existing associations
    this.db
      .delete(projectServers)
      .where(eq(projectServers.projectId, projectId))
      .run();

    // Add new associations (deduplicated)
    const uniqueServerIds = [...new Set(serverIds)];
    for (const serverId of uniqueServerIds) {
      this.db
        .insert(projectServers)
        .values({
          projectId,
          serverId,
          createdAt: new Date().toISOString(),
        })
        .run();
    }
  }

  /**
   * Replace all storage credential associations for a project
   */
  setProjectStorageCredentials(
    projectId: string,
    credentialIds: string[],
  ): void {
    // Remove all existing associations
    this.db
      .delete(projectStorageCredentials)
      .where(eq(projectStorageCredentials.projectId, projectId))
      .run();

    // Add new associations (deduplicated)
    const uniqueCredentialIds = [...new Set(credentialIds)];
    for (const credentialId of uniqueCredentialIds) {
      this.db
        .insert(projectStorageCredentials)
        .values({
          projectId,
          credentialId,
          createdAt: new Date().toISOString(),
        })
        .run();
    }
  }

  /**
   * Add servers to a project
   */
  addServersToProject(projectId: string, serverIds: string[]): void {
    const uniqueServerIds = [...new Set(serverIds)];
    for (const serverId of uniqueServerIds) {
      // Use INSERT OR IGNORE to prevent duplicates
      try {
        this.db
          .insert(projectServers)
          .values({
            projectId,
            serverId,
            createdAt: new Date().toISOString(),
          })
          .run();
      } catch {
        // Already exists, ignore
      }
    }
    this.persistToDisk();
  }

  /**
   * Remove servers from a project
   */
  removeServersFromProject(projectId: string, serverIds: string[]): void {
    for (const serverId of serverIds) {
      this.db
        .delete(projectServers)
        .where(
          sql`${projectServers.projectId} = ${projectId} AND ${projectServers.serverId} = ${serverId}`,
        )
        .run();
    }
    this.persistToDisk();
  }

  /**
   * Add storage credentials to a project
   */
  addStorageCredentialsToProject(
    projectId: string,
    credentialIds: string[],
  ): void {
    const uniqueCredentialIds = [...new Set(credentialIds)];
    for (const credentialId of uniqueCredentialIds) {
      // Use INSERT OR IGNORE to prevent duplicates
      try {
        this.db
          .insert(projectStorageCredentials)
          .values({
            projectId,
            credentialId,
            createdAt: new Date().toISOString(),
          })
          .run();
      } catch {
        // Already exists, ignore
      }
    }
    this.persistToDisk();
  }

  /**
   * Remove storage credentials from a project
   */
  removeStorageCredentialsFromProject(
    projectId: string,
    credentialIds: string[],
  ): void {
    for (const credentialId of credentialIds) {
      this.db
        .delete(projectStorageCredentials)
        .where(
          sql`${projectStorageCredentials.projectId} = ${projectId} AND ${projectStorageCredentials.credentialId} = ${credentialId}`,
        )
        .run();
    }
    this.persistToDisk();
  }
}
