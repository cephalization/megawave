#!/usr/bin/env node
import * as p from '@clack/prompts';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateAuthSecret } from './lib/auth-secret.mjs';
import {
  parseBoolean,
  parseCsv,
  readEnvFile,
  readEnvValueMap,
  upsertEnvValues,
  writeEnvFile,
} from './lib/env-file.mjs';

const DEFAULT_SEED_NAME = 'Megawave Admin';
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = resolve(__dirname, '..');
const envPath = resolve(rootDir, '.env');
const envExamplePath = resolve(rootDir, '.env.example');

if (process.argv.includes('--help')) {
  console.log('Usage: pnpm run init');
  console.log('');
  console.log('Interactive Megawave environment setup wizard.');
  process.exit(0);
}

if (!process.stdin.isTTY || !process.stdout.isTTY) {
  console.error('The init wizard requires an interactive terminal.');
  process.exit(1);
}

const sourceContent = readEnvFile(envPath, envExamplePath);
const existingValues = readEnvValueMap(sourceContent);

const existingSecret = existingValues.get('MEGAWAVE_SECRET') ?? '';
const existingSeedPassword =
  existingValues.get('MEGAWAVE_AUTH_SEED_PASSWORD') ?? '';
const existingSeedEmail = existingValues.get('MEGAWAVE_AUTH_SEED_EMAIL') ?? '';
const existingSeedName =
  existingValues.get('MEGAWAVE_AUTH_SEED_NAME') ?? DEFAULT_SEED_NAME;

const initialValues = {
  musicLibraryPath: existingValues.get('MUSIC_LIBRARY_PATH') ?? '',
  databasePath: existingValues.get('DATABASE_PATH') ?? './db',
  authEnabled: parseBoolean(existingValues.get('MEGAWAVE_AUTH'), false),
  secret: existingSecret,
  seedEmail: existingSeedEmail,
  seedPassword: existingSeedPassword,
  seedName: existingSeedName,
  adminEmails: parseCsv(existingValues.get('MEGAWAVE_AUTH_ADMIN_EMAILS')).join(
    ', ',
  ),
  signupEnabled: parseBoolean(existingValues.get('MEGAWAVE_AUTH_SIGNUP'), true),
  whitelistEnabled: parseBoolean(
    existingValues.get('MEGAWAVE_AUTH_SIGNUP_WHITELIST'),
    false,
  ),
};

const state = {
  ...initialValues,
};

const cancelled = (value) => {
  if (!p.isCancel(value)) {
    return false;
  }

  p.cancel('Environment setup cancelled.');
  process.exit(0);
};

function normalizePath(value) {
  return value.trim();
}

function maskValue(value) {
  return value ? '[hidden]' : '[empty]';
}

function emailListHint(value) {
  const count = parseCsv(value).length;
  if (count === 0) {
    return 'none';
  }

  return `${count} configured`;
}

p.intro('Megawave init');
p.log.step(
  sourceContent === readEnvFile(envPath)
    ? 'Updating existing .env in place.'
    : 'Creating .env from .env.example defaults.',
);

state.musicLibraryPath = await p.text({
  message: 'Music library path(s)',
  placeholder: '/path/to/music or /path/a,/path/b',
  initialValue: state.musicLibraryPath,
  validate(value) {
    if (!value.trim()) {
      return 'MUSIC_LIBRARY_PATH is required.';
    }
  },
});
cancelled(state.musicLibraryPath);
state.musicLibraryPath = normalizePath(state.musicLibraryPath);

state.databasePath = await p.text({
  message: 'Database directory',
  placeholder: './db',
  initialValue: state.databasePath,
  validate(value) {
    if (!value.trim()) {
      return 'DATABASE_PATH is required.';
    }
  },
});
cancelled(state.databasePath);
state.databasePath = normalizePath(state.databasePath);

state.authEnabled = await p.confirm({
  message: 'Enable authentication?',
  initialValue: state.authEnabled,
});
cancelled(state.authEnabled);

const secretActionOptions = [];
if (state.secret) {
  secretActionOptions.push({
    value: 'keep',
    label: 'Keep current secret',
    hint: 'stored value stays hidden',
  });
}
secretActionOptions.push(
  { value: 'generate', label: 'Generate secret', hint: 'recommended' },
  { value: 'manual', label: 'Enter secret manually' },
);
if (!state.authEnabled) {
  secretActionOptions.push({ value: 'clear', label: 'Leave secret empty' });
}

const secretAction = await p.select({
  message: 'MEGAWAVE_SECRET',
  options: secretActionOptions,
  initialValue: state.secret
    ? 'keep'
    : state.authEnabled
      ? 'generate'
      : 'clear',
});
cancelled(secretAction);

if (secretAction === 'generate') {
  const spinner = p.spinner();
  spinner.start('Generating Better Auth secret');
  try {
    state.secret = generateAuthSecret();
    spinner.stop('Generated secret');
  } catch (error) {
    spinner.stop('Failed to generate secret');
    throw error;
  }
} else if (secretAction === 'manual') {
  state.secret = await p.password({
    message: 'Enter MEGAWAVE_SECRET',
    mask: '*',
    validate(value) {
      if (!value || value.length < 32) {
        return 'MEGAWAVE_SECRET must be at least 32 characters.';
      }
    },
  });
  cancelled(state.secret);
} else if (secretAction === 'clear') {
  state.secret = '';
}

