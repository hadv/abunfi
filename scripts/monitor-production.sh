#!/bin/bash

# Production Monitoring Script for Abunfi
# Monitors docker-compose.production.yml services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

COMPOSE_FILE="docker-compose.production.yml"

echo -e "${BLUE}📊 Abunfi Production Monitoring${NC}"
echo -e "${BLUE}===============================${NC}"

# Check if production compose file exists
if [[ ! -f "$COMPOSE_FILE" ]]; then
    echo -e "${RED}❌ $COMPOSE_FILE not found${NC}"
    exit 1
fi

# Function to check service health
check_service_health() {
    local service=$1
    local status=$(docker-compose -f $COMPOSE_FILE ps -q $service | xargs docker inspect --format='{{.State.Health.Status}}' 2>/dev/null || echo "no-healthcheck")
    
    case $status in
        "healthy")
            echo -e "${GREEN}✅ $service${NC}"
            ;;
        "unhealthy")
            echo -e "${RED}❌ $service${NC}"
            ;;
        "starting")
            echo -e "${YELLOW}🔄 $service (starting)${NC}"
            ;;
        "no-healthcheck")
            local running=$(docker-compose -f $COMPOSE_FILE ps $service | grep -c "Up" || echo "0")
            if [[ $running -gt 0 ]]; then
                echo -e "${GREEN}✅ $service (no healthcheck)${NC}"
            else
                echo -e "${RED}❌ $service (not running)${NC}"
            fi
            ;;
        *)
            echo -e "${RED}❌ $service (unknown status: $status)${NC}"
            ;;
    esac
}

# Service status overview
echo -e "\n${YELLOW}🏥 Service Health Status:${NC}"
check_service_health "nginx"
check_service_health "frontend"
check_service_health "backend"
check_service_health "postgres"
check_service_health "certbot"

# Detailed service information
echo -e "\n${YELLOW}📋 Service Details:${NC}"
docker-compose -f $COMPOSE_FILE ps

# Resource usage
echo -e "\n${YELLOW}💻 Resource Usage:${NC}"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" $(docker-compose -f $COMPOSE_FILE ps -q) 2>/dev/null || echo "No running containers"

# Disk usage
echo -e "\n${YELLOW}💾 Disk Usage:${NC}"
echo -e "   PostgreSQL Data: $(du -sh /var/lib/abunfi/postgres 2>/dev/null | cut -f1 || echo "N/A")"
echo -e "   Backend Logs: $(du -sh /var/log/abunfi/backend 2>/dev/null | cut -f1 || echo "N/A")"
echo -e "   Nginx Logs: $(du -sh /var/log/abunfi/nginx 2>/dev/null | cut -f1 || echo "N/A")"
echo -e "   Backups: $(du -sh /var/backups/abunfi 2>/dev/null | cut -f1 || echo "N/A")"

# SSL certificate status
echo -e "\n${YELLOW}🔒 SSL Certificate Status:${NC}"
if [[ -f "./certbot/conf/live/$(cat .env.prod 2>/dev/null | grep DOMAIN_NAME | cut -d'=' -f2)/fullchain.pem" ]]; then
    domain=$(cat .env.prod 2>/dev/null | grep DOMAIN_NAME | cut -d'=' -f2)
    expiry=$(docker-compose -f $COMPOSE_FILE exec -T certbot openssl x509 -in /etc/letsencrypt/live/$domain/fullchain.pem -noout -enddate 2>/dev/null | cut -d'=' -f2 || echo "Unable to check")
    echo -e "   Certificate expires: $expiry"
else
    echo -e "   ${YELLOW}⚠️  SSL certificate not found${NC}"
fi

# Recent logs (last 10 lines from each service)
echo -e "\n${YELLOW}📝 Recent Logs (last 10 lines):${NC}"

echo -e "\n${BLUE}Backend:${NC}"
docker-compose -f $COMPOSE_FILE logs --tail=10 backend 2>/dev/null || echo "No backend logs"

echo -e "\n${BLUE}Frontend:${NC}"
docker-compose -f $COMPOSE_FILE logs --tail=10 frontend 2>/dev/null || echo "No frontend logs"

echo -e "\n${BLUE}Nginx:${NC}"
docker-compose -f $COMPOSE_FILE logs --tail=10 nginx 2>/dev/null || echo "No nginx logs"

# Network connectivity test
echo -e "\n${YELLOW}🌐 Connectivity Tests:${NC}"
if command -v curl >/dev/null 2>&1; then
    domain=$(cat .env.prod 2>/dev/null | grep DOMAIN_NAME | cut -d'=' -f2 || echo "localhost")
    
    # Test backend health
    if curl -s -f "http://localhost:3001/health" >/dev/null 2>&1; then
        echo -e "   ${GREEN}✅ Backend health check${NC}"
    else
        echo -e "   ${RED}❌ Backend health check failed${NC}"
    fi
    
    # Test frontend (if domain is configured)
    if [[ "$domain" != "localhost" ]]; then
        if curl -s -f "https://$domain" >/dev/null 2>&1; then
            echo -e "   ${GREEN}✅ Frontend HTTPS${NC}"
        else
            echo -e "   ${RED}❌ Frontend HTTPS failed${NC}"
        fi
    fi
else
    echo -e "   ${YELLOW}⚠️  curl not available for connectivity tests${NC}"
fi

# Quick actions menu
echo -e "\n${YELLOW}🛠️  Quick Actions:${NC}"
echo -e "   View logs: docker-compose -f $COMPOSE_FILE logs -f [service]"
echo -e "   Restart service: docker-compose -f $COMPOSE_FILE restart [service]"
echo -e "   Scale service: docker-compose -f $COMPOSE_FILE up -d --scale [service]=N"
echo -e "   Update deployment: DOMAIN_NAME=your-domain.com ./scripts/deploy-production-only.sh"
echo -e "   Backup database: ./scripts/backup.sh"

# System health summary
echo -e "\n${BLUE}📊 System Health Summary:${NC}"
healthy_services=$(docker-compose -f $COMPOSE_FILE ps | grep -c "healthy\|Up" || echo "0")
total_services=$(docker-compose -f $COMPOSE_FILE config --services | wc -l)

if [[ $healthy_services -eq $total_services ]]; then
    echo -e "   ${GREEN}✅ All services operational ($healthy_services/$total_services)${NC}"
elif [[ $healthy_services -gt 0 ]]; then
    echo -e "   ${YELLOW}⚠️  Partial service availability ($healthy_services/$total_services)${NC}"
else
    echo -e "   ${RED}❌ System down (0/$total_services)${NC}"
fi

echo -e "\n${BLUE}🚀 Monitoring complete!${NC}"
