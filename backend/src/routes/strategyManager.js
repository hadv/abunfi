const express = require('express');
const { query } = require('express-validator');
const strategyManagerController = require('../controllers/strategyManagerController');
const { validateRequest } = require('../middleware/validation');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Middleware to ensure only admins/strategy managers can access these endpoints
const requireStrategyManagerRole = requireRole(['admin', 'strategy_manager']);

// Get overall strategies overview
router.get('/overview', 
  authenticate,
  requireStrategyManagerRole,
  strategyManagerController.getStrategiesOverview
);

// Get current funds distribution across strategies
router.get('/distribution',
  authenticate,
  requireStrategyManagerRole,
  strategyManagerController.getFundsDistribution
);

// Get strategy performance metrics with historical data
router.get('/performance',
  authenticate,
  requireStrategyManagerRole,
  [
    query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Period must be 7d, 30d, 90d, or 1y')
  ],
  validateRequest,
  strategyManagerController.getStrategyPerformance
);

// Get compound interest calculations and projections
router.get('/compound-interest',
  authenticate,
  requireStrategyManagerRole,
  [
    query('period').optional().isIn(['3m', '6m', '1y', '2y']).withMessage('Period must be 3m, 6m, 1y, or 2y'),
    query('principal').optional().isFloat({ min: 1 }).withMessage('Principal must be a positive number')
  ],
  validateRequest,
  strategyManagerController.getCompoundInterest
);

module.exports = router;
