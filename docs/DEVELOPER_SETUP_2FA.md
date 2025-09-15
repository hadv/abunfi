# Developer Setup Guide: 2FA Passkeys

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- HTTPS setup (required for WebAuthn)

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install @simplewebauthn/server uuid
```

**Frontend:**
```bash
cd frontend
npm install @simplewebauthn/browser
```

### 2. Database Setup

Run the migration script:
```bash
psql $DATABASE_URL -f scripts/add-passkey-2fa.sql
```

### 3. Environment Variables

Add to your `.env` file:
```bash
# WebAuthn Configuration
WEBAUTHN_RP_NAME="Abunfi DeFi Platform"
WEBAUTHN_RP_ID="localhost"  # Use your domain in production
WEBAUTHN_ORIGIN="https://localhost:3000"  # Must be HTTPS

# Security Settings
PASSKEY_CHALLENGE_TIMEOUT=300000  # 5 minutes
PASSKEY_RATE_LIMIT_WINDOW=3600000 # 1 hour
PASSKEY_MAX_ATTEMPTS=10
```

### 4. HTTPS Setup for Development

**Option A: Use mkcert (Recommended)**
```bash
# Install mkcert
brew install mkcert  # macOS
# or
choco install mkcert  # Windows

# Create local CA
mkcert -install

# Generate certificates
mkcert localhost 127.0.0.1 ::1

# Update your start scripts to use HTTPS
```

**Option B: Use ngrok**
```bash
# Install ngrok
npm install -g ngrok

# Start your app normally
npm start

# In another terminal, expose with HTTPS
ngrok http 3000
```

### 5. Test the Implementation

1. Start backend: `npm run dev`
2. Start frontend: `npm start` (with HTTPS)
3. Navigate to login page
4. Complete social login
5. Follow 2FA setup prompts

## API Endpoints

### Registration Flow
```javascript
// 1. Begin registration
POST /api/passkey/register/begin
{
  "deviceName": "My iPhone"
}

// 2. Complete registration
POST /api/passkey/register/complete
{
  "credential": { /* WebAuthn credential */ },
  "deviceName": "My iPhone"
}
```

### Authentication Flow
```javascript
// 1. Begin authentication
POST /api/passkey/authenticate/begin

// 2. Complete authentication
POST /api/passkey/authenticate/complete
{
  "credential": { /* WebAuthn assertion */ },
  "temporaryToken": "temp-jwt-token"
}
```

### Management
```javascript
// List passkeys
GET /api/passkey/list

// Delete passkey
DELETE /api/passkey/:id

// Security status
GET /api/passkey/security/status

// Recommendations
GET /api/passkey/security/recommendations
```

## Frontend Integration

### Basic Usage
```javascript
import passkeyService from './services/passkeyService';

// Check support
const isSupported = passkeyService.isSupported;

// Register passkey
try {
  const result = await passkeyService.register('My Device');
  console.log('Registration successful:', result);
} catch (error) {
  console.error('Registration failed:', error);
}

// Authenticate
try {
  const result = await passkeyService.authenticate(temporaryToken);
  console.log('Authentication successful:', result);
} catch (error) {
  console.error('Authentication failed:', error);
}
```

### React Components
```javascript
import PasskeyRegistration from './components/PasskeyRegistration';
import PasskeyAuthentication from './components/PasskeyAuthentication';
import SecurityDashboard from './components/SecurityDashboard';

// Registration dialog
<PasskeyRegistration
  open={showRegistration}
  onClose={() => setShowRegistration(false)}
  onSuccess={(result) => {
    console.log('Passkey registered:', result);
    setShowRegistration(false);
  }}
/>

// Authentication dialog
<PasskeyAuthentication
  open={show2FA}
  onClose={() => setShow2FA(false)}
  onSuccess={() => {
    console.log('2FA completed');
    navigate('/dashboard');
  }}
  temporaryToken={tempToken}
/>

// Security management
<SecurityDashboard />
```

## Testing

### Unit Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Manual Testing Checklist

**Registration:**
- [ ] Device compatibility check works
- [ ] Registration options generated correctly
- [ ] WebAuthn ceremony completes successfully
- [ ] Passkey stored in database
- [ ] Achievements awarded correctly

**Authentication:**
- [ ] Authentication options generated
- [ ] WebAuthn assertion works
- [ ] Temporary token validated
- [ ] Full JWT token issued
- [ ] Security events logged

**Management:**
- [ ] Passkey list displays correctly
- [ ] Passkey deletion works
- [ ] Cannot delete last passkey
- [ ] Security dashboard loads
- [ ] Achievements display properly

## Common Issues

### "WebAuthn not supported"
- Ensure HTTPS is enabled
- Check browser compatibility
- Verify device has biometric authentication

### "Registration fails"
- Check HTTPS certificate validity
- Verify RP ID matches domain
- Clear browser cache/cookies
- Check browser console for errors

### "Authentication timeout"
- Increase challenge timeout
- Check network connectivity
- Verify challenge hasn't expired

### Database Errors
- Ensure migration ran successfully
- Check database permissions
- Verify connection string

## Production Deployment

### Environment Setup
```bash
# Production environment variables
WEBAUTHN_RP_ID="yourdomain.com"
WEBAUTHN_ORIGIN="https://app.yourdomain.com"
NODE_ENV="production"
```

### Security Checklist
- [ ] HTTPS certificate valid
- [ ] RP ID matches production domain
- [ ] Rate limiting configured
- [ ] Security event logging enabled
- [ ] Database backups configured
- [ ] Monitoring alerts set up

### Performance Considerations
- Database indexing on credential_id and user_id
- Rate limiting to prevent abuse
- Challenge cleanup job for expired entries
- Security event log rotation

## Monitoring

### Key Metrics
```javascript
// Track these metrics
- 2FA adoption rate
- Passkey registration success rate
- Authentication success rate
- Security event frequency
- Achievement claim rate
```

### Alerts
- High authentication failure rate
- Unusual security event patterns
- Database connection issues
- Rate limit violations

## Debugging

### Enable Debug Logging
```javascript
// Backend
const logger = require('./utils/logger');
logger.level = 'debug';

// Frontend
localStorage.setItem('debug', 'passkey:*');
```

### Common Debug Commands
```bash
# Check database state
psql $DATABASE_URL -c "SELECT * FROM user_passkeys WHERE user_id = 'user-id';"

# View security events
psql $DATABASE_URL -c "SELECT * FROM security_events ORDER BY created_at DESC LIMIT 10;"

# Check challenges
psql $DATABASE_URL -c "SELECT * FROM webauthn_challenges WHERE used = false;"
```

## Contributing

### Code Style
- Use ESLint configuration
- Follow existing patterns
- Add JSDoc comments
- Write tests for new features

### Pull Request Process
1. Create feature branch
2. Implement changes
3. Add/update tests
4. Update documentation
5. Submit PR with description

### Testing Requirements
- Unit tests for new functions
- Integration tests for API endpoints
- Manual testing on multiple browsers
- Security testing for vulnerabilities

## Resources

### Documentation
- [WebAuthn Specification](https://w3c.github.io/webauthn/)
- [SimpleWebAuthn Library](https://simplewebauthn.dev/)
- [MDN WebAuthn Guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)

### Tools
- [WebAuthn.io](https://webauthn.io/) - Testing tool
- [WebAuthn Debugger](https://webauthn.me/) - Debug tool
- [FIDO Alliance](https://fidoalliance.org/) - Standards body

### Browser Support
- Chrome 67+
- Firefox 60+
- Safari 14+
- Edge 18+

---

**Questions?** Check the main documentation or contact the development team.
