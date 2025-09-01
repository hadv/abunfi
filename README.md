# Abunfi - Micro-Saving for All

Abunfi là một ứng dụng DeFi tiết kiệm vi mô được thiết kế đặc biệt cho người Việt Nam, cho phép người dùng gửi tiết kiệm những khoản tiền nhỏ (từ 10,000 VNĐ) và nhận lãi suất hấp dẫn từ các chiến lược đầu tư DeFi đa dạng.

## 🎯 Sứ mệnh

Phá vỡ rào cản tài chính, mang lại khả năng tiết kiệm và sinh lời cho tất cả mọi người, đặc biệt là giới trẻ và những người dùng phổ thông chưa quen với crypto.

## 🏗️ Kiến trúc

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

## 🚀 Tính năng chính

- **Đăng ký siêu tốc**: Sử dụng Account Abstraction, đăng nhập bằng Google/Apple
- **Gửi tiết kiệm dễ dàng**: Từ 10,000 VNĐ với giao diện thân thiện
- **Lãi suất hấp dẫn**: 6-12%/năm từ các chiến lược đầu tư đa dạng
- **Theo dõi lợi nhuận**: Dashboard trực quan, cập nhật real-time
- **Rút tiền linh hoạt**: Rút cả gốc và lãi bất cứ lúc nào
- **Quản lý rủi ro thông minh**: Phân bổ tự động giữa các chiến lược

## 💼 Chiến lược đầu tư

### 🏦 Chiến lược Bảo thủ (Rủi ro thấp)
- **Lending Protocols**: Aave, Compound - APY 4-6%
- **Stablecoin Farming**: Curve, Convex - APY 3-5%

### ⚖️ Chiến lược Cân bằng (Rủi ro trung bình)
- **Liquidity Providing**: Cung cấp thanh khoản cho các cặp stablecoin (USDC/USDT) trên Curve, Uniswap V3 - APY 5-8%

### 🚀 Chiến lược Nâng cao (Rủi ro trung bình-cao)
- **Liquid Staking**: stETH, rETH để kiếm lợi nhuận từ staking Ethereum - APY 4-6%
- **Yield Farming**: Convex, Yearn Finance - APY 8-15%

## 🛠️ Tech Stack

### Frontend
- **React 18** với TypeScript
- **Material-UI** cho giao diện người dùng
- **Web3Auth** cho xác thực đa nền tảng
- **Ethers.js** cho tương tác blockchain
- **Recharts** cho data visualization
- **WebSocket** cho real-time updates

### Backend
- **Node.js** với Express.js
- **PostgreSQL** cho dữ liệu tài chính
- **In-memory Cache** cho caching và sessions (thay thế Redis)
- **JWT** cho xác thực API
- **WebSocket** cho cập nhật real-time
- **Role-based Access Control** cho Strategy Manager

### Blockchain
- **Arbitrum One** (Layer 2 của Ethereum)
- **Solidity** cho smart contracts
- **Foundry** cho testing và deployment
- **Account Abstraction** cho UX tốt hơn

### DeFi Integration
- **Aave, Curve, Lido, Rocket Pool, Uniswap V3**

## 📋 Yêu cầu hệ thống

- Node.js >= 18
- npm hoặc yarn
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

**Access**: `http://localhost:3000/strategy-manager`

**Test Accounts**:
- `manager@abunfi.com` (Strategy Manager) - ✅ Full access
- `admin@abunfi.com` (Admin) - ✅ Full access
- `user@abunfi.com` (Regular User) - ❌ Access denied

## 📚 Documentation

### Development Guides
- **[Quick Start Guide](docs/QUICK_START.md)** - Get running in 5 minutes ⚡
- **[Development Setup](docs/DEVELOPMENT_SETUP.md)** - Comprehensive setup guide 🔧
- **[Strategy Manager Dashboard](docs/STRATEGY_MANAGER_DASHBOARD.md)** - Dashboard documentation 📊

### Technical Documentation
- [`STRATEGIES.md`](docs/STRATEGIES.md) - Chi tiết về các chiến lược đầu tư
- [`DEPLOYMENT.md`](docs/DEPLOYMENT.md) - Hướng dẫn deployment
- [`README.md`](docs/README.md) - Tài liệu kỹ thuật

## 🔒 Bảo mật

- Smart contracts được audit bởi các công ty bảo mật uy tín
- Quản lý rủi ro tự động với phân bổ động
- Đa dạng hóa giữa các protocols để giảm thiểu rủi ro tập trung
- Emergency withdrawal mechanisms

## 🤝 Đóng góp

Chúng tôi hoan nghênh mọi đóng góp! Vui lòng đọc hướng dẫn đóng góp trước khi submit PR.

## 📄 License

MIT License
