# Production-Only Deployment Guide

This guide covers deploying Abunfi using the dedicated `docker-compose.production.yml` file for clean, production-focused deployment.

## 🎯 Why Production-Only Compose?

### ✅ **Benefits**
- **Clean separation** - No development dependencies or configurations
- **Optimized for production** - Performance and security focused
- **Easier maintenance** - Single purpose, clear configuration
- **Better security** - Production-specific network and volume configurations
- **Simplified deployment** - No confusion between dev and prod settings

### 📊 **Comparison**

| Feature | docker-compose.yml | docker-compose.production.yml |
|---------|-------------------|------------------------------|
| **Purpose** | Development | **Production only** |
| **SSL/TLS** | ❌ | ✅ |
| **Volume Binding** | Dev mounts | **Host bind mounts** |
| **Network** | Basic | **Custom production** |
| **Health Checks** | Basic | **Enhanced** |
| **Security** | Basic | **Hardened** |
| **Monitoring** | ❌ | **Comprehensive** |

## 🚀 Quick Start

### 1. **Environment Setup**
```bash
# Copy production environment template
cp .env.production.example .env.prod

# Edit with your production values
nano .env.prod

# Secure the file
chmod 600 .env.prod
```

### 2. **Deploy to Production**
```bash
# Deploy with your domain
DOMAIN_NAME=your-domain.com ./scripts/deploy-production-only.sh

# Monitor deployment
./scripts/monitor-production.sh
```

## 📋 Configuration

### **Required Environment Variables**
```bash
# Domain & SSL
DOMAIN_NAME=your-domain.com
EMAIL=admin@your-domain.com

# Security (generate strong values)
POSTGRES_PASSWORD=your-super-secure-password
JWT_SECRET=your-super-secure-jwt-secret

# Blockchain
RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
CHAIN_ID=11155111
VAULT_CONTRACT_ADDRESS=0x...

# Web3Auth
WEB3AUTH_CLIENT_ID=your-client-id
```

### **Production Features**

#### 🔒 **Security**
- **SSL/TLS** with Let's Encrypt auto-renewal
- **Security headers** (HSTS, CSP, XSS protection)
- **Non-root containers** for all services
- **Custom network** with isolated communication
- **Proper signal handling** with dumb-init

#### 🏗️ **Infrastructure**
- **Nginx reverse proxy** with optimized configuration
- **PostgreSQL** with production tuning
- **Health checks** for all services
- **Automatic restarts** with proper dependencies
- **Volume persistence** with host bind mounts

#### 📊 **Monitoring**
- **Service health** monitoring
- **Resource usage** tracking
- **SSL certificate** expiry monitoring
- **Log aggregation** and rotation
- **Connectivity tests**

## 🏗️ Architecture

```
Internet → Nginx (SSL) → Frontend (React)
                      ↘ Backend (Node.js) → PostgreSQL
                      ↗ Certbot (SSL renewal)
```

### **Container Details**

| Container | Image | Purpose | Health Check |
|-----------|-------|---------|--------------|
| **nginx** | nginx:alpine | Reverse proxy + SSL | nginx -t |
| **certbot** | certbot/certbot | SSL management | Auto-renewal |
| **frontend** | abunfi-frontend:production | React app | wget health |
| **backend** | abunfi-backend:production | API server | curl health |
| **postgres** | postgres:16-alpine | Database | pg_isready |

### **Volume Strategy**
```bash
# Production volumes with host bind mounts
/var/lib/abunfi/postgres     # Database data
/var/log/abunfi/backend      # Backend logs
/var/log/abunfi/nginx        # Nginx logs
/var/backups/abunfi/postgres # Database backups
```

## 🛠️ Management

### **Deployment Commands**
```bash
# Initial deployment
DOMAIN_NAME=your-domain.com ./scripts/deploy-production-only.sh

# Update deployment
DOMAIN_NAME=your-domain.com ./scripts/deploy-production-only.sh

# Monitor services
./scripts/monitor-production.sh

# View logs
docker-compose -f docker-compose.production.yml logs -f [service]

# Restart service
docker-compose -f docker-compose.production.yml restart [service]

# Stop all services
docker-compose -f docker-compose.production.yml down
```

