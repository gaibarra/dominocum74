#!/usr/bin/env bash
set -euo pipefail

# Reusable deploy script for domino-cum-74 static bundle
# Requirements (local): npm, rsync, ssh
# Requirements (remote): user with SSH access and write perms to DEPLOY_PATH

APP_NAME="domino-cum-74"
REMOTE_HOST="${DEPLOY_HOST:-185.211.4.129}"
REMOTE_USER="${DEPLOY_USER:-deploy}"
REMOTE_DIR="${DEPLOY_PATH:-/var/www/dominocum74}"
REMOTE_PORT="${DEPLOY_PORT:-22}"
NGINX_SERVICE="${NGINX_SERVICE:-nginx}"

log() {
  printf '\n[%s] %s\n' "${APP_NAME}" "$1"
}

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required to build the project" >&2
  exit 1
fi

if ! command -v rsync >/dev/null 2>&1; then
  echo "rsync is required to upload the dist bundle" >&2
  exit 1
fi

if ! command -v ssh >/dev/null 2>&1; then
  echo "ssh client is required" >&2
  exit 1
fi

log "Installing dependencies"
npm ci

log "Building production bundle"
npm run build

log "Preparing remote directories"
ssh -p "${REMOTE_PORT}" "${REMOTE_USER}@${REMOTE_HOST}" "mkdir -p ${REMOTE_DIR}/current"

log "Syncing dist/ to ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR} (port ${REMOTE_PORT})"
rsync -az --delete --exclude '.env.api' -e "ssh -p ${REMOTE_PORT}" dist/ "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/current/"

log "Ensuring shared static assets"
ssh -p "${REMOTE_PORT}" "${REMOTE_USER}@${REMOTE_HOST}" "mkdir -p ${REMOTE_DIR}/shared && ln -snf ${REMOTE_DIR}/current ${REMOTE_DIR}/html"

log "Reloading nginx"
ssh -p "${REMOTE_PORT}" "${REMOTE_USER}@${REMOTE_HOST}" "sudo systemctl reload ${NGINX_SERVICE}"

log "Deployment finished"
