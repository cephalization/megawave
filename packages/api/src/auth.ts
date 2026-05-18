import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { betterAuth, APIError } from 'better-auth';
import { admin } from 'better-auth/plugins';
import { eq } from 'drizzle-orm';

import type { DB } from 'db';
import * as schema from 'db/schema';

import {
  MEGAWAVE_AUTH_SEED_EMAIL,
  MEGAWAVE_AUTH_SEED_NAME,
  MEGAWAVE_AUTH_SEED_PASSWORD,
  MEGAWAVE_AUTH_SIGNUP,
  MEGAWAVE_AUTH_SIGNUP_WHITELIST,
  MEGAWAVE_SECRET,
  PROTOCOL,
} from './env.js';
import { getServerUrl } from './util.js';

export function makeAuth(db: DB) {
  return betterAuth({
    appName: 'Megawave',
    baseURL: getServerUrl('/api/auth').toString(),
    secret: MEGAWAVE_SECRET,
    trustedOrigins: [
      getServerUrl().origin,
      `${PROTOCOL}://localhost:5173`,
      `${PROTOCOL}://localhost:5174`,
    ],
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema,
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: !MEGAWAVE_AUTH_SIGNUP,
      minPasswordLength: 8,
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user, ctx) => {
            if (
              !MEGAWAVE_AUTH_SIGNUP_WHITELIST ||
              ctx?.path !== '/sign-up/email'
            ) {
              return { data: user };
            }

            const email = user.email.toLowerCase();
            const [allowed] = await db
              .select()
              .from(schema.authSignupWhitelist)
              .where(eq(schema.authSignupWhitelist.email, email))
              .limit(1);

            if (!allowed) {
              throw new APIError('FORBIDDEN', {
                message: 'This email is not allowed to create an account.',
              });
            }

            return { data: { ...user, email } };
          },
        },
      },
    },
    plugins: [admin()],
  });
}

export type MegawaveAuth = ReturnType<typeof makeAuth>;

export async function seedInitialAccount(auth: MegawaveAuth, db: DB) {
  if (!MEGAWAVE_AUTH_SEED_EMAIL || !MEGAWAVE_AUTH_SEED_PASSWORD) {
    return;
  }

  const email = MEGAWAVE_AUTH_SEED_EMAIL.toLowerCase();
  const [existingUser] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.email, email))
    .limit(1);

  if (existingUser) {
    if (existingUser.role !== 'admin') {
      await db
        .update(schema.user)
        .set({ role: 'admin', updatedAt: new Date() })
        .where(eq(schema.user.id, existingUser.id));
    }
    return;
  }

  await auth.api.createUser({
    body: {
      email,
      password: MEGAWAVE_AUTH_SEED_PASSWORD,
      name: MEGAWAVE_AUTH_SEED_NAME,
      role: 'admin',
    },
  });
}

export async function getSession(auth: MegawaveAuth, headers: Headers) {
  return auth.api.getSession({ headers });
}
