# Environment Configuration - Quick Reference Card

## 🚀 Super Quick Setup (5 Minutes)

```bash
# 1. Generate .env.prod automatically
./scripts/generate-env-prod.sh

# 2. You'll be asked for:
#    - Domain name (e.g., abunfi.com)
#    - Admin email (e.g., admin@abunfi.com)
#    - RPC provider (Infura/Alchemy)
#    - Web3Auth Client ID (optional)

# 3. Deploy
DOMAIN_NAME=your-domain.com ./scripts/deploy-production.sh

# Done! ✅
```

---

## 📋 Environment Variables Reference

### Required Variables (Must Configure)

| Variable | Example | Where to Get |
|----------|---------|--------------|
| `DOMAIN_NAME` | `abunfi.com` | Your domain registrar |
| `EMAIL` | `admin@abunfi.com` | Your email for SSL |
| `POSTGRES_PASSWORD` | Auto-generated | Script generates |
| `JWT_SECRET` | Auto-generated | Script generates |
| `RPC_URL` | `https://sepolia.infura.io/v3/abc123` | [Infura](https://infura.io) or [Alchemy](https://alchemy.com) |

### Pre-configured Variables (Already Set)

| Variable | Value | Description |
|----------|-------|-------------|
| `CHAIN_ID` | `11155111` | Sepolia testnet |
| `VAULT_CONTRACT_ADDRESS` | `0x094eDDFADDd34336853Ca4f738165f39D78532EE` | Deployed vault |
| `USDC_CONTRACT_ADDRESS` | `0x65a52CC89185A86ebd7e56761A3CD229Aa4669f1` | Deployed USDC |
| `STRATEGY_MANAGER_ADDRESS` | `0xC3fe56D16454cd3e7176675aB221CFD364964a68` | Deployed manager |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `WEB3AUTH_CLIENT_ID` | `your-web3auth-client-id-here` | Get from [Web3Auth](https://dashboard.web3auth.io) |
| `BACKUP_RETENTION_DAYS` | `30` | Days to keep backups |

---

## 🔑 Get Your RPC URL

### Option 1: Infura (Recommended)

1. Go to https://infura.io
2. Sign up / Log in
3. Create new project
4. Copy Project ID
5. Use: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`

### Option 2: Alchemy

1. Go to https://alchemy.com
2. Sign up / Log in
3. Create new app (Sepolia network)
4. Copy API Key
5. Use: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`

---

## 🔐 Security Checklist

```bash
# ✅ Generate strong secrets
./scripts/generate-env-prod.sh

# ✅ Secure file permissions
chmod 600 .env.prod

# ✅ Verify not in git
grep -q ".env.prod" .gitignore && echo "✅ Safe" || echo "❌ Add to .gitignore"

# ✅ Create encrypted backup
tar -czf secrets.tar.gz .env.prod
gpg -c secrets.tar.gz
rm secrets.tar.gz
```

---

## 📝 Manual Configuration Template

If you prefer manual setup:

```bash
# Copy template
cp .env.production.example .env.prod

# Edit file
nano .env.prod
```

**Replace these values:**

```bash
# 1. Domain & Email
DOMAIN_NAME=your-domain.com          # ← Your actual domain
EMAIL=admin@your-domain.com          # ← Your email

# 2. Generate strong passwords
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)

# 3. RPC URL
RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID  # ← Your Infura/Alchemy URL

# 4. Contract addresses (already deployed - use these)
VAULT_CONTRACT_ADDRESS=0x094eDDFADDd34336853Ca4f738165f39D78532EE
STRATEGY_MANAGER_ADDRESS=0xC3fe56D16454cd3e7176675aB221CFD364964a68
USDC_CONTRACT_ADDRESS=0x65a52CC89185A86ebd7e56761A3CD229Aa4669f1

# 5. Web3Auth (optional)
WEB3AUTH_CLIENT_ID=your-client-id    # ← From Web3Auth dashboard
```

---

## ✅ Validation Commands

```bash
# Check all required variables are set
source .env.prod
required_vars=("DOMAIN_NAME" "POSTGRES_PASSWORD" "JWT_SECRET" "RPC_URL" "VAULT_CONTRACT_ADDRESS")
for var in "${required_vars[@]}"; do
    [[ -z "${!var}" ]] && echo "❌ Missing: $var" || echo "✅ Set: $var"
done

# Test RPC connection
curl -X POST $RPC_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
# Should return: {"jsonrpc":"2.0","id":1,"result":"0xaa36a7"}

# Verify file permissions
ls -la .env.prod
# Should show: -rw------- (600)
```

---

## 🎯 Where Variables Are Used

```
.env.prod
    │
    ├─→ DOMAIN_NAME
    │   ├─→ Nginx: Server name & SSL certificate path
    │   ├─→ Certbot: Domain for SSL certificate
    │   └─→ Backend: CORS origin (https://$DOMAIN_NAME)
    │
    ├─→ EMAIL
    │   └─→ Certbot: Contact email for SSL certificates
    │
    ├─→ POSTGRES_PASSWORD
    │   ├─→ PostgreSQL: Database password
    │   └─→ Backend: Database connection string
    │
    ├─→ JWT_SECRET
    │   └─→ Backend: JWT token signing
    │
    ├─→ RPC_URL
    │   └─→ Backend: Blockchain connection
    │
    ├─→ CHAIN_ID
    │   └─→ Backend: Network identification
    │
    ├─→ VAULT_CONTRACT_ADDRESS
    │   └─→ Backend: Smart contract interaction
    │
    └─→ WEB3AUTH_CLIENT_ID
        └─→ Backend: Web3 authentication
```

---

## 🚨 Common Issues

### Issue: "Missing environment variable"

```bash
# Check which variables are missing
grep -E "your-|GENERATE|YOUR_" .env.prod

# Should return empty (no placeholders)
```

**Fix:** Run `./scripts/generate-env-prod.sh` or manually set values

### Issue: "RPC connection failed"

```bash
# Test RPC URL
curl -X POST $RPC_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"net_version","params":[],"id":1}'
```

**Fix:** 
- Verify API key is correct
- Check URL format
- Ensure network is Sepolia (11155111)

### Issue: "Permission denied"

```bash
# Fix file permissions
chmod 600 .env.prod
```

---

## 📞 Quick Commands

```bash
# Generate .env.prod
./scripts/generate-env-prod.sh

# View current config (hide secrets)
cat .env.prod | grep -v "PASSWORD\|SECRET\|KEY" | grep -v "^#" | grep -v "^$"

# Validate configuration
source .env.prod && echo "✅ Valid"

# Deploy
DOMAIN_NAME=$DOMAIN_NAME ./scripts/deploy-production.sh

# Monitor
./scripts/monitor-production.sh
```

---

## 🎓 Pro Tips

1. **Use the automated script** - It's faster and safer
   ```bash
   ./scripts/generate-env-prod.sh
   ```

2. **Keep encrypted backup** - Store secrets safely
   ```bash
   gpg -c .env.prod
   # Creates .env.prod.gpg
   ```

3. **Test before deploying** - Verify RPC connection
   ```bash
   curl -X POST $RPC_URL -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
   ```

4. **Use strong secrets** - Let the script generate them
   ```bash
   # Don't use weak passwords like "password123"
   # Let openssl generate cryptographically secure secrets
   ```

---

## 📚 Related Documentation

- **Detailed Guide**: `ENV_CONFIGURATION_GUIDE.md`
- **Docker Review**: `DOCKER_PRODUCTION_REVIEW.md`
- **Quick Action Plan**: `QUICK_ACTION_PLAN.md`
- **Implementation Guide**: `IMPLEMENTATION_GUIDE.md`

---

## ✨ Summary

**Fastest way to configure:**
```bash
./scripts/generate-env-prod.sh
```

**What you need:**
1. Domain name
2. Admin email
3. Infura/Alchemy API key
4. Web3Auth Client ID (optional)

**What's auto-configured:**
- ✅ Strong passwords (32-64 chars)
- ✅ Contract addresses (from deployment)
- ✅ Network settings (Sepolia)
- ✅ File permissions (600)

**Time required:** 5 minutes

**Ready to deploy!** 🚀

