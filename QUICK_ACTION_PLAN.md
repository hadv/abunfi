# Quick Action Plan - Production Deployment

**Goal**: Deploy production-ready Abunfi with all recommended improvements  
**Time Required**: 2-3 hours  
**Difficulty**: Intermediate

---

## 🎯 What You'll Accomplish

By following this plan, you will:
- ✅ Deploy with resource limits (prevents crashes)
- ✅ Enable log rotation (prevents disk full)
- ✅ Setup automated backups (protects data)
- ✅ Configure monitoring (early warning system)
- ✅ Secure secrets (better security)

---

## ⏱️ Timeline

### Hour 1: Core Improvements
- 15 min: Review and understand changes
- 20 min: Deploy enhanced configuration
- 15 min: Setup automated backups
- 10 min: Verify deployment

### Hour 2: Security & Monitoring
- 20 min: Secure secrets
- 20 min: Setup health monitoring
- 20 min: Configure external monitoring

### Hour 3: Testing & Documentation
- 30 min: Load testing
- 15 min: Backup testing
- 15 min: Document customizations

---

## 📝 Step-by-Step Instructions

### Step 1: Review What's Been Created (5 minutes)

You now have these new files:

```bash
# Review files
ls -lh DOCKER_*.md IMPLEMENTATION_GUIDE.md
ls -lh docker-compose.production.enhanced.yml
ls -lh scripts/setup-automated-backups.sh

# Quick read (recommended)
cat DOCKER_REVIEW_SUMMARY.md  # Executive summary
```

**Key Files**:
- `DOCKER_REVIEW_SUMMARY.md` - Start here (5 min read)
- `DOCKER_PRODUCTION_REVIEW.md` - Detailed review (30 min read)
- `IMPLEMENTATION_GUIDE.md` - Step-by-step guide (reference)
- `docker-compose.production.enhanced.yml` - Enhanced config (ready to use)

---

### Step 2: Backup Current Setup (5 minutes)

```bash
# Backup current configuration
cp docker-compose.production.yml docker-compose.production.yml.backup
cp .env.prod .env.prod.backup 2>/dev/null || echo "No .env.prod yet"

# Backup current data (if already deployed)
./scripts/backup.sh 2>/dev/null || echo "Not deployed yet"

echo "✅ Backups created"
```

---

### Step 3: Deploy Enhanced Configuration (20 minutes)

```bash
# 1. Use enhanced configuration
cp docker-compose.production.enhanced.yml docker-compose.production.yml

# 2. Verify configuration
cat docker-compose.production.yml | grep -A 5 "deploy:"
# You should see resource limits for each service

# 3. If not already configured, setup environment
if [[ ! -f .env.prod ]]; then
    cp .env.production.example .env.prod
    echo "⚠️  Edit .env.prod with your production values"
    nano .env.prod
    chmod 600 .env.prod
fi

# 4. Deploy
DOMAIN_NAME=your-domain.com ./scripts/deploy-production.sh

# 5. Verify deployment
./scripts/monitor-production.sh
```

**Expected Output**:
```
✅ All services operational (5/5)
✅ Backend healthy
✅ Frontend healthy
✅ Database healthy
```

---

### Step 4: Setup Automated Backups (15 minutes)

```bash
# 1. Run interactive setup
./scripts/setup-automated-backups.sh

# Follow prompts:
# - Select backup schedule: Option 1 (Daily at 2 AM)
# - Configure S3: y (if you have AWS) or n (for local only)

# 2. Test backup manually
./scripts/backup.sh

# 3. Verify backup created
ls -lh backups/
# Should see: backups/YYYYMMDD_HHMMSS.tar.gz

# 4. Check backup status
./scripts/check-backup-status.sh
```

**Expected Output**:
```
✅ Latest Backup:
   File: 20250930_140000.tar.gz
   Size: 45M
   Age: 0 hours ago
✅ Backup cron job is configured
```

---

### Step 5: Secure Secrets (20 minutes)

