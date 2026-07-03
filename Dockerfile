# syntax=docker/dockerfile:1

# Use the official Bun image
# See all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1.3.13-alpine AS base
WORKDIR /usr/src/app

# Install dependencies into temp directory
# This will cache them and speed up future builds
FROM base AS install

# Install with --frozen-lockfile for reproducible builds
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Install production dependencies separately
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# Copy node_modules from temp directory
# Then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# Define build arguments for environment variables
ARG VITE_APP_URL
ARG VITE_VAPID_PUBLIC_KEY

# Set environment variables during the build process
ENV VITE_APP_URL=$VITE_APP_URL
ENV VITE_VAPID_PUBLIC_KEY=$VITE_VAPID_PUBLIC_KEY

# Build the application
ENV NODE_ENV=production
RUN bun run build

# Copy production dependencies and built output into final image
FROM base AS release

# Copy production dependencies
COPY --from=install /temp/prod/node_modules node_modules

# Copy package.json for runtime metadata
COPY --from=prerelease /usr/src/app/package.json .

# Copy built application output (Vite generates dist directory)
COPY --from=prerelease /usr/src/app/.output .output

# Copy drizzle migrations folder
COPY --from=prerelease /usr/src/app/drizzle drizzle

# Copy migration script
COPY --from=prerelease /usr/src/app/scripts scripts

# Run the app as non-root user for security
USER bun

# Expose the application port
EXPOSE 3000/tcp

# Health check to ensure the container is healthy
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Run migrations before starting the app
CMD ["sh", "-c", "bun run db:migrate:prod && bun run ./.output/server/index.mjs"]
