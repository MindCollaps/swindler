#!/bin/sh
set -e

echo "Running database migrations..."
prisma migrate deploy

echo "Starting application..."
node .output/server/index.mjs