### **Backup & Recovery**
```bash
# Manual backup
./scripts/backup.sh

# Restore from backup
./scripts/restore.sh backup-file.sql

# View backup status
ls -la /var/backups/abunfi/postgres/
```

### **SSL Management**
```bash
# Check certificate status
docker-compose -f docker-compose.production.yml exec certbot certbot certificates

# Force renewal
docker-compose -f docker-compose.production.yml exec certbot certbot renew --force-renewal

# Reload nginx after renewal
docker-compose -f docker-compose.production.yml exec nginx nginx -s reload
```

## 🔧 Troubleshooting

### **Common Issues**

#### **SSL Certificate Issues**
```bash
# Check certificate files
ls -la ./certbot/conf/live/your-domain.com/

# Test certificate renewal
docker-compose -f docker-compose.production.yml exec certbot certbot renew --dry-run

# Check nginx configuration
docker-compose -f docker-compose.production.yml exec nginx nginx -t
```

#### **Service Health Issues**
```bash
# Check service status
docker-compose -f docker-compose.production.yml ps

# View service logs
docker-compose -f docker-compose.production.yml logs [service]

# Restart unhealthy service
docker-compose -f docker-compose.production.yml restart [service]
```

#### **Database Connection Issues**
```bash
# Test database connection
docker-compose -f docker-compose.production.yml exec postgres psql -U abunfi_user -d abunfi -c "SELECT 1;"

# Check database logs
docker-compose -f docker-compose.production.yml logs postgres

# Restart database
docker-compose -f docker-compose.production.yml restart postgres
```

### **Performance Optimization**

#### **Database Tuning**
The production compose includes optimized PostgreSQL settings:
```sql
-- Already configured in docker-compose.production.yml
shared_buffers = 256MB
effective_cache_size = 1GB
max_connections = 200
```

#### **Nginx Optimization**
```nginx
# Already configured in nginx/conf.d/abunfi.conf
gzip on;
client_max_body_size 10M;
proxy_buffering on;
```

## 📊 Monitoring & Alerts

### **Health Monitoring**
```bash
# Automated monitoring
./scripts/monitor-production.sh

# Service-specific health
curl -f https://your-domain.com/health
curl -f https://your-domain.com/api/health
```

### **Log Monitoring**
```bash
# Real-time logs
docker-compose -f docker-compose.production.yml logs -f

# Error logs only
docker-compose -f docker-compose.production.yml logs | grep -i error

# Backend application logs
tail -f /var/log/abunfi/backend/combined.log
```

### **Resource Monitoring**
```bash
# Container resource usage
docker stats $(docker-compose -f docker-compose.production.yml ps -q)

# Disk usage
df -h /var/lib/abunfi
du -sh /var/log/abunfi/*
```

## 🔄 Updates & Maintenance

### **Application Updates**
```bash
# Pull latest code
git pull origin main

# Rebuild and deploy
DOMAIN_NAME=your-domain.com ./scripts/deploy-production-only.sh
```

### **System Maintenance**
```bash
# Clean up old images
docker system prune -f

# Update base images
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d --force-recreate
```

## 🎯 Best Practices

1. **Security**
   - Use strong, unique passwords
   - Regularly update base images
   - Monitor SSL certificate expiry
   - Implement proper backup strategy

2. **Performance**
   - Monitor resource usage
   - Optimize database queries
   - Use CDN for static assets
   - Implement proper caching

3. **Reliability**
   - Set up monitoring and alerting
   - Test backup and recovery procedures
   - Document incident response procedures
   - Maintain deployment runbooks

4. **Maintenance**
   - Regular security updates
   - Database maintenance tasks
   - Log rotation and cleanup
   - Performance monitoring

This production-only setup provides a clean, secure, and maintainable deployment solution for Abunfi! 🚀
