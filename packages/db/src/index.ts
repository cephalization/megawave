import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

declare global {
  var db: ReturnType<typeof drizzle>;
}

export const makeDb = (connectionString: string) => {
  if (globalThis.db) {
    return globalThis.db;
  }
  const client = createClient({
    url: connectionString,
  });
  const db = drizzle(client);
  globalThis.db = db;
  return db;
};

export type DB = ReturnType<typeof makeDb>;
