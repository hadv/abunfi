# Contract Addresses Usage Guide

This document explains where and how the contract addresses from `.env.prod` are used throughout the Abunfi application.

---

## 📋 Contract Addresses Overview

These addresses are configured in `.env.prod` and used by both backend and frontend:

```bash
# Core Contracts
VAULT_CONTRACT_ADDRESS=0x094eDDFADDd34336853Ca4f738165f39D78532EE
STRATEGY_MANAGER_ADDRESS=0xC3fe56D16454cd3e7176675aB221CFD364964a68
USDC_CONTRACT_ADDRESS=0x65a52CC89185A86ebd7e56761A3CD229Aa4669f1

# Strategy Contracts
AAVE_STRATEGY_ADDRESS=0x050B21B2191eA6dEB0f12fD4fd40C7b59f6E397a
COMPOUND_STRATEGY_ADDRESS=0xC8235CE9F96aa2D8b21Bee4Ee99a47B45C30b7f1
LIQUID_STAKING_STRATEGY_ADDRESS=0x31B602db32404AB15a41075774ccAF66918edA8c
```

---

## 🔧 Backend Usage

### 1. **Blockchain Service** (`backend/src/config/blockchain.js`)

This is the **main service** that initializes and manages all smart contract interactions.

**File**: `backend/src/config/blockchain.js`

**What it does:**
- Initializes ethers.js contracts for all deployed smart contracts
- Provides methods to interact with the blockchain
- Used by all backend controllers that need blockchain data

**Code snippet:**
```javascript
// Lines 174-213
async initialize() {
  // Initialize Strategy Manager
  if (process.env.STRATEGY_MANAGER_ADDRESS && process.env.STRATEGY_MANAGER_ADDRESS !== '0x...') {
    this.strategyManagerContract = new ethers.Contract(
      process.env.STRATEGY_MANAGER_ADDRESS,  // ← Uses STRATEGY_MANAGER_ADDRESS
      STRATEGY_MANAGER_ABI,
      this.provider
    );
  }

  // Initialize USDC Token
  if (process.env.USDC_CONTRACT_ADDRESS && process.env.USDC_CONTRACT_ADDRESS !== '0x...') {
    this.usdcContract = new ethers.Contract(
      process.env.USDC_CONTRACT_ADDRESS,  // ← Uses USDC_CONTRACT_ADDRESS
      USDC_ABI,
      this.provider
    );
  }

  // Initialize Aave Strategy
  if (process.env.AAVE_STRATEGY_ADDRESS && process.env.AAVE_STRATEGY_ADDRESS !== '0x...') {
    this.strategyContracts.aave = new ethers.Contract(
      process.env.AAVE_STRATEGY_ADDRESS,  // ← Uses AAVE_STRATEGY_ADDRESS
      AAVE_STRATEGY_ABI,
      this.provider
    );
  }

  // Initialize Compound Strategy
  if (process.env.COMPOUND_STRATEGY_ADDRESS && process.env.COMPOUND_STRATEGY_ADDRESS !== '0x...') {
    this.strategyContracts.compound = new ethers.Contract(
      process.env.COMPOUND_STRATEGY_ADDRESS,  // ← Uses COMPOUND_STRATEGY_ADDRESS
      COMPOUND_STRATEGY_ABI,
      this.provider
    );
  }

  // Initialize Liquid Staking Strategy
  if (process.env.LIQUID_STAKING_STRATEGY_ADDRESS && process.env.LIQUID_STAKING_STRATEGY_ADDRESS !== '0x...') {
    this.strategyContracts.liquidStaking = new ethers.Contract(
      process.env.LIQUID_STAKING_STRATEGY_ADDRESS,  // ← Uses LIQUID_STAKING_STRATEGY_ADDRESS
      LIQUID_STAKING_STRATEGY_ABI,
      this.provider
    );
  }
}
```

**Methods that use these contracts:**
- `getAllStrategies()` - Gets all strategy data from StrategyManager
- `getTotalAssets()` - Gets total assets from Vault
- `getStrategyDetails(address)` - Gets specific strategy information
- `getUserBalance(address)` - Gets user's USDC balance
- `getVaultBalance()` - Gets vault's total balance

