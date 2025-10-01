# Environment Configuration Guide

## 🎯 Quick Setup

### Option 1: Automated Setup (Recommended)

```bash
# Run the automated script
./scripts/generate-env-prod.sh

# Follow the interactive prompts:
# 1. Enter your domain name
# 2. Enter admin email
# 3. Select RPC provider (Infura/Alchemy/Custom)
# 4. Enter Web3Auth Client ID (optional)

# Done! Your .env.prod is ready
```

### Option 2: Manual Setup

```bash
# Copy the example file
cp .env.production.example .env.prod

# Edit with your values
nano .env.prod

# Secure the file
chmod 600 .env.prod
```

---

## 📋 Required Environment Variables

### 1. Domain & SSL Configuration

```bash
# Your production domain
DOMAIN_NAME=abunfi.com

# Admin email for SSL certificates
EMAIL=admin@abunfi.com
```

### 2. Database Configuration

```bash
# PostgreSQL password (generate strong password)
POSTGRES_PASSWORD=$(openssl rand -base64 32)

# Example: 
POSTGRES_PASSWORD=xK9mP2vL8nQ4wR7tY3uI6oP1aS5dF0gH
```

**Generate strong password:**
```bash
openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
```

### 3. Security Configuration

```bash
# JWT Secret (generate strong secret)
JWT_SECRET=$(openssl rand -base64 64)

# Example:
JWT_SECRET=aB3cD4eF5gH6iJ7kL8mN9oP0qR1sT2uV3wX4yZ5aB6cD7eF8gH9iJ0kL1mN2oP3qR4sT5uV6wX7yZ8
```

**Generate strong JWT secret:**
```bash
openssl rand -base64 64 | tr -d "=+/" | cut -c1-64
```

### 4. Blockchain Configuration

```bash
# RPC URL - Choose one:

# Option A: Infura (Recommended)
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID

# Option B: Alchemy
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY

# Option C: Custom RPC
RPC_URL=https://your-custom-rpc-url.com

# Chain ID (Sepolia testnet)
CHAIN_ID=11155111
```

**Get RPC URL:**
- **Infura**: https://infura.io → Create project → Copy Project ID
- **Alchemy**: https://alchemy.com → Create app → Copy API Key

### 5. Contract Addresses (Already Deployed)

Your contracts are already deployed on Sepolia. Use these addresses:

```bash
# Core Contracts (from sepolia-core.json)
VAULT_CONTRACT_ADDRESS=0x094eDDFADDd34336853Ca4f738165f39D78532EE
STRATEGY_MANAGER_ADDRESS=0xC3fe56D16454cd3e7176675aB221CFD364964a68
USDC_CONTRACT_ADDRESS=0x65a52CC89185A86ebd7e56761A3CD229Aa4669f1

# Strategy Contracts
AAVE_STRATEGY_ADDRESS=0x050B21B2191eA6dEB0f12fD4fd40C7b59f6E397a
COMPOUND_STRATEGY_ADDRESS=0xC8235CE9F96aa2D8b21Bee4Ee99a47B45C30b7f1
LIQUID_STAKING_STRATEGY_ADDRESS=0x31B602db32404AB15a41075774ccAF66918edA8c
```

**Verify on Etherscan:**
- Vault: https://sepolia.etherscan.io/address/0x094eDDFADDd34336853Ca4f738165f39D78532EE
- USDC: https://sepolia.etherscan.io/address/0x65a52CC89185A86ebd7e56761A3CD229Aa4669f1

### 6. Web3Auth Configuration

```bash
# Get from Web3Auth Dashboard
WEB3AUTH_CLIENT_ID=your-web3auth-client-id-here
```

**Setup Web3Auth:**
1. Go to https://dashboard.web3auth.io
2. Create new project
3. Add your domain to whitelist
4. Copy Client ID

---

## 🔒 Security Best Practices

### 1. Generate Strong Secrets

```bash
# PostgreSQL Password (32 characters)
openssl rand -base64 32 | tr -d "=+/" | cut -c1-32

# JWT Secret (64 characters)
openssl rand -base64 64 | tr -d "=+/" | cut -c1-64
```

### 2. Secure File Permissions

```bash
# Set restrictive permissions
chmod 600 .env.prod

# Verify permissions
ls -la .env.prod
# Should show: -rw------- (owner read/write only)
```

### 3. Never Commit Secrets

```bash
# Verify .env.prod is in .gitignore
grep -q ".env.prod" .gitignore || echo ".env.prod" >> .gitignore

# Check git status
git status
# .env.prod should NOT appear in untracked files
```

### 4. Create Encrypted Backup

```bash
# Create encrypted backup of secrets
tar -czf secrets-backup-$(date +%Y%m%d).tar.gz .env.prod
gpg -c secrets-backup-$(date +%Y%m%d).tar.gz
rm secrets-backup-$(date +%Y%m%d).tar.gz

# Store the .gpg file in secure location
# Remember the passphrase!
```

---

## 📝 Complete .env.prod Template

Here's a complete template with your deployed contracts:

