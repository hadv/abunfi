# 🚀 Abunfi Development Setup Guide

This guide will help you set up the Abunfi project for local development, including the new Strategy Manager Dashboard.

## 📋 Prerequisites

### Required Software
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/)
- **npm** or **yarn** package manager

### Optional but Recommended
- **Redis** (for caching) - [Download](https://redis.io/download/)
- **VS Code** with extensions:
  - PostgreSQL (by Chris Kolkman)
  - ES7+ React/Redux/React-Native snippets
  - Prettier - Code formatter

## 🔧 Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/hadv/abunfi.git
cd abunfi
```

### 2. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root directory
cd ..
```

### 3. Database Setup

#### Option A: Automated Setup (Recommended)

```bash
# Make setup script executable
chmod +x scripts/setup-local-db.sh

# Run the automated setup
./scripts/setup-local-db.sh
```

This script will:
- ✅ Check PostgreSQL status
- ✅ Create `abunfi` database and user
- ✅ Initialize database schema
- ✅ Add user roles for Strategy Manager
- ✅ Create test users
- ✅ Verify setup

#### Option B: Manual Setup

If you prefer manual setup or the script fails:

```bash
# 1. Start PostgreSQL (if not running)
brew services start postgresql
# or
pg_ctl start

# 2. Create database and user
psql postgres << EOF
CREATE DATABASE abunfi;
CREATE USER abunfi_user WITH PASSWORD 'abunfi_password';
GRANT ALL PRIVILEGES ON DATABASE abunfi TO abunfi_user;
\q
EOF

# 3. Initialize database schema
PGPASSWORD=abunfi_password psql -h localhost -U abunfi_user -d abunfi -f scripts/init-postgres.sql

# 4. Add user roles for Strategy Manager
PGPASSWORD=abunfi_password psql -h localhost -U abunfi_user -d abunfi -f scripts/add-user-roles.sql

# 5. Create test users
PGPASSWORD=abunfi_password psql -h localhost -U abunfi_user -d abunfi << EOF
INSERT INTO users (email, wallet_address, name, role, kyc_status, is_email_verified, is_active) 
VALUES 
  ('manager@abunfi.com', '0x1111111111111111111111111111111111111111', 'Strategy Manager', 'strategy_manager', 'verified', true, true),
  ('admin@abunfi.com', '0x2222222222222222222222222222222222222222', 'Admin User', 'admin', 'verified', true, true),
  ('user@abunfi.com', '0x3333333333333333333333333333333333333333', 'Regular User', 'user', 'verified', true, true)
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role;
EOF
```

### 4. Environment Configuration

#### Backend Environment

Create `backend/.env`:

```bash
# Copy example environment file
cp backend/.env.example backend/.env
```

Update `backend/.env` with your local settings:

```env
# Server Configuration
NODE_ENV=development
PORT=3001

# Database Configuration
DATABASE_URL=postgresql://abunfi_user:abunfi_password@localhost:5432/abunfi

# Redis Configuration (optional)
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-for-development
JWT_EXPIRE=7d

# Blockchain Configuration
RPC_URL=https://arb1.arbitrum.io/rpc
CHAIN_ID=42161

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Web3Auth Configuration (for testing)
WEB3AUTH_CLIENT_ID=demo-client-id
```

#### Frontend Environment

Create `frontend/.env`:

```bash
# Copy example environment file
cp frontend/.env.example frontend/.env
```

Update `frontend/.env`:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_WS_URL=ws://localhost:3001

# Web3Auth Configuration
REACT_APP_WEB3AUTH_CLIENT_ID=demo-client-id

# Blockchain Configuration
REACT_APP_CHAIN_ID=42161
REACT_APP_RPC_URL=https://arb1.arbitrum.io/rpc

# Development Configuration
REACT_APP_ENV=development
```

### 5. Start Development Servers

#### Terminal 1: Backend Server

```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:3001`

#### Terminal 2: Frontend Server

```bash
cd frontend
npm start
```

The frontend will start on `http://localhost:3000`

### 6. Verify Setup

#### Check Backend Health

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": { "status": "connected" },
  "websocket": { "totalConnections": 0, "isRunning": true }
}
```

#### Check Database Connection

```bash
PGPASSWORD=abunfi_password psql -h localhost -U abunfi_user -d abunfi -c "SELECT email, role FROM users;"
```

Expected output:
```
        email         |      role       