---

### 2. **Strategy Manager Controller** (`backend/src/controllers/strategyManagerController.js`)

**What it does:**
- Provides API endpoints for strategy data
- Fetches real-time data from blockchain using the addresses
- Calculates APY, performance metrics, and fund distribution

**API Endpoints that use these addresses:**

#### `/api/admin/strategies/overview`
```javascript
// Gets overview of all strategies
const strategies = await blockchainService.getAllStrategies();
// Uses: STRATEGY_MANAGER_ADDRESS to fetch all registered strategies
```

#### `/api/admin/strategies/distribution`
```javascript
// Gets fund distribution across strategies
const strategies = await blockchainService.getAllStrategies();
// Uses: AAVE_STRATEGY_ADDRESS, COMPOUND_STRATEGY_ADDRESS, LIQUID_STAKING_STRATEGY_ADDRESS
// to get balance in each strategy
```

#### `/api/admin/strategies/performance`
```javascript
// Gets performance metrics for each strategy
// Uses all strategy addresses to fetch:
// - Total assets in each strategy
// - APY for each strategy
// - Risk scores
```

#### `/api/admin/strategies/compound-interest`
```javascript
// Calculates compound interest projections
// Uses strategy addresses to get current APY rates
```

**Example API Response:**
```json
{
  "success": true,
  "data": {
    "strategies": [
      {
        "address": "0x050B21B2191eA6dEB0f12fD4fd40C7b59f6E397a",  // AAVE_STRATEGY_ADDRESS
        "name": "Aave Strategy",
        "totalAssets": "50000.00",
        "apy": 5.2,
        "allocation": 40,
        "riskScore": 15
      },
      {
        "address": "0xC8235CE9F96aa2D8b21Bee4Ee99a47B45C30b7f1",  // COMPOUND_STRATEGY_ADDRESS
        "name": "Compound Strategy",
        "totalAssets": "43750.00",
        "apy": 4.8,
        "allocation": 35,
        "riskScore": 20
      },
      {
        "address": "0x31B602db32404AB15a41075774ccAF66918edA8c",  // LIQUID_STAKING_STRATEGY_ADDRESS
        "name": "Liquid Staking Strategy",
        "totalAssets": "31250.00",
        "apy": 6.5,
        "allocation": 25,
        "riskScore": 35
      }
    ]
  }
}
```

---

### 3. **Vault Controller** (`backend/src/controllers/vaultController.js`)

**What it does:**
- Handles user deposits and withdrawals
- Interacts with Vault and USDC contracts

**Uses:**
- `VAULT_CONTRACT_ADDRESS` - For deposit/withdraw operations
- `USDC_CONTRACT_ADDRESS` - For token approvals and transfers
- `STRATEGY_MANAGER_ADDRESS` - For checking strategy allocations

---

## ⚛️ Frontend Usage

### 1. **Contract Hook** (`frontend/src/hooks/useContract.js`)

**What it does:**
- Provides React hooks to interact with smart contracts
- Makes contract addresses available to all React components

**Code snippet:**
```javascript
// Lines 115-140
export const useContractAddresses = () => {
  return useMemo(() => ({
    // Core contracts
    vault: process.env.REACT_APP_VAULT_CONTRACT_ADDRESS,
    strategyManager: process.env.REACT_APP_STRATEGY_MANAGER_ADDRESS,

    // Strategy contracts
    aaveStrategy: process.env.REACT_APP_AAVE_STRATEGY_ADDRESS,
    compoundStrategy: process.env.REACT_APP_COMPOUND_STRATEGY_ADDRESS,
    liquidStakingStrategy: process.env.REACT_APP_LIQUID_STAKING_STRATEGY_ADDRESS,

    // Token contracts
    usdc: process.env.REACT_APP_USDC_CONTRACT_ADDRESS,
  }), []);
};
```

**Usage in components:**
```javascript
import { useContractAddresses } from '../hooks/useContract';

function MyComponent() {
  const addresses = useContractAddresses();

  // Access addresses
  console.log(addresses.vault);           // 0x094eDDFADDd34336853Ca4f738165f39D78532EE
  console.log(addresses.aaveStrategy);    // 0x050B21B2191eA6dEB0f12fD4fd40C7b59f6E397a
  console.log(addresses.usdc);            // 0x65a52CC89185A86ebd7e56761A3CD229Aa4669f1
}
```

