import { Injectable, Inject } from "@nestjs/common";
import { v4 as uuid } from "uuid";
import type { StorageCredential, StorageCredentialInput } from "@termloop/shared";
import { StoreService } from "../store/store.service.js";

@Injectable()
export class StorageService {
  constructor(
    @Inject(StoreService) private readonly store: StoreService
  ) {}

  list(): StorageCredential[] {
    return this.store.storage.findAll().map((c) => {
      if (c.type === 'gcs') {
        return { ...c, serviceAccountJson: undefined };
      }
      return { ...c, secretAccessKey: undefined };
    });
  }

  get(id: string): StorageCredential | undefined {
    return this.store.storage.findById(id);
  }

  create(input: StorageCredentialInput): StorageCredential {
    const now = new Date().toISOString();
    const cred = {
      ...input,
      id: uuid(),
      createdAt: now,
      updatedAt: now,
    } as StorageCredential;
    this.store.storage.insert(cred);
    return cred;
  }

  update(
    id: string,
    updates: Partial<StorageCredential>,
  ): StorageCredential | null {
    return this.store.storage.update(id, updates);
  }

  delete(id: string): boolean {
    return this.store.storage.delete(id);
  }
}
