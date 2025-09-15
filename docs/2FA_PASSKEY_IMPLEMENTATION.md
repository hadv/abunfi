# 2FA Passkey Implementation Guide

## Overview

This document describes the implementation of Two-Factor Authentication (2FA) using WebAuthn passkeys in the Abunfi DeFi platform. The implementation provides a secure, phishing-resistant authentication method that leverages device biometrics and hardware security keys.

## Features

### ✅ Implemented Features

- **WebAuthn-based Passkey Authentication**: Full implementation using @simplewebauthn libraries
- **Social Login Integration**: 2FA requirement after successful social authentication
- **Game Theory Incentives**: Achievement system and security bonuses for adoption
- **Security Dashboard**: Comprehensive management interface for passkeys and security settings
- **Rate Limiting**: Protection against brute force attacks
- **Security Event Logging**: Audit trail for all security-related actions
- **Cross-Platform Support**: Works with Face ID, Touch ID, Windows Hello, and hardware keys
- **Backward Compatibility**: Existing users not forced to enable 2FA immediately

### 🎮 Game Theory Design

The implementation uses game theory principles to encourage 2FA adoption:

1. **First Passkey Bonus**: Users get security points and achievements for setting up their first passkey
2. **Security Level System**: Higher security levels unlock platform benefits
3. **Achievement System**: Gamified security milestones (Security Champion, Early Adopter, etc.)
4. **Trust Score**: Influences transaction limits and fee discounts
5. **Social Proof**: Display security achievements to encourage peer adoption

## Architecture

### Database Schema

```sql
-- Passkey storage
CREATE TABLE user_passkeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    counter BIGINT NOT NULL DEFAULT 0,
    device_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Challenge management
CREATE TABLE webauthn_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    challenge TEXT NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'registration' or 'authentication'
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Security events
CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    event_type VARCHAR(50) NOT NULL,
    event_status VARCHAR(20) NOT NULL, -- 'success', 'failure', 'attempt'
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User security preferences
CREATE TABLE user_security_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    require_2fa_for_transactions BOOLEAN DEFAULT false,
    require_2fa_for_settings BOOLEAN DEFAULT false,
    security_notifications BOOLEAN DEFAULT true,
    trust_score INTEGER DEFAULT 50,
    security_level VARCHAR(20) DEFAULT 'basic',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Achievement system
CREATE TABLE security_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    achievement_type VARCHAR(50) NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    claimed BOOLEAN DEFAULT false,
    reward_points INTEGER DEFAULT 0
);
```

### API Endpoints

#### Passkey Management
- `POST /api/passkey/register/begin` - Start passkey registration
- `POST /api/passkey/register/complete` - Complete passkey registration
- `POST /api/passkey/authenticate/begin` - Start passkey authentication
- `POST /api/passkey/authenticate/complete` - Complete passkey authentication
- `GET /api/passkey/list` - List user's passkeys
- `DELETE /api/passkey/:id` - Delete a passkey

#### Security & Status
- `GET /api/passkey/security/status` - Get security status and achievements
- `GET /api/passkey/security/recommendations` - Get personalized security recommendations
- `POST /api/passkey/security/claim-achievement` - Claim achievement rewards

#### 2FA Integration
- `POST /api/auth/complete-2fa` - Complete 2FA after social login

### Frontend Components

#### Core Components
- `PasskeyRegistration.js` - Multi-step passkey setup wizard
- `PasskeyAuthentication.js` - Authentication dialog
- `SecurityDashboard.js` - Comprehensive security management
- `SecurityPage.js` - Dedicated security center page

#### Services
- `passkeyService.js` - WebAuthn client-side operations
- Integration with existing `authService.js`

## User Flow

### First-Time Setup (Game Theory)

1. **Social Login**: User logs in with Google/Apple/Facebook
2. **2FA Suggestion**: System shows personalized setup suggestion with rewards
3. **Compatibility Check**: Automatic device capability detection
4. **Device Naming**: User provides friendly name for their device
5. **Passkey Creation**: WebAuthn ceremony with biometric verification
6. **Reward Display**: Show earned achievements and security bonuses
7. **Dashboard Tour**: Guide user through security features

### Subsequent Logins

1. **Social Authentication**: Standard social login flow
2. **2FA Check**: System checks if user has 2FA enabled
3. **Passkey Challenge**: Present authentication dialog
4. **Biometric Verification**: User authenticates with device
5. **Session Establishment**: Full authentication token issued

### Security Management

1. **Security Dashboard**: Central hub for all security settings
2. **Passkey Management**: Add, rename, or remove passkeys
3. **Achievement Tracking**: View earned security achievements
4. **Trust Score**: Monitor and improve security rating
5. **Event History**: Review recent security events

## Security Features

### Rate Limiting
- Registration attempts: 10 per hour per user
- Authentication attempts: 20 per hour per user
- Failed attempts trigger progressive delays

### Event Logging
All security events are logged with:
- Event type and status
- IP address and user agent
- Timestamp and metadata
- User context

### Protection Mechanisms
- Challenge expiration (5 minutes)
- Replay attack prevention
- Origin validation
- User verification requirement

## Game Theory Implementation

### Achievement Types
- `first_passkey` - First passkey setup (100 points)
- `security_champion` - Multiple passkeys (200 points)
- `early_adopter` - Setup within first month (150 points)
- `consistent_user` - Regular 2FA usage (50 points/month)

