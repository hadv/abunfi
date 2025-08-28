const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // User reference
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Transaction details
  type: {
    type: String,
    enum: ['deposit', 'withdraw', 'yield_harvest', 'referral_bonus'],
    required: true
  },
  
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed', 'cancelled'],
    default: 'pending'
  },
  
  // Amounts
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  shares: {
    type: Number,
    default: 0
  },
  
  // Blockchain data
  txHash: {
    type: String,
    sparse: true
  },
  
  blockNumber: {
    type: Number
  },
  
  gasUsed: {
    type: Number
  },
  
  gasFee: {
    type: Number
  },
  
  // Exchange rates (for VND conversion)
  exchangeRate: {
    usdToVnd: Number,
    timestamp: Date
  },
  
  amountVnd: Number,
  
  // Additional data
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Error information
  errorMessage: String,
  
  // Confirmation details
  confirmations: {
    type: Number,
    default: 0
  },
  
  confirmedAt: Date,
  
  // Processing timestamps
  submittedAt: {
    type: Date,
    default: Date.now
  },
  
  processedAt: Date
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ txHash: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ submittedAt: -1 });

// Virtual for processing time
transactionSchema.virtual('processingTime').get(function() {
  if (this.processedAt && this.submittedAt) {
    return this.processedAt - this.submittedAt;
  }
  return null;
});

// Methods
transactionSchema.methods.markAsConfirmed = function(txHash, blockNumber) {
  this.status = 'confirmed';
  this.txHash = txHash;
  this.blockNumber = blockNumber;
  this.confirmedAt = new Date();
  this.processedAt = new Date();
  return this.save();
};

transactionSchema.methods.markAsFailed = function(errorMessage) {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  this.processedAt = new Date();
  return this.save();
};

// Static methods
transactionSchema.statics.getUserTransactions = function(userId, limit = 20, offset = 0) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset)
    .populate('user', 'name email walletAddress');
};

transactionSchema.statics.getUserStats = function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId), status: 'confirmed' } },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    }
  ]);
};

transactionSchema.statics.getPendingTransactions = function() {
  return this.find({ status: 'pending' })
    .sort({ submittedAt: 1 });
};

module.exports = mongoose.model('Transaction', transactionSchema);