---

### 2. **Blockchain Service** (`frontend/src/services/blockchainService.js`)

**What it does:**
- Direct contract interactions from frontend
- Used when hooks are not available (service workers, utilities)

**Code snippet:**
```javascript
// Lines 29-36
class BlockchainService {
  constructor() {
    this.addresses = {
      vault: process.env.REACT_APP_VAULT_CONTRACT_ADDRESS,
      aaveStrategy: process.env.REACT_APP_AAVE_STRATEGY_ADDRESS,
      compoundStrategy: process.env.REACT_APP_COMPOUND_STRATEGY_ADDRESS,
      liquidStakingStrategy: process.env.REACT_APP_LIQUID_STAKING_STRATEGY_ADDRESS,
      usdc: process.env.REACT_APP_USDC_CONTRACT_ADDRESS,
    };
  }
}
```

---

### 3. **Strategy Manager Dashboard** (`frontend/src/pages/StrategyManagerDashboard.js`)

**What it does:**
- Displays strategy performance, fund distribution, and APY
- Fetches data from backend API (which uses the contract addresses)

**API Calls:**
```javascript
// Loads data from backend
const [overviewData, distributionData, performanceData] = await Promise.all([
  strategyManagerService.getStrategiesOverview(),      // Uses STRATEGY_MANAGER_ADDRESS
  strategyManagerService.getFundsDistribution(),       // Uses all strategy addresses
  strategyManagerService.getStrategyPerformance(),     // Uses all strategy addresses
]);
```

**What users see:**
- Pie chart showing fund distribution across strategies
- Performance metrics for each strategy
- APY rates from each strategy contract
- Total assets in each strategy

---

## 🔄 Data Flow Diagram

```
.env.prod
    │
    ├─→ Backend (Node.js)
    │   │
    │   ├─→ blockchain.js
    │   │   ├─→ Initializes ethers.js contracts
    │   │   ├─→ STRATEGY_MANAGER_ADDRESS → StrategyManager contract
    │   │   ├─→ USDC_CONTRACT_ADDRESS → USDC token contract
    │   │   ├─→ AAVE_STRATEGY_ADDRESS → Aave strategy contract
    │   │   ├─→ COMPOUND_STRATEGY_ADDRESS → Compound strategy contract
    │   │   └─→ LIQUID_STAKING_STRATEGY_ADDRESS → Liquid Staking contract
    │   │
    │   └─→ Controllers
    │       ├─→ strategyManagerController.js
    │       │   ├─→ GET /api/admin/strategies/overview
    │       │   ├─→ GET /api/admin/strategies/distribution
    │       │   └─→ GET /api/admin/strategies/performance
    │       │
    │       └─→ vaultController.js
    │           ├─→ POST /api/vault/deposit
    │           └─→ POST /api/vault/withdraw
    │
    └─→ Frontend (React)
        │
        ├─→ .env.production (REACT_APP_* variables)
        │   │
        │   ├─→ useContract.js hook
        │   │   └─→ useContractAddresses()
        │   │
        │   └─→ blockchainService.js
        │       └─→ Direct contract interactions
        │
        └─→ Components
            ├─→ StrategyManagerDashboard.js
            │   └─→ Displays strategy data
            │
            └─→ SavingsPage.js
                └─→ Deposit/withdraw to vault
```

---

## 📊 Real-World Example

### User deposits $100 to Abunfi:

1. **Frontend** (`SavingsPage.js`):
   ```javascript
   // User clicks "Deposit $100"
   const vaultAddress = process.env.REACT_APP_VAULT_CONTRACT_ADDRESS;
   const usdcAddress = process.env.REACT_APP_USDC_CONTRACT_ADDRESS;

   // Approve USDC
   await usdcContract.approve(vaultAddress, amount);

   // Deposit to vault
   await vaultContract.deposit(amount);
   ```

2. **Backend** receives deposit event:
   ```javascript
   // blockchain.js listens for Deposit event
   vaultContract.on('Deposit', async (user, amount) => {
     // Strategy Manager allocates funds
     await strategyManagerContract.allocateFunds(amount);
   });
   ```

