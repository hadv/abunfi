#!/bin/bash

# Quick Start Script for Abunfi
# This script helps you get started quickly with either development or production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Abunfi Quick Start${NC}"
echo -e "${BLUE}=====================${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "\n${YELLOW}🔍 Checking prerequisites...${NC}"

if ! command_exists docker; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo -e "${YELLOW}Please install Docker: https://docs.docker.com/get-docker/${NC}"
    exit 1
fi

if ! command_exists docker-compose; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    echo -e "${YELLOW}Please install Docker Compose: https://docs.docker.com/compose/install/${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Ask user for deployment type
echo -e "\n${YELLOW}📋 Choose deployment type:${NC}"
echo "1) Development (with hot reload, exposed ports)"
echo "2) Production (with SSL, reverse proxy)"
echo "3) Local testing (production-like without SSL)"

read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo -e "\n${GREEN}🔧 Starting development environment...${NC}"
        
        # Check if .env exists for development
        if [ ! -f "backend/.env" ]; then
            echo -e "${YELLOW}📝 Creating development .env file...${NC}"
            cat > backend/.env << EOF
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://abunfi_user:abunfi_password@postgres:5432/abunfi
USE_MEMORY_CACHE=true
JWT_SECRET=development-jwt-secret-key-change-in-production
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
CORS_ORIGIN=http://localhost:3000
EOF
        fi
        
        # Start development environment
        docker-compose up -d --build
        
        echo -e "\n${GREEN}✅ Development environment started!${NC}"
        echo -e "${YELLOW}📱 Frontend: http://localhost:3000${NC}"
        echo -e "${YELLOW}🔧 Backend API: http://localhost:3001${NC}"
        echo -e "${YELLOW}🗄️ PostgreSQL: localhost:5432${NC}"
        echo -e "${YELLOW}💾 Cache: Memory cache (demo mode)${NC}"
        echo -e "${YELLOW}⛓️ Hardhat: http://localhost:8545${NC}"
        ;;
        
    2)
        echo -e "\n${GREEN}🏭 Starting production environment...${NC}"
        
        # Check if .env.prod exists
        if [ ! -f ".env.prod" ]; then
            echo -e "${RED}❌ .env.prod file not found${NC}"
            echo -e "${YELLOW}Please copy .env.production.example to .env.prod and configure it${NC}"
            exit 1
        fi
        
        # Ask for domain name
        read -p "Enter your domain name (e.g., abunfi.com): " domain
        read -p "Enter your email for SSL certificates: " email
        
        if [ -z "$domain" ] || [ -z "$email" ]; then
            echo -e "${RED}❌ Domain and email are required for production deployment${NC}"
            exit 1
        fi
        
        # Export variables and run production deployment
        export DOMAIN_NAME=$domain
        export EMAIL=$email
        ./scripts/deploy-production.sh
        ;;
        
    3)
        echo -e "\n${GREEN}🧪 Starting local testing environment...${NC}"
        
        # Create local testing environment file
        if [ ! -f ".env.local" ]; then
            echo -e "${YELLOW}📝 Creating local testing .env file...${NC}"
            cat > .env.local << EOF
DOMAIN_NAME=localhost
POSTGRES_PASSWORD=abunfi_password_local_test
USE_MEMORY_CACHE=true
JWT_SECRET=local-testing-jwt-secret-key-change-in-production
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
CHAIN_ID=11155111
VAULT_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
WEB3AUTH_CLIENT_ID=demo-client-id
EOF
        fi
        
        # Start with production compose but local settings
        cp .env.local .env.prod
        docker-compose -f docker-compose.production.yml up -d --build
        
        echo -e "\n${GREEN}✅ Local testing environment started!${NC}"
        echo -e "${YELLOW}📱 Application: http://localhost${NC}"
        echo -e "${YELLOW}🏥 Health Check: http://localhost/health${NC}"
        ;;
        
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

# Wait for services to be ready
echo -e "\n${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 15

# Run health check
echo -e "\n${YELLOW}🏥 Running health check...${NC}"
./scripts/monitor-production.sh

echo -e "\n${GREEN}🎉 Abunfi is ready!${NC}"
echo -e "\n${YELLOW}📚 Useful commands:${NC}"
echo -e "  ${BLUE}View logs:${NC} docker-compose logs -f"
echo -e "  ${BLUE}Stop services:${NC} docker-compose down"
echo -e "  ${BLUE}Monitor:${NC} ./scripts/monitor-production.sh"
echo -e "  ${BLUE}Backup:${NC} ./scripts/backup.sh"
