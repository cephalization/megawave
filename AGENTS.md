# Project Preferences

- Prefer simple one-command local development, especially `pnpm dev`.
- Prefer simple Docker Compose production deploys, especially `docker compose up`.
- SQLite database files should live in a mounted/persistent database directory, not inside ephemeral containers.
- Drizzle schema is the source of truth for database structure.
- Use Drizzle-generated migrations and Drizzle type-safe queries.
- Do not rely on ad-hoc SQL setup or manual production migration steps when app startup can safely run pending migrations.
