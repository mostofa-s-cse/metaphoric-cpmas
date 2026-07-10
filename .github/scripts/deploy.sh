#!/bin/bash
# ==============================================================================
# Production Deploy Script (runs ON the server via SSH)
#
# The new build already landed directly at "$DEPLOY_DIR" (rsynced in place by
# the workflow -- rsync diffs against last deploy's copy, so unchanged files
# transfer near-nothing). This script runs pending Prisma migrations using
# the app's own node_modules (no separate toolkit, no install on server),
# then restarts the app by killing the supervised "node" process -- the
# panel (Automatic/Production mode) auto-restarts it, it's not Passenger.
#
# No backup/rollback: if a migration fails, fix forward with a new commit.
#
# Never touches public/uploads/ (local file storage) or .env (managed
# manually on the server) -- both are excluded from the rsync step.
#
# Args: $1 = DEPLOY_DIR
# ==============================================================================

set -Eeuo pipefail

DEPLOY_DIR="$1"

if [ ! -f "$DEPLOY_DIR/.env" ]; then
  echo "::error::$DEPLOY_DIR/.env not found -- .env is managed manually, place it there before deploying"
  exit 1
fi

mkdir -p "$DEPLOY_DIR/public/uploads"

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

NODE_BIN=$(find_node) || { echo "::error::no node binary found (checked PATH and ~/.nvm)"; exit 1; }

echo "Running database migrations..."
(
  cd "$DEPLOY_DIR"
  set -a; source .env; set +a
  # actions/upload-artifact's zip round-trip strips the executable bit off
  # native binaries and drops symlinks (hence invoking prisma's real entry
  # point below, not the node_modules/.bin/prisma symlink).
  find node_modules/@prisma/engines -type f -exec chmod +x {} + 2>/dev/null || true
  # This server's outbound firewall silently drops (doesn't reject) blocked
  # connections, so Prisma's checkpoint.prisma.io telemetry ping hangs for
  # minutes on TCP retries instead of failing fast. Disable it.
  CHECKPOINT_DISABLE=1 "$NODE_BIN" node_modules/prisma/build/index.js migrate deploy
)

echo "Restarting app..."
# Match on cwd, not command name -- the panel's Startup command is `npm
# start` (spawns next start under it), so the exact process name/args aren't
# reliable to pattern-match. Scoping strictly by cwd keeps this safe on a
# shared box regardless of what's actually running.
target_dir=$(readlink -f "$DEPLOY_DIR")
for pid in $(pgrep -f "node|npm" 2>/dev/null || true); do
  if [ "$(readlink -f "/proc/$pid/cwd" 2>/dev/null)" = "$target_dir" ]; then
    kill "$pid" 2>/dev/null || true
  fi
done

echo "Deployment successful"
