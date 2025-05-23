import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

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
