#!/bin/bash

# Production Deployment Script for Abunfi
# This script deploys the application with SSL certificates

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN_NAME=${DOMAIN_NAME:-"your-domain.com"}
EMAIL=${EMAIL:-"admin@your-domain.com"}

echo -e "${GREEN}🚀 Starting Abunfi Production Deployment${NC}"

# Check if .env.prod exists
if [ ! -f ".env.prod" ]; then
    echo -e "${RED}❌ .env.prod file not found!${NC}"
    echo -e "${YELLOW}Please copy .env.prod.example to .env.prod and configure it${NC}"
    exit 1
fi

# Load environment variables
source .env.prod

# Validate required environment variables
required_vars=("DOMAIN_NAME" "POSTGRES_PASSWORD" "JWT_SECRET" "RPC_URL" "WEB3AUTH_CLIENT_ID")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Required environment variable $var is not set${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Environment variables validated${NC}"

# Update Nginx configuration with actual domain
echo -e "${YELLOW}📝 Updating Nginx configuration...${NC}"
sed -i.bak "s/your-domain.com/${DOMAIN_NAME}/g" nginx/conf.d/abunfi.conf

# Create necessary directories
echo -e "${YELLOW}📁 Creating directories...${NC}"
mkdir -p certbot/conf certbot/www

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose -f docker-compose.prod.yml down || true

# Build and start services (without SSL first)
echo -e "${YELLOW}🔨 Building and starting services...${NC}"
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 30

# Check if services are healthy
echo -e "${YELLOW}🏥 Checking service health...${NC}"
for service in postgres redis backend frontend; do
    if docker-compose -f docker-compose.prod.yml ps $service | grep -q "Up (healthy)"; then
        echo -e "${GREEN}✅ $service is healthy${NC}"
    else
        echo -e "${RED}❌ $service is not healthy${NC}"
        docker-compose -f docker-compose.prod.yml logs $service
    fi
done

# Obtain SSL certificate
echo -e "${YELLOW}🔒 Obtaining SSL certificate...${NC}"
docker-compose -f docker-compose.prod.yml run --rm certbot \
    certonly --webroot --webroot-path /var/www/certbot \
    --email $EMAIL --agree-tos --no-eff-email \
    -d $DOMAIN_NAME -d www.$DOMAIN_NAME

# Restart Nginx to load SSL certificates
echo -e "${YELLOW}🔄 Restarting Nginx with SSL...${NC}"
docker-compose -f docker-compose.prod.yml restart nginx

# Final health check
echo -e "${YELLOW}🏥 Final health check...${NC}"
sleep 10

if curl -f -s https://$DOMAIN_NAME/health > /dev/null; then
    echo -e "${GREEN}✅ Application is running successfully at https://$DOMAIN_NAME${NC}"
else
    echo -e "${RED}❌ Application health check failed${NC}"
    echo -e "${YELLOW}Check logs with: docker-compose -f docker-compose.prod.yml logs${NC}"
fi

echo -e "${GREEN}🎉 Deployment completed!${NC}"
echo -e "${YELLOW}📊 Access your application at: https://$DOMAIN_NAME${NC}"
echo -e "${YELLOW}📈 Monitor logs with: docker-compose -f docker-compose.prod.yml logs -f${NC}"
