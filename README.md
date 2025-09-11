# Abunfi - Micro-Saving for All

Abunfi is a micro-savings DeFi application designed for global users, allowing people to save small amounts (starting from $10) and earn attractive interest rates from diverse DeFi investment strategies.

## 🎯 Mission

Breaking down financial barriers, bringing savings and earning opportunities to everyone, especially young people and everyday users who are new to crypto.

## 🏗️ Architecture

```
abunfi/
├── backend/            # Node.js API server
├── frontend/           # React web application
├── docs/              # Documentation
└── scripts/           # Deployment & utility scripts

abunfi-contracts/       # Smart contracts repository (separate)
├── src/               # Smart contracts (Solidity)
│   ├── strategies/    # Investment strategies
│   ├── interfaces/    # Contract interfaces
│   └── mocks/         # Mock contracts for testing
├── test/              # Forge tests
├── script/            # Deployment scripts
└── exports/           # Contract ABIs for integration
```

## 🚀 Key Features

- **Super Fast Registration**: Using Account Abstraction, login with Google/Apple
- **Easy Savings**: Starting from $10 with user-friendly interface
- **Attractive Interest Rates**: 6-12% APY from diverse investment strategies
- **Profit Tracking**: Intuitive dashboard with real-time updates
- **Flexible Withdrawals**: Withdraw principal and interest anytime
- **Smart Risk Management**: Automatic allocation between strategies

## 💼 Investment Strategies

### 🏦 Conservative Strategy (Low Risk)
- **Lending Protocols**: Aave, Compound - APY 4-6%
- **Stablecoin Farming**: Curve, Convex - APY 3-5%

### ⚖️ Balanced Strategy (Medium Risk)
- **Liquidity Providing**: Providing liquidity for stablecoin pairs (USDC/USDT) on Curve, Uniswap V3 - APY 5-8%

### 🦄 Uniswap V4 FairFlow Strategy (Medium Risk - NEW!)
- **Concentrated Liquidity**: Using Uniswap V4 with concentrated liquidity for stablecoin pairs - APY 8-12%
- **Dynamic Fee Optimization**: Dynamic fee optimization based on market conditions
- **Automated Rebalancing**: Automatic rebalancing to maintain optimal efficiency
- **Gas Efficiency**: Leveraging V4's singleton architecture to reduce gas costs

### 🚀 Advanced Strategy (Medium-High Risk)
- **Liquid Staking**: stETH, rETH to earn profits from Ethereum staking - APY 4-6%
- **Yield Farming**: Convex, Yearn Finance - APY 8-15%

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Material-UI** for user interface
- **Web3Auth** for multi-platform authentication
- **Ethers.js** for blockchain interaction
- **Recharts** for data visualization
- **WebSocket** for real-time updates

### Backend
- **Node.js** with Express.js
- **PostgreSQL** for financial data
- **In-memory Cache** for caching and sessions (Redis replacement)
- **JWT** for API authentication
- **WebSocket** for real-time updates
- **Role-based Access Control** for Strategy Manager

### Blockchain
- **Arbitrum One** (Ethereum Layer 2)
- **Solidity** for smart contracts
- **Foundry** for testing and deployment
- **Account Abstraction** for better UX

### DeFi Integration
- **Aave, Curve, Lido, Rocket Pool, Uniswap V3**

## 📋 System Requirements

- Node.js >= 18
- npm or yarn
- Git

## 🚀 Development Setup

### ⚡ Quick Start (5 minutes)

```bash
# Clone repository
git clone https://github.com/hadv/abunfi.git
cd abunfi

# Automated database setup
chmod +x scripts/setup-local-db.sh
./scripts/setup-local-db.sh

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Start development servers
cd backend && npm run dev    # Terminal 1
cd frontend && npm start     # Terminal 2
```

### 🎯 Strategy Manager Dashboard

New real-time dashboard for strategy managers:
- **Real-time Data Visualization**: Funds distribution, APY comparison, compound interest
- **Interactive Controls**: Allocation management with auto-rebalancing
- **Role-based Access**: Strategy managers and admins only
- **WebSocket Integration**: Live updates every 30 seconds

**Access**: `http://localhost:3000` → Click "Development Login"

**Test Accounts**:
- `manager@abunfi.com` (Strategy Manager) - ✅ Full access
- `admin@abunfi.com` (Admin) - ✅ Full access
- `user@abunfi.com` (Regular User) - ❌ Access denied

**How to Login**:
1. Open `http://localhost:3000`
2. Click "Development Login" button (development mode only)
3. Select a test account or enter email manually
4. Automatically redirected to appropriate dashboard

## 📚 Documentation

### Development Guides
- **[Quick Start Guide](docs/QUICK_START.md)** - Get running in 5 minutes ⚡
- **[Development Setup](docs/DEVELOPMENT_SETUP.md)** - Comprehensive setup guide 🔧
- **[Strategy Manager Dashboard](docs/STRATEGY_MANAGER_DASHBOARD.md)** - Dashboard documentation 📊

### Technical Documentation
- [`STRATEGIES.md`](docs/STRATEGIES.md) - Details about investment strategies
- [`DEPLOYMENT.md`](docs/DEPLOYMENT.md) - Deployment guide
- [`README.md`](docs/README.md) - Technical documentation

## 🔒 Security

- Smart contracts audited by reputable security firms
- Automatic risk management with dynamic allocation
- Diversification across protocols to minimize concentration risk
- Emergency withdrawal mechanisms

## 🤝 Contributing

We welcome all contributions! Please read the contribution guidelines before submitting PRs.

## 📄 License

MIT License
