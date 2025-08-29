#!/usr/bin/env node

/**
 * Test script for PostgreSQL + Redis setup
 * This script tests the connection to PostgreSQL and Redis and performs comprehensive operations
 */

require('dotenv').config();
const { connectDB, databaseService } = require('../backend/src/config/database');
const UserRepository = require('../backend/src/models/postgres/UserRepository');
const TransactionRepository = require('../backend/src/models/postgres/TransactionRepository');
const logger = require('../backend/src/utils/logger');

async function testPostgreSQLSetup() {
  try {
    console.log('🚀 Testing PostgreSQL + Redis Database Setup...\n');

    // 1. Test database connections
    console.log('1. Testing database connections...');
    await connectDB();
    
    const health = await databaseService.healthCheck();
    console.log('Database Health:', health);
    
    if (!health.overall) {
      throw new Error('Database health check failed');
    }
    console.log('✅ All databases connected successfully\n');

    // 2. Test PostgreSQL operations
    console.log('2. Testing PostgreSQL operations...');
    
    // Test user creation
    const testUser = {
      email: 'test@abunfi.com',
      wallet_address: '0x1234567890123456789012345678901234567890',
      name: 'Test User',
      social_id: 'test123',
      social_provider: 'google'
    };

    // Clean up any existing test user
    try {
      const existingUser = await UserRepository.findByEmail(testUser.email);
      if (existingUser) {
        await UserRepository.softDelete(existingUser.id);
        console.log('Cleaned up existing test user');
      }
    } catch (error) {
      // Ignore cleanup errors
    }

    const createdUser = await UserRepository.create(testUser);
    console.log('✅ User created in PostgreSQL:', createdUser.id);

    // Test user retrieval
    const retrievedUser = await UserRepository.findById(createdUser.id);
    console.log('✅ User retrieved from PostgreSQL:', retrievedUser.email);

    // Test transaction creation
    const testTransaction = {
      user_id: createdUser.id,
      type: 'deposit',
      amount: 1000000, // 1,000,000 VND
      status: 'pending',
      metadata: { test: true }
    };

    const createdTransaction = await TransactionRepository.create(testTransaction);
    console.log('✅ Transaction created in PostgreSQL:', createdTransaction.id);

    // Test transaction retrieval
    const userTransactions = await TransactionRepository.getUserTransactions(createdUser.id);
    console.log('✅ User transactions retrieved:', userTransactions.length);

    // 3. Test Redis operations
    console.log('\n3. Testing Redis operations...');
    
    // Test caching
    const cacheKey = 'test:cache';
    const cacheValue = { message: 'Hello Redis!', timestamp: new Date() };
    
    await databaseService.setCache(cacheKey, cacheValue, 60);
    console.log('✅ Data cached in Redis');
    
    const cachedData = await databaseService.getCache(cacheKey);
    console.log('✅ Data retrieved from Redis:', cachedData.message);
    
    // Test session management
    const sessionId = 'test-session-123';
    const sessionData = { userId: createdUser.id, loginTime: new Date() };
    
    await databaseService.setSession(sessionId, sessionData, 3600);
    console.log('✅ Session stored in Redis');
    
    const retrievedSession = await databaseService.getSession(sessionId);
    console.log('✅ Session retrieved from Redis:', retrievedSession.userId);

    // 4. Test hybrid user operations
    console.log('\n4. Testing hybrid user operations...');
    
    const hybridUser = await databaseService.getUserById(createdUser.id, false);
    console.log('✅ Hybrid user data retrieved:', hybridUser.email);

    // Test balance update
    const balanceChanges = {
      total_balance: 1000000,
      available_balance: 1000000,
      locked_balance: 0,
      total_shares: 1
    };

    const updatedBalance = await databaseService.updateUserBalance(createdUser.id, balanceChanges);
    console.log('✅ User balance updated:', updatedBalance.total_balance);

    // Test user preferences update (JSONB)
    const newPreferences = {
      language: 'en',
      currency: 'USD',
      notifications: {
        email: false,
        push: true,
        sms: true
      },
      theme: 'dark'
    };

    await UserRepository.updatePreferences(createdUser.id, newPreferences);
    console.log('✅ User preferences updated in JSONB');

    // Test preferences retrieval
    const updatedUser = await UserRepository.findById(createdUser.id);
    console.log('✅ Preferences retrieved:', updatedUser.preferences.language);

    // 5. Test rate limiting
    console.log('\n5. Testing rate limiting...');
    
    const rateLimitKey = 'test-user-123';
    const rateLimit1 = await databaseService.checkRateLimit(rateLimitKey, 5, 60);
    console.log('✅ Rate limit check 1:', rateLimit1);
    
    const rateLimit2 = await databaseService.checkRateLimit(rateLimitKey, 5, 60);
    console.log('✅ Rate limit check 2:', rateLimit2);

    // 6. Test database statistics
    console.log('\n6. Testing database statistics...');
    
    const stats = await databaseService.getStats();
    console.log('✅ Database statistics retrieved');
    console.log('PostgreSQL pool:', stats.postgres);
    console.log('MongoDB status:', stats.mongodb.readyState);

    // 7. Cleanup
    console.log('\n7. Cleaning up test data...');
    
    await UserRepository.softDelete(createdUser.id);
    await databaseService.deleteCache(cacheKey);
    await databaseService.deleteSession(sessionId);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 PostgreSQL + Redis database setup test completed successfully!');
    console.log('\nSummary:');
    console.log('- PostgreSQL: ✅ Connected and tested');
    console.log('- Redis: ✅ Connected and tested');
    console.log('- User operations: ✅ Working correctly');
    console.log('- Transaction operations: ✅ Working correctly');
    console.log('- JSONB preferences: ✅ Working correctly');
    console.log('- Caching: ✅ Working correctly');
    console.log('- Session management: ✅ Working correctly');
    console.log('- Rate limiting: ✅ Working correctly');

  } catch (error) {
    console.error('❌ PostgreSQL + Redis database setup test failed:', error);
    process.exit(1);
  } finally {
    // Disconnect from databases
    try {
      await databaseService.disconnect();
      process.exit(0);
    } catch (error) {
      console.error('Error during cleanup:', error);
      process.exit(1);
    }
  }
}

// Run the test
if (require.main === module) {
  testPostgreSQLSetup();
}

module.exports = testPostgreSQLSetup;
