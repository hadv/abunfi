# Contract Addresses - Quick Summary

## 🎯 Where Are These Addresses Used?

The contract addresses from `.env.prod` are used throughout your application to interact with deployed smart contracts on Sepolia testnet.

---

## 📋 The 5 Contract Addresses

```bash
# 1. Strategy Manager - Manages fund allocation across strategies
STRATEGY_MANAGER_ADDRESS=0xC3fe56D16454cd3e7176675aB221CFD364964a68

# 2. USDC Token - The stablecoin users deposit
USDC_CONTRACT_ADDRESS=0x65a52CC89185A86ebd7e56761A3CD229Aa4669f1

# 3. Aave Strategy - Lends funds to Aave protocol
AAVE_STRATEGY_ADDRESS=0x050B21B2191eA6dEB0f12fD4fd40C7b59f6E397a

# 4. Compound Strategy - Lends funds to Compound protocol
COMPOUND_STRATEGY_ADDRESS=0xC8235CE9F96aa2D8b21Bee4Ee99a47B45C30b7f1

# 5. Liquid Staking Strategy - Stakes ETH for yield
LIQUID_STAKING_STRATEGY_ADDRESS=0x31B602db32404AB15a41075774ccAF66918edA8c
```

---

## 🔧 Backend Usage

### **Main File**: `backend/src/config/blockchain.js`

This file initializes all smart contracts using ethers.js:

```javascript
// Initializes contracts when backend starts
this.strategyManagerContract = new ethers.Contract(
  process.env.STRATEGY_MANAGER_ADDRESS,  // ← Your address
  STRATEGY_MANAGER_ABI,
  this.provider
);

this.usdcContract = new ethers.Contract(
  process.env.USDC_CONTRACT_ADDRESS,  // ← Your address
  USDC_ABI,
  this.provider
);

this.strategyContracts.aave = new ethers.Contract(
  process.env.AAVE_STRATEGY_ADDRESS,  // ← Your address
  AAVE_STRATEGY_ABI,
  this.provider
);

// ... and so on for Compound and Liquid Staking
```

### **API Endpoints That Use These Addresses**

| Endpoint | Uses | What It Does |
|----------|------|--------------|
| `GET /api/admin/strategies/overview` | All strategy addresses | Gets list of all strategies with balances |
| `GET /api/admin/strategies/distribution` | All strategy addresses | Shows how funds are distributed (40% Aave, 35% Compound, 25% Liquid Staking) |
| `GET /api/admin/strategies/performance` | All strategy addresses | Gets APY, risk scores, performance metrics |
| `POST /api/vault/deposit` | USDC, Vault, Strategy Manager | Handles user deposits |
| `POST /api/vault/withdraw` | USDC, Vault, Strategy Manager | Handles user withdrawals |

---

## ⚛️ Frontend Usage

### **Main Files**:
1. `frontend/src/hooks/useContract.js` - React hook for contracts
2. `frontend/src/services/blockchainService.js` - Direct contract calls

### **Pages That Display This Data**:

1. **Strategy Manager Dashboard** (`/strategy-manager`)
   - Shows pie chart of fund distribution
   - Displays APY for each strategy
   - Shows total assets in each strategy
   - **Uses**: All 5 contract addresses

2. **Savings Page** (`/savings`)
   - Deposit/withdraw interface
   - Shows your balance
   - **Uses**: USDC and Vault addresses

---

## 📊 Real Example: User Deposits $100

Here's what happens when a user deposits $100:

```
1. User clicks "Deposit $100" on frontend
   ↓
2. Frontend approves USDC spending
   Uses: USDC_CONTRACT_ADDRESS
   ↓
3. Frontend calls Vault.deposit()
   Uses: VAULT_CONTRACT_ADDRESS
   ↓
4. Vault triggers StrategyManager
   Uses: STRATEGY_MANAGER_ADDRESS
   ↓
5. StrategyManager allocates funds:
   - $40 → Aave Strategy (AAVE_STRATEGY_ADDRESS)
   - $35 → Compound Strategy (COMPOUND_STRATEGY_ADDRESS)
   - $25 → Liquid Staking (LIQUID_STAKING_STRATEGY_ADDRESS)
   ↓
6. Dashboard updates showing new balances
   Fetches data from all strategy addresses
```

---

## 🎯 What Each Address Does

### 1. **STRATEGY_MANAGER_ADDRESS**
**Purpose**: Central controller that manages all strategies

**What it does**:
- Keeps track of all registered strategies
- Decides how to allocate funds (40% Aave, 35% Compound, 25% Liquid Staking)
- Rebalances funds when needed
- Provides total assets across all strategies

**Used by**:
- Backend: `blockchain.js`, `strategyManagerController.js`
- Frontend: `StrategyManagerDashboard.js`

---

### 2. **USDC_CONTRACT_ADDRESS**
**Purpose**: The stablecoin token users deposit

**What it does**:
- ERC20 token contract
- Users approve spending before deposits
- Tracks user balances
- Transfers tokens to vault

