# Production Deployment Implementation Guide

This guide provides step-by-step instructions to implement the recommended improvements from the Docker Production Review.

## 📋 Overview

This implementation guide covers:
1. ✅ Adding resource limits
2. ✅ Configuring log rotation
3. ✅ Setting up automated backups
4. ✅ Implementing monitoring
5. ✅ Improving secrets management

**Estimated Time**: 2-3 hours  
**Difficulty**: Intermediate  
**Prerequisites**: Root/sudo access to production server

---

## 🚀 Phase 1: Resource Limits & Logging (30 minutes)

### Step 1.1: Update Docker Compose with Resource Limits

We've created an enhanced production compose file with resource limits and logging configuration.

```bash
# Backup current production compose
cp docker-compose.production.yml docker-compose.production.yml.backup

# Review the enhanced version
cat docker-compose.production.enhanced.yml

# Option 1: Replace current file
mv docker-compose.production.enhanced.yml docker-compose.production.yml

# Option 2: Use enhanced file directly
# Update deploy script to use docker-compose.production.enhanced.yml
```

**What's included**:
- ✅ CPU and memory limits for all services
- ✅ Log rotation (max 10-20MB per file, 3-5 files retained)
- ✅ Compressed logs
- ✅ Pinned certbot version

### Step 1.2: Verify Resource Limits

```bash
# Deploy with new configuration
DOMAIN_NAME=your-domain.com ./scripts/deploy-production.sh

# Verify resource limits are applied
docker stats

# Expected output should show memory limits
# CONTAINER          CPU %     MEM USAGE / LIMIT
# abunfi-backend     2.5%      512MiB / 1GiB
# abunfi-postgres    1.2%      1GiB / 2GiB
# abunfi-nginx       0.1%      64MiB / 256MiB
```

### Step 1.3: Test Log Rotation

```bash
# Check logging configuration
docker inspect abunfi-backend-prod | grep -A 10 LogConfig

# Monitor log file sizes
watch -n 5 'du -sh /var/log/abunfi/*'

# Logs should automatically rotate when reaching max-size
```

**✅ Checkpoint**: Resource limits applied, logs rotating properly

---

## 🔐 Phase 2: Secrets Management (45 minutes)

### Step 2.1: Secure Current Secrets

```bash
# Ensure .env.prod has correct permissions
chmod 600 .env.prod

# Verify it's in .gitignore
grep -q ".env.prod" .gitignore || echo ".env.prod" >> .gitignore

# Create encrypted backup of secrets
tar -czf secrets-backup-$(date +%Y%m%d).tar.gz .env.prod
gpg -c secrets-backup-$(date +%Y%m%d).tar.gz
rm secrets-backup-$(date +%Y%m%d).tar.gz
```

### Step 2.2: Option A - Docker Secrets (Recommended for Docker Swarm)

If using Docker Swarm:

```bash
# Initialize swarm
docker swarm init

# Create secrets
echo "your-postgres-password" | docker secret create postgres_password -
echo "your-jwt-secret" | docker secret create jwt_secret -
echo "your-rpc-url" | docker secret create rpc_url -

# Update docker-compose to use secrets
# See docker-compose.production.secrets.yml example below
```

### Step 2.3: Option B - Environment File Encryption (Simpler)

For standalone Docker:

```bash
# Install git-crypt for encrypted secrets
sudo apt-get install git-crypt

# Initialize git-crypt
cd /path/to/abunfi
git-crypt init

# Create .gitattributes
cat > .gitattributes << EOF
.env.prod filter=git-crypt diff=git-crypt
secrets/** filter=git-crypt diff=git-crypt
EOF

# Export encryption key (store safely!)
git-crypt export-key ../abunfi-git-crypt-key

# Now .env.prod will be encrypted in git
git add .env.prod .gitattributes
git commit -m "Add encrypted secrets"
```

### Step 2.4: Generate Strong Secrets

```bash
# Generate strong PostgreSQL password
POSTGRES_PASSWORD=$(openssl rand -base64 32)
echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD"

# Generate strong JWT secret
JWT_SECRET=$(openssl rand -base64 64)
echo "JWT_SECRET=$JWT_SECRET"

# Update .env.prod with new secrets
# Then restart services
DOMAIN_NAME=your-domain.com ./scripts/deploy-production.sh
```

**✅ Checkpoint**: Secrets secured and encrypted

---

## 💾 Phase 3: Automated Backups (30 minutes)

### Step 3.1: Setup Automated Backups

```bash
# Make setup script executable
chmod +x scripts/setup-automated-backups.sh

# Run interactive setup
./scripts/setup-automated-backups.sh

# Follow prompts to:
# 1. Select backup schedule (recommended: Daily at 2 AM)
# 2. Optionally configure S3 off-site backup
```

### Step 3.2: Test Backup System

