FROM node:23-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# 1. Builder stage: Prunes the monorepo
FROM base AS builder
WORKDIR /app
# libc6-compat is needed for Turborepo, might be needed for other dependencies
RUN apk add --no-cache libc6-compat

# Copy the rest of the monorepo source for pruning
COPY . .

# Using --frozen-lockfile is good practice for CI/Docker
RUN pnpm install --frozen-lockfile

RUN pnpm exec turbo run build --filter=api
RUN pnpm deploy --filter=api --prod=/app/out

# 2. Runner stage: Final image with only the built 'api' application
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hono

# Copy the built application and necessary node_modules from the installer stage
# The exact path will depend on your 'api' package's build output and turbo prune structure.
# It's typically <WORKDIR>/packages/<packageName>/dist and node_modules.
COPY --from=builder /app/out ./

USER hono
EXPOSE 5001

# The start script in packages/api/package.json is "node dist/index.js"
# This should now be relative to /app/packages/api if turbo prune maintains that structure,
# or just /app/dist if package.json is moved to root of the pruned app.
# Check the output of `turbo prune api --docker` to confirm the final path of package.json and dist.
# Assuming package.json is at /app/ and its start script refers to dist/index.js
CMD ["node", "dist/index.js"]