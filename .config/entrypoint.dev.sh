#!/bin/sh
set -e

echo "Running database migrations..."
bun install
bun run prisma generate
bun run prisma migrate deploy

echo "Starting application..."
bun dev:local
