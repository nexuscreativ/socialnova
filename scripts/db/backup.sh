#!/bin/bash
# =============================================================================
# SocialNova - Database Backup Script
# =============================================================================

set -euo pipefail

# Configuration
BACKUP_DIR="/opt/socialnova/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/socialnova_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=30
S3_BUCKET="s3://socialnova-backups/postgres"

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

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Check if PostgreSQL is running
if ! docker compose -f /opt/socialnova/docker-compose.prod.yml exec -T db pg_isready -U "${POSTGRES_USER}" > /dev/null 2>&1; then
    error "PostgreSQL is not running"
fi

# Perform backup
log "Starting database backup..."

docker compose -f /opt/socialnova/docker-compose.prod.yml exec -T db \
    pg_dump \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        --format=custom \
        --compress=9 \
        --verbose \
        2>/dev/null | gzip > "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    log "Backup completed successfully: ${BACKUP_FILE} (${BACKUP_SIZE})"
else
    error "Backup failed"
fi

# Verify backup integrity
log "Verifying backup integrity..."
if gzip -t "${BACKUP_FILE}" 2>/dev/null; then
    log "Backup integrity verified"
else
    error "Backup integrity check failed"
fi

# Upload to S3 (if configured)
if command -v aws &> /dev/null; then
    log "Uploading backup to S3..."
    aws s3 cp "${BACKUP_FILE}" "${S3_BUCKET}/" --storage-class STANDARD_IA
    if [ $? -eq 0 ]; then
        log "S3 upload completed"
    else
        warn "S3 upload failed, backup stored locally only"
    fi
fi

# Cleanup old backups
log "Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "socialnova_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
REMAINING=$(find "${BACKUP_DIR}" -name "socialnova_*.sql.gz" | wc -l)
log "Remaining backups: ${REMAINING}"

# Log backup metrics
log "Backup completed: ${BACKUP_FILE}"

# Optional: Send notification
if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
    curl -s -X POST "${SLACK_WEBHOOK_URL}" \
        -H 'Content-type: application/json' \
        -d "{\"text\":\"✅ SocialNova database backup completed: ${BACKUP_FILE} (${BACKUP_SIZE})\"}"
fi
