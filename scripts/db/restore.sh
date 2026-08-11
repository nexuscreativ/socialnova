#!/bin/bash
# =============================================================================
# SocialNova - Database Restore Script
# =============================================================================

set -euo pipefail

# Configuration
BACKUP_DIR="/opt/socialnova/backups/postgres"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
    exit 1
}

# Check if backup file is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_file>"
    echo ""
    echo "Available backups:"
    ls -lh "${BACKUP_DIR}"/socialnova_*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Verify backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
    error "Backup file not found: ${BACKUP_FILE}"
fi

# Confirm restore
echo -e "${YELLOW}WARNING: This will overwrite the current database!${NC}"
echo "Backup file: ${BACKUP_FILE}"
read -p "Are you sure you want to proceed? (yes/no): " CONFIRM
if [ "${CONFIRM}" != "yes" ]; then
    log "Restore cancelled"
    exit 0
fi

# Stop API to prevent writes
log "Stopping API service..."
docker compose -f /opt/socialnova/docker-compose.prod.yml stop api

# Create a safety backup before restore
SAFETY_BACKUP="${BACKUP_DIR}/pre_restore_$(date +%Y%m%d_%H%M%S).sql.gz"
log "Creating safety backup: ${SAFETY_BACKUP}"
docker compose -f /opt/socialnova/docker-compose.prod.yml exec -T db \
    pg_dump \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        --format=custom \
        --compress=9 \
        2>/dev/null | gzip > "${SAFETY_BACKUP}"

# Drop and recreate database
log "Dropping existing database..."
docker compose -f /opt/socialnova/docker-compose.prod.yml exec -T db \
    psql -U "${POSTGRES_USER}" -c "DROP DATABASE IF EXISTS ${POSTGRES_DB};"

docker compose -f /opt/socialnova/docker-compose.prod.yml exec -T db \
    psql -U "${POSTGRES_USER}" -c "CREATE DATABASE ${POSTGRES_DB};"

# Restore from backup
log "Restoring database from backup..."
gunzip -c "${BACKUP_FILE}" | docker compose -f /opt/socialnova/docker-compose.prod.yml exec -T db \
    pg_restore \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        --verbose \
        --no-owner \
        --no-acl \
        2>/dev/null

if [ $? -eq 0 ]; then
    log "Database restore completed successfully"
else
    warn "pgrestore completed with warnings (this is usually OK)"
fi

# Run migrations
log "Running database migrations..."
docker compose -f /opt/socialnova/docker-compose.prod.yml exec -T api \
    alembic upgrade head

# Restart API
log "Starting API service..."
docker compose -f /opt/socialnova/docker-compose.prod.yml start api

# Verify restore
log "Verifying restore..."
sleep 5
if docker compose -f /opt/socialnova/docker-compose.prod.yml exec -T api \
    python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" > /dev/null 2>&1; then
    log "Restore verification passed"
else
    warn "Could not verify restore automatically"
fi

log "Database restore completed: ${BACKUP_FILE}"

# Optional: Send notification
if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
    curl -s -X POST "${SLACK_WEBHOOK_URL}" \
        -H 'Content-type: application/json' \
        -d "{\"text\":\"✅ SocialNova database restore completed from: ${BACKUP_FILE}\"}"
fi
