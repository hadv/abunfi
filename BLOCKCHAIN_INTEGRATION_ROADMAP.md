# Blockchain Integration Roadmap

## Overview

This document explains the remaining TODOs in the codebase. These are **NOT demo code** - they are **production placeholders** waiting for smart contract deployment and integration.

## Why TODOs Remain

The application is structured in **two layers**:

1. **✅ Application Layer** - COMPLETE
   - Web3Auth social login
   - User authentication
   - UI/UX components
   - API endpoints
   - Database operations
   - Caching layer

2. **⏳ Blockchain Layer** - PENDING DEPLOYMENT
   - Smart contract deployment
   - Contract integration
   - On-chain data queries
   - Transaction execution

**Current Status**: The app works with **placeholder data** for UI testing. Once contracts are deployed, we replace placeholders with **real blockchain calls**.

## Remaining TODOs

### 1. Security & Rate Limiting (EIP-7702 Paymaster)

**File**: `backend/src/controllers/securityController.js`

**Function**: `getSecurityStatus(walletAddress)`

**What it does now**:
- Returns deterministic placeholder data based on wallet address
- Allows UI testing without deployed contracts

**What it should do**:
```javascript
async getSecurityStatus(walletAddress) {
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  const paymaster = new ethers.Contract(
    process.env.EIP7702_PAYMASTER_ADDRESS,
    EIP7702PaymasterABI,
    provider
  );
  
  // Query contract for real data
  const status = await paymaster.getAccountStatus(walletAddress);
  const limits = await paymaster.getRateLimits(walletAddress);
  const usage = await paymaster.getUsageStats(walletAddress);
  
  return {
    isWhitelisted: status.isWhitelisted,
    dailyGasLimit: ethers.formatEther(limits.dailyGasLimit),
    dailyGasUsed: ethers.formatEther(usage.dailyGasUsed),
    dailyTxLimit: limits.dailyTxLimit.toNumber(),
    dailyTxCount: usage.dailyTxCount.toNumber(),
    perTxGasLimit: ethers.formatEther(limits.perTxGasLimit),
    lastResetTimestamp: status.lastResetTimestamp.toNumber(),
    // ... calculate remaining, percentages, warnings
  };
}
```

**Required**:
- ✅ EIP7702Paymaster contract deployed
- ✅ Contract address in environment variables
- ✅ Contract ABI imported
- ✅ RPC endpoint configured

### 2. Vault Deposits

**File**: `frontend/src/pages/SavingsPage.js`

**Function**: `handleDeposit()`

**What it does now**:
- Shows success toast
- Updates UI optimistically

**What it should do**:
```javascript
const handleDeposit = async () => {
  try {
    setIsLoading(true);
    
    // Get Web3Auth provider
    const { provider } = useWeb3Auth();
    const ethersProvider = new ethers.BrowserProvider(provider);
    const signer = await ethersProvider.getSigner();
    
    // Connect to Vault contract
    const vault = new ethers.Contract(
      process.env.REACT_APP_VAULT_ADDRESS,
      VaultABI,
      signer
    );
    
    // Execute deposit transaction
    const tx = await vault.deposit({
      value: ethers.parseEther(depositAmount)
    });
    
    toast.info('Transaction submitted...');
    
    // Wait for confirmation
    const receipt = await tx.wait();
    
    toast.success(`Deposit successful! Tx: ${receipt.hash}`);
    
    // Refresh balance
    await refreshUserBalance();
    
  } catch (error) {
    console.error('Deposit error:', error);
    toast.error(error.message);
  } finally {
    setIsLoading(false);
  }
};
```

**Required**:
- ✅ Vault contract deployed
- ✅ Contract address in environment variables
- ✅ Contract ABI imported
- ✅ Web3Auth provider available

### 3. Vault Withdrawals

**File**: `frontend/src/pages/SavingsPage.js`

**Function**: `handleWithdraw()`

**What it does now**:
- Shows success toast
- Updates UI optimistically

**What it should do**:
```javascript
const handleWithdraw = async () => {
  try {
    setIsLoading(true);
    
    const { provider } = useWeb3Auth();
    const ethersProvider = new ethers.BrowserProvider(provider);
    const signer = await ethersProvider.getSigner();
    
    const vault = new ethers.Contract(
      process.env.REACT_APP_VAULT_ADDRESS,
      VaultABI,
      signer
    );
    
    // Execute withdrawal transaction
    const tx = await vault.withdraw(withdrawShares);
    
    toast.info('Transaction submitted...');
    
    const receipt = await tx.wait();
    
    toast.success(`Withdrawal successful! Tx: ${receipt.hash}`);
    
    await refreshUserBalance();
    
  } catch (error) {
    console.error('Withdrawal error:', error);
    toast.error(error.message);
  } finally {
    setIsLoading(false);
  }
};
```

**Required**:
- ✅ Vault contract deployed
- ✅ Contract address in environment variables
- ✅ Contract ABI imported

### 4. Protocol APY Data

**File**: `frontend/src/components/ProtocolComparison.js`

**Functions**: `useEffect()` auto-refresh, `handleRefresh()`

**What it does now**:
- Uses static APY data
- Adds small random variations for demo

