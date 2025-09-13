#!/bin/bash

# SSL Certificate Setup Script
# This script sets up SSL certificates for the domain

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN_NAME=${DOMAIN_NAME:-"your-domain.com"}
EMAIL=${EMAIL:-"admin@your-domain.com"}

echo -e "${GREEN}🔒 Setting up SSL certificates for $DOMAIN_NAME${NC}"

# Check if domain is provided
if [ "$DOMAIN_NAME" = "your-domain.com" ]; then
    echo -e "${RED}❌ Please set DOMAIN_NAME environment variable${NC}"
    echo -e "${YELLOW}Example: DOMAIN_NAME=abunfi.com EMAIL=admin@abunfi.com ./scripts/ssl-setup.sh${NC}"
    exit 1
fi

# Create directories
mkdir -p certbot/conf certbot/www

# Create initial certificate (staging first)
echo -e "${YELLOW}📝 Creating staging certificate first...${NC}"
docker-compose -f docker-compose.prod.yml run --rm certbot \
    certonly --webroot --webroot-path /var/www/certbot \
    --email $EMAIL --agree-tos --no-eff-email \
    --staging \
    -d $DOMAIN_NAME -d www.$DOMAIN_NAME

# If staging works, get real certificate
echo -e "${YELLOW}🔒 Creating production certificate...${NC}"
docker-compose -f docker-compose.prod.yml run --rm certbot \
    certonly --webroot --webroot-path /var/www/certbot \
    --email $EMAIL --agree-tos --no-eff-email \
    --force-renewal \
    -d $DOMAIN_NAME -d www.$DOMAIN_NAME

echo -e "${GREEN}✅ SSL certificates created successfully${NC}"

# Test certificate renewal
echo -e "${YELLOW}🔄 Testing certificate renewal...${NC}"
docker-compose -f docker-compose.prod.yml run --rm certbot renew --dry-run

echo -e "${GREEN}✅ Certificate renewal test passed${NC}"
echo -e "${YELLOW}📝 Certificates are stored in ./certbot/conf/live/$DOMAIN_NAME/${NC}"
