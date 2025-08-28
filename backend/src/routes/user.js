const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { validateRequest } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', authenticate, userController.getProfile);

// Update user profile
router.put('/profile',
  authenticate,
  [
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('phone').optional().isMobilePhone('vi-VN').withMessage('Valid Vietnamese phone number required'),
    body('preferences.language').optional().isIn(['vi', 'en']).withMessage('Invalid language'),
    body('preferences.currency').optional().isIn(['VND', 'USD']).withMessage('Invalid currency')
  ],
  validateRequest,
  userController.updateProfile
);

// Get user dashboard data
router.get('/dashboard', authenticate, userController.getDashboard);

// Get referral info
router.get('/referral', authenticate, userController.getReferralInfo);

module.exports = router;