```bash
# Run manual backup
./scripts/backup.sh

# Verify backup created
ls -lh backups/

# Check backup contents
tar -tzf backups/$(ls -t backups/*.tar.gz | head -1)

# Test backup monitoring
./scripts/check-backup-status.sh
```

### Step 3.3: Configure Off-Site Backup (Optional but Recommended)

**Option A: AWS S3**

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region, Output format

# Create S3 bucket
aws s3 mb s3://abunfi-backups --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket abunfi-backups \
  --versioning-configuration Status=Enabled

# Test S3 backup
./scripts/backup-to-s3.sh
```

**Option B: Rsync to Remote Server**

```bash
# Create rsync backup script
cat > scripts/backup-to-remote.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="./backups"
REMOTE_USER="backup"
REMOTE_HOST="backup.example.com"
REMOTE_PATH="/backups/abunfi"

# Find latest backup
LATEST_BACKUP=$(ls -t $BACKUP_DIR/*.tar.gz | head -1)

# Rsync to remote server
rsync -avz --progress "$LATEST_BACKUP" \
  ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/
EOF

chmod +x scripts/backup-to-remote.sh

# Setup SSH key for passwordless rsync
ssh-keygen -t ed25519 -f ~/.ssh/backup_key -N ""
ssh-copy-id -i ~/.ssh/backup_key backup@backup.example.com
```

### Step 3.4: Verify Backup Restoration

```bash
# Create test restore script
cat > scripts/test-restore.sh << 'EOF'
#!/bin/bash
set -e

echo "🧪 Testing backup restoration..."

# Find latest backup
LATEST_BACKUP=$(ls -t backups/*.tar.gz | head -1)
echo "Using backup: $LATEST_BACKUP"

# Extract to temp directory
TEMP_DIR=$(mktemp -d)
tar -xzf "$LATEST_BACKUP" -C "$TEMP_DIR"

# Verify PostgreSQL backup
if [[ -f "$TEMP_DIR/$(basename $LATEST_BACKUP .tar.gz)/postgres_backup.sql" ]]; then
    echo "✅ PostgreSQL backup found"
    # Test SQL syntax
    grep -q "PostgreSQL database dump" "$TEMP_DIR/$(basename $LATEST_BACKUP .tar.gz)/postgres_backup.sql"
    echo "✅ PostgreSQL backup is valid"
else
    echo "❌ PostgreSQL backup not found"
    exit 1
fi

# Verify configuration files
if [[ -f "$TEMP_DIR/$(basename $LATEST_BACKUP .tar.gz)/.env.prod" ]]; then
    echo "✅ Environment configuration found"
else
    echo "❌ Environment configuration not found"
    exit 1
fi

# Cleanup
rm -rf "$TEMP_DIR"

echo "✅ Backup restoration test passed!"
EOF

chmod +x scripts/test-restore.sh
./scripts/test-restore.sh
```

**✅ Checkpoint**: Automated backups configured and tested

---

## 📊 Phase 4: Enhanced Monitoring (45 minutes)

### Step 4.1: Setup Prometheus Metrics (Optional)

```bash
# Create prometheus directory
mkdir -p monitoring/prometheus

# Create Prometheus configuration
cat > monitoring/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'docker'
    static_configs:
      - targets: ['host.docker.internal:9323']
  
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:9113']
  
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
  
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
EOF

# Add to docker-compose (see monitoring section below)
```

### Step 4.2: Setup Health Check Monitoring

```bash
# Create health check monitoring script
cat > scripts/monitor-health.sh << 'EOF'
#!/bin/bash

# Health Check Monitoring with Alerts
# Checks service health and sends alerts if issues detected

# Configuration
DOMAIN_NAME=$(grep DOMAIN_NAME .env.prod | cut -d'=' -f2)
ALERT_EMAIL="admin@example.com"
SLACK_WEBHOOK=""  # Optional: Add Slack webhook URL

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check backend health
check_backend() {
    if curl -sf http://localhost:3001/health > /dev/null; then
        echo -e "${GREEN}✅ Backend healthy${NC}"
        return 0
    else
        echo -e "${RED}❌ Backend unhealthy${NC}"
        return 1
    fi
}

# Check frontend
check_frontend() {
    if curl -sf https://$DOMAIN_NAME > /dev/null; then
        echo -e "${GREEN}✅ Frontend healthy${NC}"
        return 0
    else
        echo -e "${RED}❌ Frontend unhealthy${NC}"
        return 1
    fi
}

# Check database
check_database() {
    if docker-compose -f docker-compose.production.yml exec -T postgres \
       pg_isready -U abunfi_user > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Database healthy${NC}"
        return 0
    else
        echo -e "${RED}❌ Database unhealthy${NC}"
        return 1
    fi
}

# Send alert
send_alert() {
    local message="$1"
    
    # Email alert
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "Abunfi Alert: Service Down" "$ALERT_EMAIL"
    fi
    
    # Slack alert
    if [[ -n "$SLACK_WEBHOOK" ]]; then
        curl -X POST -H 'Content-type: application/json' \
          --data "{\"text\":\"$message\"}" \
          "$SLACK_WEBHOOK"
    fi
}

# Main monitoring loop
echo "🔍 Running health checks..."

FAILED=0

check_backend || { send_alert "Backend service is down!"; FAILED=1; }
check_frontend || { send_alert "Frontend service is down!"; FAILED=1; }
check_database || { send_alert "Database service is down!"; FAILED=1; }

if [[ $FAILED -eq 0 ]]; then
    echo -e "\n${GREEN}✅ All services healthy${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some services are unhealthy${NC}"
    exit 1
fi
EOF

chmod +x scripts/monitor-health.sh

# Add to crontab for continuous monitoring
(crontab -l 2>/dev/null; echo "*/5 * * * * /path/to/abunfi/scripts/monitor-health.sh >> /var/log/abunfi/health-monitor.log 2>&1") | crontab -
```

### Step 4.3: Setup Uptime Monitoring (External)

**Option A: UptimeRobot (Free)**

1. Go to https://uptimerobot.com
2. Create account
3. Add monitors:
   - HTTPS monitor: `https://your-domain.com`
   - HTTP monitor: `https://your-domain.com/health`
   - HTTP monitor: `https://your-domain.com/api/health`
4. Configure alert contacts (email, Slack, etc.)

**Option B: Self-hosted with Uptime Kuma**

```bash
# Add to docker-compose
cat >> docker-compose.production.yml << 'EOF'
  uptime-kuma:
    image: louislam/uptime-kuma:latest
    container_name: abunfi-uptime-kuma
    restart: unless-stopped
    ports:
      - "3002:3001"
    volumes:
      - uptime_kuma_data:/app/data
    networks:
      - abunfi-prod-network
EOF

# Add volume
echo "  uptime_kuma_data:" >> docker-compose.production.yml

# Deploy
docker-compose -f docker-compose.production.yml up -d uptime-kuma

# Access at http://your-server-ip:3002
```

**✅ Checkpoint**: Monitoring configured and running

---

## 🧪 Phase 5: Testing & Validation (30 minutes)

### Step 5.1: Load Testing

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test backend API
ab -n 1000 -c 10 https://your-domain.com/api/health

# Test frontend
ab -n 1000 -c 10 https://your-domain.com/

# Expected results:
# - Requests per second: > 100
# - Mean response time: < 100ms
# - Failed requests: 0
```

### Step 5.2: Security Testing

```bash
# Test SSL configuration
curl -I https://your-domain.com

# Check SSL Labs rating
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=your-domain.com

# Test security headers
curl -I https://your-domain.com | grep -E "Strict-Transport|X-Frame|X-Content"

# Expected headers:
# Strict-Transport-Security: max-age=31536000
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
```

### Step 5.3: Disaster Recovery Test

```bash
# Simulate failure and recovery
echo "🧪 Testing disaster recovery..."

# 1. Create backup
./scripts/backup.sh

# 2. Stop all services
docker-compose -f docker-compose.production.yml down

# 3. Simulate data loss (CAREFUL!)
# sudo rm -rf /var/lib/abunfi/postgres/*

# 4. Restore from backup
# ./scripts/restore-backup.sh backups/latest.tar.gz

# 5. Restart services
DOMAIN_NAME=your-domain.com ./scripts/deploy-production.sh

# 6. Verify all services healthy
./scripts/monitor-production.sh
```

**✅ Checkpoint**: All tests passing

---

## 📝 Final Checklist

- [ ] Resource limits applied and verified
- [ ] Log rotation configured
- [ ] Automated backups running
- [ ] Off-site backup configured
- [ ] Backup restoration tested
- [ ] Health monitoring active
- [ ] Uptime monitoring configured
- [ ] Load testing completed
- [ ] Security testing passed
- [ ] Disaster recovery tested
- [ ] Documentation updated
- [ ] Team trained on new procedures

---

## 🎉 Completion

Congratulations! Your production deployment now includes:

✅ **Resource Management**: CPU and memory limits prevent resource exhaustion  
✅ **Log Management**: Automatic rotation prevents disk space issues  
✅ **Backup Strategy**: Automated daily backups with off-site storage  
✅ **Monitoring**: Proactive health checks and alerting  
✅ **Security**: Encrypted secrets and hardened configuration  

**Next Steps**:
1. Monitor system for 24-48 hours
2. Review logs and metrics
3. Adjust resource limits if needed
4. Document any custom configurations
5. Schedule regular security audits

**Support**: Refer to DOCKER_PRODUCTION_REVIEW.md for detailed information

