# Base image for Node.js
FROM node:18-alpine AS base

FROM base AS builder

RUN apk update && apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

# Builder stage
FROM base AS builder

RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=api --docker

# Installer stage
FROM base AS installer
WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# Build stage
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json
RUN pnpm turbo run build --filter=api...

# Runner stage
FROM node:18-alpine AS runner
WORKDIR /app

# Add non-root user
RUN addgroup --system --gid 1001 nestjs
RUN adduser --system --uid 1001 nestjs
USER nestjs

# Copy the built app
COPY --from=installer /app/apps/api/dist ./dist
COPY --from=installer /app/apps/api/package.json ./package.json

# Install production dependencies
RUN pnpm install --prod --frozen-lockfile

# Set environment variables if needed
# ENV NODE_ENV production

CMD ["node", "dist/main.js"]
