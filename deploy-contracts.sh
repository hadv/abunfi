#!/bin/bash

# 🚀 Abunfi Contract Deployment Script
# Deploys smart contracts to Sepolia testnet

echo "🚀 Deploying Abunfi Contracts to Sepolia..."

# Check if we're in the right directory
if [[ ! -d "contracts-submodule" ]]; then
    echo "❌ Error: contracts-submodule directory not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Check if environment is configured
if [[ ! -f "contracts-submodule/.env" ]]; then
    echo "❌ Error: contracts-submodule/.env not found"
    echo "Please run the setup script first: ./scripts/setup-sepolia-demo.sh"
    exit 1
fi

cd contracts-submodule

# Load environment variables
source .env

# Check if required variables are set
if [[ -z "$PRIVATE_KEY" || -z "$SEPOLIA_RPC_URL" ]]; then
    echo "❌ Error: Missing required environment variables"
    echo "Please ensure PRIVATE_KEY and SEPOLIA_RPC_URL are set in contracts-submodule/.env"
    exit 1
fi

# Check Sepolia ETH balance
echo "💰 Checking Sepolia ETH balance..."
BALANCE=$(cast balance $PRIVATE_KEY --rpc-url $SEPOLIA_RPC_URL 2>/dev/null || echo "0")
if [[ "$BALANCE" == "0" ]]; then
    echo "❌ Error: No Sepolia ETH found in wallet"
    echo "Please get Sepolia ETH from:"
    echo "   • https://sepoliafaucet.com/"
    echo "   • https://faucet.quicknode.com/ethereum/sepolia"
    exit 1
fi

echo "✅ Sepolia ETH balance: $BALANCE wei"

# Build contracts
echo "🔨 Building contracts..."
forge build

if [[ $? -ne 0 ]]; then
    echo "❌ Contract build failed"
    exit 1
fi

echo "✅ Contracts built successfully"

# Deploy core contracts
echo "📡 Deploying core contracts..."
forge script script/DeploySepolia.s.sol \
    --rpc-url $SEPOLIA_RPC_URL \
    --broadcast \
    --verify \
    --etherscan-api-key $ETHERSCAN_API_KEY

if [[ $? -eq 0 ]]; then
    echo "✅ Core contracts deployed successfully"
else
    echo "❌ Core contract deployment failed"
    exit 1
fi

# Deploy zkVM contracts
echo "🔐 Deploying zkVM social verification contracts..."
forge script script/DeploySocialVerification.s.sol \
    --rpc-url $SEPOLIA_RPC_URL \
    --broadcast \
    --verify \
    --etherscan-api-key $ETHERSCAN_API_KEY

if [[ $? -eq 0 ]]; then
    echo "✅ zkVM contracts deployed successfully"
else
    echo "⚠️  zkVM contract deployment failed (demo will work with simulation mode)"
fi

# Export ABIs
echo "📄 Exporting ABIs..."
npm run export-abis

cd ..

echo ""
echo "🎉 Contract deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Update contract addresses in environment files"
echo "2. Start the demo: ./start-demo.sh"
echo "3. Access frontend: http://localhost:3000"
echo ""
echo "📝 Note: Check deployment logs for contract addresses and update:"
echo "   • backend/.env"
echo "   • frontend/.env.local"
