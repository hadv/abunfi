const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic user info
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  // Social login info
  socialId: {
    type: String,
    sparse: true // Allows multiple null values
  },
  
  socialProvider: {
    type: String,
    enum: ['google', 'apple', 'facebook', 'phone'],
    required: function() {
      return this.socialId != null;
    }
  },
  
  // Profile info
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  phone: {
    type: String,
    sparse: true
  },
  
  avatar: {
    type: String
  },
  
  // Wallet info
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  
  // KYC status
  kycStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  
  kycData: {
    fullName: String,
    idNumber: String,
    dateOfBirth: Date,
    address: String,
    verificationDocuments: [String]
  },
  
  // Preferences
  preferences: {
    language: {
      type: String,
      default: 'vi',
      enum: ['vi', 'en']
    },
    currency: {
      type: String,
      default: 'VND',
      enum: ['VND', 'USD']
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  },
  
  // Security
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  
  twoFactorSecret: String,
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  emailVerificationToken: String,
  
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Tracking
  lastLoginAt: Date,
  loginCount: {
    type: Number,
    default: 0
  },
  
  // Referral system
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  referralCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.twoFactorSecret;
      delete ret.emailVerificationToken;
      delete ret.passwordResetToken;
      return ret;
    }
  }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ walletAddress: 1 });
userSchema.index({ socialId: 1, socialProvider: 1 });
userSchema.index({ referralCode: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.kycData?.fullName || this.name;
});

// Methods
userSchema.methods.generateReferralCode = function() {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  this.referralCode = code;
  return code;
};

userSchema.methods.updateLoginInfo = function() {
  this.lastLoginAt = new Date();
  this.loginCount += 1;
  return this.save();
};

userSchema.methods.toPublicJSON = function() {
  const user = this.toObject();
  delete user.twoFactorSecret;
  delete user.emailVerificationToken;
  delete user.passwordResetToken;
  return user;
};

// Static methods
userSchema.statics.findByWallet = function(walletAddress) {
  return this.findOne({ walletAddress: walletAddress.toLowerCase() });
};

userSchema.statics.findBySocial = function(socialId, provider) {
  return this.findOne({ socialId, socialProvider: provider });
};

// Pre-save middleware
userSchema.pre('save', function(next) {
  // Generate referral code if not exists
  if (this.isNew && !this.referralCode) {
    this.generateReferralCode();
  }
  
  // Ensure wallet address is lowercase
  if (this.walletAddress) {
    this.walletAddress = this.walletAddress.toLowerCase();
  }
  
  next();
});

module.exports = mongoose.model('User', userSchema);
