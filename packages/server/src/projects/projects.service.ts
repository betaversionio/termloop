import { Injectable, Inject } from "@nestjs/common";
import { v4 as uuid } from "uuid";
import type { Project, ProjectInput } from "@termloop/shared";
import { StoreService } from "../store/store.service.js";

@Injectable()
export class ProjectsService {
  constructor(
    @Inject(StoreService) private readonly store: StoreService
  ) {}

  list(): Project[] {
    return this.store.projects.findAll();
  }

  get(id: string): Project | undefined {
    return this.store.projects.findById(id);
  }

  create(input: ProjectInput): Project {
    const now = new Date().toISOString();
    const project: Project = {
      ...input,
      id: uuid(),
      createdAt: now,
      updatedAt: now,
    };
    this.store.projects.insert(project);
    return project;
  }

  update(id: string, updates: Partial<Project>): Project | null {
    return this.store.projects.update(id, updates);
  }

  delete(id: string): boolean {
    return this.store.projects.delete(id);
  }

  // New methods for managing associations

  addServers(id: string, serverIds: string[]): Project | null {
    this.store.projects.addServersToProject(id, serverIds);
    return this.store.projects.findById(id) ?? null;
  }

  removeServers(id: string, serverIds: string[]): Project | null {
    this.store.projects.removeServersFromProject(id, serverIds);
    return this.store.projects.findById(id) ?? null;
  }

  addStorageCredentials(id: string, credentialIds: string[]): Project | null {
    this.store.projects.addStorageCredentialsToProject(id, credentialIds);
    return this.store.projects.findById(id) ?? null;
  }

  removeStorageCredentials(
    id: string,
    credentialIds: string[],
  ): Project | null {
    this.store.projects.removeStorageCredentialsFromProject(id, credentialIds);
    return this.store.projects.findById(id) ?? null;
  }

  getByServerId(serverId: string): Project[] {
    return this.store.projects.findByServerId(serverId);
  }

  getByStorageCredentialId(credentialId: string): Project[] {
    return this.store.projects.findByStorageCredentialId(credentialId);
  }
}
