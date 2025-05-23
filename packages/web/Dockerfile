# Stage 1: Base Node image with pnpm
FROM node:23-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Stage 2: Builder - Builds and deploys the 'web' package
FROM base AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat # Recommended for Turborepo

# Copy the entire monorepo source code
COPY . .

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build the web package and prepare production assets with pnpm deploy
RUN pnpm exec turbo run build --filter=web
RUN pnpm deploy --filter=web --prod=/app/out

# Stage 3: Production environment (Nginx)
FROM nginx:stable-alpine

# Copy the built static assets from the 'builder' stage
COPY --from=builder /app/out/dist /usr/share/nginx/html

# Copy the Nginx configuration file
COPY --from=builder /app/packages/web/nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]