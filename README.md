# Abunfi - Micro-Saving for All

Abunfi là một ứng dụng DeFi tiết kiệm vi mô được thiết kế đặc biệt cho người Việt Nam, cho phép người dùng gửi tiết kiệm những khoản tiền nhỏ (từ 10,000 VNĐ) và nhận lãi suất hấp dẫn từ các chiến lược đầu tư DeFi đa dạng.

## 🎯 Sứ mệnh

Phá vỡ rào cản tài chính, mang lại khả năng tiết kiệm và sinh lời cho tất cả mọi người, đặc biệt là giới trẻ và những người dùng phổ thông chưa quen với crypto.

## 🏗️ Kiến trúc

```
abunfi/
├── contracts/          # Smart contracts (Solidity)
│   ├── strategies/     # Investment strategies
│   └── interfaces/     # Contract interfaces
├── backend/            # Node.js API server
├── frontend/           # React web application
├── docs/              # Documentation
└── scripts/           # Deployment & utility scripts
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

- **Blockchain**: Arbitrum/Base (Layer 2)
- **Smart Contracts**: Solidity, Hardhat
- **Backend**: Node.js, Express, MongoDB
- **Frontend**: React, ethers.js, Web3Auth
- **DeFi Integration**: Aave, Curve, Lido, Rocket Pool, Uniswap V3

## 📋 Yêu cầu hệ thống

- Node.js >= 18
- npm hoặc yarn
- Git

## 🏃‍♂️ Bắt đầu nhanh

```bash
# Clone repository
git clone <repo-url>
cd abunfi

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```

## 📚 Documentation

Xem thêm tài liệu chi tiết trong thư mục `docs/`:

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
