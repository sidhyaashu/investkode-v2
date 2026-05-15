#!/bin/sh
set -e

echo "Running watchlist_service migrations..."
alembic upgrade head

echo "watchlist_service migrations completed."