# AGENT.md - Development Guide for Megawave

## Build/Lint/Test Commands
- `pnpm dev` - Start development environment (Turbo TUI)
- `pnpm build` - Build all packages
- `pnpm typecheck` - Type check all packages
- `pnpm db:push` - Push database schema changes
- `pnpm db:generate` - Generate database migrations
- `pnpm db:migrate` - Run database migrations

### Package-specific Commands
- Web: `pnpm lint --filter=web` (Prettier check), `pnpm format --filter=web` (Prettier format), `pnpm eslint --filter=web` (ESLint check)
- API: `pnpm dev --filter=api` (watch mode), `pnpm build --filter=api` (TypeScript compile)

## Code Style Guidelines
- pnpm monorepo with pnpm workspaces
- react frontend and hono backend with hono rpc
- TypeScript with strict mode enabled
- ESM modules (type: "module") with .js imports for local files
- Single quotes, trailing commas (Prettier)
- Import order: third-party → ~/ aliases → relative paths
- React with React Compiler plugin enabled
- Use workspace dependencies via workspace:* syntax
- PascalCase for components, camelCase for variables/functions
- Express errors with proper HTTP status codes and structured responses
- import monorepo packages using `name` from `package.json` e.g. `import { makeDb } from 'db';`
