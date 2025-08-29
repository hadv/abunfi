# Hybrid Database Architecture

This document describes the hybrid database architecture implemented in Abunfi, which combines PostgreSQL, MongoDB, and Redis for optimal performance and development flexibility.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │     MongoDB     │    │      Redis      │
│                 │    │                 │    │                 │
│ Financial Data  │    │ Flexible Data   │    │ Cache & Session │
│ ACID Compliance │    │ Schema-less     │    │ High Performance│
│                 │    │                 │    │                 │
│ • Users         │    │ • Preferences   │    │ • User Cache    │
│ • Balances      │    │ • Metadata      │    │ • Sessions      │
│ • Transactions  │    │ • Logs          │    │ • Rate Limiting │
│ • Audit Trail   │    │ • Dev Data      │    │ • Temp Data     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Data Distribution Strategy

### PostgreSQL (Primary Financial Database)
**Purpose**: Critical financial data requiring ACID compliance
- **Users**: Core user information, KYC status, wallet addresses
- **User Balances**: Account balances, shares, yield tracking
- **Transactions**: All financial transactions with blockchain data
- **Transaction History**: Audit trail for compliance

**Why PostgreSQL?**
- ACID compliance for financial data integrity
- Strong consistency guarantees
- Excellent performance for complex queries
- Mature ecosystem and tooling
- Better scaling options than MongoDB

### MongoDB (Flexible Development Database)
**Purpose**: Schema-flexible data for rapid development
- **User Preferences**: Language, currency, notification settings
- **Metadata**: Flexible JSON data that changes frequently
- **Development Data**: Temporary data during development
- **Logs**: Application logs and debugging information

**Why Keep MongoDB?**
- Rapid prototyping and development
- Schema flexibility for evolving features
- Easy to iterate on data models
- Good for non-critical data

### Redis (Cache and Session Store)
**Purpose**: High-performance caching and temporary data
- **User Cache**: Cached user profiles and dashboard data
- **Session Management**: User sessions and authentication tokens
- **Rate Limiting**: API rate limiting counters
- **Temporary Data**: Short-lived data and computations

## Implementation Details

### Database Service Layer

The `DatabaseService` class provides a unified interface to all databases:

```javascript
const databaseService = require('./services/DatabaseService');

// Hybrid user retrieval (PostgreSQL + MongoDB + Redis cache)
const user = await databaseService.getUserById(userId, useCache = true);

// Caching with automatic fallback
const data = await databaseService.cache(key, fetchFunction, ttl);

// Atomic transactions (PostgreSQL)
const result = await databaseService.executeTransaction(callback);
```

### Repository Pattern

Each database has dedicated repositories:

```javascript
// PostgreSQL repositories
const UserRepository = require('./models/postgres/UserRepository');
const TransactionRepository = require('./models/postgres/TransactionRepository');

// MongoDB models (existing)
const MongoUser = require('./models/User');
```

### Hybrid Controllers

Controllers use data from multiple databases seamlessly:

```javascript
// Get user with financial data (PostgreSQL) + preferences (MongoDB)
const user = await databaseService.getUserById(userId);

// Cache dashboard data (Redis) with blockchain data
const dashboard = await databaseService.cache('dashboard:' + userId, fetchDashboard, 300);
```

## Configuration

### Environment Variables

```bash
# PostgreSQL (Financial Data)
DATABASE_URL=postgresql://abunfi_user:abunfi_password@localhost:5432/abunfi

# MongoDB (Flexible Data)
MONGODB_URI=mongodb://localhost:27017/abunfi

# Redis (Cache & Sessions)
REDIS_URL=redis://localhost:6379
```

### Docker Compose

All databases are configured in `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: abunfi
      POSTGRES_USER: abunfi_user
      POSTGRES_PASSWORD: abunfi_password
    
  mongodb:
    image: mongo:7.0
    environment:
      MONGO_INITDB_DATABASE: abunfi
    
  redis:
    image: redis:7.2-alpine
    command: redis-server --appendonly yes
```

## Migration Strategy

### Phase 1: Hybrid Development (Current)
- Keep MongoDB for rapid development
- Use PostgreSQL for financial data
- Add Redis for performance

### Phase 2: Gradual Migration
- Move more data to PostgreSQL as features stabilize
- Keep MongoDB for truly flexible data
- Optimize Redis usage

### Phase 3: Production Ready
- PostgreSQL as primary database
- MongoDB for specific use cases only
- Redis for high-performance needs

## Usage Examples

### Creating a User (Hybrid)

```javascript
// Create in PostgreSQL (financial data)
const postgresUser = await UserRepository.create({
  email, wallet_address, name, kyc_status
});

// Create in MongoDB (preferences)
const mongoUser = new MongoUser({
  _id: postgresUser.id,
  preferences: { language: 'vi', currency: 'VND' }
});
await mongoUser.save();
```

### Getting User Dashboard (Cached)

```javascript
const dashboard = await databaseService.cache(
  `dashboard:${userId}`,
  async () => {
    const user = await UserRepository.findById(userId);
    const transactions = await TransactionRepository.getUserTransactions(userId);
    const preferences = await MongoUser.findById(userId);
    return { user, transactions, preferences };
  },
  300 // 5 minutes cache
);
```

### Financial Transaction (ACID)

```javascript
const transaction = await databaseService.executeTransaction(async (client) => {
  // Create transaction
  const tx = await TransactionRepository.create(transactionData);
  
  // Update balance atomically
  await databaseService.updateUserBalance(userId, balanceChanges);
  
  return tx;
});
```

## Testing

Run the hybrid database test:

```bash
node scripts/test-hybrid-setup.js
```

This tests:
- Database connections
- PostgreSQL operations
- MongoDB operations  
- Redis caching
- Hybrid user operations
- Rate limiting
- Session management

## Monitoring

### Health Check Endpoint

```bash
curl http://localhost:3001/health
```

Returns status of all databases:

```json
{
  "status": "OK",
  "databases": {
    "postgresql": { "status": "connected" },
    "mongodb": { "status": "connected" },
    "redis": { "status": "connected" }
  }
}
```

### Database Statistics

```javascript
const stats = await databaseService.getStats();
console.log('PostgreSQL pool:', stats.postgres);
console.log('MongoDB status:', stats.mongodb);
console.log('Redis info:', stats.redis);
```

## Best Practices

1. **Financial Data**: Always use PostgreSQL for money-related operations
2. **Caching**: Cache expensive operations in Redis with appropriate TTL
3. **Sessions**: Store user sessions in Redis for scalability
4. **Preferences**: Use MongoDB for user preferences and flexible data
5. **Transactions**: Use PostgreSQL transactions for data consistency
6. **Error Handling**: Gracefully handle database failures
7. **Monitoring**: Monitor all database connections and performance

## Benefits

1. **Development Speed**: MongoDB allows rapid prototyping
2. **Data Integrity**: PostgreSQL ensures financial data consistency
3. **Performance**: Redis provides high-speed caching
4. **Scalability**: Each database optimized for its use case
5. **Migration Path**: Clear path to production-ready architecture
6. **Flexibility**: Can adapt to changing requirements

This hybrid approach gives you the best of all worlds while maintaining a clear migration path to a production-ready architecture.
