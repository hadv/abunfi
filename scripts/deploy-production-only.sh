#!/bin/bash

# Production-Only Deployment Script for Abunfi
# Uses docker-compose.production.yml for clean production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Abunfi Production Deployment${NC}"
echo -e "${BLUE}================================${NC}"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}❌ This script should not be run as root${NC}"
   exit 1
fi

# Check required environment variables
if [[ -z "$DOMAIN_NAME" ]]; then
    echo -e "${RED}❌ DOMAIN_NAME environment variable is required${NC}"
    echo -e "${YELLOW}Usage: DOMAIN_NAME=your-domain.com ./scripts/deploy-production-only.sh${NC}"
    exit 1
fi

# Set default email if not provided
EMAIL=${EMAIL:-"admin@${DOMAIN_NAME}"}

echo -e "${YELLOW}📋 Deployment Configuration:${NC}"
echo -e "   Domain: ${DOMAIN_NAME}"
echo -e "   Email: ${EMAIL}"
echo -e "   Compose File: docker-compose.production.yml"

# Check if .env.prod exists
if [[ ! -f .env.prod ]]; then
    echo -e "${YELLOW}⚠️  .env.prod not found. Creating from template...${NC}"
    if [[ -f .env.production.example ]]; then
        cp .env.production.example .env.prod
        echo -e "${YELLOW}📝 Please edit .env.prod with your production values${NC}"
        echo -e "${YELLOW}   Required: POSTGRES_PASSWORD, JWT_SECRET, RPC_URL, etc.${NC}"
        read -p "Press Enter when you've configured .env.prod..."
    else
        echo -e "${RED}❌ .env.production.example not found${NC}"
        exit 1
    fi
fi

# Load environment variables
set -a
source .env.prod
set +a

# Validate required environment variables
required_vars=("POSTGRES_PASSWORD" "JWT_SECRET" "RPC_URL")
for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        echo -e "${RED}❌ Required environment variable $var is not set in .env.prod${NC}"
        exit 1
    fi
done

# Create production directories
echo -e "\n${YELLOW}📁 Creating production directories...${NC}"
sudo mkdir -p /var/lib/abunfi/postgres
sudo mkdir -p /var/log/abunfi/{backend,nginx}
sudo mkdir -p /var/backups/abunfi/postgres
sudo chown -R $USER:$USER /var/lib/abunfi /var/log/abunfi /var/backups/abunfi

# Create nginx configuration
echo -e "\n${YELLOW}🔧 Setting up Nginx configuration...${NC}"
mkdir -p nginx/conf.d

# Generate nginx config for the domain
cat > nginx/conf.d/abunfi.conf << EOF
# Abunfi Production Configuration
server {
    listen 80;
    server_name ${DOMAIN_NAME} www.${DOMAIN_NAME};
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect HTTP to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN_NAME} www.${DOMAIN_NAME};
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/${DOMAIN_NAME}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN_NAME}/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Frontend
    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://backend:3001/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # Health check
    location /health {
        proxy_pass http://backend:3001/health;
        access_log off;
    }
}
EOF

# Stop any existing services
echo -e "\n${YELLOW}🛑 Stopping existing services...${NC}"
docker-compose -f docker-compose.production.yml down --remove-orphans 2>/dev/null || true

# Build and start production services
echo -e "\n${YELLOW}🏗️  Building production images...${NC}"
docker-compose -f docker-compose.production.yml build --no-cache

echo -e "\n${YELLOW}🚀 Starting production services...${NC}"
DOMAIN_NAME=$DOMAIN_NAME EMAIL=$EMAIL docker-compose -f docker-compose.production.yml up -d

# Wait for services to be healthy
echo -e "\n${YELLOW}⏳ Waiting for services to be healthy...${NC}"
timeout=300
counter=0

while [ $counter -lt $timeout ]; do
    if docker-compose -f docker-compose.production.yml ps | grep -q "healthy"; then
        echo -e "${GREEN}✅ Services are healthy${NC}"
        break
    fi
    
    echo -e "   Waiting... ($counter/$timeout seconds)"
    sleep 5
    counter=$((counter + 5))
done

if [ $counter -eq $timeout ]; then
    echo -e "${RED}❌ Services failed to become healthy within $timeout seconds${NC}"
    echo -e "${YELLOW}📋 Service status:${NC}"
    docker-compose -f docker-compose.production.yml ps
    exit 1
fi

# Setup SSL certificate
echo -e "\n${YELLOW}🔒 Setting up SSL certificate...${NC}"
docker-compose -f docker-compose.production.yml exec -T certbot certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN_NAME \
    -d www.$DOMAIN_NAME || echo -e "${YELLOW}⚠️  SSL setup will be retried automatically${NC}"

# Reload nginx with SSL
echo -e "\n${YELLOW}🔄 Reloading Nginx with SSL...${NC}"
docker-compose -f docker-compose.production.yml exec nginx nginx -s reload

# Show deployment status
echo -e "\n${GREEN}🎉 Production deployment completed!${NC}"
echo -e "\n${YELLOW}📊 Service Status:${NC}"
docker-compose -f docker-compose.production.yml ps

echo -e "\n${YELLOW}🌐 Access your application:${NC}"
echo -e "   🔗 Website: https://${DOMAIN_NAME}"
echo -e "   🔗 API: https://${DOMAIN_NAME}/api/health"

echo -e "\n${YELLOW}📋 Management Commands:${NC}"
echo -e "   📊 Monitor: ./scripts/monitor-production.sh"
echo -e "   💾 Backup: ./scripts/backup.sh"
echo -e "   🔄 Update: DOMAIN_NAME=${DOMAIN_NAME} ./scripts/deploy-production-only.sh"
echo -e "   🛑 Stop: docker-compose -f docker-compose.production.yml down"

echo -e "\n${BLUE}🚀 Abunfi is now running in production mode!${NC}"
