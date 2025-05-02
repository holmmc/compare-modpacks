# Use official Bun image
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# Install all dependencies (including devDependencies) for building
FROM base AS builder
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# Create production image with only runtime dependencies
FROM base AS production
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/server ./server

# Run the app
EXPOSE 3000
CMD ["bun", "run", "serve"]