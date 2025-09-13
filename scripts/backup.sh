#!/bin/bash

# Backup Script for Abunfi Production
# This script creates backups of database and important files

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
POSTGRES_CONTAINER="abunfi-postgres"

echo -e "${GREEN}💾 Starting backup process${NC}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Load environment variables
if [ -f ".env.prod" ]; then
    source .env.prod
else
    echo -e "${RED}❌ .env.prod file not found${NC}"
    exit 1
fi

# Backup PostgreSQL database
echo -e "${YELLOW}🗄️ Backing up PostgreSQL database...${NC}"
docker exec $POSTGRES_CONTAINER pg_dump -U abunfi_user -d abunfi > "$BACKUP_DIR/postgres_backup.sql"

# Note: Using memory cache for demo - no Redis backup needed
echo -e "${YELLOW}📦 Memory cache in use - no persistent cache data to backup${NC}"

# Backup SSL certificates
echo -e "${YELLOW}🔒 Backing up SSL certificates...${NC}"
if [ -d "certbot/conf" ]; then
    cp -r certbot/conf "$BACKUP_DIR/ssl_certificates"
fi

# Backup configuration files
echo -e "${YELLOW}⚙️ Backing up configuration files...${NC}"
cp -r nginx "$BACKUP_DIR/"
cp .env.prod "$BACKUP_DIR/"
cp docker-compose.prod.yml "$BACKUP_DIR/"

# Create backup info file
echo -e "${YELLOW}📝 Creating backup info...${NC}"
cat > "$BACKUP_DIR/backup_info.txt" << EOF
Backup created: $(date)
Domain: $DOMAIN_NAME
PostgreSQL version: $(docker exec $POSTGRES_CONTAINER psql -U abunfi_user -d abunfi -c "SELECT version();" -t)
Cache: Memory cache (demo mode)
Application version: $(git rev-parse HEAD 2>/dev/null || echo "unknown")
EOF

# Compress backup
echo -e "${YELLOW}🗜️ Compressing backup...${NC}"
tar -czf "${BACKUP_DIR}.tar.gz" -C "$(dirname "$BACKUP_DIR")" "$(basename "$BACKUP_DIR")"
rm -rf "$BACKUP_DIR"

echo -e "${GREEN}✅ Backup completed: ${BACKUP_DIR}.tar.gz${NC}"

# Clean old backups (keep last 7 days)
echo -e "${YELLOW}🧹 Cleaning old backups...${NC}"
find ./backups -name "*.tar.gz" -mtime +7 -delete 2>/dev/null || true

echo -e "${GREEN}🎉 Backup process completed successfully${NC}"
