# Strategy Manager Dashboard

A comprehensive real-time dashboard for strategy managers to visualize funds distribution, compound interest, and manage DeFi strategy allocations in the Abunfi platform.

## 🎯 Features

### Real-time Data Visualization
- **Funds Distribution Chart**: Interactive pie chart showing allocation across strategies
- **Compound Interest Projections**: Line charts with customizable time periods and principal amounts
- **APY Comparison**: Multi-line charts comparing strategy performance over time
- **Strategy Performance Grid**: Detailed cards with metrics, risk scores, and allocation data

### Live Updates
- **WebSocket Integration**: Real-time updates every 30 seconds
- **Connection Status**: Visual indicator of live data connection
- **Automatic Reconnection**: Robust connection handling with retry logic

### Strategy Management
- **Allocation Controls**: Interactive sliders and precise input fields
- **Auto-rebalancing**: Equal, risk-based, and APY-based allocation strategies
- **Risk Assessment**: Color-coded risk levels and detailed metrics
- **Performance Analytics**: Volatility, Sharpe ratio, and drawdown calculations

### Role-based Access Control
- **Strategy Manager Role**: Full access to dashboard and controls
- **Admin Role**: Complete access with additional privileges
- **User Role**: Restricted access (redirected to main dashboard)

## 🏗️ Architecture

### Backend Components

#### API Endpoints
```
GET /api/admin/strategies/overview
GET /api/admin/strategies/distribution
GET /api/admin/strategies/performance?period=30d
GET /api/admin/strategies/compound-interest?period=1y&principal=10000
```

#### WebSocket Service
- **Real-time Updates**: `/ws` endpoint with token authentication
- **Strategy Updates**: Broadcasts to strategy managers every 30 seconds
- **Connection Management**: Automatic cleanup and reconnection handling

#### Database Schema
```sql
-- Add role column to users table
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user' 
CHECK (role IN ('user', 'strategy_manager', 'admin'));
```

### Frontend Components

#### Main Dashboard
- `StrategyManagerDashboard.js` - Main container with tabs and real-time data
- `useWebSocket.js` - Custom hook for WebSocket connection management
- `strategyManagerService.js` - API service for strategy data

#### Visualization Components
- `FundsDistributionChart.js` - Pie chart with detailed strategy breakdown
- `CompoundInterestChart.js` - Line chart with projection calculations
- `APYComparisonChart.js` - Multi-line chart with performance statistics
- `StrategyPerformanceGrid.js` - Card grid with detailed metrics
- `AllocationControls.js` - Interactive allocation management interface

## 🚀 Setup Instructions

### 1. Database Migration
```bash
# Run the role migration
psql -d abunfi -f scripts/add-user-roles.sql
```

### 2. Backend Dependencies
```bash
cd backend
npm install
# Note: Redis dependency removed - now uses in-memory cache for simplicity
```

### 3. Environment Variables
```bash
# Add to backend/.env
WS_PORT=3001  # WebSocket will use same port as HTTP server
```

### 4. Frontend Dependencies
All required dependencies are already included:
- `recharts` for charts
- `@mui/material` for UI components
- `framer-motion` for animations

### 5. Create Strategy Manager User
```sql
-- Create a test strategy manager
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
  '0x0000000000000000000000000000000000000001',
  'Strategy Manager',
  'strategy_manager',
  'verified',
  true,
  true
);
```

## 📊 Dashboard Sections

### 1. Overview Tab
- **Strategy Performance Grid**: Cards showing each strategy's metrics
- **Funds Distribution Chart**: Pie chart of current allocations
- **Key Statistics**: Total AUM, average APY, active strategies count

### 2. Fund Distribution Tab
- **Distribution Visualization**: Detailed pie chart with percentages
- **APY Comparison**: Side-by-side strategy performance comparison
- **Risk Analysis**: Color-coded risk assessment

### 3. Performance Analytics Tab
- **Historical APY Charts**: Time-series data with customizable periods
- **Statistical Analysis**: Volatility, Sharpe ratio, max drawdown
- **Performance Rankings**: Best/worst performers identification

### 4. Compound Interest Tab
- **Projection Calculator**: Interactive principal and time period selection
- **Strategy Comparison**: Side-by-side compound growth visualization
- **ROI Analysis**: Return on investment calculations and insights

### 5. Allocation Management Tab
- **Interactive Controls**: Sliders and precise input fields
- **Auto-rebalancing**: Quick rebalancing strategies
- **Validation**: Real-time allocation total validation
- **Confirmation Dialog**: Safe change confirmation process

## 🔒 Security Features

### Authentication & Authorization
- **JWT Token Validation**: Secure API access
- **Role-based Access**: Strategy manager and admin roles only
- **WebSocket Authentication**: Token-based WebSocket connections

### Data Protection
- **Input Validation**: All allocation changes validated
- **Rate Limiting**: API endpoint protection
- **Error Handling**: Graceful error management and user feedback

## 🧪 Testing

### Component Tests
```bash
cd frontend
npm test -- --testPathPattern=StrategyManagerDashboard
```

### API Tests
```bash
cd backend
npm test -- --testPathPattern=strategyManager
```

### Integration Tests
- WebSocket connection testing
- Real-time data flow validation
- Role-based access verification

## 📈 Performance Optimizations

### Frontend
- **Component Memoization**: React.memo for chart components
- **Data Caching**: Service-level caching for API responses
- **Lazy Loading**: Code splitting for dashboard components
- **WebSocket Optimization**: Efficient message handling and reconnection

### Backend
- **Response Caching**: Redis caching for strategy data (2-5 minutes TTL)
- **Connection Pooling**: PostgreSQL connection optimization
- **WebSocket Management**: Efficient client connection handling
- **Data Aggregation**: Optimized database queries

## 🔧 Configuration

### WebSocket Settings
```javascript
// Configurable in websocketService.js
const updateInterval = 30000; // 30 seconds
const reconnectAttempts = 5;
const reconnectInterval = 3000; // 3 seconds
```

### Cache Settings
```javascript
// API response caching
overview: 120 seconds
distribution: 60 seconds
performance: 300 seconds
compound: 600 seconds
```

## 🚨 Monitoring & Alerts

### Health Checks
- WebSocket connection status in `/health` endpoint
- Real-time connection statistics
- Error logging and monitoring

### Performance Metrics
- API response times
- WebSocket message throughput
- Database query performance
- Cache hit rates

## 🔄 Future Enhancements

### Planned Features
1. **Advanced Analytics**: Machine learning-based strategy recommendations
2. **Historical Backtesting**: Strategy performance simulation
3. **Risk Management**: Automated risk threshold alerts
4. **Mobile Optimization**: Responsive design improvements
5. **Export Functionality**: PDF reports and CSV data export

### Technical Improvements
1. **Database Optimization**: Materialized views for complex queries
2. **Microservices**: Strategy service separation
3. **Advanced Caching**: Redis clustering for scalability
4. **Real-time Alerts**: Push notifications for critical events

## 📞 Support

For issues or questions:
1. Check the health endpoint: `GET /health`
2. Review WebSocket connection status
3. Verify user role permissions
4. Check browser console for frontend errors
5. Review backend logs for API issues

The Strategy Manager Dashboard provides a comprehensive, real-time interface for managing DeFi strategies with enterprise-grade security and performance.