### Trust Score Calculation
```javascript
const calculateTrustScore = (user) => {
  let score = 50; // Base score
  
  // Passkey factors
  score += user.passkeys.length * 15; // +15 per passkey
  score += user.has2FAEnabled ? 20 : 0; // +20 for 2FA
  
  // Usage factors
  score += user.recentSecurityEvents.filter(e => e.status === 'success').length * 2;
  score -= user.recentSecurityEvents.filter(e => e.status === 'failure').length * 5;
  
  // Time factors
  const daysSinceLastSecurity = daysSince(user.lastSecurityActivity);
  score -= Math.max(0, daysSinceLastSecurity - 30) * 0.5; // Decay after 30 days
  
  return Math.max(0, Math.min(100, score));
};
```

### Incentive Structure
- **Security Bonuses**: Reduced transaction fees for high trust scores
- **Feature Access**: Premium features unlock at higher security levels
- **Social Recognition**: Public achievement badges (opt-in)
- **Referral Rewards**: Bonus points for referring users who enable 2FA

## Browser Compatibility

### Supported Platforms
- **iOS Safari**: Face ID, Touch ID
- **Android Chrome**: Fingerprint, Face unlock
- **macOS Safari/Chrome**: Touch ID, Face ID
- **Windows Chrome/Edge**: Windows Hello, PIN
- **Hardware Keys**: YubiKey, Titan Security Key

### Feature Detection
```javascript
const checkSupport = async () => {
  if (!window.PublicKeyCredential) return false;
  
  const platformSupport = await PublicKeyCredential
    .isUserVerifyingPlatformAuthenticatorAvailable();
  
  return {
    webauthn: true,
    platform: platformSupport,
    crossPlatform: true // Assume hardware key support
  };
};
```

## Error Handling

### Common Error Scenarios
- **NotAllowedError**: User cancelled or timeout
- **SecurityError**: Invalid origin or configuration
- **NetworkError**: Connection issues
- **InvalidStateError**: Credential already exists

### User-Friendly Messages
```javascript
const getErrorMessage = (error) => {
  switch (error.name) {
    case 'NotAllowedError':
      return 'Authentication was cancelled. Please try again.';
    case 'SecurityError':
      return 'Security error. Please ensure you\'re on a secure connection.';
    case 'NetworkError':
      return 'Network error. Please check your connection.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};
```

## Testing Strategy

### Unit Tests
- Passkey service functions
- Component rendering and interactions
- Error handling scenarios
- Game theory calculations

### Integration Tests
- Full registration and authentication flows
- Database operations
- API endpoint functionality
- Rate limiting behavior

### Security Tests
- Challenge validation
- Origin verification
- Replay attack prevention
- Rate limiting effectiveness

## Deployment Considerations

### Environment Variables
```bash
# WebAuthn Configuration
WEBAUTHN_RP_NAME="Abunfi DeFi Platform"
WEBAUTHN_RP_ID="abunfi.com"
WEBAUTHN_ORIGIN="https://app.abunfi.com"

# Security Settings
PASSKEY_CHALLENGE_TIMEOUT=300000  # 5 minutes
PASSKEY_RATE_LIMIT_WINDOW=3600000 # 1 hour
PASSKEY_MAX_ATTEMPTS=10
```

### HTTPS Requirements
- WebAuthn requires HTTPS in production
- Localhost allowed for development
- Valid SSL certificate required

### Database Migrations
Run the provided SQL schema before deployment:
```bash
psql $DATABASE_URL -f scripts/add-passkey-2fa.sql
```

## Monitoring and Analytics

### Key Metrics
- 2FA adoption rate
- Passkey usage frequency
- Authentication success/failure rates
- Security event patterns
- Achievement claim rates

### Alerts
- High failure rates
- Unusual authentication patterns
- Rate limit violations
- Database errors

## Future Enhancements

### Planned Features
- **Conditional UI**: Streamlined authentication for returning users
- **Cross-Device Sync**: Passkey synchronization across user devices
- **Advanced Analytics**: Detailed security insights and recommendations
- **Enterprise Features**: Admin controls and bulk management
- **Mobile App Integration**: Native mobile app passkey support

### Game Theory Expansions
- **Seasonal Challenges**: Time-limited security achievements
- **Community Goals**: Platform-wide security milestones
- **Referral Programs**: Enhanced rewards for security advocacy
- **Premium Tiers**: Subscription benefits for security champions

## Support and Troubleshooting

### Common Issues
1. **Passkey not working**: Check browser compatibility and device settings
2. **Registration fails**: Verify HTTPS and clear browser data
3. **Authentication timeout**: Increase challenge timeout or retry
4. **Multiple devices**: Each device needs separate passkey registration

### User Education
- In-app tutorials for first-time setup
- Help documentation with screenshots
- Video guides for different platforms
- FAQ section addressing common concerns

## Conclusion

The 2FA passkey implementation provides a robust, user-friendly security enhancement to the Abunfi platform. By combining WebAuthn technology with game theory incentives, we create a system that not only improves security but actively encourages user adoption through rewards and gamification.

The implementation is designed to be scalable, maintainable, and future-proof, with comprehensive testing, monitoring, and documentation to ensure long-term success.
