#!/bin/bash

# Generate Local Development Environment Configuration
# This script creates a .env.local file for local development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Generating Local Development Environment Configuration${NC}"
echo -e "${BLUE}=======================================================${NC}"

# Check if .env.local already exists
if [[ -f .env.local ]]; then
    echo -e "\n${YELLOW}⚠️  .env.local already exists${NC}"
    read -p "Do you want to backup and recreate it? (y/n): " backup_choice
    if [[ $backup_choice == "y" ]]; then
        BACKUP_FILE=".env.local.backup.$(date +%Y%m%d_%H%M%S)"
        cp .env.local "$BACKUP_FILE"
        echo -e "${GREEN}✅ Backed up to $BACKUP_FILE${NC}"
    else
        echo -e "${YELLOW}Exiting without changes${NC}"
        exit 0
    fi
fi

# Generate development secrets (simpler than production)
echo -e "\n${YELLOW}🔑 Generating development secrets...${NC}"
POSTGRES_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-16)
JWT_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

echo -e "${GREEN}✅ Generated POSTGRES_PASSWORD (16 chars)${NC}"
echo -e "${GREEN}✅ Generated JWT_SECRET (32 chars)${NC}"

# Get user input for blockchain configuration
echo -e "\n${YELLOW}⛓️  Blockchain Configuration:${NC}"
echo -e "   1) Local Hardhat Node (recommended for development)"
echo -e "   2) Sepolia Testnet"
echo -e "   3) Custom RPC URL"
read -p "Select blockchain network (1-3): " network_choice

case $network_choice in
    1)
        RPC_URL="http://localhost:8545"
        CHAIN_ID="31337"
        NETWORK_NAME="Hardhat Local"
        echo -e "${GREEN}✅ Using local Hardhat node${NC}"
        echo -e "${YELLOW}   Make sure to run: npx hardhat node${NC}"
        ;;
    2)
        echo -e "\n${YELLOW}Sepolia RPC Provider:${NC}"
        echo -e "   1) Infura"
        echo -e "   2) Alchemy"
        echo -e "   3) Custom Sepolia RPC"
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
                read -p "Enter custom Sepolia RPC URL: " RPC_URL
                ;;
            *)
                echo -e "${RED}❌ Invalid choice${NC}"
                exit 1
                ;;
        esac
        CHAIN_ID="11155111"
        NETWORK_NAME="Sepolia Testnet"
        ;;
    3)
        read -p "Enter custom RPC URL: " RPC_URL
        read -p "Enter Chain ID: " CHAIN_ID
        NETWORK_NAME="Custom Network"
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

# Web3Auth Client ID
echo -e "\n${YELLOW}🔐 Web3Auth Configuration:${NC}"
read -p "Web3Auth Client ID (or press Enter for demo): " WEB3AUTH_CLIENT_ID
WEB3AUTH_CLIENT_ID=${WEB3AUTH_CLIENT_ID:-"demo-client-id"}

# Load contract addresses based on network
echo -e "\n${YELLOW}📦 Loading contract addresses...${NC}"

if [[ $CHAIN_ID == "11155111" ]] && [[ -f "contracts-submodule/deployments/sepolia-core.json" ]]; then
    # Load from Sepolia deployment
    VAULT_ADDRESS=$(grep -A 1 '"vault"' contracts-submodule/deployments/sepolia-core.json | grep -o '0x[a-fA-F0-9]*' | head -1)
    USDC_ADDRESS=$(grep -A 1 '"usdc"' contracts-submodule/deployments/sepolia-core.json | grep -o '0x[a-fA-F0-9]*' | head -1)
    STRATEGY_MANAGER_ADDRESS=$(grep -A 1 '"strategyManager"' contracts-submodule/deployments/sepolia-core.json | grep -o '0x[a-fA-F0-9]*' | head -1)
    
    echo -e "${GREEN}✅ Loaded Sepolia contract addresses${NC}"
    echo -e "${GREEN}   Vault: $VAULT_ADDRESS${NC}"
    echo -e "${GREEN}   USDC: $USDC_ADDRESS${NC}"
    echo -e "${GREEN}   StrategyManager: $STRATEGY_MANAGER_ADDRESS${NC}"
