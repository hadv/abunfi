-- Abunfi PostgreSQL Database Initialization
-- This script sets up the core financial data tables with ACID compliance

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (core user data for financial operations)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    
    -- Social login info
    social_id VARCHAR(255),
    social_provider VARCHAR(20) CHECK (social_provider IN ('google', 'apple', 'facebook', 'phone')),
    
    -- KYC status
    kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
    kyc_data JSONB DEFAULT '{}',

    -- User preferences (previously in MongoDB)
    preferences JSONB DEFAULT '{
        "language": "vi",
        "currency": "VND",
        "notifications": {
            "email": true,
            "push": true,
            "sms": false
        }
    }',

    -- Additional flexible data
    metadata JSONB DEFAULT '{}',

    -- Security
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret TEXT,
    is_active BOOLEAN DEFAULT true,
    is_email_verified BOOLEAN DEFAULT false,
    email_verification_token TEXT,
    password_reset_token TEXT,
    password_reset_expires TIMESTAMP,
    
    -- Tracking
    last_login_at TIMESTAMP,
    login_count INTEGER DEFAULT 0,
    
    -- Referral system
    referral_code VARCHAR(10) UNIQUE,
    referred_by UUID REFERENCES users(id),
    referral_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User balances table (critical financial data)
CREATE TABLE user_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Balance information
    total_balance DECIMAL(20,6) DEFAULT 0 CHECK (total_balance >= 0),
    available_balance DECIMAL(20,6) DEFAULT 0 CHECK (available_balance >= 0),
    locked_balance DECIMAL(20,6) DEFAULT 0 CHECK (locked_balance >= 0),
    
    -- Shares information
    total_shares DECIMAL(20,6) DEFAULT 0 CHECK (total_shares >= 0),
    share_price DECIMAL(20,6) DEFAULT 1000000, -- 1 share = 1,000,000 VND initially
    
    -- Yield tracking
    total_yield_earned DECIMAL(20,6) DEFAULT 0,
    last_yield_calculation TIMESTAMP DEFAULT NOW(),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Ensure balance consistency
    CONSTRAINT balance_consistency CHECK (total_balance = available_balance + locked_balance)
);

-- Transactions table (all financial transactions)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Transaction details
    type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdraw', 'yield_harvest', 'referral_bonus')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled')),
    
    -- Amounts (using DECIMAL for precision)
    amount DECIMAL(20,6) NOT NULL CHECK (amount > 0),
    shares DECIMAL(20,6) DEFAULT 0,
    
    -- Blockchain data
    tx_hash VARCHAR(66), -- Ethereum transaction hash
    block_number BIGINT,
    gas_used BIGINT,
    gas_fee DECIMAL(20,6),
    
    -- Exchange rates (for VND conversion)
    exchange_rate JSONB,
    amount_vnd DECIMAL(20,2),
    
    -- Additional data
    metadata JSONB DEFAULT '{}',
    
    -- Error information
    error_message TEXT,
    
    -- Confirmation details
    confirmations INTEGER DEFAULT 0,
    confirmed_at TIMESTAMP,
    
    -- Processing timestamps
    submitted_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Transaction history for audit trail
CREATE TABLE transaction_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    
    -- Previous state
    previous_status VARCHAR(20),
    new_status VARCHAR(20),
    
    -- Change details
    changed_by VARCHAR(255), -- system, user, admin
    change_reason TEXT,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_users_social ON users(social_id, social_provider);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_kyc_status ON users(kyc_status);
CREATE INDEX idx_users_active ON users(is_active);

-- JSONB indexes for preferences and metadata
CREATE INDEX idx_users_preferences_language ON users USING GIN ((preferences->>'language'));
CREATE INDEX idx_users_preferences_currency ON users USING GIN ((preferences->>'currency'));
CREATE INDEX idx_users_metadata ON users USING GIN (metadata);
CREATE INDEX idx_users_preferences ON users USING GIN (preferences);

CREATE INDEX idx_user_balances_user_id ON user_balances(user_id);
CREATE INDEX idx_user_balances_updated_at ON user_balances(updated_at);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_user_created ON transactions(user_id, created_at DESC);
CREATE INDEX idx_transactions_tx_hash ON transactions(tx_hash);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_submitted_at ON transactions(submitted_at DESC);
CREATE INDEX idx_transactions_block_number ON transactions(block_number);

CREATE INDEX idx_transaction_history_transaction_id ON transaction_history(transaction_id);
CREATE INDEX idx_transaction_history_created_at ON transaction_history(created_at DESC);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_balances_updated_at BEFORE UPDATE ON user_balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user balance record when user is created
CREATE OR REPLACE FUNCTION create_user_balance()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_balances (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_user_balance_trigger AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_user_balance();

-- Function to log transaction status changes
CREATE OR REPLACE FUNCTION log_transaction_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO transaction_history (transaction_id, previous_status, new_status, changed_by, change_reason)
        VALUES (NEW.id, OLD.status, NEW.status, 'system', 'Status updated');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER log_transaction_status_change_trigger AFTER UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION log_transaction_status_change();

-- Create initial admin user (optional)
-- INSERT INTO users (email, wallet_address, name, kyc_status, is_email_verified)
-- VALUES ('admin@abunfi.com', '0x0000000000000000000000000000000000000000', 'Admin User', 'verified', true);

COMMENT ON TABLE users IS 'Core user data for financial operations';
COMMENT ON TABLE user_balances IS 'User balance information with ACID compliance';
COMMENT ON TABLE transactions IS 'All financial transactions with blockchain data';
COMMENT ON TABLE transaction_history IS 'Audit trail for transaction status changes';
