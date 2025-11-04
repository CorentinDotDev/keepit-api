#!/bin/sh
set -e

echo "[INFO] Waiting for database to be ready..."
sleep 5

echo "[INFO] Running Prisma migrations..."
npx prisma migrate deploy

echo "[INFO] Database ready, starting application..."
exec "$@"
