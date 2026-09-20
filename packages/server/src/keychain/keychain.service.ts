import { Injectable, Inject } from "@nestjs/common";
import { v4 as uuid } from "uuid";
import type { SSHKey, SSHKeyInput } from "@termloop/shared";
import { StoreService } from "../store/store.service.js";

@Injectable()
export class KeychainService {
  constructor(
    @Inject(StoreService) private readonly store: StoreService
  ) {}

  list(): SSHKey[] {
    return this.store.keychain.findAll().map((k) => ({
      ...k,
      keyContent: undefined,
      passphrase: undefined,
    }));
  }

  get(id: string): SSHKey | undefined {
    return this.store.keychain.findById(id);
  }

  getFull(id: string): SSHKey | undefined {
    return this.store.keychain.findById(id);
  }

  create(input: SSHKeyInput): SSHKey {
    const now = new Date().toISOString();
    const key: SSHKey = {
      ...input,
      id: uuid(),
      createdAt: now,
      updatedAt: now,
    };
    this.store.keychain.insert(key);
    return key;
  }

  update(id: string, updates: Partial<SSHKey>): SSHKey | null {
    return this.store.keychain.update(id, updates);
  }

  delete(id: string): boolean {
    return this.store.keychain.delete(id);
  }
}
