import 'dotenv/config';

import { makeDb, migrateDb } from '../index.js';
import {
  account,
  authSignupWhitelist,
  session,
  user,
  verification,
} from '../schema.js';

function getArgValue(name: string) {
  const prefix = `${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) {
    return inline.slice(prefix.length);
  }

  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function makeConnectionString(databasePath: string) {
  if (databasePath.startsWith('file:')) {
    return databasePath;
  }

  const normalized = databasePath.endsWith('/')
    ? databasePath
    : `${databasePath}/`;
  return `file:${normalized}megawave.db`;
}

const databasePath =
  getArgValue('--database-path') ?? process.env.DATABASE_PATH;
const confirmed = process.argv.includes('--yes');

if (!databasePath) {
  console.error(
    'Missing DATABASE_PATH. Pass --database-path <dir-or-file-url> or set DATABASE_PATH.',
  );
  process.exit(1);
}

if (!confirmed) {
  console.error(
    'This deletes Megawave auth users, sessions, accounts, verification records, and signup whitelist entries. Re-run with --yes to confirm.',
  );
  process.exit(1);
}

const db = makeDb(makeConnectionString(databasePath));
await migrateDb(db);

await db.delete(session);
await db.delete(account);
await db.delete(verification);
await db.delete(authSignupWhitelist);
await db.delete(user);

console.log(`Reset auth data in ${databasePath}`);
