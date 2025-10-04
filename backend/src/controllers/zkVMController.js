const zkVMService = require('../services/zkVMService');
const logger = require('../utils/logger');

/**
 * zkVM Controller - Handles zkVM verification requests
 */
const zkVMController = {
  /**
   * Start a new verification request
   * POST /api/zkvm/verify
   */
  startVerification: async (req, res) => {
    try {
      const { platform, oauth_token, wallet_address, request_id } = req.body;

      // Validate required fields
      if (!platform || !oauth_token || !wallet_address) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: platform, oauth_token, wallet_address'
        });
      }

      // Validate platform
      const validPlatforms = ['twitter', 'discord', 'github', 'telegram', 'linkedin'];
      if (!validPlatforms.includes(platform.toLowerCase())) {
        return res.status(400).json({
          success: false,
          error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}`
        });
      }

      // Start verification
      const result = await zkVMService.startVerification(
        platform,
        oauth_token,
        wallet_address,
        request_id
      );

      res.json(result);

    } catch (error) {
      logger.error('Verification start error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start verification',
        message: error.message
      });
    }
  },

  /**
   * Get verification status
   * GET /api/zkvm/status/:verificationId
   */
  getStatus: async (req, res) => {
    try {
      const { verificationId } = req.params;

      if (!verificationId) {
        return res.status(400).json({
          success: false,
          error: 'Verification ID is required'
        });
      }

      const status = zkVMService.getVerificationStatus(verificationId);

      if (!status.success) {
        return res.status(404).json(status);
      }

      res.json(status);

    } catch (error) {
      logger.error('Get status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get verification status',
        message: error.message
      });
    }
  },

  /**
   * Health check for zkVM service
   * GET /api/zkvm/health
   */
  healthCheck: async (req, res) => {
    try {
      res.json({
        success: true,
        service: 'zkVM',
        status: 'operational',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Health check error:', error);
      res.status(500).json({
        success: false,
        error: 'Service unhealthy'
      });
    }
  }
};

module.exports = zkVMController;