**Used by**:
- Backend: `blockchain.js`, `vaultController.js`
- Frontend: `SavingsPage.js` (for approvals and balance checks)

---

### 3. **AAVE_STRATEGY_ADDRESS**
**Purpose**: Lends funds to Aave protocol for yield

**What it does**:
- Receives 40% of deposited funds
- Lends to Aave lending protocol
- Earns ~5.2% APY
- Returns funds when users withdraw

**Used by**:
- Backend: `blockchain.js`, `strategyManagerController.js`
- Frontend: `StrategyManagerDashboard.js` (shows Aave performance)

---

### 4. **COMPOUND_STRATEGY_ADDRESS**
**Purpose**: Lends funds to Compound protocol for yield

**What it does**:
- Receives 35% of deposited funds
- Lends to Compound lending protocol
- Earns ~4.8% APY
- Returns funds when users withdraw

**Used by**:
- Backend: `blockchain.js`, `strategyManagerController.js`
- Frontend: `StrategyManagerDashboard.js` (shows Compound performance)

---

### 5. **LIQUID_STAKING_STRATEGY_ADDRESS**
**Purpose**: Stakes ETH for staking rewards

**What it does**:
- Receives 25% of deposited funds
- Stakes ETH in liquid staking protocols
- Earns ~6.5% APY (higher risk, higher reward)
- Returns funds when users withdraw

**Used by**:
- Backend: `blockchain.js`, `strategyManagerController.js`
- Frontend: `StrategyManagerDashboard.js` (shows staking performance)

---

## 🔍 How to Verify These Addresses

### **On Etherscan**:

1. **Vault**: https://sepolia.etherscan.io/address/0x094eDDFADDd34336853Ca4f738165f39D78532EE
2. **Strategy Manager**: https://sepolia.etherscan.io/address/0xC3fe56D16454cd3e7176675aB221CFD364964a68
3. **USDC**: https://sepolia.etherscan.io/address/0x65a52CC89185A86ebd7e56761A3CD229Aa4669f1
4. **Aave Strategy**: https://sepolia.etherscan.io/address/0x050B21B2191eA6dEB0f12fD4fd40C7b59f6E397a
5. **Compound Strategy**: https://sepolia.etherscan.io/address/0xC8235CE9F96aa2D8b21Bee4Ee99a47B45C30b7f1
6. **Liquid Staking**: https://sepolia.etherscan.io/address/0x31B602db32404AB15a41075774ccAF66918edA8c

### **In Your Application**:

```bash
# Backend API
curl http://localhost:3001/api/admin/strategies/overview

# Should return JSON with all strategy addresses and their data
```

---

## ✅ Quick Checklist

When deploying, make sure:

- [ ] All 5 addresses are in `.env.prod`
- [ ] Addresses match your deployed contracts on Sepolia
- [ ] Backend can connect to RPC (Infura/Alchemy)
- [ ] Frontend has `REACT_APP_*` versions in `.env.production`
- [ ] API endpoint `/api/admin/strategies/overview` returns data
- [ ] Dashboard shows strategy distribution correctly

---

## 🚀 Testing

### **Test Backend**:
```bash
# Start backend
cd backend && npm start

# Test strategy endpoint
curl http://localhost:3001/api/admin/strategies/overview

# Should return:
{
  "success": true,
  "data": {
    "strategies": [
      {
        "address": "0x050B21B2191eA6dEB0f12fD4fd40C7b59f6E397a",
        "name": "Aave Strategy",
        "totalAssets": "...",
        "apy": 5.2
      },
      // ... more strategies
    ]
  }
}
```

### **Test Frontend**:
```bash
# Start frontend
cd frontend && npm start

# Visit http://localhost:3000/strategy-manager
# Should see:
# - Pie chart with 3 strategies
# - Aave: 40%
# - Compound: 35%
# - Liquid Staking: 25%
```

---

## 📚 Related Documentation

- **Detailed Usage**: `CONTRACT_ADDRESSES_USAGE.md` (comprehensive guide)
- **Environment Setup**: `ENV_CONFIGURATION_GUIDE.md`
- **Quick Reference**: `ENV_QUICK_REFERENCE.md`

---

## 🎓 Summary

**These 5 addresses are the backbone of your DeFi application:**

1. **STRATEGY_MANAGER** - The brain (decides where money goes)
2. **USDC** - The currency (what users deposit)
3. **AAVE_STRATEGY** - Investment option #1 (40% allocation)
4. **COMPOUND_STRATEGY** - Investment option #2 (35% allocation)
5. **LIQUID_STAKING** - Investment option #3 (25% allocation)

**They're used in:**
- ✅ Backend contract initialization
- ✅ API endpoints for strategy data
- ✅ Frontend dashboard displays
- ✅ Deposit/withdraw operations

**Auto-configured by:**
```bash
./scripts/generate-env-prod.sh
```

**All addresses are already deployed on Sepolia and ready to use!** 🚀