else
    # Use placeholder addresses for local development
    echo -e "${YELLOW}⚠️  Using placeholder contract addresses${NC}"
    echo -e "${YELLOW}   Deploy contracts locally and update .env.local${NC}"
    VAULT_ADDRESS="0x5FbDB2315678afecb367f032d93F642f64180aa3"
    USDC_ADDRESS="0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
    STRATEGY_MANAGER_ADDRESS="0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
fi

# Email for development
EMAIL="dev@localhost"

# Create .env.local file
echo -e "\n${YELLOW}📝 Creating .env.local file...${NC}"

cat > .env.local << EOF
# Local Development Environment Configuration for Abunfi
# Generated on: $(date)
# This file is for local development only

# =============================================================================
# DEVELOPMENT CONFIGURATION
# =============================================================================
NODE_ENV=development
EMAIL=$EMAIL

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
# PostgreSQL Configuration
POSTGRES_DB=abunfi
POSTGRES_USER=abunfi_user
POSTGRES_PASSWORD=$POSTGRES_PASSWORD

# Database URL for backend
DATABASE_URL=postgresql://abunfi_user:$POSTGRES_PASSWORD@localhost:5432/abunfi
DATABASE_TEST_URL=postgresql://abunfi_user:$POSTGRES_PASSWORD@localhost:5432/abunfi_test

# =============================================================================
# CACHE CONFIGURATION
# =============================================================================
# Using in-memory cache for local development (no Redis needed)
USE_MEMORY_CACHE=true

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================
# JWT Secret (development - not for production!)
JWT_SECRET=$JWT_SECRET
JWT_EXPIRE=7d

# =============================================================================
# BLOCKCHAIN CONFIGURATION - $NETWORK_NAME
# =============================================================================
# RPC URL for blockchain connection
RPC_URL=$RPC_URL

# Chain ID
CHAIN_ID=$CHAIN_ID

# =============================================================================
# CONTRACT ADDRESSES
# =============================================================================
# Core Contracts
VAULT_CONTRACT_ADDRESS=$VAULT_ADDRESS
STRATEGY_MANAGER_ADDRESS=$STRATEGY_MANAGER_ADDRESS
USDC_CONTRACT_ADDRESS=$USDC_ADDRESS

# Strategy Contracts (update after local deployment)
AAVE_STRATEGY_ADDRESS=0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
COMPOUND_STRATEGY_ADDRESS=0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
LIQUID_STAKING_STRATEGY_ADDRESS=0x5FC8d32690cc91D4c39d9d3abcBD16989F875707

# =============================================================================
# WEB3AUTH CONFIGURATION
# =============================================================================
# Web3Auth Client ID
WEB3AUTH_CLIENT_ID=$WEB3AUTH_CLIENT_ID
WEB3AUTH_NETWORK=sapphire_devnet

# =============================================================================
# SERVER CONFIGURATION
# =============================================================================
# Backend API
PORT=3001
CORS_ORIGIN=http://localhost:3000

# =============================================================================
# FRONTEND CONFIGURATION
# =============================================================================
# API URL
REACT_APP_API_URL=http://localhost:3001/api

# Web3Auth
REACT_APP_WEB3AUTH_CLIENT_ID=$WEB3AUTH_CLIENT_ID
REACT_APP_WEB3AUTH_NETWORK=sapphire_devnet

# Blockchain
REACT_APP_CHAIN_ID=$CHAIN_ID
REACT_APP_RPC_URL=$RPC_URL

# Contract Addresses
REACT_APP_VAULT_CONTRACT_ADDRESS=$VAULT_ADDRESS
REACT_APP_STRATEGY_MANAGER_ADDRESS=$STRATEGY_MANAGER_ADDRESS
REACT_APP_USDC_CONTRACT_ADDRESS=$USDC_ADDRESS

