import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { Scalar } from '@scalar/hono-api-reference';
import { makeDb, migrateDb } from 'db';
import { openAPISpecs } from 'hono-openapi';

import {
  authAdminRouter,
  authAdminUsersRouter,
  authMeRouter,
  authSettingsRouter,
} from './auth-router.js';
import { makeAuth, seedInitialAccount, type MegawaveAuth } from './auth.js';
import {
  HOST,
  MUSIC_LIBRARY_PATH,
  PORT,
  DATABASE_PATH,
  authEnabled,
} from './env.js';
import { Library } from './library.js';
import {
  albumsRouter,
  artRouter,
  artistsRouter,
  rescanRouter,
  statusRouter,
  songsRouter,
} from './router.js';
import { getServerUrl } from './util.js';

declare module 'hono' {
  interface ContextVariableMap {
    library: Library;
    db: ReturnType<typeof makeDb>;
    musicLibraryPaths: string[];
    auth: MegawaveAuth | null;
  }
}

const db = makeDb(DATABASE_PATH);
await migrateDb(db);
const auth = authEnabled ? makeAuth(db) : null;
if (auth) {
  await seedInitialAccount(auth, db);
}
const library = new Library(db);
const musicLibraryPaths = MUSIC_LIBRARY_PATH.split(',');

const app = new Hono().basePath('/api');
app.use(cors());
app.use(logger());
if (auth) {
  app.on(['GET', 'POST'], '/auth/*', (c) => auth.handler(c.req.raw));
}
app.use(async (c, next) => {
  c.set('library', library);
  c.set('db', db);
  c.set('musicLibraryPaths', musicLibraryPaths);
  c.set('auth', auth);
  await next();
});
app.route('/', authSettingsRouter);
app.use(async (c, next) => {
  if (!auth) {
    await next();
    return;
  }

  const pathname = new URL(c.req.url).pathname;
  if (pathname === '/api/health' || pathname === '/api/auth-settings') {
    await next();
    return;
  }

  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  await next();
});
app.route('/', authMeRouter);
app.route('/', authAdminRouter);
app.route('/', authAdminUsersRouter);

// chain new routers to the end of this for proper type inference
const libraryRouter = new Hono().basePath('/library');
const router = app.route(
  '/',
  libraryRouter
    .route('/', statusRouter)
    .route('/', rescanRouter)
    .route('/', albumsRouter)
    .route('/', artistsRouter)
    .route('/', songsRouter)
    .route('/', artRouter),
);

export type AppType = typeof router;

app.get(
  '/openapi',
  openAPISpecs(app, {
    documentation: {
      info: {
        title: 'Megawave API',
        version: '1.0.0',
        description: 'Search and stream music',
      },
      servers: [
        { url: getServerUrl().toString(), description: 'Local Server' },
      ],
    },
  }),
);

app.get('/docs', Scalar({ url: 'openapi', theme: 'saturn' }));

app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

serve(
  {
    fetch: app.fetch,
    port: PORT,
    hostname: HOST,
  },
  (info) => {
    console.log('');
    console.log(`Server:              ${getServerUrl('/api')}`);
    console.log(`API Reference:       ${getServerUrl('/api/docs')}`);
    console.log(`OpenAPI Schema:      ${getServerUrl('/api/openapi')}`);
    console.log('');
    void library.initialize(musicLibraryPaths);
  },
);
