const databaseService = require('../../services/DatabaseService');
const logger = require('../../utils/logger');

class TransactionRepository {
  // Create a new transaction
  async create(transactionData) {
    const query = `
      INSERT INTO transactions (
        user_id, type, amount, shares, tx_hash, block_number,
        gas_used, gas_fee, exchange_rate, amount_vnd, metadata,
        status, submitted_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      transactionData.user_id,
      transactionData.type,
      transactionData.amount,
      transactionData.shares || 0,
      transactionData.tx_hash,
      transactionData.block_number,
      transactionData.gas_used,
      transactionData.gas_fee,
      JSON.stringify(transactionData.exchange_rate || {}),
      transactionData.amount_vnd,
      JSON.stringify(transactionData.metadata || {}),
      transactionData.status || 'pending',
      transactionData.submitted_at || new Date()
    ];

    try {
      const result = await databaseService.executeQuery(query, values);
      logger.info(`Transaction created: ${result.rows[0].id}`);
      
      // Invalidate user cache
      await databaseService.deleteCache(`user:${transactionData.user_id}`);
      await databaseService.deleteCache(`user_transactions:${transactionData.user_id}:*`);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating transaction:', error);
      throw error;
    }
  }

  // Find transaction by ID
  async findById(transactionId) {
    const query = `
      SELECT t.*, u.email, u.name, u.wallet_address
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = $1
    `;

    try {
      const result = await databaseService.executeQuery(query, [transactionId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding transaction by ID:', error);
      throw error;
    }
  }

  // Find transaction by hash
  async findByHash(txHash) {
    const query = `
      SELECT t.*, u.email, u.name, u.wallet_address
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.tx_hash = $1
    `;

    try {
      const result = await databaseService.executeQuery(query, [txHash]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding transaction by hash:', error);
      throw error;
    }
  }

  // Get user transactions with pagination
  async getUserTransactions(userId, options = {}) {
    const {
      limit = 20,
      offset = 0,
      type = null,
      status = null,
      startDate = null,
      endDate = null
    } = options;

    let whereConditions = ['t.user_id = $1'];
    let values = [userId];
    let paramIndex = 2;

    if (type) {
      whereConditions.push(`t.type = $${paramIndex}`);
      values.push(type);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`t.status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (startDate) {
      whereConditions.push(`t.created_at >= $${paramIndex}`);
      values.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereConditions.push(`t.created_at <= $${paramIndex}`);
      values.push(endDate);
      paramIndex++;
    }

    const query = `
      SELECT t.*, u.name, u.email
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY t.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    values.push(limit, offset);

    try {
      const result = await databaseService.executeQuery(query, values);
      return result.rows;
    } catch (error) {
      logger.error('Error getting user transactions:', error);
      throw error;
    }
  }

  // Count user transactions
  async countUserTransactions(userId, options = {}) {
    const { type = null, status = null, startDate = null, endDate = null } = options;

    let whereConditions = ['user_id = $1'];
    let values = [userId];
    let paramIndex = 2;

    if (type) {
      whereConditions.push(`type = $${paramIndex}`);
      values.push(type);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (startDate) {
      whereConditions.push(`created_at >= $${paramIndex}`);
      values.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereConditions.push(`created_at <= $${paramIndex}`);
      values.push(endDate);
      paramIndex++;
    }

    const query = `
      SELECT COUNT(*) as total
      FROM transactions
      WHERE ${whereConditions.join(' AND ')}
    `;

    try {
      const result = await databaseService.executeQuery(query, values);
      return parseInt(result.rows[0].total);
    } catch (error) {
      logger.error('Error counting user transactions:', error);
      throw error;
    }
  }

  // Update transaction status
  async updateStatus(transactionId, status, additionalData = {}) {
    const allowedStatuses = ['pending', 'confirmed', 'failed', 'cancelled'];
    
    if (!allowedStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    let updateFields = ['status = $2', 'updated_at = NOW()'];
    let values = [transactionId, status];
    let paramIndex = 3;

    // Add additional fields based on status
    if (status === 'confirmed') {
      updateFields.push(`confirmed_at = NOW()`);
      updateFields.push(`processed_at = NOW()`);
      
      if (additionalData.tx_hash) {
        updateFields.push(`tx_hash = $${paramIndex}`);
        values.push(additionalData.tx_hash);
        paramIndex++;
      }
      
      if (additionalData.block_number) {
        updateFields.push(`block_number = $${paramIndex}`);
        values.push(additionalData.block_number);
        paramIndex++;
      }
      
      if (additionalData.gas_used) {
        updateFields.push(`gas_used = $${paramIndex}`);
        values.push(additionalData.gas_used);
        paramIndex++;
      }
      
      if (additionalData.gas_fee) {
        updateFields.push(`gas_fee = $${paramIndex}`);
        values.push(additionalData.gas_fee);
        paramIndex++;
      }
    }

    if (status === 'failed' && additionalData.error_message) {
      updateFields.push(`error_message = $${paramIndex}`);
      updateFields.push(`processed_at = NOW()`);
      values.push(additionalData.error_message);
      paramIndex++;
    }

    const query = `
      UPDATE transactions 
      SET ${updateFields.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    try {
      const result = await databaseService.executeQuery(query, values);
      
      if (result.rows.length > 0) {
        const transaction = result.rows[0];
        
        // Invalidate caches
        await databaseService.deleteCache(`user:${transaction.user_id}`);
        await databaseService.deleteCache(`user_transactions:${transaction.user_id}:*`);
        
        logger.info(`Transaction ${transactionId} status updated to ${status}`);
      }
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating transaction status:', error);
      throw error;
    }
  }

  // Get transaction statistics for a user
  async getUserStats(userId) {
    const query = `
      SELECT 
        type,
        status,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(AVG(amount), 0) as avg_amount,
        COALESCE(MIN(amount), 0) as min_amount,
        COALESCE(MAX(amount), 0) as max_amount
      FROM transactions
      WHERE user_id = $1
      GROUP BY type, status
      ORDER BY type, status
    `;

    try {
      const result = await databaseService.executeQuery(query, [userId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting user transaction stats:', error);
      throw error;
    }
  }

  // Get monthly transaction statistics
  async getMonthlyStats(userId, months = 6) {
    const query = `
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        type,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM transactions
      WHERE user_id = $1 
        AND status = 'confirmed'
        AND created_at >= NOW() - INTERVAL '${months} months'
      GROUP BY DATE_TRUNC('month', created_at), type
      ORDER BY month DESC, type
    `;

    try {
      const result = await databaseService.executeQuery(query, [userId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting monthly transaction stats:', error);
      throw error;
    }
  }

  // Get pending transactions
  async getPendingTransactions(limit = 100) {
    const query = `
      SELECT t.*, u.email, u.wallet_address
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.status = 'pending'
        AND t.submitted_at < NOW() - INTERVAL '5 minutes'
      ORDER BY t.submitted_at ASC
      LIMIT $1
    `;

    try {
      const result = await databaseService.executeQuery(query, [limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting pending transactions:', error);
      throw error;
    }
  }

  // Create transaction with balance update (atomic operation)
  async createWithBalanceUpdate(transactionData, balanceChanges) {
    return await databaseService.executeTransaction(async (client) => {
      // Create transaction
      const transactionQuery = `
        INSERT INTO transactions (
          user_id, type, amount, shares, tx_hash, block_number,
          gas_used, gas_fee, exchange_rate, amount_vnd, metadata,
          status, submitted_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;

      const transactionValues = [
        transactionData.user_id,
        transactionData.type,
        transactionData.amount,
        transactionData.shares || 0,
        transactionData.tx_hash,
        transactionData.block_number,
        transactionData.gas_used,
        transactionData.gas_fee,
        JSON.stringify(transactionData.exchange_rate || {}),
        transactionData.amount_vnd,
        JSON.stringify(transactionData.metadata || {}),
        transactionData.status || 'pending',
        transactionData.submitted_at || new Date()
      ];

      const transactionResult = await client.query(transactionQuery, transactionValues);
      const transaction = transactionResult.rows[0];

      // Update user balance if provided
      if (balanceChanges) {
        const balanceQuery = `
          UPDATE user_balances 
          SET total_balance = total_balance + $1,
              available_balance = available_balance + $2,
              locked_balance = locked_balance + $3,
              total_shares = total_shares + $4,
              updated_at = NOW()
          WHERE user_id = $5
          RETURNING *
        `;

        const balanceValues = [
          balanceChanges.total_balance || 0,
          balanceChanges.available_balance || 0,
          balanceChanges.locked_balance || 0,
          balanceChanges.total_shares || 0,
          transactionData.user_id
        ];

        await client.query(balanceQuery, balanceValues);
      }

      // Invalidate caches
      await databaseService.deleteCache(`user:${transactionData.user_id}`);
      
      return transaction;
    });
  }
}

module.exports = new TransactionRepository();