```bash
# 1. Generate strong passwords
echo "Generating strong passwords..."

# PostgreSQL password
POSTGRES_PASSWORD=$(openssl rand -base64 32)
echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD"

# JWT secret
JWT_SECRET=$(openssl rand -base64 64)
echo "JWT_SECRET=$JWT_SECRET"

# 2. Update .env.prod
# IMPORTANT: Save these passwords securely!
nano .env.prod
# Update POSTGRES_PASSWORD and JWT_SECRET with generated values

# 3. Secure the file
chmod 600 .env.prod
chown $USER:$USER .env.prod

# 4. Verify it's in .gitignore
grep -q ".env.prod" .gitignore || echo ".env.prod" >> .gitignore

# 5. Create encrypted backup
tar -czf secrets-backup-$(date +%Y%m%d).tar.gz .env.prod
gpg -c secrets-backup-$(date +%Y%m%d).tar.gz
rm secrets-backup-$(date +%Y%m%d).tar.gz

# 6. Redeploy with new secrets
DOMAIN_NAME=your-domain.com ./scripts/deploy-production.sh
```

---

### Step 6: Setup Health Monitoring (20 minutes)

```bash
# 1. Create health monitoring script
cat > scripts/monitor-health.sh << 'EOF'
#!/bin/bash
# Quick health check script

DOMAIN_NAME=$(grep DOMAIN_NAME .env.prod | cut -d'=' -f2)

echo "🔍 Checking services..."

# Backend
if curl -sf http://localhost:3001/health > /dev/null; then
    echo "✅ Backend healthy"
else
    echo "❌ Backend unhealthy"
    exit 1
fi

# Frontend
if curl -sf https://$DOMAIN_NAME > /dev/null 2>&1; then
    echo "✅ Frontend healthy"
else
    echo "❌ Frontend unhealthy"
    exit 1
fi

# Database
if docker-compose -f docker-compose.production.yml exec -T postgres pg_isready -U abunfi_user > /dev/null 2>&1; then
    echo "✅ Database healthy"
else
    echo "❌ Database unhealthy"
    exit 1
fi

echo "✅ All services healthy"
EOF

chmod +x scripts/monitor-health.sh

# 2. Test it
./scripts/monitor-health.sh

# 3. Add to crontab for continuous monitoring
PROJECT_DIR=$(pwd)
(crontab -l 2>/dev/null; echo "*/5 * * * * cd $PROJECT_DIR && ./scripts/monitor-health.sh >> /var/log/abunfi/health-monitor.log 2>&1") | crontab -

echo "✅ Health monitoring configured (runs every 5 minutes)"
```

---

### Step 7: Configure External Monitoring (20 minutes)

**Option A: UptimeRobot (Recommended - Free)**

1. Go to https://uptimerobot.com
2. Sign up for free account
3. Add monitors:
   - Monitor 1: `https://your-domain.com` (HTTPS)
   - Monitor 2: `https://your-domain.com/health` (Keyword: "OK")
   - Monitor 3: `https://your-domain.com/api/health` (Keyword: "OK")
4. Configure alerts:
   - Email: your-email@example.com
   - Alert when down for: 5 minutes
5. Done! You'll get email alerts if site goes down

**Option B: Self-hosted Uptime Kuma**

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
# Setup admin account and add monitors
```

---

### Step 8: Testing (30 minutes)

```bash
# 1. Load Testing
echo "🧪 Running load tests..."

# Install Apache Bench if needed
sudo apt-get install -y apache2-utils

# Test backend
ab -n 1000 -c 10 https://your-domain.com/api/health

# Expected: Requests per second > 100, Failed requests: 0

# 2. Security Testing
echo "🔒 Testing security..."

# Check SSL
curl -I https://your-domain.com | grep -E "Strict-Transport|X-Frame"

# Test SSL Labs (manual)
echo "Visit: https://www.ssllabs.com/ssltest/analyze.html?d=your-domain.com"
echo "Expected grade: A or A+"

# 3. Backup Testing
echo "💾 Testing backup restoration..."

# Create test backup
./scripts/backup.sh