```bash
# Production Environment Configuration for Abunfi
# Generated: 2025-09-30

# =============================================================================
# DOMAIN & SSL CONFIGURATION
# =============================================================================
DOMAIN_NAME=your-domain.com
EMAIL=admin@your-domain.com

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
POSTGRES_PASSWORD=GENERATE_STRONG_PASSWORD_HERE

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================
JWT_SECRET=GENERATE_STRONG_SECRET_HERE

# =============================================================================
# BLOCKCHAIN CONFIGURATION - SEPOLIA TESTNET
# =============================================================================
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
CHAIN_ID=11155111

# =============================================================================
# DEPLOYED CONTRACT ADDRESSES (Sepolia Testnet)
# =============================================================================
# Core Contracts
VAULT_CONTRACT_ADDRESS=0x094eDDFADDd34336853Ca4f738165f39D78532EE
STRATEGY_MANAGER_ADDRESS=0xC3fe56D16454cd3e7176675aB221CFD364964a68
USDC_CONTRACT_ADDRESS=0x65a52CC89185A86ebd7e56761A3CD229Aa4669f1

# Strategy Contracts
AAVE_STRATEGY_ADDRESS=0x050B21B2191eA6dEB0f12fD4fd40C7b59f6E397a
COMPOUND_STRATEGY_ADDRESS=0xC8235CE9F96aa2D8b21Bee4Ee99a47B45C30b7f1
LIQUID_STAKING_STRATEGY_ADDRESS=0x31B602db32404AB15a41075774ccAF66918edA8c

# =============================================================================
# WEB3AUTH CONFIGURATION
# =============================================================================
WEB3AUTH_CLIENT_ID=your-web3auth-client-id-here

# =============================================================================
# OPTIONAL CONFIGURATION
# =============================================================================
BACKUP_RETENTION_DAYS=30
BACKUP_S3_BUCKET=abunfi-backups
```

---

## ✅ Validation Checklist

Before deploying, verify:

- [ ] **Domain configured**: DOMAIN_NAME is your actual domain
- [ ] **Email configured**: EMAIL is valid for SSL certificates
- [ ] **Strong passwords**: POSTGRES_PASSWORD is 32+ characters
- [ ] **Strong JWT secret**: JWT_SECRET is 64+ characters
- [ ] **RPC URL configured**: Valid Infura/Alchemy URL with API key
- [ ] **Contract addresses**: Using deployed Sepolia addresses
- [ ] **Web3Auth configured**: Client ID from Web3Auth dashboard
- [ ] **File secured**: chmod 600 .env.prod
- [ ] **Not in git**: .env.prod in .gitignore
- [ ] **Backup created**: Encrypted backup stored securely

---

## 🧪 Testing Configuration

### Test Environment Variables

```bash
# Load and verify environment
set -a
source .env.prod
set +a

# Check required variables
echo "Domain: $DOMAIN_NAME"
echo "Chain ID: $CHAIN_ID"
echo "Vault: $VAULT_CONTRACT_ADDRESS"

# Verify all required variables are set
required_vars=("DOMAIN_NAME" "POSTGRES_PASSWORD" "JWT_SECRET" "RPC_URL" "VAULT_CONTRACT_ADDRESS")
for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        echo "❌ Missing: $var"
    else
        echo "✅ Set: $var"
    fi
done
```

### Test RPC Connection

```bash
# Test RPC URL is accessible
curl -X POST $RPC_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

# Should return: {"jsonrpc":"2.0","id":1,"result":"0xaa36a7"}
# 0xaa36a7 = 11155111 (Sepolia)
```

### Test Contract Addresses

```bash
# Verify vault contract exists
curl -X POST $RPC_URL \
  -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getCode\",\"params\":[\"$VAULT_CONTRACT_ADDRESS\",\"latest\"],\"id\":1}"

# Should return contract bytecode (not "0x")
```

---

## 🚀 Deployment

Once .env.prod is configured:

```bash
# 1. Verify configuration
cat .env.prod

# 2. Deploy to production
DOMAIN_NAME=your-domain.com ./scripts/deploy-production.sh

# 3. Verify deployment
./scripts/monitor-production.sh

# 4. Test endpoints
curl https://your-domain.com/health
curl https://your-domain.com/api/health
```

---

## 🆘 Troubleshooting

### Issue: Missing environment variables

```bash
# Check which variables are missing
grep -E "^[A-Z_]+=.*your-|^[A-Z_]+=.*GENERATE" .env.prod

# Should return empty (no placeholder values)
```

### Issue: RPC connection fails

```bash
# Test RPC URL
curl -X POST $RPC_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"net_version","params":[],"id":1}'

# Check API key is valid
# Verify URL format is correct
```

### Issue: Contract not found

```bash
# Verify contract address on Etherscan
open "https://sepolia.etherscan.io/address/$VAULT_CONTRACT_ADDRESS"

# Check deployment files
cat contracts-submodule/deployments/sepolia-core.json
```

---

## 📞 Quick Reference

### Generate Secrets
```bash
./scripts/generate-env-prod.sh
```

### Verify Configuration
```bash
cat .env.prod | grep -v "^#" | grep -v "^$"
```

### Secure File
```bash
chmod 600 .env.prod
```

### Deploy
```bash
DOMAIN_NAME=your-domain.com ./scripts/deploy-production.sh
```

---

## 🎯 Summary

**Your deployed contracts on Sepolia:**
- ✅ Vault: `0x094eDDFADDd34336853Ca4f738165f39D78532EE`
- ✅ USDC: `0x65a52CC89185A86ebd7e56761A3CD229Aa4669f1`
- ✅ Strategy Manager: `0xC3fe56D16454cd3e7176675aB221CFD364964a68`

**What you need to configure:**
1. Domain name
2. Admin email
3. Strong passwords (auto-generated by script)
4. RPC URL (Infura or Alchemy)
5. Web3Auth Client ID

**Recommended approach:**
```bash
# Run automated script
./scripts/generate-env-prod.sh

# Follow prompts, then deploy
DOMAIN_NAME=your-domain.com ./scripts/deploy-production.sh
```

That's it! Your environment is ready for production deployment. 🚀

