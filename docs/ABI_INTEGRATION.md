# ABI Integration and Contract Management

This document outlines the new ABI integration system and contract management structure for the Abunfi project.

## Overview

The project now uses a git submodule approach for contract management, with **direct ABI references** from the submodule. No copying is required - ABIs are always up-to-date and referenced directly from the source.

## Structure Changes

### Before
```
abunfi/
├── contracts/              # Local contract files (removed)
├── src/                   # Local interfaces (removed)
├── script/                # Local scripts (removed)
├── backend/
└── frontend/
```

### After
```
abunfi/
├── contracts-submodule/   # Git submodule from abunfi-contracts repo
│   ├── exports/           # Pre-built ABIs
│   ├── src/              # Contract source code
│   └── scripts/          # Contract build scripts
├── backend/
│   └── src/abis/         # Copied ABIs for backend
├── frontend/
│   └── src/abis/         # Copied ABIs for frontend
└── scripts/
    └── copy-abis.js      # ABI copying utility
```

## Available Contracts

### AbunfiVault
- **Purpose**: Main vault contract for user deposits and yield management
- **Key Functions**:
  - `deposit(amount)` - Deposit USDC into the vault
  - `withdraw(shares)` - Withdraw funds from the vault
  - `totalAssets()` - Get total assets under management
  - `getAllStrategiesInfo()` - Get information about all strategies

### AaveStrategy
- **Purpose**: Strategy contract for Aave V3 lending
- **Key Functions**:
  - `getAPY()` - Get current APY from Aave
  - `totalAssets()` - Get total assets in this strategy
  - `deposit(amount)` - Deposit into Aave
  - `withdraw(amount)` - Withdraw from Aave

### CompoundStrategy
- **Purpose**: Strategy contract for Compound V3 lending
- **Key Functions**:
  - `getAPY()` - Get current APY from Compound
  - `totalAssets()` - Get total assets in this strategy
  - `deposit(amount)` - Deposit into Compound
  - `withdraw(amount)` - Withdraw from Compound
  - `harvest()` - Harvest yield and claim COMP rewards

### LiquidStakingStrategy
- **Purpose**: Strategy contract for liquid staking (stETH, rETH)
- **Key Functions**:
  - `getAPY()` - Get current staking APY
  - `totalAssets()` - Get total assets in this strategy
  - `deposit(amount)` - Stake assets for liquid staking tokens
  - `withdraw(amount)` - Unstake liquid staking tokens
  - `harvest()` - Harvest staking rewards

### LiquidityProvidingStrategy
- **Purpose**: Strategy contract for AMM liquidity provision
- **Key Functions**:
  - `getAPY()` - Get current LP APY
  - `totalAssets()` - Get total assets in this strategy
  - `deposit(amount)` - Add liquidity to AMM pools
  - `withdraw(amount)` - Remove liquidity from AMM pools
  - `harvest()` - Harvest LP fees and rewards

### MockERC20
- **Purpose**: ERC20 token interface (used for USDC interactions)
- **Key Functions**:
  - `balanceOf(address)` - Get token balance
  - `approve(spender, amount)` - Approve token spending
  - `transfer(to, amount)` - Transfer tokens

## Frontend Integration

### Using Contract Hooks

```javascript
import {
  useVaultContract,
  useERC20Contract,
  useAllStrategyContracts,
  useContractAddresses
} from '../hooks/useContract';

function VaultComponent() {
  const addresses = useContractAddresses();
  const { contract: vaultContract, isReady } = useVaultContract(addresses.vault);
  const { contract: usdcContract } = useERC20Contract(addresses.usdc);
  const strategies = useAllStrategyContracts();

  const handleDeposit = async (amount) => {
    if (!isReady) return;

    // Approve USDC spending
    await usdcContract.approve(addresses.vault, ethers.constants.MaxUint256);

    // Deposit into vault
    const tx = await vaultContract.deposit(ethers.utils.parseUnits(amount, 6));
    await tx.wait();
  };

  const getStrategiesInfo = async () => {
    if (!isReady) return;

    // Get all strategies info from vault
    const strategiesInfo = await vaultContract.getAllStrategiesInfo();
    return {
      addresses: strategiesInfo[0],
      names: strategiesInfo[1],
      totalAssets: strategiesInfo[2],
      apys: strategiesInfo[3],
      weights: strategiesInfo[4]
    };
  };

  const getIndividualStrategyAPY = async (strategyType) => {
    const strategy = strategies[strategyType];
    if (strategy?.readOnlyContract) {
      const apy = await strategy.readOnlyContract.getAPY();
      return Number(apy) / 100; // Convert from basis points
    }
    return 0;
  };

  return (
    // Component JSX
  );
}
```

