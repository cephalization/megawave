import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateAuthSecret } from './lib/auth-secret.mjs';
import { readEnvFile, upsertEnvValues, writeEnvFile } from './lib/env-file.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = resolve(__dirname, '..');
const envPath = resolve(rootDir, '.env');
const envExamplePath = resolve(rootDir, '.env.example');

const secret = generateAuthSecret();
const existing = readEnvFile(envPath, envExamplePath);
const next = upsertEnvValues(existing, { MEGAWAVE_SECRET: secret });

writeEnvFile(envPath, next);
console.log(`Wrote MEGAWAVE_SECRET to ${envPath}`);
