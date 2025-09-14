# Abunfi - Micro-Saving DeFi Platform

## 📖 Overview

Abunfi is an easy DeFi savings platform designed for global users. The application allows users to deposit small amounts (from $10) and earn attractive interest rates from reputable DeFi protocols.

## 🎯 Goals

- **Break financial barriers**: Allow everyone to access DeFi with small amounts
- **Simplify experience**: Hide blockchain complexity
- **Safe and transparent**: Use audited smart contracts
- **Optimized for global users**: English interface, USD support

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │ Smart Contracts │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (Solidity)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web3Auth      │    │    MongoDB      │    │ Arbitrum/Base   │
│ (Social Login)  │    │   (Database)    │    │   (Layer 2)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Key Features

### 1. Super Fast Registration
- Login with Google/Apple/Facebook via Web3Auth
- Automatically create secure blockchain wallet
- No need to remember private key

### 2. Easy Savings
- Minimum amount: $10
- Attractive interest rates: ~8%/year
- Flexible withdrawals 24/7

### 3. User-Friendly Interface
- Simple, easy-to-use design
- Display figures in USD
- Intuitive dashboard

### 4. Safe & Transparent
- Audited smart contracts
- Integration with Aave Protocol
- All transactions are transparent

## 🛠️ Tech Stack

### Frontend
- **React 18**: UI framework
- **Material-UI**: Component library
- **Web3Auth**: Social login & wallet
- **ethers.js**: Blockchain interaction
- **React Query**: Data fetching
- **Framer Motion**: Animations

### Backend
- **Node.js**: Runtime environment
- **Express**: Web framework
- **MongoDB**: Database
- **ethers.js**: Blockchain interaction
- **JWT**: Authentication

### Smart Contracts
- **Solidity**: Smart contract language
- **Hardhat**: Development framework
- **OpenZeppelin**: Security libraries
- **Aave V3**: Yield generation

### Blockchain
- **Arbitrum One**: Main network
- **Base**: Alternative L2
- **Account Abstraction**: ERC-4337

## 📋 Installation and Setup

### System Requirements
- Node.js >= 18
- npm or yarn
- MongoDB
- Git

### 1. Clone repository
```bash
git clone <repository-url>
cd abunfi
```

### 2. Install Dependencies
```bash
npm run install:all
```

### 3. Cấu hình environment
```bash
# Copy và chỉnh sửa file .env
cp contracts/.env.example contracts/.env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 4. Chạy development
```bash
# Chạy tất cả services
npm run dev

# Or run each service separately
npm run dev:contracts  # Hardhat node
npm run dev:backend    # API server
npm run dev:frontend   # React app
```

### 5. Deploy smart contracts
```bash
cd contracts
npm run deploy
```

## 🧪 Testing

```bash
# Test smart contracts
npm run test:contracts

# Test backend
npm run test:backend

# Test frontend
npm run test:frontend

# Test tất cả
npm test
```

## 📚 API Documentation

### Authentication
- `POST /api/auth/social-login` - Social login
- `POST /api/auth/phone-login` - Phone number login
- `POST /api/auth/logout` - Logout

### User
- `GET /api/user/profile` - Get user information
- `PUT /api/user/profile` - Update information
- `GET /api/user/dashboard` - Dashboard data

### Vault
- `GET /api/vault/stats` - Vault statistics
- `GET /api/vault/portfolio` - Portfolio user
- `POST /api/vault/estimate-deposit` - Estimate deposit
- `POST /api/vault/estimate-withdraw` - Estimate withdrawal

### Transactions
- `GET /api/transactions` - Lịch sử giao dịch
- `GET /api/transactions/:id` - Chi tiết giao dịch

## 🔐 Bảo mật

### Smart Contracts
- Sử dụng OpenZeppelin libraries
- Audited by reputable companies
- Timelock for important changes

### Backend
- JWT authentication
- Rate limiting
- Input validation
- CORS protection

### Frontend
- CSP headers
- XSS protection
- Secure cookie handling

## 🚀 Deployment

### Smart Contracts
```bash
# Deploy to testnet
npm run deploy:testnet

# Deploy to mainnet
npm run deploy
```

### Backend
```bash
# Build
npm run build:backend

# Deploy to server
pm2 start ecosystem.config.js
```

### Frontend
```bash
# Build
npm run build:frontend

# Deploy to CDN/hosting
```

## 📊 Monitoring

- **Smart Contracts**: Etherscan, Arbiscan
- **Backend**: Winston logs, PM2 monitoring
- **Frontend**: Error tracking, Analytics

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📄 License

MIT License - see [LICENSE](../LICENSE) file for more details.

## 📞 Contact

- **Website**: https://abunfi.com
- **Email**: support@abunfi.com
- **Telegram**: @abunfi_support

## 🗺️ Roadmap

### Phase 1 (MVP) ✅
- [x] Basic smart contracts
- [x] Frontend React app
- [x] Backend API
- [x] Social login integration

### Phase 2 (Q3/Q4 2025)
- [ ] Mobile app (React Native)
- [ ] Advanced strategies
- [ ] Referral system
- [ ] KYC integration

### Phase 3 (Q1 2026)
- [ ] Multi-chain support
- [ ] Governance token
- [ ] Advanced analytics
- [ ] Institutional features

### Phase 4 (Q4 2024)
- [ ] Cross-chain bridges
- [ ] Lending/borrowing
- [ ] Insurance integration
- [ ] Global expansion