### Using Blockchain Service

```javascript
import blockchainService from '../services/blockchainService';

// Initialize service
await blockchainService.initialize(provider);

// Get vault stats
const stats = await blockchainService.getVaultStats();

// Execute deposit
const receipt = await blockchainService.deposit(100); // $100 USDC
```

### Direct ABI Import

```javascript
import { ABIS } from '../abis';

// Get specific ABI
const vaultABI = ABIS.AbunfiVault.abi;

// Create contract instance
const contract = new ethers.Contract(address, vaultABI, signer);
```

## Backend Integration

### Using ABI Module

```javascript
const { getABI, AbunfiVaultABI } = require('../abis');

// Get ABI by name
const vaultABI = getABI('AbunfiVault');

// Or use direct import
const contract = new ethers.Contract(address, AbunfiVaultABI, provider);
```

### Updated Blockchain Service

The backend blockchain service now automatically loads ABIs from the new location:

```javascript
const blockchainService = require('../config/blockchain');

// Service automatically uses new ABI location
const stats = await blockchainService.getVaultStats();
```

## Development Workflow

### 1. Contract Updates
When contracts are updated in the abunfi-contracts repository:

```bash
# Update submodule
git submodule update --remote contracts-submodule

# Copy new ABIs
npm run copy:abis
```

### 2. Building Contracts
```bash
# Build contracts in submodule
npm run contracts:build

# Test contracts
npm run contracts:test

# Copy ABIs after build
npm run copy:abis
```

### 3. Development Server
```bash
# Start development (automatically copies ABIs)
npm run dev

# Or copy ABIs manually
npm run copy:abis
```

## Environment Variables

Update your `.env` files with contract addresses:

### Frontend (.env)
```
REACT_APP_VAULT_CONTRACT_ADDRESS=0x...
REACT_APP_AAVE_STRATEGY_ADDRESS=0x...
REACT_APP_USDC_CONTRACT_ADDRESS=0xaf88d065e77c8cC2239327C5EDb3A432268e5831
```

### Backend (.env)
```
VAULT_CONTRACT_ADDRESS=0x...
AAVE_STRATEGY_ADDRESS=0x...
USDC_CONTRACT_ADDRESS=0xaf88d065e77c8cC2239327C5EDb3A432268e5831
```

## Error Handling

### Contract Errors
Both frontend and backend services include error formatting utilities:

```javascript
import { formatContractError } from '../hooks/useContract';

try {
  await contract.deposit(amount);
} catch (error) {
  const userFriendlyError = formatContractError(error);
  console.error('Deposit failed:', userFriendlyError);
}
```

## Testing

### Frontend Testing
```bash
cd frontend
npm test
```

### Backend Testing
```bash
cd backend
npm test
```

### Contract Testing
```bash
npm run contracts:test
```

## Deployment

### Production Build
```bash
# Build everything (includes ABI copying)
npm run build
```

### Contract Deployment
```bash
# Deploy contracts
npm run contracts:deploy

# Update ABIs after deployment
npm run copy:abis
```

## Troubleshooting

### ABI Not Found Errors
1. Ensure contracts submodule is initialized: `git submodule update --init`
2. Build contracts: `npm run contracts:build`
3. Copy ABIs: `npm run copy:abis`

### Contract Connection Issues
1. Check environment variables are set correctly
2. Verify contract addresses are deployed on the target network
3. Ensure provider is connected to the correct network

### Submodule Issues
```bash
# Reset submodule
git submodule deinit contracts-submodule
git submodule update --init contracts-submodule

# Update to latest
git submodule update --remote contracts-submodule
```

## Migration Notes

### Removed Files
- `contracts/` directory (replaced by submodule)
- `src/` directory (interfaces moved to submodule)
- `script/` directory (scripts moved to submodule)
- `scripts/export-abis.js` (replaced by copy-abis.js)

### Updated Files
- `package.json` - Updated scripts and workspaces
- `backend/src/config/blockchain.js` - Uses new ABI location
- Frontend services - Updated to use new contract hooks

### New Files
- `contracts-submodule/` - Git submodule
- `scripts/copy-abis.js` - ABI copying utility
- `frontend/src/abis/` - Frontend ABI directory
- `backend/src/abis/` - Backend ABI directory
- `frontend/src/hooks/useContract.js` - Contract interaction hooks
- `frontend/src/services/blockchainService.js` - Blockchain service
