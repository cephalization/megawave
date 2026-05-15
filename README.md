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
   cp .env.example .env
   ```

3. Configure `.env`:

   ```sh
   MUSIC_LIBRARY_PATH="/path/to/music"
   DATABASE_PATH="./db"
   ```

   `DATABASE_PATH` is a directory. Megawave creates/uses `megawave.db` inside it and runs pending Drizzle migrations automatically on API startup.

4. Start the API and web app:

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

## Production

Megawave is designed for a simple Docker Compose deploy with a mounted music library and persistent SQLite database directory.

1. Create environment config:

   ```sh
   cp .env.example .env
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
