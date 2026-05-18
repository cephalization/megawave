# ~~ MEGAWAVE ~~

![Home screen image as of 3/16/2022](/images/home.png)

## Development

Development is tested and supported on Linux, Mac OS, and WSL 2.

1. Install dependencies from the root directory:

   ```sh
   pnpm install
   ```

2. Create local environment config:

   ```sh
   pnpm run init
   ```

   `pnpm init` is reserved by pnpm itself, so Megawave's init wizard runs via `pnpm run init` or `pnpm init:env`.
   The wizard is idempotent, updates `.env` in place, lets you skip optional settings, and keeps secret values hidden while prompting.

3. Configure `.env` manually if you prefer:

   ```sh
    MUSIC_LIBRARY_PATH="/path/to/music"
   DATABASE_PATH="./db"
   ```

   `DATABASE_PATH` is a directory. Megawave creates/uses `megawave.db` inside it and runs pending Drizzle migrations automatically on API startup.

4. Optional auth setup:

   ```sh
    pnpm auth:secret
   ```

   This uses the Better Auth CLI secret generator and writes a fresh `MEGAWAVE_SECRET` to `.env`, replacing any previous value. Then enable auth in `.env`:

   ```sh
   MEGAWAVE_AUTH=true
   ```

5. Start the API and web app:

   ```sh
   pnpm dev
   ```

Optional commands:

```sh
pnpm typecheck
pnpm build
pnpm db:generate
pnpm db:clean
```

## Optional Authentication

Authentication is disabled by default. To require sign-in for Megawave routes, set:

```sh
MEGAWAVE_AUTH=true
```

Generate or rotate `MEGAWAVE_SECRET` with:

```sh
pnpm auth:secret
```

The command is idempotent: it creates `.env` if needed and replaces the existing `MEGAWAVE_SECRET` line on every run.

Auth data is stored in the same persistent SQLite database as the library, so users and sessions remain available when auth is turned off and later turned back on.

Optional seed account:

```sh
MEGAWAVE_AUTH_SEED_EMAIL="admin@example.com"
MEGAWAVE_AUTH_SEED_PASSWORD="change-this-password"
MEGAWAVE_AUTH_SEED_NAME="Megawave Admin"
```

Admin page access can also be granted by email with a comma-separated list:

```sh
MEGAWAVE_AUTH_ADMIN_EMAILS="admin@example.com,other-admin@example.com"
```

Optional signup controls:

```sh
MEGAWAVE_AUTH_SIGNUP=true
MEGAWAVE_AUTH_SIGNUP_WHITELIST=false
```

When `MEGAWAVE_AUTH_SIGNUP=false`, public account creation is disabled. When `MEGAWAVE_AUTH_SIGNUP_WHITELIST=true`, new accounts can only be created for email addresses added by an admin in Megawave at `/admin`.

To reset auth for an instance without deleting library data:

```sh
DATABASE_PATH="/path/to/megawave-db" pnpm auth:reset -- --yes
```

This deletes auth users, sessions, accounts, verification records, and signup whitelist entries from the instance database. It does not delete tracks, albums, artists, artwork, or scan history.

## Production

Megawave is designed for a simple Docker Compose deploy with a mounted music library and persistent SQLite database directory.

1. Create environment config:

   ```sh
   pnpm run init
   ```

2. Configure `.env` with host paths:

   ```sh
   MUSIC_LIBRARY_PATH="/path/to/music"
   DATABASE_PATH="/path/to/megawave-db"
   ```

3. Start the stack:

   ```sh
   docker compose up --build -d
   ```

The API container mounts the music library at `/musiclibrary` and the database directory at `/db`. The SQLite file lives at `/db/megawave.db`, and pending Drizzle migrations run automatically on API startup.

Open [localhost](http://localhost) or serve behind a reverse proxy.