----------------------+-----------------
 manager@abunfi.com   | strategy_manager
 admin@abunfi.com     | admin
 user@abunfi.com      | user
```

## 🎯 Testing Strategy Manager Dashboard

### 1. Access the Dashboard

1. Open `http://localhost:3000`
2. You'll need to implement a temporary login for development

### 2. Development Login (Temporary)

Add this temporary route to `backend/src/routes/auth.js` for development:

```javascript
// Development login endpoint (REMOVE IN PRODUCTION)
router.post('/dev-login', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Development login not allowed' });
  }
  
  const { email } = req.body;
  const user = await UserRepository.findByEmail(email);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  
  res.json({
    success: true,
    token,
    user: UserRepository.toPublicJSON(user)
  });
});
```

### 3. Test User Accounts

| Email | Role | Access Level |
|-------|------|-------------|
| `manager@abunfi.com` | strategy_manager | ✅ Full Strategy Dashboard |
| `admin@abunfi.com` | admin | ✅ Full Strategy Dashboard |
| `user@abunfi.com` | user | ❌ Access Denied |

### 4. Dashboard Features to Test

- **Overview Tab**: Strategy performance cards and distribution chart
- **Fund Distribution**: Interactive pie charts with risk assessment
- **Performance Analytics**: Historical APY charts and statistics
- **Compound Interest**: Projection calculator with ROI analysis
- **Allocation Management**: Interactive controls and auto-rebalancing
- **Real-time Updates**: WebSocket connection and live data refresh

## 🧪 Running Tests

### Backend Tests

```bash
cd backend
npm test

# Run specific test suites
npm test -- --testPathPattern=strategyManager
npm test -- --testPathPattern=auth
```

### Frontend Tests

```bash
cd frontend
npm test

# Run Strategy Manager Dashboard tests
npm test -- --testPathPattern=StrategyManagerDashboard
```

### Integration Tests

```bash
# Test API endpoints
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3001/api/admin/strategies/overview

# Test WebSocket connection
# Open browser dev tools -> Network -> WS filter
# Navigate to /strategy-manager and verify WebSocket connection
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Failed

```bash
# Check PostgreSQL status
brew services list | grep postgresql

# Start PostgreSQL if not running
brew services start postgresql

# Test connection
psql -h localhost -U abunfi_user -d abunfi
```

#### 2. "Role does not exist" Error

```bash
# Re-run the role migration
PGPASSWORD=abunfi_password psql -h localhost -U abunfi_user -d abunfi -f scripts/add-user-roles.sql
```

#### 3. WebSocket Connection Failed

- Check backend logs for WebSocket errors
- Verify JWT token is valid
- Ensure user has correct role permissions

#### 4. Frontend Build Errors

```bash
# Clear node modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

#### 5. Backend API Errors

```bash
# Check backend logs
cd backend
npm run dev

# Verify environment variables
cat .env
```

### Database Reset

If you need to completely reset the database:

```bash
# Drop and recreate database
psql postgres -c "DROP DATABASE IF EXISTS abunfi;"
psql postgres -c "DROP USER IF EXISTS abunfi_user;"

# Re-run setup
./scripts/setup-local-db.sh
```

## 📚 Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and test locally
npm run dev (backend)
npm start (frontend)

# Run tests
npm test

# Commit changes
git add .
git commit -m "feat: your feature description"

# Push and create PR
git push origin feature/your-feature-name
```

### 2. Database Changes

```bash
# Create migration script in scripts/
# Test migration locally
PGPASSWORD=abunfi_password psql -h localhost -U abunfi_user -d abunfi -f scripts/your-migration.sql

# Update documentation
# Commit migration script
```

### 3. API Development

```bash
# Add new endpoints in backend/src/routes/
# Add corresponding service methods
# Update API documentation
# Write tests for new endpoints
```

## 🎯 Next Steps

1. **Complete Authentication**: Implement proper Web3Auth integration
2. **Add More Tests**: Increase test coverage for new features
3. **Performance Optimization**: Add caching and query optimization
4. **Security Audit**: Review authentication and authorization
5. **Documentation**: Update API documentation and user guides

## 📞 Support

If you encounter issues:

1. Check this troubleshooting guide
2. Review backend/frontend logs
3. Verify database connection and schema
4. Check environment variables
5. Create an issue on GitHub with detailed error information

---

**Happy Coding!** 🚀

The Strategy Manager Dashboard is now ready for development and testing!
