const jwt = require('jsonwebtoken');
const UserRepository = require('../models/postgres/UserRepository');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserRepository.findById(decoded.userId);

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid token or user not found' });
    }

    // Check if this is a temporary token that requires 2FA completion
    if (decoded.temporary && decoded.requires2FA) {
      // Only allow access to 2FA completion and passkey endpoints
      const allowedPaths = [
        '/api/auth/complete-2fa',
        '/api/passkey/authenticate/begin',
        '/api/passkey/authenticate/complete'
      ];

      if (!allowedPaths.some(path => req.path.startsWith(path))) {
        return res.status(403).json({
          error: 'Two-factor authentication required',
          requires2FA: true,
          message: 'Please complete passkey authentication to access this resource'
        });
      }
    }

    req.user = user;
    req.tokenInfo = {
      isTemporary: decoded.temporary || false,
      requires2FA: decoded.requires2FA || false,
      verified2FA: decoded.verified2FA || false
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Role-based authorization middleware
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const userRole = req.user.role || 'user';

      if (!allowedRoles.includes(userRole)) {
        logger.warn(`Access denied for user ${req.user.id} with role ${userRole}. Required roles: ${allowedRoles.join(', ')}`);
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: allowedRoles,
          current: userRole
        });
      }

      next();
    } catch (error) {
      logger.error('Authorization error:', error);
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};

// Specific role check middlewares for common use cases
const requireAdmin = requireRole(['admin']);
const requireStrategyManager = requireRole(['admin', 'strategy_manager']);

module.exports = {
  authenticate,
  requireRole,
  requireAdmin,
  requireStrategyManager
};
