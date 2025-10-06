# Caching Architecture

## Overview

Abunfi uses an **in-memory cache** for sessions and data caching in the testnet/pre-production environment. This provides excellent performance for development and testing while keeping infrastructure simple.

## Current Implementation: Memory Cache

### Architecture
- **Primary Cache**: In-memory cache (JavaScript Map-based)
- **Location**: `backend/src/utils/memoryCache.js`
- **Integration**: `backend/src/services/DatabaseService.js`

### Features
✅ **Session Management**: User sessions stored in memory  
✅ **Data Caching**: API responses, blockchain data, user data  
✅ **Rate Limiting**: Request rate limiting per user/IP  
✅ **TTL Support**: Automatic expiration of cached items  
✅ **Statistics**: Cache hit/miss tracking  
✅ **Auto-cleanup**: Periodic cleanup of expired entries  

### Memory Cache Capabilities

```javascript
// Basic operations
memoryCache.set(key, value, ttl)
memoryCache.get(key)
memoryCache.delete(key)
memoryCache.exists(key)

// JSON operations
memoryCache.setJSON(key, object, ttl)
memoryCache.getJSON(key)

// Cache with fetch fallback
memoryCache.cacheWithTTL(key, fetchFunction, ttl)

// Session management
memoryCache.setJSON('session:userId', sessionData, 86400)
memoryCache.getJSON('session:userId')

// Statistics
memoryCache.getInfo() // Returns hits, misses, size, etc.
memoryCache.healthCheck() // Always returns true
```

### Use Cases in Abunfi

1. **User Sessions** (24 hour TTL)
   - Login state
   - Authentication tokens
   - User preferences

2. **API Response Caching** (5 minute TTL)
   - Protocol APY data
   - Strategy performance
   - Portfolio balances

3. **Blockchain Data** (1 minute TTL)
   - Contract states
   - Transaction status
   - Gas prices

4. **Rate Limiting** (1 hour window)
   - API request limits
   - Transaction limits
   - Login attempt tracking

5. **Social Verification** (30 second TTL)
   - zkVM verification results
   - Social platform data
   - Verification status

## Advantages of Memory Cache

### For Testnet/Pre-Production
✅ **Zero Infrastructure**: No Redis server needed  
✅ **Fast Performance**: In-process, no network latency  
✅ **Simple Deployment**: Works out of the box  
✅ **Easy Debugging**: Direct access to cache state  
✅ **Cost Effective**: No additional hosting costs  
✅ **Development Friendly**: No external dependencies  

### Limitations
⚠️ **Single Server**: Cache not shared across instances  
⚠️ **Memory Bound**: Limited by Node.js heap size  
⚠️ **Not Persistent**: Lost on server restart  
⚠️ **No Clustering**: Can't scale horizontally  

## Future: Redis Migration Path

### When to Migrate to Redis

Consider migrating to Redis when:
- **Scaling horizontally** (multiple server instances)
- **High traffic** (>1000 concurrent users)
- **Persistence needed** (cache survives restarts)
- **Advanced features** (pub/sub, sorted sets, etc.)
- **Production deployment** on mainnet

### Migration Strategy

The codebase is **already prepared** for Redis migration:

1. **Redis Client Ready**: `backend/src/config/redis.js` exists
2. **Same Interface**: Redis client matches memory cache API
3. **Environment Toggle**: Just set `REDIS_URL` in `.env`
4. **Graceful Fallback**: Redis client returns null when not connected

### How to Enable Redis

**Step 1: Install Redis**
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt-get install redis-server
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:alpine
```

**Step 2: Update Environment**
```bash
# backend/.env
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_password_here  # Optional
```

**Step 3: Update DatabaseService** (if needed)
```javascript
// backend/src/services/DatabaseService.js
// Replace memoryCache with redisClient
const redisClient = require('../config/redis');

