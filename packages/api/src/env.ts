import 'dotenv/config';
import { parseEnv } from 'znv';
import { z } from 'zod';

const DATABASE_NAME = 'megawave.db';

export const { PORT, HOST, PROTOCOL, MUSIC_LIBRARY_PATH, DATABASE_PATH } =
  parseEnv(process.env, {
    PORT: z.number().int().positive().default(5001),
    HOST: z.string().default('0.0.0.0'),
    PROTOCOL: z.enum(['http', 'https']).default('http'),
    MUSIC_LIBRARY_PATH: z.string(),
    DATABASE_PATH: z
      .string()
      .transform((val) => (val.endsWith('/') ? val : `${val}/`))
      .transform((val) => `file:${val}${DATABASE_NAME}`),
  });

const parseBoolean = (value: string | undefined, defaultValue = false) => {
  if (value == null || value === '') {
    return defaultValue;
  }
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

const parseCsv = (value: string | undefined) =>
  (value ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

export const MEGAWAVE_AUTH = parseBoolean(process.env.MEGAWAVE_AUTH);
export const MEGAWAVE_SECRET = process.env.MEGAWAVE_SECRET ?? '';
export const MEGAWAVE_AUTH_SIGNUP = parseBoolean(
  process.env.MEGAWAVE_AUTH_SIGNUP,
  true,
);
export const MEGAWAVE_AUTH_SIGNUP_WHITELIST = parseBoolean(
  process.env.MEGAWAVE_AUTH_SIGNUP_WHITELIST,
);
export const MEGAWAVE_AUTH_SEED_EMAIL = process.env.MEGAWAVE_AUTH_SEED_EMAIL;
export const MEGAWAVE_AUTH_SEED_PASSWORD =
  process.env.MEGAWAVE_AUTH_SEED_PASSWORD;
export const MEGAWAVE_AUTH_SEED_NAME =
  process.env.MEGAWAVE_AUTH_SEED_NAME ?? 'Megawave Admin';
export const MEGAWAVE_AUTH_ADMIN_EMAILS = parseCsv(
  process.env.MEGAWAVE_AUTH_ADMIN_EMAILS,
);

if (MEGAWAVE_AUTH && MEGAWAVE_SECRET.length < 32) {
  throw new Error(
    'MEGAWAVE_SECRET must be at least 32 characters when MEGAWAVE_AUTH=true',
  );
}

export const authEnabled = MEGAWAVE_AUTH && MEGAWAVE_SECRET.length >= 32;
