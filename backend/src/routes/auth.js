const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// Social login/register
router.post('/social-login',
  [
    body('socialId').notEmpty().withMessage('Social ID is required'),
    body('socialProvider').isIn(['google', 'apple', 'facebook']).withMessage('Invalid social provider'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('name').notEmpty().withMessage('Name is required'),
    body('walletAddress').isEthereumAddress().withMessage('Valid wallet address is required')
  ],
  validateRequest,
  authController.socialLogin
);

// Phone login/register
router.post('/phone-login',
  [
    body('phone').isMobilePhone('vi-VN').withMessage('Valid Vietnamese phone number is required'),
    body('verificationCode').isLength({ min: 6, max: 6 }).withMessage('Verification code must be 6 digits'),
    body('walletAddress').isEthereumAddress().withMessage('Valid wallet address is required')
  ],
  validateRequest,
  authController.phoneLogin
);

// Send phone verification
router.post('/send-phone-verification',
  [
    body('phone').isMobilePhone('vi-VN').withMessage('Valid Vietnamese phone number is required')
  ],
  validateRequest,
  authController.sendPhoneVerification
);

// Refresh token
router.post('/refresh-token',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required')
  ],
  validateRequest,
  authController.refreshToken
);

// Logout
router.post('/logout', authController.logout);

// Verify email
router.get('/verify-email/:token', authController.verifyEmail);

// Request password reset (for future use)
router.post('/forgot-password',
  [
    body('email').isEmail().withMessage('Valid email is required')
  ],
  validateRequest,
  authController.forgotPassword
);

// Development login (ONLY for development environment)
router.post('/dev-login',
  [
    body('email').isEmail().withMessage('Valid email is required')
  ],
  validateRequest,
  authController.devLogin
);

module.exports = router;
