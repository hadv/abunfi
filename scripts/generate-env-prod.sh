#!/bin/bash

# Generate Production Environment Configuration
# This script creates a .env.prod file with secure secrets and deployed contract addresses

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 Generating Production Environment Configuration${NC}"
echo -e "${BLUE}=================================================${NC}"

# Check if .env.prod already exists
if [[ -f .env.prod ]]; then
    echo -e "\n${YELLOW}⚠️  .env.prod already exists${NC}"
    read -p "Do you want to backup and recreate it? (y/n): " backup_choice
    if [[ $backup_choice == "y" ]]; then
        BACKUP_FILE=".env.prod.backup.$(date +%Y%m%d_%H%M%S)"
        cp .env.prod "$BACKUP_FILE"
        echo -e "${GREEN}✅ Backed up to $BACKUP_FILE${NC}"
    else
        echo -e "${YELLOW}Exiting without changes${NC}"
        exit 0
    fi
fi

# Generate secure secrets
echo -e "\n${YELLOW}🔑 Generating secure secrets...${NC}"
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)

echo -e "${GREEN}✅ Generated POSTGRES_PASSWORD (32 chars)${NC}"
echo -e "${GREEN}✅ Generated JWT_SECRET (64 chars)${NC}"

# Get user input for required fields
echo -e "\n${YELLOW}📝 Please provide the following information:${NC}"

# Domain name
read -p "Domain name (e.g., abunfi.com): " DOMAIN_NAME
if [[ -z "$DOMAIN_NAME" ]]; then
    echo -e "${RED}❌ Domain name is required${NC}"
    exit 1
fi

# Email
read -p "Admin email (default: admin@$DOMAIN_NAME): " EMAIL
EMAIL=${EMAIL:-"admin@$DOMAIN_NAME"}

# RPC URL
echo -e "\n${YELLOW}Blockchain RPC Configuration:${NC}"
echo -e "   1) Infura (recommended)"
echo -e "   2) Alchemy"
echo -e "   3) Custom RPC URL"
read -p "Select RPC provider (1-3): " rpc_choice

case $rpc_choice in
    1)
        read -p "Enter your Infura Project ID: " INFURA_ID
        RPC_URL="https://sepolia.infura.io/v3/$INFURA_ID"
        ;;
    2)
        read -p "Enter your Alchemy API Key: " ALCHEMY_KEY
        RPC_URL="https://eth-sepolia.g.alchemy.com/v2/$ALCHEMY_KEY"
        ;;
    3)
        read -p "Enter custom RPC URL: " RPC_URL
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

# Web3Auth Client ID
echo -e "\n${YELLOW}Web3Auth Configuration:${NC}"
read -p "Web3Auth Client ID (or press Enter to skip): " WEB3AUTH_CLIENT_ID
WEB3AUTH_CLIENT_ID=${WEB3AUTH_CLIENT_ID:-"your-web3auth-client-id-here"}

# Load deployed contract addresses from sepolia-core.json
echo -e "\n${YELLOW}📦 Loading deployed contract addresses...${NC}"

if [[ -f "contracts-submodule/deployments/sepolia-core.json" ]]; then
    VAULT_ADDRESS=$(grep -A 1 '"vault"' contracts-submodule/deployments/sepolia-core.json | grep -o '0x[a-fA-F0-9]*' | head -1)
    USDC_ADDRESS=$(grep -A 1 '"usdc"' contracts-submodule/deployments/sepolia-core.json | grep -o '0x[a-fA-F0-9]*' | head -1)
    STRATEGY_MANAGER_ADDRESS=$(grep -A 1 '"strategyManager"' contracts-submodule/deployments/sepolia-core.json | grep -o '0x[a-fA-F0-9]*' | head -1)
    
    echo -e "${GREEN}✅ Loaded Vault: $VAULT_ADDRESS${NC}"
    echo -e "${GREEN}✅ Loaded USDC: $USDC_ADDRESS${NC}"
    echo -e "${GREEN}✅ Loaded StrategyManager: $STRATEGY_MANAGER_ADDRESS${NC}"
else
    echo -e "${YELLOW}⚠️  Contract deployment file not found, using placeholders${NC}"
    VAULT_ADDRESS="0x094eDDFADDd34336853Ca4f738165f39D78532EE"
    USDC_ADDRESS="0x65a52CC89185A86ebd7e56761A3CD229Aa4669f1"
    STRATEGY_MANAGER_ADDRESS="0xC3fe56D16454cd3e7176675aB221CFD364964a68"
fi

# Create .env.prod file
echo -e "\n${YELLOW}📝 Creating .env.prod file...${NC}"

cat > .env.prod << EOF
# Production Environment Configuration for Abunfi
# Generated on: $(date)
# DO NOT COMMIT THIS FILE TO VERSION CONTROL

# =============================================================================
# DOMAIN & SSL CONFIGURATION
# =============================================================================
DOMAIN_NAME=$DOMAIN_NAME
EMAIL=$EMAIL

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
# PostgreSQL password (auto-generated secure password)
POSTGRES_PASSWORD=$POSTGRES_PASSWORD

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================
# JWT Secret (auto-generated secure secret)
JWT_SECRET=$JWT_SECRET

# =============================================================================
# BLOCKCHAIN CONFIGURATION - SEPOLIA TESTNET
# =============================================================================
# RPC URL for blockchain connection
RPC_URL=$RPC_URL

# Chain ID (11155111 for Sepolia testnet)
CHAIN_ID=11155111

# =============================================================================
# DEPLOYED CONTRACT ADDRESSES (Sepolia Testnet)
# =============================================================================
# Core Contracts
VAULT_CONTRACT_ADDRESS=$VAULT_ADDRESS
STRATEGY_MANAGER_ADDRESS=$STRATEGY_MANAGER_ADDRESS
USDC_CONTRACT_ADDRESS=$USDC_ADDRESS

