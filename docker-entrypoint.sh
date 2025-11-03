#!/bin/sh
set -e

echo "= Waiting for database to be ready..."
sleep 5

echo "=æ Running Prisma migrations..."
npx prisma migrate deploy

echo " Database ready, starting application..."
exec "$@"
