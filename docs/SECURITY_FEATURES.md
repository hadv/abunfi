# Security Features & Rate Limiting

This document describes the comprehensive security features implemented in Abunfi to prevent DOS and Sybil attacks while ensuring fair access to gasless transactions.

## Overview

Abunfi implements a multi-layered security approach that includes:

- **Rate Limiting**: Daily limits on gas usage and transaction count
- **DOS Attack Prevention**: Protection against denial-of-service attacks
- **Sybil Attack Prevention**: Identity verification and behavior monitoring
- **Real-time Monitoring**: Continuous security status tracking
- **User Education**: Comprehensive information about security practices

## Rate Limiting System

### Default Limits (Standard Accounts)

| Limit Type | Standard Account | Whitelisted Account |
|------------|------------------|---------------------|
| Daily Gas Limit | 0.1 ETH (~$250) | 0.2 ETH (~$500) |
| Daily Transaction Limit | 50 transactions | 100 transactions |
| Per-Transaction Gas Limit | 0.01 ETH (~$25) | 0.02 ETH (~$50) |
| Reset Period | 24 hours | 24 hours |

### How Rate Limiting Works

1. **Daily Tracking**: Each account's gas usage and transaction count are tracked daily
2. **Automatic Reset**: Limits reset every 24 hours at midnight UTC
3. **Real-time Validation**: Each transaction is validated against current limits before execution
4. **Graceful Degradation**: Users receive warnings as they approach limits

## Security Components

### 1. EIP7702Paymaster Contract

The paymaster contract implements sophisticated rate limiting:

```solidity
struct SponsorshipPolicy {
    uint256 dailyGasLimit;     // Daily gas limit in wei
    uint256 perTxGasLimit;     // Per-transaction gas limit in wei
    uint256 dailyTxLimit;      // Daily transaction count limit
    bool requiresWhitelist;    // Whether account needs whitelisting
    bool isActive;             // Whether sponsorship is active
}
```

**Key Features:**
- Custom policies per account
- Whitelist management
- Emergency pause functionality
- Trusted bundler system

### 2. Frontend Security Components

#### SecurityDashboard
- Real-time security status display
- Rate limit visualization
- Warning and alert management
- Account status indicators

#### GaslessTransactionSecurity
- Pre-transaction validation
- Security status display
- Rate limit warnings
- Transaction blocking when limits exceeded

#### AntiAbuseEducation
- User education about security measures
- Best practices guidance
- Interactive learning content

### 3. Backend Security API

#### Endpoints

- `GET /api/security/status/:walletAddress` - Get security status
- `POST /api/security/check-eligibility/:walletAddress` - Check transaction eligibility
- `GET /api/security/recommendations/:walletAddress` - Get security recommendations
- `POST /api/security/events` - Record security events
- `GET /api/security/events/:walletAddress` - Get security event history

## DOS Attack Prevention

### Protection Mechanisms

1. **Gas Limits**: Prevent excessive gas consumption
2. **Transaction Limits**: Limit transaction frequency
3. **Per-Transaction Caps**: Prevent single large transactions
4. **Rate Monitoring**: Real-time usage tracking

### Implementation

```javascript
// Example: Transaction validation
const validateTransaction = (securityStatus, estimatedGasCost) => {
  // Check daily gas limit
  if (estimatedGasCost > securityStatus.dailyLimits.gas.remaining) {
    return { canProceed: false, reason: 'Daily gas limit exceeded' };
  }
  
  // Check per-transaction limit
  if (estimatedGasCost > securityStatus.perTxLimit) {
    return { canProceed: false, reason: 'Per-transaction limit exceeded' };
  }
  
  // Check transaction count
  if (securityStatus.dailyLimits.transactions.remaining <= 0) {
    return { canProceed: false, reason: 'Daily transaction limit exceeded' };
  }
  
  return { canProceed: true };
};
```

## Sybil Attack Prevention

### Identity Verification

1. **Social Login**: Google, Apple, Facebook authentication
2. **Wallet Verification**: Ethereum wallet ownership proof
3. **Behavior Analysis**: Pattern recognition for suspicious activity
4. **Whitelist System**: Verified accounts get higher limits

### Account Types

