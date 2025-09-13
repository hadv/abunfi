# Docker Compose Setup for Abunfi

This document provides a comprehensive guide for deploying Abunfi using Docker Compose with public domain access.

## 📁 File Structure

```
abunfi/
├── docker-compose.yml              # Development configuration
├── docker-compose.prod.yml         # Production configuration
├── docker-compose.override.yml     # Development overrides
├── .env.prod.example              # Production environment template
├── frontend/
│   ├── Dockerfile                 # Frontend container
│   ├── nginx.conf                 # Frontend Nginx config
│   └── .env.production            # Frontend production env
├── backend/
│   └── Dockerfile                 # Backend container
├── nginx/
│   ├── nginx.conf                 # Main Nginx configuration
│   └── conf.d/
│       └── abunfi.conf           # Site-specific configuration
├── redis/
│   └── redis.conf                # Redis configuration
└── scripts/
    ├── quick-start.sh            # Quick deployment script
    ├── deploy-production.sh      # Production deployment
    ├── ssl-setup.sh             # SSL certificate setup
    ├── backup.sh                # Backup script
    └── monitor.sh               # Monitoring script
```

## 🚀 Quick Start

### Option 1: Interactive Quick Start
```bash
./scripts/quick-start.sh
```

### Option 2: Manual Development Setup
```bash
# Start development environment
docker-compose up -d --build

# View logs
docker-compose logs -f

# Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
# Database: localhost:5432
```

### Option 3: Manual Production Setup
```bash
# 1. Configure environment
cp .env.prod.example .env.prod
# Edit .env.prod with your values

# 2. Deploy to production
DOMAIN_NAME=your-domain.com EMAIL=admin@your-domain.com ./scripts/deploy-production.sh

# 3. Monitor deployment
./scripts/monitor.sh
```

## 🏗️ Architecture Components

### 1. Nginx Reverse Proxy
- **SSL/TLS termination** with Let's Encrypt
- **Rate limiting** for API endpoints
- **Security headers** (HSTS, CSP, XSS protection)
- **Gzip compression** for static assets
- **WebSocket support** for real-time features

### 2. Frontend (React)
- **Multi-stage build** for optimized production images
- **Nginx serving** static files with caching
- **Environment-specific** configuration
- **Health checks** for container monitoring

### 3. Backend (Node.js)
- **Express.js API** with comprehensive health checks
- **WebSocket support** for real-time updates
- **Database connections** to PostgreSQL and memory cache
- **Security middleware** and rate limiting

### 4. PostgreSQL Database
- **Production-optimized** configuration
- **Health checks** and monitoring
- **Automated backups** with retention
- **Performance tuning** for concurrent connections

### 5. Memory Cache (Demo Mode)
- **In-memory session management** and caching
- **Lightweight** for demo and development
- **No persistence** - data resets on restart
- **Automatic fallback** when Redis unavailable

### 6. SSL/TLS with Let's Encrypt
- **Automatic certificate** generation and renewal
- **Staging and production** certificate support
- **HTTPS redirect** for all traffic
- **Modern TLS configuration**

## 🔧 Configuration Options

### Environment Variables

#### Production (.env.prod)
```bash
# Domain and SSL
DOMAIN_NAME=your-domain.com

# Database Security
POSTGRES_PASSWORD=secure_password_here

# Application Security
JWT_SECRET=32_character_minimum_secret

# Blockchain Configuration
RPC_URL=https://sepolia.infura.io/v3/PROJECT_ID
CHAIN_ID=11155111
VAULT_CONTRACT_ADDRESS=0x...

# Authentication
WEB3AUTH_CLIENT_ID=your_client_id
```

#### Frontend (.env.production)
```bash
REACT_APP_API_URL=https://your-domain.com/api
REACT_APP_WEB3AUTH_CLIENT_ID=your_client_id
REACT_APP_CHAIN_ID=11155111
REACT_APP_RPC_URL=https://sepolia.infura.io/v3/PROJECT_ID
REACT_APP_VAULT_CONTRACT_ADDRESS=0x...
```

### Nginx Configuration

#### Security Features
- **HSTS** with 1-year max-age
- **Content Security Policy** for XSS protection
- **Rate limiting** (10 req/s for API, 5 req/m for login)
- **Modern TLS** configuration (TLS 1.2+)

#### Performance Features
- **Gzip compression** for text assets
- **Static asset caching** with 1-year expiry
- **Connection keep-alive** for upstream servers
- **HTTP/2 support**

## 📊 Monitoring and Maintenance

### Health Checks
```bash
# Application health
curl https://your-domain.com/health

# Service status
docker-compose -f docker-compose.prod.yml ps

# Resource usage
docker stats

# Comprehensive monitoring
./scripts/monitor.sh
```

### Backup and Recovery
```bash
# Create backup
./scripts/backup.sh

# Backups include:
# - PostgreSQL database dump
# - Redis data snapshot
# - SSL certificates
# - Configuration files
```

### Log Management
```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# Service-specific logs
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs nginx

# Nginx access logs
tail -f nginx_logs/access.log
```

## 🔒 Security Features

### Network Security
- **Internal Docker network** for service communication
- **Exposed ports** only for HTTP/HTTPS (80/443)
- **Database isolation** from external access

### Application Security
- **JWT authentication** with secure secrets
- **Rate limiting** on API endpoints
- **CORS configuration** for frontend domain
- **Input validation** and sanitization

### SSL/TLS Security
- **Automatic HTTPS redirect**
- **Modern cipher suites**
- **HSTS headers** for browser security
- **Certificate auto-renewal**

## 🚨 Troubleshooting

### Common Issues

1. **SSL Certificate Failures**
   ```bash
   # Check certificate status
   docker-compose -f docker-compose.prod.yml logs certbot
   
   # Manual certificate renewal
   ./scripts/ssl-setup.sh
   ```

2. **Database Connection Issues**
   ```bash
   # Check PostgreSQL health
   docker-compose -f docker-compose.prod.yml exec postgres pg_isready
   
   # View database logs
   docker-compose -f docker-compose.prod.yml logs postgres
   ```

3. **Application Startup Issues**
   ```bash
   # Check backend health
   docker-compose -f docker-compose.prod.yml logs backend
   
   # Verify environment variables
   docker-compose -f docker-compose.prod.yml exec backend env | grep -E "(DATABASE_URL|JWT_SECRET)"
   ```

### Performance Issues
```bash
# Monitor resource usage
docker stats

# Check disk space
df -h

# Monitor network connections
netstat -tulpn | grep -E "(80|443|3001|5432|6379)"
```

## 📈 Scaling Considerations

For high-traffic deployments:

1. **Horizontal Scaling**
   - Multiple backend instances behind load balancer
   - Database read replicas
   - Redis clustering

2. **Performance Optimization**
   - CDN for static assets
   - Database connection pooling
   - Caching strategies

3. **Monitoring**
   - Prometheus + Grafana
   - Log aggregation (ELK stack)
   - Application performance monitoring

## 🔄 Updates and Deployment

### Rolling Updates
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart services
docker-compose -f docker-compose.prod.yml up -d --build

# Verify health
./scripts/monitor.sh
```

### Zero-Downtime Deployment
For production environments, consider:
- Blue-green deployment strategy
- Database migration scripts
- Health check validation before traffic switching
