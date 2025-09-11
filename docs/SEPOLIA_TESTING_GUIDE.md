# Sepolia Testnet Security Testing Guide

This guide provides comprehensive instructions for testing the DOS/Sybil attack prevention features on Sepolia testnet.

## Prerequisites

### 1. Environment Setup

- Node.js 16+ installed
- Foundry installed for smart contract deployment
- Sepolia testnet ETH (get from [Sepolia Faucet](https://sepoliafaucet.com/))
- Infura or Alchemy RPC endpoint for Sepolia

### 2. Required Environment Variables

Create a `.env` file in the contracts-submodule directory:

```bash
# Sepolia Configuration
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## Deployment Steps

### 1. Deploy Security Testing Contracts

```bash
cd contracts-submodule

# Install dependencies
npm install

# Deploy to Sepolia with security testing configuration
npm run deploy:sepolia-security

# Or manually with forge
forge script script/DeploySepoliaTest.s.sol --rpc-url sepolia --broadcast --verify
```

This will deploy:
- EIP7702Paymaster with rate limiting
- EIP7702Bundler for gasless transactions
- AbunfiVault for testing deposits
- Mock USDC for testing
- Test accounts with different security levels

### 2. Update Configuration Files

After deployment, update the configuration files with the deployed contract addresses:

#### Frontend Configuration
Copy `frontend/.env.sepolia` to `frontend/.env.local` and update contract addresses:

```bash
cp frontend/.env.sepolia frontend/.env.local
# Edit .env.local with deployed contract addresses
```

#### Backend Configuration
Copy `backend/.env.sepolia` to `backend/.env` and update contract addresses:

```bash
cp backend/.env.sepolia backend/.env
# Edit .env with deployed contract addresses
```

### 3. Start the Application

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm start
```

## Testing Scenarios

### 1. Rate Limiting Tests

#### Standard Account Testing
- **Daily Gas Limit**: 0.1 ETH
- **Daily Transaction Limit**: 50 transactions
- **Per-Transaction Limit**: 0.01 ETH

**Test Steps:**
1. Login with a standard test account
2. Navigate to Security Dashboard
3. Verify rate limits are displayed correctly
4. Attempt multiple small deposits to approach limits
5. Verify warnings appear at 75%, 90%, 95% usage
6. Verify transactions are blocked at 100% usage

#### Whitelisted Account Testing
- **Daily Gas Limit**: 0.2 ETH
- **Daily Transaction Limit**: 100 transactions
- **Per-Transaction Limit**: 0.02 ETH

**Test Steps:**
1. Login with the whitelisted test account
2. Verify higher limits in Security Dashboard
3. Confirm "Whitelisted" status is displayed
4. Test higher transaction amounts
5. Verify premium features are available

#### Restricted Account Testing
- **Daily Gas Limit**: 0.01 ETH
- **Daily Transaction Limit**: 5 transactions
- **Per-Transaction Limit**: 0.001 ETH
- **Requires Whitelist**: Yes (but not whitelisted)

**Test Steps:**
1. Login with the restricted test account
2. Verify very low limits are displayed
3. Confirm "Requires Whitelist" warning
4. Verify transactions are blocked due to whitelist requirement

### 2. DOS Attack Prevention Tests

#### Excessive Gas Consumption
```javascript
// Test with high gas cost transaction
const excessiveGasCost = "0.5"; // 0.5 ETH (above limit)
// Should be blocked by security system
```

#### Rapid Transaction Attempts
```javascript
// Test rapid-fire transactions
for (let i = 0; i < 60; i++) {
  // Attempt deposit
  // Should be blocked after daily limit reached
}
```

### 3. Sybil Attack Prevention Tests

#### Multiple Account Testing
1. Test with multiple standard accounts
2. Verify each account has independent rate limits
3. Confirm one account's usage doesn't affect others
4. Test whitelist requirements for restricted accounts

#### Identity Verification
1. Test social login integration
2. Verify wallet ownership proof
3. Test account linking and verification

### 4. Real-time Monitoring Tests

#### WebSocket Integration
1. Open multiple browser tabs
2. Perform transactions in one tab
3. Verify real-time updates in other tabs
4. Test connection recovery after network issues

#### Security Notifications
1. Approach rate limits gradually
2. Verify progressive notifications:
   - Info at 50% usage
   - Warning at 75% usage
   - Critical at 90% usage
   - Error at 100% usage

### 5. UI Component Tests

#### Security Dashboard
- [ ] Displays correct account status
- [ ] Shows accurate rate limit progress
- [ ] Updates in real-time
- [ ] Refresh functionality works
- [ ] Risk level assessment accurate

#### Gasless Transaction Security
- [ ] Pre-transaction validation works
- [ ] Security warnings display correctly
- [ ] Transaction blocking when limits exceeded
- [ ] Detailed security information expandable

#### Anti-Abuse Education
- [ ] Educational content accessible
- [ ] Interactive accordions work
- [ ] Best practices clearly explained
- [ ] Account status indicators clear

#### Security Notifications
- [ ] Notifications appear at correct thresholds
- [ ] Auto-hide functionality works
- [ ] Expandable details provide useful info
- [ ] Action buttons work correctly

## Automated Testing

### 1. Run Security Test Suite

```bash
cd test/security
npm test SepoliaSecurityTest.js
```

This will:
- Verify contract deployment
- Test rate limiting configuration
- Validate account types
- Check DOS/Sybil prevention
- Verify real-time monitoring

### 2. Frontend Component Tests

```bash
cd frontend
npm test -- --testPathPattern=security
```

### 3. Backend API Tests

```bash
cd backend
npm test -- --testPathPattern=security
```

## Monitoring and Debugging

### 1. Contract Events

Monitor contract events for security-related activities:

```bash
# Watch paymaster events
cast logs --rpc-url sepolia --address PAYMASTER_ADDRESS

# Watch bundler events
cast logs --rpc-url sepolia --address BUNDLER_ADDRESS
```

### 2. Application Logs

#### Frontend Logs
- Open browser developer tools
- Check console for security-related logs
- Monitor network requests to security API

#### Backend Logs
- Check server logs for security events
- Monitor rate limiting cache
- Watch WebSocket connections

### 3. Database Monitoring

```sql
-- Check security events
SELECT * FROM security_events ORDER BY timestamp DESC LIMIT 100;

-- Check rate limiting data
SELECT * FROM rate_limits WHERE wallet_address = 'TEST_ADDRESS';
```

## Troubleshooting

### Common Issues

#### 1. Contract Not Deployed
```bash
Error: Contract not found at address
```
**Solution**: Verify deployment completed successfully and addresses are correct

#### 2. Insufficient Test ETH
```bash
Error: Insufficient funds for gas
```
**Solution**: Get more Sepolia ETH from faucet

#### 3. Rate Limiting Not Working
```bash
Error: Security validation failed
```
**Solution**: Check contract configuration and ensure paymaster is funded

#### 4. WebSocket Connection Issues
```bash
Error: WebSocket connection failed
```
**Solution**: Verify backend WebSocket server is running on correct port

### Debug Commands

```bash
# Check contract state
cast call PAYMASTER_ADDRESS "getGlobalPolicy()" --rpc-url sepolia

# Check account state
cast call PAYMASTER_ADDRESS "getAccountState(address)" TEST_ADDRESS --rpc-url sepolia

# Check paymaster balance
cast balance PAYMASTER_ADDRESS --rpc-url sepolia
```

## Success Criteria

### ✅ Deployment Success
- [ ] All contracts deployed successfully
- [ ] Contract addresses saved to deployment file
- [ ] Test accounts created and funded
- [ ] Rate limiting policies configured

### ✅ Rate Limiting Working
- [ ] Standard accounts have 0.1 ETH daily limit
- [ ] Whitelisted accounts have 0.2 ETH daily limit
- [ ] Restricted accounts require whitelist
- [ ] Per-transaction limits enforced

### ✅ DOS Prevention Working
- [ ] Excessive gas transactions blocked
- [ ] Daily limits prevent system overload
- [ ] Per-transaction caps working

### ✅ Sybil Prevention Working
- [ ] Individual account tracking
- [ ] Whitelist requirements enforced
- [ ] Identity verification integrated

### ✅ UI Integration Working
- [ ] Security dashboard displays correctly
- [ ] Transaction security validation works
- [ ] Real-time notifications appear
- [ ] Educational content accessible

### ✅ Real-time Monitoring Working
- [ ] WebSocket connections stable
- [ ] Live updates across tabs
- [ ] Progressive warnings at correct thresholds
- [ ] Connection recovery after issues

## Next Steps

After successful Sepolia testing:

1. **Production Deployment**: Deploy to mainnet with production configurations
2. **User Onboarding**: Create user guides for security features
3. **Monitoring Setup**: Implement production monitoring and alerting
4. **Security Audit**: Conduct comprehensive security audit
5. **Performance Optimization**: Optimize for production load

## Support

For issues during testing:

- **Documentation**: Check `docs/SECURITY_FEATURES.md`
- **GitHub Issues**: Create issue with test results
- **Discord**: Join development channel for real-time help
- **Email**: security@abunfi.com for security-related questions
