const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const UserRepository = require('../models/postgres/UserRepository');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // Map of userId -> Set of WebSocket connections
    this.strategyManagerClients = new Set(); // Set of strategy manager connections
    this.updateInterval = null;
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws',
      verifyClient: async (info) => {
        try {
          const url = new URL(info.req.url, `http://${info.req.headers.host}`);
          const token = url.searchParams.get('token');

          if (!token) {
            logger.warn('WebSocket connection rejected: No token provided');
            return false;
          }

          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await UserRepository.findById(decoded.userId);

          if (!user || !user.is_active) {
            logger.warn('WebSocket connection rejected: Invalid user');
            return false;
          }

          // Store user info for later use
          info.req.user = user;
          info.req.userData = user;
          return true;
        } catch (error) {
          logger.warn('WebSocket connection rejected:', error.message);
          return false;
        }
      }
    });

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    // Start periodic updates for strategy managers
    this.startPeriodicUpdates();

    logger.info('WebSocket service initialized');
  }

  async handleConnection(ws, req) {
    let user = req.user || req.userData;

    // If user is not found in req, try to extract from URL and verify again
    if (!user) {
      try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const token = url.searchParams.get('token');

        if (token) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          user = await UserRepository.findById(decoded.userId);
        }
      } catch (error) {
        logger.error('WebSocket token verification failed:', error.message);
      }
    }

    if (!user) {
      logger.error('WebSocket connection failed: No user found in request');
      ws.close(1008, 'Authentication failed');
      return;
    }

    const userId = user.id;
    const userRole = user.role || 'user';

    logger.info(`WebSocket connection established for user ${userId} with role ${userRole}`);

    // Add client to appropriate collections
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId).add(ws);

    // Add to strategy manager clients if applicable
    if (userRole === 'strategy_manager' || userRole === 'admin') {
      this.strategyManagerClients.add(ws);
    }

    // Send initial data
    this.sendInitialData(ws, userRole);

    // Handle messages
    ws.on('message', (message) => {
      this.handleMessage(ws, message, user);
    });

    // Handle disconnection
    ws.on('close', (code, reason) => {
      logger.info(`WebSocket disconnected: userId=${userId}, code=${code}`);
      this.handleDisconnection(ws, userId);
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error(`WebSocket error for user ${userId}:`, error);
    });
  }

  handleMessage(ws, message, user) {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'subscribe_strategy_updates':
          if (user.role === 'strategy_manager' || user.role === 'admin') {
            this.subscribeToStrategyUpdates(ws);
          }
          break;
        
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;
        
        default:
          logger.warn(`Unknown message type: ${data.type}`);
      }
    } catch (error) {
      logger.error('Error handling WebSocket message:', error);
    }
  }

  handleDisconnection(ws, userId) {
    logger.info(`WebSocket disconnected for user ${userId}`);
    
    // Remove from clients map
    if (this.clients.has(userId)) {
      this.clients.get(userId).delete(ws);
      if (this.clients.get(userId).size === 0) {
        this.clients.delete(userId);
      }
    }

    // Remove from strategy manager clients
    this.strategyManagerClients.delete(ws);
  }

  async sendInitialData(ws, userRole) {
    try {
      if (userRole === 'strategy_manager' || userRole === 'admin') {
        // Send initial strategy data
        const strategyData = await this.getLatestStrategyData();
        ws.send(JSON.stringify({
          type: 'initial_strategy_data',
          data: strategyData,
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      logger.error('Error sending initial data:', error);
    }
  }

  subscribeToStrategyUpdates(ws) {
    ws.send(JSON.stringify({
      type: 'subscription_confirmed',
      subscription: 'strategy_updates',
      timestamp: Date.now()
    }));
  }

  // Broadcast strategy updates to all strategy managers
  async broadcastStrategyUpdate(updateData) {
    if (this.strategyManagerClients.size === 0) return;

    const message = JSON.stringify({
      type: 'strategy_update',
      data: updateData,
      timestamp: Date.now()
    });

    const deadConnections = new Set();

    for (const ws of this.strategyManagerClients) {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        } else {
          deadConnections.add(ws);
        }
      } catch (error) {
        logger.error('Error broadcasting strategy update:', error);
        deadConnections.add(ws);
      }
    }

    // Clean up dead connections
    for (const ws of deadConnections) {
      this.strategyManagerClients.delete(ws);
    }
  }

  // Broadcast fund distribution updates
  async broadcastFundsDistributionUpdate(distributionData) {
    const message = JSON.stringify({
      type: 'funds_distribution_update',
      data: distributionData,
      timestamp: Date.now()
    });

    this.broadcastToStrategyManagers(message);
  }

  // Broadcast compound interest updates
  async broadcastCompoundInterestUpdate(compoundData) {
    const message = JSON.stringify({
      type: 'compound_interest_update',
      data: compoundData,
      timestamp: Date.now()
    });

    this.broadcastToStrategyManagers(message);
  }

  // Helper method to broadcast to all strategy managers
  broadcastToStrategyManagers(message) {
    const deadConnections = new Set();

    for (const ws of this.strategyManagerClients) {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        } else {
          deadConnections.add(ws);
        }
      } catch (error) {
        logger.error('Error broadcasting to strategy managers:', error);
        deadConnections.add(ws);
      }
    }

    // Clean up dead connections
    for (const ws of deadConnections) {
      this.strategyManagerClients.delete(ws);
    }
  }

  // Start periodic updates for real-time data
  startPeriodicUpdates() {
    // Update every 30 seconds
    this.updateInterval = setInterval(async () => {
      try {
        if (this.strategyManagerClients.size > 0) {
          const strategyData = await this.getLatestStrategyData();
          await this.broadcastStrategyUpdate(strategyData);
        }
      } catch (error) {
        logger.error('Error in periodic strategy update:', error);
      }
    }, 30000); // 30 seconds

    logger.info('Started periodic WebSocket updates');
  }

  // Get latest strategy data (mock implementation)
  async getLatestStrategyData() {
    // This would normally fetch from blockchain or database
    // Using mock data for now
    return {
      strategies: [
        {
          name: 'Aave USDC Strategy',
          apy: 7.8 + (Math.random() - 0.5) * 0.2, // Small random variation
          totalAssets: 30000000,
          allocation: 40.0,
          riskScore: 25,
          lastUpdate: new Date().toISOString()
        },
        {
          name: 'Compound V3 USDC Strategy',
          apy: 8.9 + (Math.random() - 0.5) * 0.3,
          totalAssets: 25000000,
          allocation: 33.3,
          riskScore: 30,
          lastUpdate: new Date().toISOString()
        },
        {
          name: 'Lido Liquid Staking',
          apy: 5.2 + (Math.random() - 0.5) * 0.1,
          totalAssets: 15000000,
          allocation: 20.0,
          riskScore: 15,
          lastUpdate: new Date().toISOString()
        },
        {
          name: 'Uniswap V3 LP Strategy',
          apy: 12.1 + (Math.random() - 0.5) * 1.0,
          totalAssets: 5000000,
          allocation: 6.7,
          riskScore: 65,
          lastUpdate: new Date().toISOString()
        }
      ],
      totalAssets: 75000000,
      averageAPY: 8.45,
      lastUpdate: new Date().toISOString()
    };
  }

  // Send message to specific user
  sendToUser(userId, message) {
    const userConnections = this.clients.get(userId);
    if (!userConnections) return;

    const messageStr = JSON.stringify(message);
    const deadConnections = new Set();

    for (const ws of userConnections) {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr);
        } else {
          deadConnections.add(ws);
        }
      } catch (error) {
        logger.error(`Error sending message to user ${userId}:`, error);
        deadConnections.add(ws);
      }
    }

    // Clean up dead connections
    for (const ws of deadConnections) {
      userConnections.delete(ws);
    }
  }

  // Get connection statistics
  getStats() {
    return {
      totalConnections: Array.from(this.clients.values()).reduce((sum, set) => sum + set.size, 0),
      uniqueUsers: this.clients.size,
      strategyManagerConnections: this.strategyManagerClients.size,
      isRunning: !!this.wss
    };
  }

  // Cleanup method
  cleanup() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    this.clients.clear();
    this.strategyManagerClients.clear();
    
    logger.info('WebSocket service cleaned up');
  }
}

module.exports = new WebSocketService();