# App Configuration
REACT_APP_APP_NAME=Abunfi
REACT_APP_APP_VERSION=1.0.0
REACT_APP_ENVIRONMENT=development

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_ENABLE_NOTIFICATIONS=true

# =============================================================================
# DEVELOPMENT NOTES
# =============================================================================
# ✅ Secrets auto-generated for local development
# ✅ Using in-memory cache (no Redis required)
# ✅ CORS enabled for localhost:3000
# ⚠️  This configuration is for DEVELOPMENT ONLY
# ⚠️  Never use these settings in production

# =============================================================================
# QUICK START COMMANDS
# =============================================================================
# 1. Start PostgreSQL:
#    docker run -d --name abunfi-postgres \\
#      -e POSTGRES_DB=abunfi \\
#      -e POSTGRES_USER=abunfi_user \\
#      -e POSTGRES_PASSWORD=$POSTGRES_PASSWORD \\
#      -p 5432:5432 postgres:16-alpine
#
# 2. Start Hardhat node (if using local network):
#    cd contracts-submodule && npx hardhat node
#
# 3. Deploy contracts (if using local network):
#    cd contracts-submodule && npx hardhat run scripts/deploy.js --network localhost
#
# 4. Start backend:
#    cd backend && npm run dev
#
# 5. Start frontend:
#    cd frontend && npm start
#
# Or use Docker Compose:
#    docker-compose up -d --build

EOF

# Secure the file (readable by owner only)
chmod 600 .env.local

echo -e "\n${GREEN}✅ .env.local created successfully!${NC}"

# Display summary
echo -e "\n${BLUE}📋 Configuration Summary:${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Environment:${NC}         Local Development"
echo -e "${GREEN}Network:${NC}             $NETWORK_NAME (Chain ID: $CHAIN_ID)"
echo -e "${GREEN}RPC URL:${NC}             $RPC_URL"
echo -e "${GREEN}Database:${NC}            PostgreSQL (localhost:5432)"
echo -e "${GREEN}Cache:${NC}               In-Memory (no Redis)"
echo -e "${GREEN}Vault Address:${NC}       $VAULT_ADDRESS"
echo -e "${GREEN}USDC Address:${NC}        $USDC_ADDRESS"
echo -e "${GREEN}Strategy Manager:${NC}    $STRATEGY_MANAGER_ADDRESS"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Next steps
echo -e "\n${BLUE}🚀 Next Steps:${NC}"

if [[ $CHAIN_ID == "31337" ]]; then
    echo -e "\n${YELLOW}For Local Hardhat Development:${NC}"
    echo -e "   1. Start Hardhat node: ${GREEN}cd contracts-submodule && npx hardhat node${NC}"
    echo -e "   2. Deploy contracts: ${GREEN}cd contracts-submodule && npx hardhat run scripts/deploy.js --network localhost${NC}"
    echo -e "   3. Update contract addresses in .env.local"
fi

echo -e "\n${YELLOW}Start Development Environment:${NC}"
echo -e "   ${GREEN}Option 1 - Docker Compose (Recommended):${NC}"
echo -e "      docker-compose up -d --build"
echo -e ""
echo -e "   ${GREEN}Option 2 - Manual Setup:${NC}"
echo -e "      1. Start PostgreSQL: ${GREEN}./scripts/setup-local-db.sh${NC}"
echo -e "      2. Start backend: ${GREEN}cd backend && npm run dev${NC}"
echo -e "      3. Start frontend: ${GREEN}cd frontend && npm start${NC}"

echo -e "\n${YELLOW}Access Application:${NC}"
echo -e "   Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "   Backend:  ${GREEN}http://localhost:3001${NC}"
echo -e "   Database: ${GREEN}localhost:5432${NC}"

echo -e "\n${GREEN}🎉 Local environment configuration complete!${NC}"

