#!/bin/bash
# ==============================================================================
# Production Deploy Script (runs ON the server via SSH)
#
# The new build already landed at "$DEPLOY_DIR.incoming" (rsynced by the
# workflow). This script swaps it into place, runs pending Prisma migrations
# against the local Postgres using the pre-resolved prisma-toolkit (no install
# on server), restarts the app via Passenger's tmp/restart.txt convention,
# health-checks it, and rolls back on any failure.
#
# Never touches public/uploads/ (local file storage) or .env (managed
# manually on the server) -- both are carried forward untouched on every
# swap. Never runs npm install/build either -- both already happened in CI.
#
# Args: $1 = DEPLOY_DIR   $2 = APP_URL
# ==============================================================================

set -Eeuo pipefail

DEPLOY_DIR="$1"
APP_URL="$2"
INCOMING_DIR="${DEPLOY_DIR}.incoming"
BACKUP_DIR="${DEPLOY_DIR}.backup"

if [ ! -d "$INCOMING_DIR" ]; then
  echo "::error::$INCOMING_DIR not found -- rsync step must run first"
  exit 1
fi

restart_app() {
  mkdir -p "$DEPLOY_DIR/tmp"
  touch "$DEPLOY_DIR/tmp/restart.txt"
}

healthcheck() {
  for i in 1 2 3 4 5 6; do
    if curl -fsS -o /dev/null -m 10 "$APP_URL"; then
      return 0
    fi
    echo "Healthcheck attempt $i failed, retrying in 5s..."
    sleep 5
  done
  return 1
}

find_node() {
  if command -v node >/dev/null 2>&1; then
    command -v node
    return
  fi
  # Non-interactive SSH sessions don't source nvm -- fall back to the newest
  # nvm-installed version directly.
  local candidate
  candidate=$(ls -d "$HOME"/.nvm/versions/node/*/bin/node 2>/dev/null | sort -V | tail -1)
  if [ -n "$candidate" ]; then
    echo "$candidate"
    return 0
  fi
  return 1
}

run_migrations() {
  local node_bin
  node_bin=$(find_node) || { echo "::error::no node binary found (checked PATH and ~/.nvm)"; return 1; }
  ( set -a; source "$DEPLOY_DIR/.env"; set +a
    cd "$DEPLOY_DIR/prisma-toolkit"
    # Invoke the real entry point, not node_modules/.bin/prisma -- that's a
    # symlink, and actions/upload-artifact's zip round-trip drops symlinks.
    "$node_bin" node_modules/prisma/build/index.js migrate deploy )
}

rollback() {
  echo "::error::$1. Rolling back..."
  if [ -d "$BACKUP_DIR" ]; then
    UPLOADS_TMP=$(mktemp -d)
    if [ -d "$DEPLOY_DIR/public/uploads" ]; then
      mv "$DEPLOY_DIR/public/uploads" "$UPLOADS_TMP/uploads"
    fi
    rm -rf "$DEPLOY_DIR"
    mv "$BACKUP_DIR" "$DEPLOY_DIR"
    if [ -d "$UPLOADS_TMP/uploads" ]; then
      rm -rf "$DEPLOY_DIR/public/uploads"
      mv "$UPLOADS_TMP/uploads" "$DEPLOY_DIR/public/uploads"
    fi
    rm -rf "$UPLOADS_TMP"
    restart_app
  fi
  exit 1
}

# --- Preserve things the new build must not clobber ---
mkdir -p "$DEPLOY_DIR/public/uploads"

# --- Back up current release for rollback ---
rm -rf "$BACKUP_DIR"
if [ -d "$DEPLOY_DIR" ] && [ -n "$(ls -A "$DEPLOY_DIR" 2>/dev/null)" ]; then
  mv "$DEPLOY_DIR" "$BACKUP_DIR"
fi

# --- Move new build into place, carrying over the persisted uploads dir ---
mv "$INCOMING_DIR" "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR/public"
if [ -d "$BACKUP_DIR/public/uploads" ]; then
  rm -rf "$DEPLOY_DIR/public/uploads"
  mv "$BACKUP_DIR/public/uploads" "$DEPLOY_DIR/public/uploads"
fi
if [ -f "$BACKUP_DIR/.env" ]; then
  cp "$BACKUP_DIR/.env" "$DEPLOY_DIR/.env"
fi

if [ ! -f "$DEPLOY_DIR/.env" ]; then
  echo "::error::$DEPLOY_DIR/.env not found -- .env is managed manually, place it there before deploying"
  exit 1
fi

echo "Running database migrations..."
if ! run_migrations; then
  rollback "Migration failed"
fi

echo "Restarting app..."
restart_app

if healthcheck; then
  echo "Deployment successful"
  rm -rf "$BACKUP_DIR"
  exit 0
fi

rollback "Healthcheck failed"
