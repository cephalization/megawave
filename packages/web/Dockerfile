# Stage 1: Base Node image with pnpm
FROM node:23-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Stage 2: Builder - Prunes the monorepo for the 'web' package
FROM base AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat # Recommended for Turborepo

# Copy root configuration files necessary for Turborepo and pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
# Copy all package.json files to help turbo map dependencies during prune
COPY packages/*/*.json ./packages/
# If you have root or shared tsconfig.json files that affect the 'web' build or pruning, copy them.
# COPY tsconfig.json ./

# Install all dependencies to enable pruning
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Copy the entire monorepo source code to allow Turborepo to prune
COPY . .

# Prune the monorepo to only include 'web' and its dependencies
RUN pnpm exec turbo prune web

# Stage 3: Installer - Builds the pruned 'web' application
FROM base AS installer
WORKDIR /app
RUN apk add --no-cache libc6-compat # If needed by dependencies

# Copy the pruned package.json files and lockfile from the builder stage
COPY --from=builder /app/out/ .

# Install dependencies for the pruned 'web' application
# Only install production dependencies if your build step doesn't require devDependencies
# For many frontend builds (like Vite), devDependencies are often needed for the build process.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Build the 'web' application
# The build script for 'web' is "vite build" as per its package.json
# Ensure your turbo.json is configured to build 'web' and its dependencies.
RUN pnpm exec turbo run build --filter=web...

# Stage 4: Production environment (Nginx)
FROM nginx:stable-alpine

# Copy the built static assets from the 'installer' stage
# The 'web' package (e.g., Vite) builds into 'packages/web/dist' relative to /app in the installer stage.
# The exact path will be /app/packages/web/dist within the 'out/full' structure from turbo prune.
COPY --from=installer /app/packages/web/dist /usr/share/nginx/html

# Copy the Nginx configuration file
# This path is relative to the monorepo root (the build context)
COPY packages/web/nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]