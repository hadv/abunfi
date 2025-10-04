const { spawn } = require('child_process');
const path = require('path');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * zkVM Service - Integrates with RISC Zero prover binary
 * Handles social account verification using zero-knowledge proofs
 */
class ZkVMService {
  constructor() {
    // Path to the zkVM prover binary
    this.proverBinaryPath = process.env.ZKVM_PROVER_PATH || path.join(__dirname, '../../bin/zkvm-prover');
    
    // Store verification requests in memory (in production, use database)
    this.verificationRequests = new Map();
    
    // Timeout for verification (5 minutes)
    this.verificationTimeout = parseInt(process.env.ZKVM_TIMEOUT || '300000');
    
    logger.info(`zkVM Service initialized with binary path: ${this.proverBinaryPath}`);
  }

  /**
   * Start a verification request
   * @param {string} platform - Social platform (twitter, discord, github, etc.)
   * @param {string} oauthToken - OAuth token for the platform
   * @param {string} walletAddress - User's wallet address
   * @param {string} requestId - Blockchain request ID
   * @returns {Promise<Object>} Verification request details
   */
  async startVerification(platform, oauthToken, walletAddress, requestId) {
    try {
      logger.info(`Starting zkVM verification for ${platform}, wallet: ${walletAddress}`);

      // Create verification request
      const verificationId = requestId || uuidv4();
      const request = {
        id: verificationId,
        platform,
        walletAddress,
        status: 'pending',
        createdAt: Date.now(),
        result: null,
        error: null
      };

      this.verificationRequests.set(verificationId, request);

      // Start the verification process asynchronously
      this.executeVerification(verificationId, platform, oauthToken, walletAddress)
        .catch(error => {
          logger.error(`Verification execution failed for ${verificationId}:`, error);
          const req = this.verificationRequests.get(verificationId);
          if (req) {
            req.status = 'failed';
            req.error = error.message;
          }
        });

      return {
        success: true,
        verificationId,
        status: 'pending',
        message: 'Verification started'
      };

    } catch (error) {
      logger.error('Failed to start verification:', error);
      throw error;
    }
  }

  /**
   * Execute the verification by calling the Rust zkVM prover binary
   * @private
   */
  async executeVerification(verificationId, platform, oauthToken, walletAddress) {
    return new Promise((resolve, reject) => {
      const request = this.verificationRequests.get(verificationId);
      if (!request) {
        return reject(new Error('Verification request not found'));
      }

      logger.info(`Executing zkVM prover for ${verificationId}`);

      // Spawn the Rust zkVM prover binary
      const prover = spawn(this.proverBinaryPath, [
        platform.toLowerCase(),
        oauthToken,
        walletAddress
      ]);

      let stdout = '';
      let stderr = '';

      // Collect stdout
      prover.stdout.on('data', (data) => {
        stdout += data.toString();
        logger.debug(`zkVM stdout: ${data}`);
      });

      // Collect stderr
      prover.stderr.on('data', (data) => {
        stderr += data.toString();
        logger.debug(`zkVM stderr: ${data}`);
      });

      // Handle process completion
      prover.on('close', (code) => {
        if (code === 0) {
          try {
            // Parse the output from the prover
            const result = this.parseProverOutput(stdout);
            
            request.status = result.verification_success ? 'completed' : 'failed';
            request.result = result;
            request.completedAt = Date.now();

            logger.info(`Verification ${verificationId} completed successfully`);
            resolve(result);

          } catch (error) {
            logger.error(`Failed to parse prover output for ${verificationId}:`, error);
            request.status = 'failed';
            request.error = 'Failed to parse verification result';
            reject(error);
          }
        } else {
          logger.error(`zkVM prover exited with code ${code} for ${verificationId}`);
          logger.error(`stderr: ${stderr}`);
          
          request.status = 'failed';
          request.error = `Prover failed with code ${code}: ${stderr}`;
          reject(new Error(request.error));
        }
      });

      // Handle process errors
      prover.on('error', (error) => {
        logger.error(`Failed to spawn zkVM prover for ${verificationId}:`, error);
        request.status = 'failed';
        request.error = `Failed to execute prover: ${error.message}`;
        reject(error);
      });

      // Set timeout
      setTimeout(() => {
        if (request.status === 'pending') {
          prover.kill();
          request.status = 'failed';
          request.error = 'Verification timeout';
          reject(new Error('Verification timeout'));
        }
      }, this.verificationTimeout);
    });
  }

  /**
   * Parse the output from the zkVM prover
   * @private
   */
  parseProverOutput(output) {
    try {
      // The prover outputs JSON result
      // Look for JSON in the output
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback: parse text output
      const lines = output.split('\n');
      const result = {
        verification_success: false,
        social_account_hash: null,
        account_age: 0,
        follower_count: 0,
        proof_hash: null,
        receipt: null
      };

      for (const line of lines) {
        if (line.includes('Success:')) {
          result.verification_success = line.includes('true');
        } else if (line.includes('Social Account Hash:')) {
          result.social_account_hash = line.split(':')[1].trim();
        } else if (line.includes('Account Age:')) {
          result.account_age = parseInt(line.split(':')[1].trim());
        } else if (line.includes('Follower Count:')) {
          result.follower_count = parseInt(line.split(':')[1].trim());
        } else if (line.includes('Proof Hash:')) {
          result.proof_hash = line.split(':')[1].trim();
        }
      }

      return result;

    } catch (error) {
      logger.error('Failed to parse prover output:', error);
      throw new Error('Invalid prover output format');
    }
  }

  /**
   * Get verification status
   * @param {string} verificationId - Verification request ID
   * @returns {Object} Verification status
   */
  getVerificationStatus(verificationId) {
    const request = this.verificationRequests.get(verificationId);
    
    if (!request) {
      return {
        success: false,
        error: 'Verification request not found'
      };
    }

    return {
      success: true,
      id: request.id,
      platform: request.platform,
      walletAddress: request.walletAddress,
      status: request.status,
      result: request.result,
      error: request.error,
      createdAt: request.createdAt,
      completedAt: request.completedAt
    };
  }

  /**
   * Clean up old verification requests (call periodically)
   */
  cleanupOldRequests() {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour

    for (const [id, request] of this.verificationRequests.entries()) {
      if (now - request.createdAt > maxAge) {
        this.verificationRequests.delete(id);
        logger.debug(`Cleaned up old verification request: ${id}`);
      }
    }
  }
}

// Export singleton instance
module.exports = new ZkVMService();

