import { createClient } from '@libsql/client';
import { existsSync } from 'node:fs';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';

import * as schema from './schema.js';

declare global {
  var db: ReturnType<typeof drizzle<typeof schema>>;
}

export const makeDb = (connectionString: string) => {
  if (globalThis.db) {
    return globalThis.db;
  }
  const client = createClient({
    url: connectionString,
  });
  const db = drizzle(client, { schema });
  globalThis.db = db;
  return db;
};

export async function migrateDb(db: DB) {
  const migrationsFolder = [
    './packages/db/drizzle',
    '../db/drizzle',
    './drizzle',
  ].find((folder) => existsSync(`${folder}/meta/_journal.json`));

  if (!migrationsFolder) {
    throw new Error('Unable to locate Drizzle migrations folder');
  }

  await migrate(db, { migrationsFolder });
}

export type DB = ReturnType<typeof makeDb>;
