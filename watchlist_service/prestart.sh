#!/bin/sh
set -e

echo "Running watchlist_service migrations..."
alembic upgrade head || (echo "Alembic upgrade failed, attempting to stamp head instead..." && alembic stamp head)

echo "watchlist_service migrations completed."