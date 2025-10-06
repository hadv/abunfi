# Web3Auth Setup Guide

## Overview

Abunfi uses **Web3Auth** for social login, allowing users to authenticate with Google, Apple, or Facebook and automatically create an Ethereum wallet. This guide explains how to set up Web3Auth for your deployment.

## What is Web3Auth?

Web3Auth is a pluggable authentication infrastructure that enables:
- **Social Login**: Google, Apple, Facebook, Twitter, Discord, etc.
- **Wallet Creation**: Automatic non-custodial wallet generation
- **Key Management**: Secure private key management using MPC (Multi-Party Computation)
- **Web3 Integration**: Seamless integration with Ethereum and other blockchains

## Current Implementation

### Files
- **Frontend Context**: `frontend/src/contexts/Web3AuthContext.js`
- **Environment Config**: `frontend/.env.example`

### Features Implemented
✅ Web3Auth SDK initialization  
✅ Social login (Google, Apple, Facebook)  
✅ Wallet creation and management  
✅ Balance checking  
✅ Message signing  
✅ Transaction sending  
✅ Graceful fallback if not configured  

## Setup Instructions

### Step 1: Create Web3Auth Account

1. Go to [https://dashboard.web3auth.io/](https://dashboard.web3auth.io/)
2. Sign up or log in with your email
3. You'll be redirected to the Web3Auth Dashboard

### Step 2: Create a New Project

1. Click **"Create Project"** or **"New Project"**
2. Fill in project details:
   - **Project Name**: `Abunfi` (or your app name)
   - **Environment**: Select `Sapphire Devnet` for testnet
   - **Platform**: Select `Web`

3. Click **"Create"**

### Step 3: Get Your Client ID

1. After creating the project, you'll see your **Client ID**
2. Copy this Client ID - you'll need it for configuration
3. It looks like: `BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ`

### Step 4: Configure Verifiers (Social Login)

Web3Auth uses "verifiers" for social login. By default, Google, Apple, and Facebook are pre-configured.

**For Custom Configuration:**

1. Go to **"Social Login"** tab in your project
2. Enable the providers you want:
   - ✅ **Google** (recommended)
   - ✅ **Apple** (for iOS users)
   - ✅ **Facebook** (optional)
   - ⬜ **Twitter** (optional)
   - ⬜ **Discord** (optional)
   - ⬜ **GitHub** (optional)

3. For each provider, you may need to configure OAuth credentials:
   - **Google**: Uses Web3Auth's default (or add your own)
   - **Apple**: Requires Apple Developer account
   - **Facebook**: Requires Facebook App ID

### Step 5: Configure Whitelist (Optional)

For production, you should whitelist your domains:

1. Go to **"Whitelist"** tab
2. Add your domains:
   - `http://localhost:3000` (for local development)
   - `https://yourdomain.com` (for production)
   - `https://testnet.yourdomain.com` (for testnet)

### Step 6: Update Environment Variables

Update your `frontend/.env` file:

```bash
# Web3Auth Configuration
REACT_APP_WEB3AUTH_CLIENT_ID=BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ
REACT_APP_WEB3AUTH_NETWORK=sapphire_devnet

# Blockchain Configuration (Sepolia Testnet)
REACT_APP_CHAIN_ID=11155111
REACT_APP_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
```

**Network Options:**
- `sapphire_devnet` - For development/testnet (recommended)
- `sapphire_mainnet` - For production mainnet
- `testnet` - Legacy testnet
- `mainnet` - Legacy mainnet
- `cyan` - Cyan network

### Step 7: Test the Integration

1. Start your frontend:
```bash
cd frontend
npm start
```

2. Navigate to login page: `http://localhost:3000/login`

3. Click on a social login button (Google, Apple, or Facebook)

4. Complete the OAuth flow

5. You should see:
   - User logged in
   - Wallet address displayed
   - Balance shown (if you have Sepolia ETH)

## How It Works

### Login Flow

```
User clicks "Login with Google"
         ↓
Web3Auth opens OAuth popup
         ↓
User authenticates with Google
         ↓
Web3Auth generates wallet using MPC
         ↓
Private key stored securely (user-controlled)
         ↓
App receives wallet address & user info
         ↓
User can sign messages & send transactions
```

### Key Features

**Non-Custodial**
- User controls their private key
- Web3Auth uses threshold cryptography (MPC)
- No single point of failure

**Seamless UX**
- No seed phrases to remember
- Social login familiar to users
- Automatic wallet creation

**Secure**
- Private keys never exposed
- MPC-based key management
- Industry-standard OAuth

## Code Example

### Using Web3Auth Context

```javascript
import { useWeb3Auth } from '../contexts/Web3AuthContext';

function MyComponent() {
  const { 
    login, 
    logout, 
    isAuthenticated, 
    userInfo, 
    walletAddress,
    getBalance,
    signMessage,
    sendTransaction 
  } = useWeb3Auth();

  const handleLogin = async () => {
    try {
      const result = await login('google');
      console.log('Logged in:', result.walletAddress);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleSignMessage = async () => {
    try {
      const signature = await signMessage('Hello, Web3!');
      console.log('Signature:', signature);
    } catch (error) {
      console.error('Signing failed:', error);
    }
  };

  return (
    <div>
      {!isAuthenticated ? (
        <button onClick={handleLogin}>Login with Google</button>
      ) : (
        <div>
          <p>Welcome, {userInfo?.name}</p>
          <p>Wallet: {walletAddress}</p>
          <button onClick={handleSignMessage}>Sign Message</button>
          <button onClick={logout}>Logout</button>
        </div>
      )}
    </div>
  );
}
```

## Troubleshooting

### Issue: "Web3Auth not initialized"

**Cause**: Client ID not configured or invalid

**Solution**:
1. Check `REACT_APP_WEB3AUTH_CLIENT_ID` in `.env`
2. Verify Client ID is correct from Web3Auth dashboard
3. Restart frontend server after changing `.env`

### Issue: "Failed to connect with Web3Auth"

**Cause**: Network issues or popup blocked

**Solution**:
1. Check browser console for errors
2. Allow popups for your domain
3. Check internet connection
4. Verify Web3Auth network is correct (`sapphire_devnet`)

### Issue: "Domain not whitelisted"

**Cause**: Your domain is not in Web3Auth whitelist

**Solution**:
1. Go to Web3Auth dashboard
2. Add your domain to whitelist
3. Include both `http://localhost:3000` and production domain

### Issue: "Provider not available"

**Cause**: User not logged in or session expired

**Solution**:
1. Check `isAuthenticated` before calling provider methods
2. Handle login state properly
3. Implement session persistence if needed

## Production Considerations

### Security

✅ **Use Mainnet Network**: Switch to `sapphire_mainnet` for production  
✅ **Whitelist Domains**: Only allow your production domains  
✅ **Enable MFA**: Consider enabling multi-factor authentication  
✅ **Monitor Usage**: Track login attempts and failures  

### Performance

✅ **Cache User Info**: Store user info in local state  
✅ **Lazy Load SDK**: Load Web3Auth SDK only when needed  
✅ **Handle Errors**: Implement proper error handling  
✅ **Session Management**: Persist login state across refreshes  

### User Experience

✅ **Loading States**: Show loading indicators during login  
✅ **Error Messages**: Display user-friendly error messages  
✅ **Logout Flow**: Implement clear logout functionality  
✅ **Wallet Info**: Show wallet address and balance  

## Migration from Placeholder

The Web3Auth integration is **already complete**! No migration needed.

**Before** (Placeholder):
```javascript
// TODO: Implement Web3Auth login
const placeholderUser = { email: 'user@example.com' };
```

**After** (Implemented):
```javascript
// Real Web3Auth login
const web3authProvider = await web3auth.connect();
const user = await web3auth.getUserInfo();
```

## Resources

- **Web3Auth Dashboard**: https://dashboard.web3auth.io/
- **Documentation**: https://web3auth.io/docs/
- **SDK Reference**: https://web3auth.io/docs/sdk/web/modal/
- **Examples**: https://github.com/Web3Auth/web3auth-pnp-examples

## Summary

✅ Web3Auth is **fully implemented** in Abunfi  
✅ Supports Google, Apple, Facebook login  
✅ Creates non-custodial Ethereum wallets  
✅ Handles signing and transactions  
✅ Production-ready with proper error handling  

**Next Step**: Get your Client ID from [web3auth.io](https://web3auth.io/) and add it to your `.env` file!