3. **Strategy Manager** distributes funds:
   ```javascript
   // Uses AAVE_STRATEGY_ADDRESS, COMPOUND_STRATEGY_ADDRESS, LIQUID_STAKING_STRATEGY_ADDRESS
   // Allocates: 40% to Aave, 35% to Compound, 25% to Liquid Staking

   await aaveStrategy.deposit(amount * 0.40);      // $40 to Aave
   await compoundStrategy.deposit(amount * 0.35);  // $35 to Compound
   await liquidStakingStrategy.deposit(amount * 0.25); // $25 to Liquid Staking
   ```

4. **Dashboard** shows updated balances:
   ```javascript
   // StrategyManagerDashboard.js fetches new data
   const distribution = await strategyManagerService.getFundsDistribution();

   // Shows:
   // Aave Strategy: $40 (40%)
   // Compound Strategy: $35 (35%)
   // Liquid Staking: $25 (25%)
   ```

---

## ✅ Summary

### **Backend Environment Variables** (`.env.prod`)

| Variable | Used By | Purpose |
|----------|---------|---------|
| `STRATEGY_MANAGER_ADDRESS` | `blockchain.js`, `strategyManagerController.js` | Fetch all strategies, allocations, APY |
| `USDC_CONTRACT_ADDRESS` | `blockchain.js`, `vaultController.js` | Token approvals, balance checks |
| `AAVE_STRATEGY_ADDRESS` | `blockchain.js`, `strategyManagerController.js` | Aave strategy data, deposits, withdrawals |
| `COMPOUND_STRATEGY_ADDRESS` | `blockchain.js`, `strategyManagerController.js` | Compound strategy data, deposits, withdrawals |
| `LIQUID_STAKING_STRATEGY_ADDRESS` | `blockchain.js`, `strategyManagerController.js` | Liquid staking data, deposits, withdrawals |

### **Frontend Environment Variables** (`.env.production`)

| Variable | Used By | Purpose |
|----------|---------|---------|
| `REACT_APP_STRATEGY_MANAGER_ADDRESS` | `useContract.js`, `blockchainService.js` | Contract interactions from frontend |
| `REACT_APP_USDC_CONTRACT_ADDRESS` | `useContract.js`, `blockchainService.js` | Token approvals, balance display |
| `REACT_APP_AAVE_STRATEGY_ADDRESS` | `useContract.js`, `blockchainService.js` | Direct strategy interactions |
| `REACT_APP_COMPOUND_STRATEGY_ADDRESS` | `useContract.js`, `blockchainService.js` | Direct strategy interactions |
| `REACT_APP_LIQUID_STAKING_STRATEGY_ADDRESS` | `useContract.js`, `blockchainService.js` | Direct strategy interactions |

### **Key Files**

**Backend:**
- `backend/src/config/blockchain.js` - Main contract initialization
- `backend/src/controllers/strategyManagerController.js` - Strategy API endpoints
- `backend/src/controllers/vaultController.js` - Vault operations

**Frontend:**
- `frontend/src/hooks/useContract.js` - Contract hooks
- `frontend/src/services/blockchainService.js` - Direct contract calls
- `frontend/src/pages/StrategyManagerDashboard.js` - Strategy dashboard
- `frontend/src/pages/SavingsPage.js` - Deposit/withdraw UI

---

## 🎯 Quick Reference

**To see contract addresses in action:**

1. **Backend API**: `GET /api/admin/strategies/overview`
2. **Frontend Dashboard**: Visit `/strategy-manager` page
3. **Logs**: Check `backend/logs/` for contract initialization

**To verify addresses are correct:**

```bash
# Backend
curl http://localhost:3001/api/admin/strategies/overview

# Should return strategies with your deployed addresses
```

**To update addresses:**

1. Edit `.env.prod` (backend)
2. Edit `frontend/.env.production` (frontend)
3. Restart services
4. Verify in dashboard

---

**All contract addresses are loaded from your deployment files and configured automatically by the `generate-env-prod.sh` script!** 🚀

<function_calls>
<invoke name="view">
<parameter name="path">backend/src/config/blockchain.js
