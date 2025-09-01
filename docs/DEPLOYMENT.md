# Hướng dẫn Deployment - Abunfi

## 📋 Tổng quan

Tài liệu này hướng dẫn cách deploy dự án Abunfi lên các môi trường khác nhau.

## 🚀 Quick Start

### 1. Development Environment

```bash
# Clone repository
git clone <repository-url>
cd abunfi

# Setup environment
chmod +x scripts/setup.sh
./scripts/setup.sh

# Start development
npm run dev
```

### 2. Docker Development

```bash
# Start all services with Docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🏗️ Production Deployment

### Smart Contracts

#### Sepolia Testnet (Recommended for Production Testing)
```bash
cd contracts-submodule

# Configure environment
cp .env.example .env
# Update .env with Sepolia testnet configuration
# Set SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
# Set PRIVATE_KEY=your_private_key_here
# Set ETHERSCAN_API_KEY=your_etherscan_api_key

# Deploy to Sepolia
npm run deploy:sepolia

# Verify contracts (automatic with --verify flag)
```

#### Arbitrum Mainnet (Alternative)
```bash
# Deploy to Arbitrum
npm run deploy -- --network arbitrumOne

# Verify contracts
npm run verify -- --network arbitrumOne
```

### Backend API

#### Using PM2 (Recommended)
```bash
cd backend

# Install PM2 globally
npm install -g pm2

# Build application
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Using Docker
```bash
# Build Docker image
docker build -t abunfi-backend ./backend

# Run container
docker run -d \
  --name abunfi-backend \
  -p 3001:3001 \
  --env-file backend/.env.production \
  abunfi-backend
```

### Frontend

#### Static Hosting (Vercel/Netlify)
```bash
cd frontend

# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Or deploy to Netlify
netlify deploy --prod --dir=build
```

#### Using Nginx
```bash
# Build application
cd frontend
npm run build

# Copy build files to web server
sudo cp -r build/* /var/www/abunfi/

# Configure Nginx
sudo nano /etc/nginx/sites-available/abunfi
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name abunfi.com www.abunfi.com;
    
    root /var/www/abunfi;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔧 Environment Configuration

### Smart Contracts (.env)
```bash
PRIVATE_KEY=your_private_key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
ETHERSCAN_API_KEY=your_etherscan_api_key
# Optional: Keep Arbitrum config for alternative deployment
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
ARBISCAN_API_KEY=your_arbiscan_api_key
```

### Backend (.env.production)
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://username:password@host:port/abunfi
JWT_SECRET=your_super_secret_jwt_key
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
CHAIN_ID=11155111
VAULT_CONTRACT_ADDRESS=0x...
CORS_ORIGIN=https://abunfi.com
```

### Frontend (.env.production)
```bash
REACT_APP_API_URL=https://api.abunfi.com
REACT_APP_WEB3AUTH_CLIENT_ID=your_web3auth_client_id
REACT_APP_CHAIN_ID=11155111
REACT_APP_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
REACT_APP_VAULT_CONTRACT_ADDRESS=0x...
```

## 🗄️ Database Setup

### MongoDB Atlas (Recommended)
1. Tạo cluster trên MongoDB Atlas
2. Tạo database user
3. Whitelist IP addresses
4. Copy connection string

### Self-hosted MongoDB
```bash
# Install MongoDB
sudo apt update
sudo apt install -y mongodb

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Create database and user
mongo
> use abunfi
> db.createUser({
    user: "abunfi_user",
    pwd: "secure_password",
    roles: ["readWrite"]
})
```

## 🔐 Security Checklist

### Smart Contracts
- [ ] Contracts audited by reputable firm
- [ ] Timelock implemented for critical functions
- [ ] Multi-sig wallet for admin functions
- [ ] Emergency pause mechanism tested

### Backend
- [ ] Environment variables secured
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] JWT secrets rotated regularly
- [ ] Database access restricted
- [ ] HTTPS enforced
- [ ] Security headers implemented

### Frontend
- [ ] Environment variables for production
- [ ] CSP headers configured
- [ ] XSS protection enabled
- [ ] Secure cookie settings
- [ ] HTTPS enforced

## 📊 Monitoring & Logging

### Application Monitoring
```bash
# Install monitoring tools
npm install -g pm2-logrotate
pm2 install pm2-server-monit

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### Blockchain Monitoring
- Monitor contract events
- Track gas usage
- Alert on failed transactions
- Monitor yield generation

### Health Checks
```bash
# Backend health check
curl https://api.abunfi.com/health

# Frontend health check
curl https://abunfi.com

# Database health check
mongo --eval "db.adminCommand('ping')"
```

## 🚨 Backup & Recovery

### Database Backup
```bash
# Create backup
mongodump --uri="mongodb://user:pass@host:port/abunfi" --out=/backup/$(date +%Y%m%d)

# Restore backup
mongorestore --uri="mongodb://user:pass@host:port/abunfi" /backup/20240101/abunfi
```

### Smart Contract Backup
- Store deployment artifacts
- Backup private keys securely
- Document contract addresses
- Keep ABI files accessible

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm run install:all
        
      - name: Run tests
        run: npm test
        
      - name: Build frontend
        run: cd frontend && npm run build
        
      - name: Deploy to server
        run: |
          # Deploy commands here
```

## 📞 Support & Troubleshooting

### Common Issues

1. **Contract deployment fails**
   - Check gas price and limit
   - Verify network configuration
   - Ensure sufficient ETH balance

2. **Backend connection issues**
   - Check MongoDB connection
   - Verify environment variables
   - Check firewall settings

3. **Frontend build errors**
   - Clear node_modules and reinstall
   - Check environment variables
   - Verify API endpoints

### Getting Help
- Check logs: `pm2 logs`
- Monitor resources: `pm2 monit`
- Database status: `mongo --eval "db.stats()"`
- Contract verification: Check on Arbiscan/Basescan

## 📈 Performance Optimization

### Backend
- Enable compression
- Implement caching (Redis)
- Database indexing
- Connection pooling

### Frontend
- Code splitting
- Image optimization
- CDN usage
- Service worker caching

### Smart Contracts
- Gas optimization
- Batch operations
- Efficient data structures
- Minimal external calls
