#!/bin/bash

# Abunfi Setup Script
# This script sets up the development environment for Abunfi

set -e

echo "🚀 Setting up Abunfi development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if MongoDB is running (optional for development)
if command -v mongod &> /dev/null; then
    echo "✅ MongoDB is available"
else
    echo "⚠️  MongoDB not found. You may need to install and start MongoDB for full functionality."
fi

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install contracts dependencies
echo "📦 Installing contracts dependencies..."
cd contracts
npm install
cd ..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Create environment files if they don't exist
echo "⚙️  Setting up environment files..."

if [ ! -f contracts/.env ]; then
    cp contracts/.env.example contracts/.env
    echo "📝 Created contracts/.env - Please update with your configuration"
fi

if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "📝 Created backend/.env - Please update with your configuration"
fi

if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
    echo "📝 Created frontend/.env - Please update with your configuration"
fi

# Create logs directory
mkdir -p backend/logs

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update environment files with your configuration:"
echo "   - contracts/.env"
echo "   - backend/.env" 
echo "   - frontend/.env"
echo ""
echo "2. Start MongoDB (if using locally):"
echo "   mongod"
echo ""
echo "3. Start the development environment:"
echo "   npm run dev"
echo ""
echo "4. Deploy smart contracts (optional for local development):"
echo "   cd contracts && npm run deploy"
echo ""
echo "🌐 Access the application:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:3001"
echo "   - Hardhat Network: http://localhost:8545"
echo ""
echo "📚 For more information, see docs/README.md"