// Initialize Redis
async initialize() {
  await redisClient.connect();
  // ... rest of initialization
}
```

**Step 4: Test**
```bash
# Check Redis connection
redis-cli ping
# Should return: PONG

# Start application
npm run dev

# Check health endpoint
curl http://localhost:3001/api/health
```

## Comparison: Memory Cache vs Redis

| Feature | Memory Cache | Redis |
|---------|-------------|-------|
| **Setup** | ✅ Zero config | ⚠️ Requires server |
| **Performance** | ✅ Fastest (in-process) | ✅ Very fast (network) |
| **Persistence** | ❌ Lost on restart | ✅ Optional persistence |
| **Clustering** | ❌ Single instance | ✅ Multi-instance |
| **Memory Limit** | ⚠️ Node.js heap (~1.5GB) | ✅ Configurable (GBs) |
| **Data Structures** | ⚠️ Basic (Map) | ✅ Rich (lists, sets, etc.) |
| **Pub/Sub** | ❌ Not supported | ✅ Built-in |
| **Monitoring** | ⚠️ Basic stats | ✅ Rich monitoring |
| **Cost** | ✅ Free | ⚠️ Hosting cost |
| **Best For** | Dev/Test/Small apps | Production/Scale |

## Current Configuration

### Memory Cache Settings

```javascript
// backend/src/utils/memoryCache.js
class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }
}

// Auto-cleanup every 5 minutes
setInterval(() => {
  memoryCache.cleanup();
}, 5 * 60 * 1000);
```

### Default TTL Values

- **Sessions**: 86400 seconds (24 hours)
- **API Cache**: 300 seconds (5 minutes)
- **Blockchain Data**: 60 seconds (1 minute)
- **Rate Limits**: 3600 seconds (1 hour)
- **zkVM Results**: 30 seconds

## Monitoring

### Health Check
```bash
curl http://localhost:3001/api/health
```

Response includes cache statistics:
```json
{
  "status": "healthy",
  "database": {
    "postgres": true,
    "memoryCache": true
  },
  "cache": {
    "hits": 1234,
    "misses": 56,
    "size": 89,
    "hitRate": "95.67%"
  }
}
```

### Cache Statistics
```javascript
// Get cache info
const stats = memoryCache.getInfo();
console.log(stats);
// {
//   hits: 1234,
//   misses: 56,
//   sets: 1290,
//   deletes: 45,
//   size: 89,
//   hitRate: 0.9567
// }
```

## Best Practices

### For Testnet (Current)
✅ Use memory cache as-is  
✅ Monitor cache hit rates  
✅ Set appropriate TTLs  
✅ Clear cache on deployment  
✅ Test cache invalidation  

### For Production (Future)
✅ Migrate to Redis  
✅ Enable Redis persistence  
✅ Set up Redis clustering  
✅ Monitor Redis memory usage  
✅ Configure Redis eviction policy  
✅ Set up Redis backups  

## Troubleshooting

### Memory Cache Issues

**Issue**: Cache growing too large
```javascript
// Solution: Reduce TTLs or clear cache
memoryCache.clear();
```

**Issue**: Cache not working
```javascript
// Check health
const healthy = memoryCache.healthCheck();
console.log('Cache healthy:', healthy); // Should be true
```

**Issue**: Low hit rate
```javascript
// Check statistics
const info = memoryCache.getInfo();
console.log('Hit rate:', info.hitRate);
// Adjust TTLs if hit rate < 0.8
```

## Summary

**Current State**: Memory cache is perfect for Sepolia testnet deployment
- ✅ Simple, fast, reliable
- ✅ No external dependencies
- ✅ Easy to debug and monitor
- ✅ Sufficient for testing and pre-production

**Future State**: Redis ready when you need to scale
- 🔄 Migration path is clear
- 🔄 Code already supports Redis
- 🔄 Just update environment variables
- 🔄 No code changes needed

**Recommendation**: Keep memory cache for testnet, migrate to Redis before mainnet or when scaling beyond single server.

