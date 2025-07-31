import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite', // 'mysql' | 'sqlite' | 'turso'
  // every path below this is relative to the root of the project, not db/
  schema: './packages/db/src/schema.ts',
  out: './packages/db/drizzle',
  dbCredentials: {
    url: `file:${
      process.env.DATABASE_PATH!.endsWith('/')
        ? process.env.DATABASE_PATH!
        : `${process.env.DATABASE_PATH!}/`
    }megawave.db`,
  },
});