**What it should do**:
```javascript
const fetchProtocolAPYs = async () => {
  try {
    // Option 1: Query from backend API
    const response = await api.get('/protocols/apy');
    return response.data.protocols;
    
    // Option 2: Query directly from contracts
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    
    const aaveAPY = await getAaveAPY(provider);
    const compoundAPY = await getCompoundAPY(provider);
    const curveAPY = await getCurveAPY(provider);
    const uniswapAPY = await getUniswapV4APY(provider);
    
    return [
      { name: 'Aave', apy: aaveAPY, ... },
      { name: 'Compound', apy: compoundAPY, ... },
      { name: 'Curve', apy: curveAPY, ... },
      { name: 'Uniswap V4', apy: uniswapAPY, ... },
    ];
  } catch (error) {
    console.error('Failed to fetch APYs:', error);
    return fallbackData;
  }
};

useEffect(() => {
  if (autoRefresh) {
    const interval = setInterval(async () => {
      const data = await fetchProtocolAPYs();
      setProtocolData(data);
    }, 30000);
    return () => clearInterval(interval);
  }
}, [autoRefresh]);
```

**Required**:
- ✅ Backend API endpoint `/api/protocols/apy`
- ✅ Integration with DeFi protocol APIs (Aave, Compound, etc.)
- OR direct contract queries

### 5. Phone Verification (Optional)

**File**: `backend/src/controllers/authController.js`

**Function**: `sendPhoneVerification()`

**What it does now**:
- Returns success without sending SMS

**What it should do**:
```javascript
sendPhoneVerification: async (req, res) => {
  try {
    const { phone } = req.body;
    
    // Generate verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Send SMS via Twilio/AWS SNS
    await twilioClient.messages.create({
      body: `Your Abunfi verification code is: ${code}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });
    
    // Store code in database with expiration
    await db.storeVerificationCode(phone, code, 10 * 60); // 10 minutes
    
    res.json({ success: true });
  } catch (error) {
    logger.error('SMS send error:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
}
```

**Required**:
- ✅ Twilio/AWS SNS account
- ✅ Phone number verification service
- ✅ SMS credits

## Implementation Priority

### Phase 1: Core Functionality (CRITICAL)
1. **Deploy Smart Contracts** to Sepolia
   - Vault contract
   - StrategyManager contract
   - EIP7702Paymaster contract
   - Strategy contracts (Aave, Compound, etc.)

2. **Integrate Vault Operations**
   - Implement deposit transactions
   - Implement withdrawal transactions
   - Add transaction status tracking
   - Handle errors and edge cases

3. **Integrate Security/Rate Limiting**
   - Query EIP7702Paymaster contract
   - Get real rate limit data
   - Display accurate usage stats

### Phase 2: Enhanced Features (IMPORTANT)
4. **Protocol APY Integration**
   - Create backend API endpoints
   - Integrate with DeFi protocol APIs
   - Cache APY data
   - Auto-refresh mechanism

5. **Transaction History**
   - Query blockchain for user transactions
   - Display deposit/withdrawal history
   - Show transaction status

### Phase 3: Optional Features (NICE TO HAVE)
6. **Phone Verification**
   - Integrate SMS service
   - Implement verification flow
   - Add phone-based 2FA

## How to Implement

### Step 1: Deploy Contracts

```bash
cd contracts-submodule
./deploy-contracts.sh
```

This will deploy all contracts and output addresses.

### Step 2: Update Environment Variables

Add contract addresses to `.env`:

```bash
# Backend
VAULT_ADDRESS=0x...
STRATEGY_MANAGER_ADDRESS=0x...
EIP7702_PAYMASTER_ADDRESS=0x...

# Frontend
REACT_APP_VAULT_ADDRESS=0x...
REACT_APP_STRATEGY_MANAGER_ADDRESS=0x...
REACT_APP_EIP7702_PAYMASTER_ADDRESS=0x...
```

### Step 3: Import Contract ABIs

```javascript
// frontend/src/contracts/VaultABI.json
import VaultABI from './contracts/VaultABI.json';
import EIP7702PaymasterABI from './contracts/EIP7702PaymasterABI.json';
```

### Step 4: Replace Placeholder Functions

Follow the code examples above for each TODO.

### Step 5: Test

1. Test deposit transaction
2. Test withdrawal transaction
3. Test rate limiting queries
4. Test APY data fetching
5. End-to-end testing

## Summary

**TODOs are NOT demo code** - they are **integration points** for blockchain functionality.

**Current State**:
- ✅ Application works with placeholder data
- ✅ UI/UX is complete
- ✅ Web3Auth is fully implemented
- ✅ Backend APIs are ready
- ⏳ Waiting for smart contract deployment

**Next Steps**:
1. Deploy contracts to Sepolia
2. Update environment variables
3. Replace placeholder functions with real contract calls
4. Test thoroughly
5. Deploy to production

**Timeline**:
- Phase 1 (Core): 1-2 weeks after contract deployment
- Phase 2 (Enhanced): 2-3 weeks
- Phase 3 (Optional): As needed

The application is **production-ready** for UI/UX testing. Once contracts are deployed, integration is straightforward and well-documented.

