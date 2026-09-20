import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import fs from 'fs';
import path from 'path';
import os from 'os';
import initSqlJs from 'sql.js';
import { drizzle, type SQLJsDatabase } from 'drizzle-orm/sql-js';
import * as schema from './schema.js';
import { ServerRepository } from './repositories/server.repository.js';
import { KeychainRepository } from './repositories/keychain.repository.js';
import { StorageRepository } from './repositories/storage.repository.js';
import { ProjectRepository } from './repositories/project.repository.js';

const DATA_DIR = path.join(os.homedir(), '.termloop');
const DB_FILE = path.join(DATA_DIR, 'data.db');

@Injectable()
export class StoreService implements OnModuleInit {
  private readonly logger = new Logger(StoreService.name);
  private db!: SQLJsDatabase<typeof schema>;
  private sqlite!: InstanceType<
    Awaited<ReturnType<typeof initSqlJs>>['Database']
  >;

  // Repository instances
  public servers!: ServerRepository;
  public keychain!: KeychainRepository;
  public storage!: StorageRepository;
  public projects!: ProjectRepository;

  async onModuleInit() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const SQL = await initSqlJs();

    if (fs.existsSync(DB_FILE)) {
      const fileBuffer = fs.readFileSync(DB_FILE);
      this.sqlite = new SQL.Database(fileBuffer);
    } else {
      this.sqlite = new SQL.Database();
    }

    this.db = drizzle(this.sqlite, { schema });

    // Enable foreign keys (required for CASCADE DELETE)
    this.sqlite.run('PRAGMA foreign_keys = ON');

    // Create tables
    this.sqlite.run(`
      CREATE TABLE IF NOT EXISTS connections (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        host TEXT NOT NULL,
        port INTEGER NOT NULL DEFAULT 22,
        username TEXT NOT NULL,
        authMethod TEXT NOT NULL CHECK(authMethod IN ('password', 'key')),
        password TEXT,
        privateKey TEXT,
        passphrase TEXT,
        keychainKeyId TEXT,
        color TEXT,
        tags TEXT,
        systemInfo TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    this.sqlite.run(`
      CREATE TABLE IF NOT EXISTS sshKeys (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('path', 'text')),
        keyPath TEXT,
        keyContent TEXT,
        passphrase TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    this.sqlite.run(`
      CREATE TABLE IF NOT EXISTS storageCredentials (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('s3', 'gcs')),
        provider TEXT NOT NULL,
        endpointUrl TEXT,
        region TEXT,
        accessKeyId TEXT,
        secretAccessKey TEXT,
        serviceAccountJson TEXT,
        defaultBucket TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    this.sqlite.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    this.sqlite.run(`
      CREATE TABLE IF NOT EXISTS projectServers (
        projectId TEXT NOT NULL,
        serverId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        PRIMARY KEY (projectId, serverId),
        FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (serverId) REFERENCES connections(id) ON DELETE CASCADE
      )
    `);

    this.sqlite.run(`
      CREATE TABLE IF NOT EXISTS projectStorageCredentials (
        projectId TEXT NOT NULL,
        credentialId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        PRIMARY KEY (projectId, credentialId),
        FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (credentialId) REFERENCES storageCredentials(id) ON DELETE CASCADE
      )
    `);

    // Initialize repositories
    this.servers = new ServerRepository(this.db, this.persistToDisk.bind(this));
    this.keychain = new KeychainRepository(
      this.db,
      this.persistToDisk.bind(this),
    );
    this.storage = new StorageRepository(
      this.db,
      this.persistToDisk.bind(this),
    );
    this.projects = new ProjectRepository(
      this.db,
      this.persistToDisk.bind(this),
    );

    this.persistToDisk();
    this.logger.log('Database initialized with repository pattern');
  }

  private persistToDisk() {
    const data = this.sqlite.export();
    fs.writeFileSync(DB_FILE, Buffer.from(data));
  }
}
