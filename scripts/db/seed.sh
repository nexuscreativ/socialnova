#!/bin/bash
# =============================================================================
# SocialNova - Database Seed Script
# =============================================================================

set -euo pipefail

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

# Check if API is running
if ! docker compose -f /opt/socialnova/docker-compose.prod.yml exec -T api \
    python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" > /dev/null 2>&1; then
    error "API is not running. Start the services first."
fi

log "Starting database seeding..."

# Create seed data via API or direct SQL
docker compose -f /opt/socialnova/docker-compose.prod.yml exec -T db psql \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" \
    <<-EOSQL
    -- Insert demo user
    INSERT INTO users (id, email, name, role, created_at, updated_at)
    VALUES (
        '550e8400-e29b-41d4-a716-446655440000',
        'demo@socialnova.com',
        'Demo User',
        'admin',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (email) DO NOTHING;

    -- Insert sample content
    INSERT INTO content (id, user_id, title, body, status, platform, created_at, updated_at)
    VALUES
        (
            '660e8400-e29b-41d4-a716-446655440001',
            '550e8400-e29b-41d4-a716-446655440000',
            'Welcome to SocialNova!',
            'Discover the power of AI-driven social media management. Our platform helps you create engaging content, analyze performance, and grow your audience.',
            'published',
            'twitter',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        ),
        (
            '660e8400-e29b-41d4-a716-446655440002',
            '550e8400-e29b-41d4-a716-446655440000',
            'AI Content Generation Tips',
            'Learn how to leverage AI to create compelling social media content that resonates with your audience.',
            'draft',
            'linkedin',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        )
    ON CONFLICT DO NOTHING;

    -- Insert sample campaign
    INSERT INTO campaigns (id, user_id, name, description, status, start_date, end_date, created_at, updated_at)
    VALUES (
        '770e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440000',
        'Product Launch Campaign',
        'AI-powered campaign for new product launch',
        'active',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP + INTERVAL '30 days',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT DO NOTHING;

    -- Insert API key for demo
    INSERT INTO api_keys (id, user_id, name, key_hash, created_at, expires_at)
    VALUES (
        '880e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440000',
        'Demo API Key',
        encode(gen_random_bytes(32), 'hex'),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP + INTERVAL '1 year'
    )
    ON CONFLICT DO NOTHING;

    SELECT 'Seed data inserted successfully' as status;
EOSQL

if [ $? -eq 0 ]; then
    log "Database seeding completed successfully"
else
    error "Database seeding failed"
fi

# Verify seed data
log "Verifying seed data..."
docker compose -f /opt/socialnova/docker-compose.prod.yml exec -T db psql \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" \
    -c "SELECT COUNT(*) as user_count FROM users;"
    -c "SELECT COUNT(*) as content_count FROM content;"
    -c "SELECT COUNT(*) as campaign_count FROM campaigns;"

log "Seed script completed"