if (state.authEnabled && state.secret.length < 32) {
  p.log.error(
    'Authentication requires a MEGAWAVE_SECRET with at least 32 characters.',
  );
  process.exit(1);
}

const seedAction = await p.select({
  message: 'Initial admin seed account',
  options: [
    {
      value: 'keep',
      label: 'Keep current values',
      hint: existingSeedEmail ? existingSeedEmail : 'empty',
    },
    { value: 'set', label: 'Set or update seed account' },
    { value: 'clear', label: 'Clear seed account' },
  ],
  initialValue: 'keep',
});
cancelled(seedAction);

if (seedAction === 'set') {
  state.seedEmail = await p.text({
    message: 'MEGAWAVE_AUTH_SEED_EMAIL',
    placeholder: 'admin@example.com',
    initialValue: state.seedEmail,
    validate(value) {
      const trimmed = value.trim();
      if (!trimmed) {
        return 'Enter an email or choose clear instead.';
      }
      if (!trimmed.includes('@')) {
        return 'Enter a valid email address.';
      }
    },
  });
  cancelled(state.seedEmail);
  state.seedEmail = state.seedEmail.trim();

  state.seedName = await p.text({
    message: 'MEGAWAVE_AUTH_SEED_NAME',
    placeholder: DEFAULT_SEED_NAME,
    initialValue: state.seedName || DEFAULT_SEED_NAME,
  });
  cancelled(state.seedName);
  state.seedName = state.seedName.trim() || DEFAULT_SEED_NAME;

  const seedPasswordAction = await p.select({
    message: 'MEGAWAVE_AUTH_SEED_PASSWORD',
    options: state.seedPassword
      ? [
          {
            value: 'keep',
            label: 'Keep current password',
            hint: 'stored value stays hidden',
          },
          { value: 'manual', label: 'Enter new password' },
        ]
      : [{ value: 'manual', label: 'Enter password' }],
    initialValue: state.seedPassword ? 'keep' : 'manual',
  });
  cancelled(seedPasswordAction);

  if (seedPasswordAction === 'manual') {
    state.seedPassword = await p.password({
      message: 'Enter MEGAWAVE_AUTH_SEED_PASSWORD',
      mask: '*',
      validate(value) {
        if (!value || value.length < 8) {
          return 'Seed password must be at least 8 characters.';
        }
      },
    });
    cancelled(state.seedPassword);
  }
} else if (seedAction === 'clear') {
  state.seedEmail = '';
  state.seedPassword = '';
  state.seedName = DEFAULT_SEED_NAME;
}

state.adminEmails = await p.text({
  message: 'MEGAWAVE_AUTH_ADMIN_EMAILS',
  placeholder: 'admin@example.com,other-admin@example.com',
  initialValue: state.adminEmails,
});
cancelled(state.adminEmails);
state.adminEmails = parseCsv(state.adminEmails).join(',');

state.signupEnabled = await p.confirm({
  message: 'Allow public sign-up?',
  initialValue: state.signupEnabled,
});
cancelled(state.signupEnabled);

state.whitelistEnabled = await p.confirm({
  message: 'Require sign-up whitelist approval?',
  initialValue: state.whitelistEnabled,
});
cancelled(state.whitelistEnabled);

p.log.info('Summary');
p.log.message(`MUSIC_LIBRARY_PATH=${state.musicLibraryPath}`);
p.log.message(`DATABASE_PATH=${state.databasePath}`);
p.log.message(`MEGAWAVE_AUTH=${state.authEnabled}`);
p.log.message(`MEGAWAVE_SECRET=${maskValue(state.secret)}`);
p.log.message(`MEGAWAVE_AUTH_SEED_EMAIL=${state.seedEmail || '[empty]'}`);
p.log.message(`MEGAWAVE_AUTH_SEED_PASSWORD=${maskValue(state.seedPassword)}`);
p.log.message(`MEGAWAVE_AUTH_SEED_NAME=${state.seedName || DEFAULT_SEED_NAME}`);
p.log.message(`MEGAWAVE_AUTH_ADMIN_EMAILS=${emailListHint(state.adminEmails)}`);
p.log.message(`MEGAWAVE_AUTH_SIGNUP=${state.signupEnabled}`);
p.log.message(`MEGAWAVE_AUTH_SIGNUP_WHITELIST=${state.whitelistEnabled}`);

const shouldWrite = await p.confirm({
  message: `Write these values to ${envPath}?`,
  initialValue: true,
});
cancelled(shouldWrite);

if (!shouldWrite) {
  p.cancel('No changes were written.');
  process.exit(0);
}

const nextContent = upsertEnvValues(sourceContent, {
  MUSIC_LIBRARY_PATH: state.musicLibraryPath,
  DATABASE_PATH: state.databasePath,
  MEGAWAVE_AUTH: state.authEnabled,
  MEGAWAVE_SECRET: state.secret,
  MEGAWAVE_AUTH_SEED_EMAIL: state.seedEmail,
  MEGAWAVE_AUTH_SEED_PASSWORD: state.seedPassword,
  MEGAWAVE_AUTH_SEED_NAME: state.seedName || DEFAULT_SEED_NAME,
  MEGAWAVE_AUTH_ADMIN_EMAILS: state.adminEmails,
  MEGAWAVE_AUTH_SIGNUP: state.signupEnabled,
  MEGAWAVE_AUTH_SIGNUP_WHITELIST: state.whitelistEnabled,
});

writeEnvFile(envPath, nextContent);

p.outro(`Saved environment config to ${envPath}`);
