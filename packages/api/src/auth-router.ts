import { desc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { Context } from 'hono';
import { z } from 'zod';

import * as schema from 'db/schema';
import { validator } from 'hono-openapi/zod';

import {
  authEnabled,
  MEGAWAVE_AUTH_ADMIN_EMAILS,
  MEGAWAVE_AUTH_SIGNUP,
  MEGAWAVE_AUTH_SIGNUP_WHITELIST,
} from './env.js';

const whitelistEmailSchema = z.object({ email: z.string().email() });

async function requireAdmin(c: Context) {
  const auth = c.get('auth');
  if (!auth) {
    return null;
  }

  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session || !isAdminUser(session.user)) {
    return null;
  }

  return session;
}

function isAdminUser(user: { email?: string | null; role?: string | null }) {
  return (
    user.role === 'admin' ||
    (!!user.email &&
      MEGAWAVE_AUTH_ADMIN_EMAILS.includes(user.email.toLowerCase()))
  );
}

export const authSettingsRouter = new Hono().get('/auth-settings', (c) => {
  return c.json({
    enabled: authEnabled,
    signupEnabled: authEnabled && MEGAWAVE_AUTH_SIGNUP,
    signupWhitelistEnabled: authEnabled && MEGAWAVE_AUTH_SIGNUP_WHITELIST,
  });
});

export const authMeRouter = new Hono().get('/me', async (c) => {
  const auth = c.get('auth');
  if (!auth) {
    return c.json({ user: null, isAdmin: false });
  }

  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ user: null, isAdmin: false }, 401);
  }

  return c.json({
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    },
    isAdmin: isAdminUser(session.user),
  });
});

export const authAdminUsersRouter = new Hono()
  .basePath('/admin/users')
  .get('/', async (c) => {
    const session = await requireAdmin(c);
    if (!session) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const db = c.get('db');
    const users = await db
      .select({
        id: schema.user.id,
        name: schema.user.name,
        email: schema.user.email,
        role: schema.user.role,
        createdAt: schema.user.createdAt,
        banned: schema.user.banned,
      })
      .from(schema.user)
      .orderBy(desc(schema.user.createdAt));

    return c.json({
      users: users.map((u) => ({
        ...u,
        isAdmin: isAdminUser(u),
      })),
    });
  });

export const authAdminRouter = new Hono()
  .basePath('/admin/signup-whitelist')
  .get('/', async (c) => {
    const session = await requireAdmin(c);
    if (!session) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const db = c.get('db');
    const entries = await db
      .select()
      .from(schema.authSignupWhitelist)
      .orderBy(schema.authSignupWhitelist.email);

    return c.json({ entries });
  })
  .post('/', validator('json', whitelistEmailSchema), async (c) => {
    const session = await requireAdmin(c);
    if (!session) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const db = c.get('db');
    const body = c.req.valid('json');
    const email = body.email.toLowerCase();
    await db
      .insert(schema.authSignupWhitelist)
      .values({
        email,
        createdBy: session.user.id,
        createdAt: new Date(),
      })
      .onConflictDoNothing({ target: schema.authSignupWhitelist.email });

    return c.json({ email });
  })
  .delete('/:email', validator('param', whitelistEmailSchema), async (c) => {
    const session = await requireAdmin(c);
    if (!session) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const db = c.get('db');
    const { email } = c.req.valid('param');
    await db
      .delete(schema.authSignupWhitelist)
      .where(eq(schema.authSignupWhitelist.email, email.toLowerCase()));

    return c.json({ email: email.toLowerCase() });
  });
