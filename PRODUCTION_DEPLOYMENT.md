# Abunfi Production Deployment Guide

This guide will help you deploy Abunfi to production with Docker Compose, including SSL certificates, reverse proxy, and monitoring.

## 🏗️ Architecture Overview

```
Internet → Nginx (SSL/Reverse Proxy) → Frontend (React) + Backend (Node.js) → PostgreSQL + Redis
```

## 📋 Prerequisites

- **Server**: Ubuntu 20.04+ or similar Linux distribution
- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **Domain**: A registered domain pointing to your server
- **Ports**: 80 and 443 open on your server

## 🚀 Quick Deployment

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again for group changes to take effect
```

### 2. Clone and Configure

```bash
# Clone repository
git clone https://github.com/hadv/abunfi.git
cd abunfi

# Copy environment file
cp .env.prod.example .env.prod

# Edit environment variables
nano .env.prod
```

### 3. Configure Environment Variables

Update `.env.prod` with your actual values:

```bash
# Domain Configuration
DOMAIN_NAME=your-domain.com

# Database Configuration
POSTGRES_PASSWORD=your_secure_postgres_password_here

# Application Security
JWT_SECRET=your_super_secure_jwt_secret_key_minimum_32_characters

# Blockchain Configuration
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
CHAIN_ID=11155111

# Smart Contract Addresses (update after deployment)
VAULT_CONTRACT_ADDRESS=0x...

# Web3Auth Configuration
WEB3AUTH_CLIENT_ID=your_web3auth_client_id_here
```

### 4. Update Frontend Environment

Edit `frontend/.env.production`:

```bash
REACT_APP_API_URL=https://your-domain.com/api
REACT_APP_WEB3AUTH_CLIENT_ID=your_web3auth_client_id_here
REACT_APP_CHAIN_ID=11155111
REACT_APP_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
REACT_APP_VAULT_CONTRACT_ADDRESS=0x...
```

### 5. Deploy

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Deploy with SSL
DOMAIN_NAME=your-domain.com EMAIL=admin@your-domain.com ./scripts/deploy-production.sh
```

## 🔒 SSL Certificate Setup

The deployment script automatically sets up SSL certificates using Let's Encrypt. If you need to set up SSL manually:

```bash
# Setup SSL certificates
DOMAIN_NAME=your-domain.com EMAIL=admin@your-domain.com ./scripts/ssl-setup.sh
```

## 📊 Monitoring and Maintenance

### Health Checks

```bash
# Check all services
docker-compose -f docker-compose.prod.yml ps

# Check specific service health
docker-compose -f docker-compose.prod.yml exec backend curl http://localhost:3001/health

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Backup

```bash
# Create backup
./scripts/backup.sh

# Backups are stored in ./backups/ directory
```

### Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart services
docker-compose -f docker-compose.prod.yml up -d --build

# Check health after update
curl https://your-domain.com/health
```

## 🔧 Configuration Details

### Nginx Configuration

- **SSL/TLS**: Automatic HTTPS redirect, modern SSL configuration
- **Security Headers**: HSTS, CSP, XSS protection
- **Rate Limiting**: API and login rate limiting
- **Compression**: Gzip compression for static assets
- **Caching**: Static asset caching with proper headers

### Database Configuration

- **PostgreSQL 16**: Optimized for production workloads
- **Connection Pooling**: Configured for 200 max connections
- **Performance Tuning**: Optimized shared_buffers, effective_cache_size
- **Health Checks**: Automatic health monitoring
- **Backups**: Automated daily backups

### Redis Configuration

- **Memory Management**: 256MB max memory with LRU eviction
- **Persistence**: AOF + RDB for data durability
- **Performance**: Optimized for caching and sessions

## 🚨 Troubleshooting

### Common Issues

1. **SSL Certificate Issues**
   ```bash
   # Check certificate status
   docker-compose -f docker-compose.prod.yml logs certbot
   
   # Renew certificates manually
   docker-compose -f docker-compose.prod.yml run --rm certbot renew
   ```

2. **Database Connection Issues**
   ```bash
   # Check PostgreSQL logs
   docker-compose -f docker-compose.prod.yml logs postgres
   
   # Connect to database
   docker-compose -f docker-compose.prod.yml exec postgres psql -U abunfi_user -d abunfi
   ```

3. **Application Not Starting**
   ```bash
   # Check backend logs
   docker-compose -f docker-compose.prod.yml logs backend
   
   # Check environment variables
   docker-compose -f docker-compose.prod.yml exec backend env
   ```

### Performance Monitoring

```bash
# Monitor resource usage
docker stats

# Check disk usage
df -h
docker system df

# Monitor logs
tail -f /var/log/nginx/access.log
```

## 🔐 Security Considerations

1. **Firewall**: Only ports 80, 443, and SSH should be open
2. **SSH**: Use key-based authentication, disable password auth
3. **Updates**: Keep system and Docker updated
4. **Secrets**: Use strong passwords and rotate regularly
5. **Monitoring**: Set up log monitoring and alerting
6. **Backups**: Test backup restoration regularly

## 📈 Scaling

For high-traffic scenarios:

1. **Load Balancer**: Add multiple backend instances
2. **Database**: Consider read replicas
3. **CDN**: Use CloudFlare or similar for static assets
4. **Monitoring**: Add Prometheus + Grafana
5. **Caching**: Implement Redis clustering

## 📞 Support

- **Logs**: Check `docker-compose -f docker-compose.prod.yml logs`
- **Health**: Monitor `/health` endpoint
- **Metrics**: Available at `/metrics` (if enabled)
- **Documentation**: See `docs/` directory for detailed guides
