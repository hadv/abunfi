# Abunfi Smart Contracts - Testing & Deployment Guide

## Overview

This document provides comprehensive guidance for testing and deploying the Abunfi smart contract system, including all strategies and supporting infrastructure.

## 📋 Table of Contents

- [Testing](#testing)
- [Deployment](#deployment)
- [Contract Verification](#contract-verification)
- [Network Configuration](#network-configuration)
- [Security Considerations](#security-considerations)

## 🧪 Testing

### Test Structure

The test suite includes comprehensive unit tests for all smart contracts:

```
contracts/test/
├── AbunfiVault.test.js           # Core vault functionality
├── AaveStrategy.test.js          # Aave lending strategy
├── CompoundStrategy.test.js      # Compound V3 strategy
├── LiquidStakingStrategy.test.js # Liquid staking (stETH, rETH)
├── LiquidityProvidingStrategy.test.js # AMM liquidity provision
├── StrategyManager.test.js       # Strategy management & allocation
└── VaultIntegration.test.js      # Integration tests
```

### Mock Contracts

Comprehensive mock contracts for testing without external dependencies:

```
contracts/contracts/mocks/
├── MockERC20.sol                 # ERC20 token mock
├── MockAavePool.sol              # Aave V3 pool mock
├── MockComet.sol                 # Compound V3 comet mock
├── MockCometRewards.sol          # Compound rewards mock
├── MockLidoStETH.sol             # Lido stETH mock
├── MockRocketPoolRETH.sol        # Rocket Pool rETH mock
├── MockCurvePool.sol             # Curve pool mock
├── MockUniswapV3Pool.sol         # Uniswap V3 pool mock
├── MockUniswapV3PositionManager.sol # Uniswap V3 position manager
└── MockStrategy.sol              # Generic strategy mock
```

### Running Tests

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests with gas reporting
npm run test:gas

# Run specific test file
npx hardhat test test/AaveStrategy.test.js

# Run tests on specific network
npx hardhat test --network sepolia
```

### Test Coverage

The test suite covers:

- ✅ **Core Functionality**: Deposits, withdrawals, harvesting
- ✅ **Strategy Management**: Adding, removing, rebalancing strategies
- ✅ **Risk Management**: Risk scoring, allocation limits
- ✅ **Access Control**: Owner-only functions, vault-only calls
- ✅ **Edge Cases**: Zero amounts, insufficient balances, failed operations
- ✅ **Integration**: Multi-strategy interactions, yield distribution
- ✅ **Emergency Functions**: Pause, emergency withdrawals

## 🚀 Deployment

### Deployment Scripts

Three main deployment scripts are available:

1. **Complete Deployment** (`deploy-complete.js`)
   - Full mainnet deployment with real protocols
   - Supports Ethereum, Arbitrum, Polygon

2. **Testnet Deployment** (`deploy-testnet.js`)
   - Testnet deployment with mock contracts
   - Includes test token minting and setup

3. **Contract Verification** (`verify-contracts.js`)
   - Automated contract verification on Etherscan

### Quick Start

```bash
# Deploy to local network
npm run deploy:local

# Deploy to testnet
npm run deploy:sepolia
npm run deploy:goerli
npm run deploy:mumbai
npm run deploy:arbitrum-goerli

# Deploy to mainnet (requires proper configuration)
npm run deploy:ethereum
npm run deploy:arbitrum
npm run deploy:polygon

# Verify contracts after deployment
npm run verify:ethereum
```

### Environment Setup

Create a `.env` file in the contracts directory:

```env
# Private keys (use test keys for testnets)
PRIVATE_KEY=your_private_key_here
DEPLOYER_PRIVATE_KEY=your_deployer_key_here

# RPC URLs
ETHEREUM_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/YOUR-API-KEY
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR-API-KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR-API-KEY
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY

# Etherscan API keys for verification
ETHERSCAN_API_KEY=your_etherscan_api_key
ARBISCAN_API_KEY=your_arbiscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key

# Security (for mainnet)
ETHEREUM_MULTISIG=0x...
ARBITRUM_MULTISIG=0x...
POLYGON_MULTISIG=0x...
PAUSE_GUARDIAN=0x...
EMERGENCY_ADMIN=0x...
```

### Deployment Configuration

The deployment system uses comprehensive configuration files:

- `config/deployment.config.js` - Network and protocol configurations
- `scripts/deployment-utils.js` - Utility functions for deployment
- Automatic gas estimation and retry logic
- Contract validation and verification
- Deployment artifact generation

### Supported Networks

#### Mainnet
- **Ethereum**: Full protocol support (all strategies)
- **Arbitrum**: Aave, Compound, Curve, Uniswap V3
- **Polygon**: Aave support

#### Testnet
- **Sepolia**: Mock contracts for testing
- **Goerli**: Aave testnet integration
- **Mumbai**: Polygon testnet
- **Arbitrum Goerli**: Arbitrum testnet

## 🔍 Contract Verification

Automated verification is included in the deployment process:

```bash
# Verify all contracts on current network
npm run verify

# Verify on specific network
npm run verify:ethereum
npm run verify:arbitrum
npm run verify:polygon
```

The verification system:
- Automatically detects deployed contracts
- Uses correct constructor arguments
- Supports multiple block explorers
- Handles already-verified contracts gracefully

## ⚙️ Network Configuration

### Hardhat Configuration

The `hardhat.config.js` includes:
- Network configurations for all supported chains
- Gas optimization settings
- Etherscan integration for verification
- Solidity compiler settings

### Strategy Configuration

Each strategy has specific configuration:

```javascript
const STRATEGY_CONFIG = {
  aave: {
    riskScore: 20,      // Low risk
    weight: 3000,       // 30% allocation
    maxAllocation: 4000, // 40% max
    minAllocation: 1000  // 10% min
  },
  compound: {
    riskScore: 25,      // Low-medium risk
    weight: 2500,       // 25% allocation
    maxAllocation: 3500,
    minAllocation: 800
  },
  // ... other strategies
};
```

## 🔒 Security Considerations

### Access Control
- Owner-only functions for critical operations
- Vault-only access for strategy operations
- Multi-signature support for mainnet deployments
- Timelock for parameter changes

### Risk Management
- Maximum allocation limits per strategy
- Risk scoring system
- Emergency pause functionality
- Slippage protection for withdrawals

### Testing Security
- Comprehensive test coverage
- Mock contracts prevent mainnet interactions during testing
- Gas limit protections
- Reentrancy guards

## 📊 Monitoring & Maintenance

### Deployment Artifacts

All deployments generate comprehensive artifacts:
- Contract addresses and ABIs
- Deployment configuration
- Gas usage reports
- Validation results

### Post-Deployment Checklist

1. ✅ Verify all contracts on block explorer
2. ✅ Test basic functionality (deposit/withdraw)
3. ✅ Verify strategy allocations
4. ✅ Check access controls
5. ✅ Monitor initial yields
6. ✅ Set up monitoring alerts

## 🛠️ Development Workflow

```bash
# 1. Install dependencies
npm install

# 2. Compile contracts
npm run build

# 3. Run tests
npm run test

# 4. Deploy to testnet
npm run deploy:sepolia

# 5. Test on testnet
# Use testnet deployment addresses

# 6. Deploy to mainnet (when ready)
npm run deploy:ethereum

# 7. Verify contracts
npm run verify:ethereum
```

## 📞 Support

For deployment issues or questions:
- Check deployment logs in `deployments/` directory
- Review test results for any failures
- Verify network configuration and RPC endpoints
- Ensure sufficient ETH balance for gas fees

## 🔄 Updates & Upgrades

The contract system is designed for:
- Strategy additions without core contract changes
- Parameter updates through governance
- Emergency procedures for critical issues
- Gradual migration paths for major upgrades