#### Standard Accounts
- Basic rate limits
- Social login required
- Wallet verification required

#### Whitelisted Accounts
- Higher rate limits
- Priority processing
- Custom policies available
- Manual verification process

## Real-time Monitoring

### WebSocket Integration

```javascript
// Example: Real-time security monitoring
const useSecurityMonitoring = () => {
  const { isConnected, lastMessage } = useWebSocket('/security-monitoring');
  
  useEffect(() => {
    if (lastMessage?.type === 'security_update') {
      // Handle real-time security updates
      updateSecurityStatus(lastMessage.data);
    }
  }, [lastMessage]);
};
```

### Monitoring Features

- Real-time rate limit tracking
- Automatic warning notifications
- Security event logging
- Anomaly detection

## User Experience

### Security Notifications

The system provides various types of notifications:

1. **Info Notifications**: General security information
2. **Warning Notifications**: Approaching limits (75-90% usage)
3. **Critical Notifications**: Near limits (90%+ usage)
4. **Error Notifications**: Blocked transactions

### Progressive Warnings

- **75% Usage**: Warning notification
- **90% Usage**: Critical warning
- **95% Usage**: Transaction blocking imminent
- **100% Usage**: All transactions blocked until reset

## Integration Guide

### Frontend Integration

1. **Add Security Components**:
```jsx
import { SecurityDashboard, GaslessTransactionSecurity } from './components/security';

// In your component
<GaslessTransactionSecurity
  onTransactionValidated={handleValidation}
  estimatedGasCost="0.005"
  transactionType="deposit"
/>
```

2. **Use Security Hooks**:
```javascript
import { useSecurityAuth, useSecurityMonitoring } from './services';

const { canPerformGaslessTransaction } = useSecurityAuth();
const { securityStatus, isMonitoring } = useSecurityMonitoring();
```

### Backend Integration

1. **Add Security Routes**:
```javascript
app.use('/api/security', securityRoutes);
```

2. **Implement Security Checks**:
```javascript
const securityStatus = await securityController.getSecurityStatus(walletAddress);
const eligibility = await securityController.checkTransactionEligibility(walletAddress, gasCost);
```

## Best Practices

### For Users

1. **Monitor Usage**: Check your daily limits regularly
2. **Batch Transactions**: Combine operations when possible
3. **Off-Peak Usage**: Use gasless transactions during low-demand periods
4. **Secure Account**: Protect wallet and login credentials

### For Developers

1. **Validate Early**: Check security status before transaction preparation
2. **Handle Errors**: Gracefully handle rate limit errors
3. **Cache Wisely**: Cache security status with appropriate TTL
4. **Monitor Events**: Track security events for debugging

## Troubleshooting

### Common Issues

1. **Transaction Blocked**: Check rate limits and wait for reset
2. **Whitelist Required**: Contact support for account verification
3. **Service Unavailable**: Check network connection and try again
4. **Invalid Address**: Ensure wallet address is valid Ethereum address

### Error Codes

- `RATE_LIMIT_EXCEEDED`: Daily limits reached
- `WHITELIST_REQUIRED`: Account needs whitelisting
- `SERVICE_UNAVAILABLE`: Security service temporarily unavailable
- `INVALID_ADDRESS`: Wallet address format invalid

## Security Considerations

### Data Privacy

- No personal data stored in smart contracts
- Rate limiting data cached temporarily
- Security events logged for monitoring only

### Smart Contract Security

- Audited rate limiting logic
- Emergency pause functionality
- Upgradeable proxy pattern for fixes
- Multi-signature admin controls

## Future Enhancements

1. **Machine Learning**: Advanced pattern recognition
2. **Dynamic Limits**: Adaptive rate limiting based on network conditions
3. **Cross-Chain**: Multi-chain security coordination
4. **Advanced Analytics**: Detailed security metrics and reporting

## Support

For security-related questions or issues:

- Email: security@abunfi.com
- Documentation: https://docs.abunfi.com/security
- Discord: https://discord.gg/abunfi

## Changelog

### v1.0.0 (Current)
- Initial rate limiting implementation
- DOS/Sybil attack prevention
- Real-time monitoring
- User education components
- Comprehensive testing suite
