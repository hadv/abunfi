#!/bin/bash

# 🚀 Abunfi Sepolia Setup Script
# Automated setup for Sepolia testnet

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to validate environment variables
validate_env() {
    local env_file=$1
    local required_vars=("$@")
    
    if [[ ! -f "$env_file" ]]; then
        print_error "Environment file $env_file not found"
        return 1
    fi
    
    source "$env_file"
    
    for var in "${required_vars[@]:1}"; do
        if [[ -z "${!var}" ]]; then
            print_error "Required environment variable $var is not set in $env_file"
            return 1
        fi
    done
    
    return 0
}

# Main setup function
main() {
    print_status "🚀 Starting Abunfi Sepolia Demo Setup..."
    
    # Check prerequisites
    print_status "Checking prerequisites..."
    
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js >= 18"
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm"
        exit 1
    fi
    
    if ! command_exists git; then
        print_error "git is not installed. Please install git"
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $NODE_VERSION -lt 18 ]]; then
        print_error "Node.js version must be >= 18. Current version: $(node --version)"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
    
    # Install dependencies
    print_status "Installing dependencies..."
    
    if [[ ! -d "node_modules" ]]; then
        npm install
    fi
    
    if [[ ! -d "backend/node_modules" ]]; then
        cd backend && npm install && cd ..
    fi
    
    if [[ ! -d "frontend/node_modules" ]]; then
        cd frontend && npm install && cd ..
    fi
    
    print_success "Dependencies installed"
    
    # Setup environment files
    print_status "Setting up environment files..."
    
    # Contracts environment
    if [[ ! -f "contracts-submodule/.env" ]]; then
        if [[ -f "contracts-submodule/.env.example" ]]; then
            cp contracts-submodule/.env.example contracts-submodule/.env
            print_warning "Created contracts-submodule/.env from example. Please configure it with your values."
        else
            print_error "contracts-submodule/.env.example not found"
            exit 1
        fi
    fi
    
    # Backend environment
    if [[ ! -f "backend/.env" ]]; then
        if [[ -f "backend/.env.example" ]]; then
            cp backend/.env.example backend/.env
            print_warning "Created backend/.env from example. Please configure it with your values."
        else
            print_error "backend/.env.example not found"
            exit 1
        fi
    fi
    
    # Frontend environment
    if [[ ! -f "frontend/.env.local" ]]; then
        if [[ -f "frontend/.env.sepolia" ]]; then
            cp frontend/.env.sepolia frontend/.env.local
            print_warning "Created frontend/.env.local from sepolia template. Please configure it with your values."
        elif [[ -f "frontend/.env.example" ]]; then
            cp frontend/.env.example frontend/.env.local
            print_warning "Created frontend/.env.local from example. Please configure it with your values."
        else
            print_error "frontend/.env.sepolia or frontend/.env.example not found"
            exit 1
        fi
    fi
    
    print_success "Environment files created"
    
    # Check if environment variables are configured
    print_status "Checking environment configuration..."
    
    # Check contracts environment
    if grep -q "YOUR_INFURA_PROJECT_ID" contracts-submodule/.env 2>/dev/null; then
        print_warning "Please configure contracts-submodule/.env with your Infura project ID"
    fi
    
    if grep -q "0x1234567890abcdef" contracts-submodule/.env 2>/dev/null; then
        print_warning "Please configure contracts-submodule/.env with your private key"
    fi
    
    # Check backend environment
    if grep -q "YOUR_INFURA_PROJECT_ID" backend/.env 2>/dev/null; then
        print_warning "Please configure backend/.env with your Infura project ID"
    fi
    
    # Check frontend environment
    if grep -q "YOUR_INFURA_PROJECT_ID" frontend/.env.local 2>/dev/null; then
        print_warning "Please configure frontend/.env.local with your Infura project ID"
    fi
    
    # Build contracts
    print_status "Building smart contracts..."
    
    if command_exists forge; then
        cd contracts-submodule
        forge build
        cd ..
        print_success "Smart contracts built successfully"
    else
        print_warning "Foundry not installed. Please install Foundry to build and deploy contracts"
        print_status "Install Foundry: curl -L https://foundry.paradigm.xyz | bash"
    fi
    
    # Create demo data directory
    print_status "Setting up demo data..."
    mkdir -p demo-data
    
    # Create demo users file
    cat > demo-data/demo-users.json << EOF
{
  "demoUsers": [
    {
      "email": "investor@demo.com",
      "name": "Demo Investor",
      "role": "user",
      "balance": 1000,
      "apy": 12.5
    },
    {
      "email": "manager@demo.com", 
      "name": "Strategy Manager",
      "role": "strategy_manager",
      "balance": 50000,
      "apy": 15.2
    }
  ]
}
EOF
    
    print_success "Demo data created"
    
    # Create startup script
    print_status "Creating startup scripts..."
    
    cat > start-demo.sh << 'EOF'
#!/bin/bash

# Start Abunfi Demo
echo "🚀 Starting Abunfi Demo..."

# Check if contracts are deployed
if grep -q "0x\.\.\." backend/.env; then
    echo "⚠️  Warning: Contract addresses not configured in backend/.env"
    echo "Please deploy contracts first or update with deployed addresses"
fi

# Start backend in background
echo "Starting backend..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 5

# Start frontend
echo "Starting frontend..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo "✅ Demo started successfully!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop the demo"

# Wait for user interrupt
trap "echo 'Stopping demo...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
EOF
    
    chmod +x start-demo.sh
    
    # Create deployment script
    cat > deploy-contracts.sh << 'EOF'
#!/bin/bash

# Deploy Contracts to Sepolia
echo "🚀 Deploying contracts to Sepolia..."

cd contracts-submodule

# Check environment
if ! grep -q "SEPOLIA_RPC_URL" .env; then
    echo "❌ SEPOLIA_RPC_URL not configured in .env"
    exit 1
fi

if ! grep -q "PRIVATE_KEY" .env; then
    echo "❌ PRIVATE_KEY not configured in .env"
    exit 1
fi

# Load environment
source .env

# Deploy contracts
echo "Deploying to Sepolia..."
forge script script/DeploySepolia.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify

# Export ABIs
echo "Exporting ABIs..."
npm run export-abis

echo "✅ Deployment completed!"
echo "Please update contract addresses in backend/.env and frontend/.env.local"

cd ..
EOF
    
    chmod +x deploy-contracts.sh
    
    print_success "Startup scripts created"
    
    # Final instructions
    print_success "🎉 Abunfi Sepolia Demo setup completed!"
    echo ""
    print_status "Next steps:"
    echo "1. Configure environment variables in:"
    echo "   - contracts-submodule/.env"
    echo "   - backend/.env" 
    echo "   - frontend/.env.local"
    echo ""
    echo "2. Deploy contracts (if not already deployed):"
    echo "   ./deploy-contracts.sh"
    echo ""
    echo "3. Start the demo:"
    echo "   ./start-demo.sh"
    echo ""
    echo "4. Access the demo:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend: http://localhost:3001"
    echo ""
    print_status "For detailed setup instructions, see: SEPOLIA_DEMO_SETUP_GUIDE.md"
}

# Run main function
main "$@"