# Strategy Contracts (from sepolia-core.json)
AAVE_STRATEGY_ADDRESS=0x050B21B2191eA6dEB0f12fD4fd40C7b59f6E397a
COMPOUND_STRATEGY_ADDRESS=0xC8235CE9F96aa2D8b21Bee4Ee99a47B45C30b7f1
LIQUID_STAKING_STRATEGY_ADDRESS=0x31B602db32404AB15a41075774ccAF66918edA8c

# =============================================================================
# WEB3AUTH CONFIGURATION
# =============================================================================
# Web3Auth Client ID (get from Web3Auth dashboard)
WEB3AUTH_CLIENT_ID=$WEB3AUTH_CLIENT_ID

# =============================================================================
# OPTIONAL CONFIGURATION
# =============================================================================
# Backup configuration
BACKUP_RETENTION_DAYS=30
BACKUP_S3_BUCKET=abunfi-backups

# Monitoring configuration (optional)
# SENTRY_DSN=your-sentry-dsn-for-error-tracking
# ANALYTICS_ID=your-analytics-id

# =============================================================================
# PRODUCTION NOTES
# =============================================================================
# ✅ Secrets auto-generated with cryptographically secure random values
# ✅ Contract addresses loaded from deployment files
# ✅ Configured for Sepolia testnet
# ⚠️  Remember to configure Web3Auth for your domain
# ⚠️  Set up monitoring and backup services
# ⚠️  Keep this file secure (chmod 600)

# =============================================================================
# SECURITY CHECKLIST
# =============================================================================
# ✅ Strong, unique passwords generated
# ✅ JWT secret is cryptographically secure
# ✅ RPC URL configured
# ⚠️  Domain SSL certificate will be auto-generated on deployment
# ⚠️  Setup backup strategy (run: ./scripts/setup-automated-backups.sh)
# ⚠️  Configure monitoring (run: ./scripts/monitor-production.sh)
# ⚠️  Secure file permissions (run: chmod 600 .env.prod)

# =============================================================================
# DEPLOYMENT COMMANDS
# =============================================================================
# 1. Secure this file: chmod 600 .env.prod
# 2. Deploy: DOMAIN_NAME=$DOMAIN_NAME ./scripts/deploy-production.sh
# 3. Setup backups: ./scripts/setup-automated-backups.sh
# 4. Monitor: ./scripts/monitor-production.sh
EOF

# Secure the file
chmod 600 .env.prod

echo -e "\n${GREEN}✅ .env.prod created successfully!${NC}"

# Display summary
echo -e "\n${BLUE}📋 Configuration Summary:${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Domain:${NC}              $DOMAIN_NAME"
echo -e "${GREEN}Email:${NC}               $EMAIL"
echo -e "${GREEN}Network:${NC}             Sepolia Testnet (Chain ID: 11155111)"
echo -e "${GREEN}RPC URL:${NC}             $RPC_URL"
echo -e "${GREEN}Vault Address:${NC}       $VAULT_ADDRESS"
echo -e "${GREEN}USDC Address:${NC}        $USDC_ADDRESS"
echo -e "${GREEN}Strategy Manager:${NC}    $STRATEGY_MANAGER_ADDRESS"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Security reminder
echo -e "\n${YELLOW}🔒 IMPORTANT SECURITY NOTES:${NC}"
echo -e "   1. ${GREEN}✅${NC} File permissions set to 600 (owner read/write only)"
echo -e "   2. ${GREEN}✅${NC} Strong passwords auto-generated"
echo -e "   3. ${YELLOW}⚠️${NC}  NEVER commit .env.prod to version control"
echo -e "   4. ${YELLOW}⚠️${NC}  Store backup of secrets in secure location"

# Save secrets to encrypted backup
echo -e "\n${YELLOW}💾 Creating encrypted backup of secrets...${NC}"
SECRETS_BACKUP="secrets-backup-$(date +%Y%m%d_%H%M%S).txt"
cat > "$SECRETS_BACKUP" << EOF
Abunfi Production Secrets Backup
Generated: $(date)
Domain: $DOMAIN_NAME

POSTGRES_PASSWORD=$POSTGRES_PASSWORD
JWT_SECRET=$JWT_SECRET

IMPORTANT: Store this file in a secure location (password manager, encrypted storage)
EOF

# Encrypt the backup
if command -v gpg &> /dev/null; then
    gpg -c "$SECRETS_BACKUP"
    rm "$SECRETS_BACKUP"
    echo -e "${GREEN}✅ Encrypted backup created: ${SECRETS_BACKUP}.gpg${NC}"
    echo -e "${YELLOW}   Store this file securely and remember the passphrase!${NC}"
else
    echo -e "${YELLOW}⚠️  GPG not found. Secrets backup saved as plain text: $SECRETS_BACKUP${NC}"
    echo -e "${YELLOW}   Please encrypt or move to secure location!${NC}"
fi

# Next steps
echo -e "\n${BLUE}🚀 Next Steps:${NC}"
echo -e "   1. Review .env.prod file: ${GREEN}cat .env.prod${NC}"
echo -e "   2. Deploy to production: ${GREEN}DOMAIN_NAME=$DOMAIN_NAME ./scripts/deploy-production.sh${NC}"
echo -e "   3. Setup automated backups: ${GREEN}./scripts/setup-automated-backups.sh${NC}"
echo -e "   4. Monitor deployment: ${GREEN}./scripts/monitor-production.sh${NC}"

echo -e "\n${GREEN}🎉 Environment configuration complete!${NC}"

