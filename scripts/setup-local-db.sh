#!/bin/bash

# Abunfi Local Database Setup Script
# This script sets up the PostgreSQL database for local development

set -e

echo "🚀 Setting up Abunfi database for local development..."
echo "📝 Note: Using in-memory cache instead of Redis for simplicity"

# Database configuration
DB_NAME="abunfi"
DB_USER="abunfi_user"
DB_PASSWORD="abunfi_password"
DB_HOST="localhost"
DB_PORT="5432"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL status..."
if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
    print_error "PostgreSQL is not running on $DB_HOST:$DB_PORT"
    echo "Please start PostgreSQL first:"
    echo "  brew services start postgresql"
    echo "  or"
    echo "  pg_ctl start"
    exit 1
fi
print_status "PostgreSQL is running"

# Check if database exists
echo "🔍 Checking if database exists..."
if psql -h $DB_HOST -p $DB_PORT -U postgres -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    print_warning "Database '$DB_NAME' already exists"
    read -p "Do you want to recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  Dropping existing database..."
        psql -h $DB_HOST -p $DB_PORT -U postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
        psql -h $DB_HOST -p $DB_PORT -U postgres -c "DROP USER IF EXISTS $DB_USER;"
    else
        echo "Skipping database creation..."
        DB_EXISTS=true
    fi
fi

# Create database and user if they don't exist
if [ "$DB_EXISTS" != true ]; then
    echo "📦 Creating database and user..."
    
    # Create user
    psql -h $DB_HOST -p $DB_PORT -U postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || true
    
    # Create database
    psql -h $DB_HOST -p $DB_PORT -U postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    
    # Grant privileges
    psql -h $DB_HOST -p $DB_PORT -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    
    print_status "Database and user created"
fi

# Set PGPASSWORD to avoid password prompts
export PGPASSWORD=$DB_PASSWORD

# Initialize database schema
echo "🏗️  Initializing database schema..."
if [ -f "scripts/init-postgres.sql" ]; then
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f scripts/init-postgres.sql
    print_status "Database schema initialized"
else
    print_error "scripts/init-postgres.sql not found"
    exit 1
fi

# Add user roles for Strategy Manager
echo "👥 Adding user roles..."
if [ -f "scripts/add-user-roles.sql" ]; then
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f scripts/add-user-roles.sql
    print_status "User roles added"
else
    print_error "scripts/add-user-roles.sql not found"
    exit 1
fi

# Create test users
echo "👤 Creating test users..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF
-- Create Strategy Manager user
INSERT INTO users (
  email, 
  wallet_address, 
  name, 
  role,
  kyc_status, 
  is_email_verified,
  is_active
) VALUES (
  'manager@abunfi.com',
  '0x1111111111111111111111111111111111111111',
  'Strategy Manager',
  'strategy_manager',
  'verified',
  true,
  true
) ON CONFLICT (email) DO UPDATE SET role = 'strategy_manager';

-- Create Admin user
INSERT INTO users (
  email, 
  wallet_address, 
  name, 
  role,
  kyc_status, 
  is_email_verified,
  is_active
) VALUES (
  'admin@abunfi.com',
  '0x2222222222222222222222222222222222222222',
  'Admin User',
  'admin',
  'verified',
  true,
  true
) ON CONFLICT (email) DO UPDATE SET role = 'admin';

-- Create Regular user for testing
INSERT INTO users (
  email, 
  wallet_address, 
  name, 
  role,
  kyc_status, 
  is_email_verified,
  is_active
) VALUES (
  'user@abunfi.com',
  '0x3333333333333333333333333333333333333333',
  'Regular User',
  'user',
  'verified',
  true,
  true
) ON CONFLICT (email) DO UPDATE SET role = 'user';
EOF

print_status "Test users created"

# Verify setup
echo "🔍 Verifying setup..."
USER_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users;")
TABLE_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")

print_status "Database setup completed successfully!"
echo "📊 Database Statistics:"
echo "  - Tables created: $(echo $TABLE_COUNT | xargs)"
echo "  - Test users created: $(echo $USER_COUNT | xargs)"
echo ""
echo "🎯 Test Accounts:"
echo "  📧 manager@abunfi.com (Strategy Manager)"
echo "  📧 admin@abunfi.com (Admin)"
echo "  📧 user@abunfi.com (Regular User)"
echo ""
echo "🔗 Database Connection:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""
echo "✅ You can now start the backend server and test the Strategy Manager Dashboard!"

# Unset password
unset PGPASSWORD
