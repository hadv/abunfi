# Abunfi - Micro-Saving DeFi Platform

## 📖 Tổng quan

Abunfi là một nền tảng DeFi tiết kiệm dễ dàng được thiết kế đặc biệt cho người Việt Nam. Ứng dụng cho phép người dùng gửi tiết kiệm những khoản tiền nhỏ (từ 10,000 VNĐ) và nhận lãi suất hấp dẫn từ các giao thức DeFi uy tín.

## 🎯 Mục tiêu

- **Phá vỡ rào cản tài chính**: Cho phép mọi người tiếp cận DeFi với số tiền nhỏ
- **Đơn giản hóa trải nghiệm**: Ẩn đi sự phức tạp của blockchain
- **An toàn và minh bạch**: Sử dụng smart contracts được kiểm toán
- **Tối ưu cho người Việt**: Giao diện tiếng Việt, hỗ trợ VNĐ

## 🏗️ Kiến trúc hệ thống

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

## 🚀 Tính năng chính

### 1. Đăng ký siêu tốc
- Đăng nhập bằng Google/Apple/Facebook qua Web3Auth
- Tự động tạo ví blockchain an toàn
- Không cần nhớ private key

### 2. Tiết kiệm dễ dàng
- Số tiền tối thiểu: 10,000 VNĐ (~$4)
- Lãi suất hấp dẫn: ~8%/năm
- Rút tiền linh hoạt 24/7

### 3. Giao diện thân thiện
- Thiết kế đơn giản, dễ sử dụng
- Hiển thị số liệu bằng VNĐ
- Dashboard trực quan

### 4. An toàn & minh bạch
- Smart contracts được kiểm toán
- Tích hợp với Aave Protocol
- Mọi giao dịch đều minh bạch

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

## 📋 Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js >= 18
- npm hoặc yarn
- MongoDB
- Git

### 1. Clone repository
```bash
git clone <repository-url>
cd abunfi
```

### 2. Cài đặt dependencies
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

# Hoặc chạy từng service riêng
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
- `POST /api/auth/social-login` - Đăng nhập social
- `POST /api/auth/phone-login` - Đăng nhập số điện thoại
- `POST /api/auth/logout` - Đăng xuất

### User
- `GET /api/user/profile` - Lấy thông tin user
- `PUT /api/user/profile` - Cập nhật thông tin
- `GET /api/user/dashboard` - Dashboard data

### Vault
- `GET /api/vault/stats` - Thống kê vault
- `GET /api/vault/portfolio` - Portfolio user
- `POST /api/vault/estimate-deposit` - Ước tính gửi tiền
- `POST /api/vault/estimate-withdraw` - Ước tính rút tiền

### Transactions
- `GET /api/transactions` - Lịch sử giao dịch
- `GET /api/transactions/:id` - Chi tiết giao dịch

## 🔐 Bảo mật

### Smart Contracts
- Sử dụng OpenZeppelin libraries
- Kiểm toán bởi các công ty uy tín
- Timelock cho các thay đổi quan trọng

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

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📄 License

MIT License - xem file [LICENSE](../LICENSE) để biết thêm chi tiết.

## 📞 Liên hệ

- **Website**: https://abunfi.com
- **Email**: support@abunfi.com
- **Telegram**: @abunfi_support

## 🗺️ Roadmap

### Phase 1 (MVP) ✅
- [x] Smart contracts cơ bản
- [x] Frontend React app
- [x] Backend API
- [x] Social login integration

### Phase 2 (Q2 2024)
- [ ] Mobile app (React Native)
- [ ] Advanced strategies
- [ ] Referral system
- [ ] KYC integration

### Phase 3 (Q3 2024)
- [ ] Multi-chain support
- [ ] Governance token
- [ ] Advanced analytics
- [ ] Institutional features

### Phase 4 (Q4 2024)
- [ ] Cross-chain bridges
- [ ] Lending/borrowing
- [ ] Insurance integration
- [ ] Global expansion