# Verify backup integrity
LATEST_BACKUP=$(ls -t backups/*.tar.gz | head -1)
tar -tzf "$LATEST_BACKUP" > /dev/null && echo "✅ Backup is valid"

# 4. Resource Testing
echo "📊 Checking resource usage..."
docker stats --no-stream

# Expected:
# - Backend: < 1GB memory
# - PostgreSQL: < 2GB memory
# - Nginx: < 256MB memory
```

---

### Step 9: Verify Everything (10 minutes)

```bash
# Run comprehensive check
echo "🔍 Final verification..."

# 1. Check all services
./scripts/monitor-production.sh

# 2. Check backups
./scripts/check-backup-status.sh

# 3. Check health monitoring
./scripts/monitor-health.sh

# 4. Check cron jobs
crontab -l

# 5. Check resource limits
docker inspect abunfi-backend-prod | grep -A 10 "Resources"

# 6. Check logs
docker-compose -f docker-compose.production.yml logs --tail=50

# 7. Test endpoints
curl https://your-domain.com/health
curl https://your-domain.com/api/health
```

**Expected Results**:
- ✅ All services healthy
- ✅ Backups configured and working
- ✅ Health monitoring active
- ✅ Resource limits applied
- ✅ Logs rotating properly
- ✅ All endpoints responding

---

## ✅ Completion Checklist

### Core Deployment
- [ ] Enhanced docker-compose deployed
- [ ] Resource limits verified
- [ ] Log rotation configured
- [ ] All services healthy

### Backup & Recovery
- [ ] Automated backups configured
- [ ] Backup tested successfully
- [ ] Backup monitoring active
- [ ] Off-site backup configured (optional)

### Security
- [ ] Strong passwords generated
- [ ] Secrets secured (chmod 600)
- [ ] .env.prod in .gitignore
- [ ] Encrypted backup created

### Monitoring
- [ ] Health monitoring script running
- [ ] Cron jobs configured
- [ ] External monitoring setup (UptimeRobot)
- [ ] Alerts configured

### Testing
- [ ] Load testing passed
- [ ] Security testing passed
- [ ] Backup restoration tested
- [ ] All endpoints working

---

## 🎉 Success Criteria

You're done when:

1. **All services are healthy**
   ```bash
   ./scripts/monitor-production.sh
   # Shows: ✅ All services operational (5/5)
   ```

2. **Backups are automated**
   ```bash
   crontab -l | grep backup.sh
   # Shows: 0 2 * * * ... backup.sh
   ```

3. **Resource limits are active**
   ```bash
   docker stats
   # Shows memory limits for all containers
   ```

4. **Monitoring is working**
   ```bash
   tail -f /var/log/abunfi/health-monitor.log
   # Shows: ✅ All services healthy (every 5 minutes)
   ```

5. **External monitoring configured**
   - UptimeRobot dashboard shows all monitors green
   - OR Uptime Kuma accessible and configured

---

## 🆘 Troubleshooting

### Issue: Deployment fails

```bash
# Check logs
docker-compose -f docker-compose.production.yml logs

# Check environment
cat .env.prod | grep -v "^#" | grep -v "^$"

# Verify required variables
grep -E "POSTGRES_PASSWORD|JWT_SECRET|RPC_URL" .env.prod
```

### Issue: Backup fails

```bash
# Check backup log
tail -f /var/log/abunfi/backups/backup.log

# Test manually
./scripts/backup.sh

# Check permissions
ls -la backups/
```

### Issue: Health check fails

```bash
# Check service status
docker-compose -f docker-compose.production.yml ps

# Check specific service
docker-compose -f docker-compose.production.yml logs backend

# Restart service
docker-compose -f docker-compose.production.yml restart backend
```

---

## 📚 Next Steps

After completing this plan:

1. **Monitor for 24-48 hours**
   - Watch resource usage
   - Check logs for errors
   - Verify backups running

2. **Fine-tune if needed**
   - Adjust resource limits based on actual usage
   - Optimize PostgreSQL settings
   - Configure additional monitoring

3. **Document customizations**
   - Note any changes made
   - Update team documentation
   - Share access credentials securely

4. **Plan for scaling**
   - Review DOCKER_PRODUCTION_REVIEW.md Priority 3 items
   - Consider adding Prometheus + Grafana
   - Plan for horizontal scaling if needed

---

## 📞 Support

- **Detailed Review**: See `DOCKER_PRODUCTION_REVIEW.md`
- **Step-by-Step Guide**: See `IMPLEMENTATION_GUIDE.md`
- **Quick Reference**: See `DOCKER_REVIEW_SUMMARY.md`

**Questions?** All documentation is comprehensive and includes troubleshooting sections.

---

**Good luck with your deployment! 🚀**

