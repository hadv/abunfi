#!/bin/bash

# Monitoring Script for Abunfi Production
# This script monitors the health and performance of the application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN_NAME=${DOMAIN_NAME:-"localhost"}
PROTOCOL=${PROTOCOL:-"https"}
COMPOSE_FILE="docker-compose.prod.yml"

echo -e "${BLUE}📊 Abunfi Application Monitoring${NC}"
echo -e "${BLUE}================================${NC}"

# Function to check service health
check_service_health() {
    local service=$1
    local status=$(docker-compose -f $COMPOSE_FILE ps -q $service 2>/dev/null)
    
    if [ -z "$status" ]; then
        echo -e "${RED}❌ $service: Not running${NC}"
        return 1
    fi
    
    local health=$(docker inspect --format='{{.State.Health.Status}}' $(docker-compose -f $COMPOSE_FILE ps -q $service) 2>/dev/null)
    
    if [ "$health" = "healthy" ]; then
        echo -e "${GREEN}✅ $service: Healthy${NC}"
        return 0
    elif [ "$health" = "unhealthy" ]; then
        echo -e "${RED}❌ $service: Unhealthy${NC}"
        return 1
    else
        echo -e "${YELLOW}⚠️  $service: Running (no health check)${NC}"
        return 0
    fi
}

# Function to check HTTP endpoint
check_http_endpoint() {
    local url=$1
    local name=$2
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ $name: HTTP $response${NC}"
        return 0
    else
        echo -e "${RED}❌ $name: HTTP $response${NC}"
        return 1
    fi
}

# Function to get resource usage
get_resource_usage() {
    local service=$1
    local container_id=$(docker-compose -f $COMPOSE_FILE ps -q $service 2>/dev/null)
    
    if [ -n "$container_id" ]; then
        local stats=$(docker stats --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}" $container_id 2>/dev/null | tail -n 1)
        echo -e "${BLUE}📈 $service: $stats${NC}"
    fi
}

echo -e "\n${YELLOW}🔍 Service Health Checks${NC}"
echo "------------------------"

# Check all services (Redis removed for demo)
services=("nginx" "frontend" "backend" "postgres")
healthy_services=0
total_services=${#services[@]}

for service in "${services[@]}"; do
    if check_service_health $service; then
        ((healthy_services++))
    fi
done

echo -e "\n${YELLOW}🌐 HTTP Endpoint Checks${NC}"
echo "------------------------"

# Check HTTP endpoints
if [ "$DOMAIN_NAME" = "localhost" ]; then
    check_http_endpoint "http://localhost" "Frontend (HTTP)"
    check_http_endpoint "http://localhost/health" "Health Check"
else
    check_http_endpoint "$PROTOCOL://$DOMAIN_NAME" "Frontend"
    check_http_endpoint "$PROTOCOL://$DOMAIN_NAME/health" "Health Check"
    check_http_endpoint "$PROTOCOL://$DOMAIN_NAME/api/auth/health" "Backend API"
fi

echo -e "\n${YELLOW}📊 Resource Usage${NC}"
echo "------------------"

# Get resource usage for each service
for service in "${services[@]}"; do
    get_resource_usage $service
done

echo -e "\n${YELLOW}💾 Storage Usage${NC}"
echo "----------------"

# Check disk usage
df -h | grep -E "(Filesystem|/dev/)" | head -2

# Check Docker volumes
echo -e "\n${BLUE}Docker Volumes:${NC}"
docker volume ls | grep abunfi || echo "No Abunfi volumes found"

echo -e "\n${YELLOW}📋 Container Status${NC}"
echo "-------------------"

# Show container status
docker-compose -f $COMPOSE_FILE ps

echo -e "\n${YELLOW}🔄 Recent Logs (Last 10 lines)${NC}"
echo "-------------------------------"

# Show recent logs for each service
for service in "${services[@]}"; do
    echo -e "\n${BLUE}$service:${NC}"
    docker-compose -f $COMPOSE_FILE logs --tail=3 $service 2>/dev/null || echo "No logs available"
done

echo -e "\n${YELLOW}📈 Summary${NC}"
echo "----------"

# Calculate health percentage
health_percentage=$((healthy_services * 100 / total_services))

if [ $health_percentage -eq 100 ]; then
    echo -e "${GREEN}✅ All services healthy ($healthy_services/$total_services)${NC}"
elif [ $health_percentage -ge 80 ]; then
    echo -e "${YELLOW}⚠️  Most services healthy ($healthy_services/$total_services)${NC}"
else
    echo -e "${RED}❌ Multiple services unhealthy ($healthy_services/$total_services)${NC}"
fi

# SSL certificate check (if using HTTPS)
if [ "$PROTOCOL" = "https" ] && [ "$DOMAIN_NAME" != "localhost" ]; then
    echo -e "\n${YELLOW}🔒 SSL Certificate Check${NC}"
    echo "------------------------"
    
    cert_info=$(echo | openssl s_client -servername $DOMAIN_NAME -connect $DOMAIN_NAME:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ SSL Certificate is valid${NC}"
        echo "$cert_info"
    else
        echo -e "${RED}❌ SSL Certificate check failed${NC}"
    fi
fi

echo -e "\n${BLUE}Monitoring completed at $(date)${NC}"
