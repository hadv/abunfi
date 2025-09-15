-- Add Passkey 2FA Support with Game Theory Incentives
-- This migration adds WebAuthn passkey support and incentive mechanisms

-- User passkeys table for storing WebAuthn credentials
CREATE TABLE user_passkeys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- WebAuthn credential data
    credential_id TEXT NOT NULL UNIQUE, -- Base64URL encoded credential ID
    public_key TEXT NOT NULL, -- Base64URL encoded public key
    counter BIGINT DEFAULT 0, -- Signature counter for replay protection
    
    -- Device information
    device_name VARCHAR(255), -- User-friendly device name
    device_type VARCHAR(50), -- 'platform' or 'cross-platform'
    authenticator_attachment VARCHAR(20), -- 'platform', 'cross-platform', or null
    
    -- Backup eligibility and flags
    backup_eligible BOOLEAN DEFAULT false,
    backup_state BOOLEAN DEFAULT false,
    
    -- Transport methods
    transports JSONB DEFAULT '[]', -- Array of transport methods ['usb', 'nfc', 'ble', 'internal']
    
    -- Security metadata
    aaguid TEXT, -- Authenticator Attestation GUID
    attestation_type VARCHAR(20), -- 'none', 'basic', 'self', 'attca'
    
    -- Usage tracking
    last_used_at TIMESTAMP,
    usage_count INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- WebAuthn challenges table for temporary challenge storage
CREATE TABLE webauthn_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Challenge data
    challenge TEXT NOT NULL, -- Base64URL encoded challenge
    challenge_type VARCHAR(20) NOT NULL CHECK (challenge_type IN ('registration', 'authentication')),
    
    -- Request options
    rp_id VARCHAR(255) NOT NULL, -- Relying Party ID
    user_handle TEXT, -- Base64URL encoded user handle (for registration)
    
    -- Timeout and expiry
    timeout INTEGER DEFAULT 60000, -- Timeout in milliseconds
    expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
    
    -- Status
    used BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2FA security events table for audit and analytics
CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Event details
    event_type VARCHAR(50) NOT NULL, -- 'passkey_registered', 'passkey_used', '2fa_enabled', etc.
    event_status VARCHAR(20) NOT NULL CHECK (event_status IN ('success', 'failure', 'attempt')),
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    device_fingerprint TEXT,
    
    -- Additional data
    metadata JSONB DEFAULT '{}',
    
    -- Risk assessment
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT NOW()
);

-- User security preferences and incentives
CREATE TABLE user_security_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- 2FA preferences
    two_factor_required BOOLEAN DEFAULT false, -- Force 2FA for this user
    passkey_preferred BOOLEAN DEFAULT true, -- Prefer passkeys over other 2FA methods
    
    -- Backup and recovery
    backup_codes JSONB DEFAULT '[]', -- Encrypted backup codes
    backup_codes_used INTEGER DEFAULT 0,
    recovery_email VARCHAR(255),
    
    -- Security level and incentives
    security_level VARCHAR(20) DEFAULT 'basic' CHECK (security_level IN ('basic', 'enhanced', 'premium')),
    security_score INTEGER DEFAULT 0 CHECK (security_score >= 0 AND security_score <= 100),
    
    -- Incentive tracking
    security_bonus_earned DECIMAL(20,6) DEFAULT 0, -- Bonus earned for security features
    last_security_bonus_at TIMESTAMP,
    
    -- Rate limit bonuses (game theory incentives)
    enhanced_limits_enabled BOOLEAN DEFAULT false,
    enhanced_limits_expires_at TIMESTAMP,
    
    -- Trust score (affects transaction limits and fees)
    trust_score INTEGER DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
    trust_score_updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Security achievements table (gamification)
CREATE TABLE security_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Achievement details
    achievement_type VARCHAR(50) NOT NULL, -- 'first_passkey', 'security_champion', 'early_adopter', etc.
    achievement_name VARCHAR(255) NOT NULL,
    achievement_description TEXT,
    
    -- Rewards
    bonus_amount DECIMAL(20,6) DEFAULT 0,
    bonus_type VARCHAR(20) DEFAULT 'yield_boost', -- 'yield_boost', 'fee_reduction', 'limit_increase'
    bonus_duration_days INTEGER DEFAULT 30,
    bonus_expires_at TIMESTAMP,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    claimed BOOLEAN DEFAULT false,
    claimed_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_passkeys_user_id ON user_passkeys(user_id);
CREATE INDEX idx_user_passkeys_credential_id ON user_passkeys(credential_id);
CREATE INDEX idx_user_passkeys_active ON user_passkeys(user_id, is_active);
CREATE INDEX idx_user_passkeys_last_used ON user_passkeys(last_used_at);

CREATE INDEX idx_webauthn_challenges_user_id ON webauthn_challenges(user_id);
CREATE INDEX idx_webauthn_challenges_challenge ON webauthn_challenges(challenge);
CREATE INDEX idx_webauthn_challenges_expires ON webauthn_challenges(expires_at);
CREATE INDEX idx_webauthn_challenges_type ON webauthn_challenges(challenge_type);

CREATE INDEX idx_security_events_user_id ON security_events(user_id);
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_created_at ON security_events(created_at);
CREATE INDEX idx_security_events_risk_score ON security_events(risk_score);

CREATE INDEX idx_user_security_preferences_user_id ON user_security_preferences(user_id);
CREATE INDEX idx_user_security_preferences_security_level ON user_security_preferences(security_level);
CREATE INDEX idx_user_security_preferences_trust_score ON user_security_preferences(trust_score);

CREATE INDEX idx_security_achievements_user_id ON security_achievements(user_id);
CREATE INDEX idx_security_achievements_type ON security_achievements(achievement_type);
CREATE INDEX idx_security_achievements_active ON security_achievements(is_active);
CREATE INDEX idx_security_achievements_expires ON security_achievements(bonus_expires_at);

-- Update users table to add 2FA status tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_setup_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_method VARCHAR(20) DEFAULT 'none' 
    CHECK (two_factor_method IN ('none', 'passkey', 'totp', 'sms'));

-- Create indexes for new user fields
CREATE INDEX IF NOT EXISTS idx_users_two_factor_method ON users(two_factor_method);
CREATE INDEX IF NOT EXISTS idx_users_two_factor_enabled ON users(two_factor_enabled);

-- Function to automatically update trust score based on security features
CREATE OR REPLACE FUNCTION update_user_trust_score()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate trust score based on security features
    UPDATE user_security_preferences 
    SET 
        trust_score = LEAST(100, GREATEST(0, 
            50 + -- Base score
            (CASE WHEN NEW.two_factor_enabled THEN 20 ELSE 0 END) + -- 2FA bonus
            (SELECT COUNT(*) * 10 FROM user_passkeys WHERE user_id = NEW.id AND is_active = true) + -- Passkey bonus
            (CASE WHEN NEW.is_email_verified THEN 10 ELSE 0 END) + -- Email verification
            (CASE WHEN NEW.kyc_status = 'verified' THEN 20 ELSE 0 END) -- KYC bonus
        )),
        trust_score_updated_at = NOW()
    WHERE user_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update trust score when user security features change
CREATE TRIGGER trigger_update_trust_score
    AFTER UPDATE OF two_factor_enabled, is_email_verified, kyc_status ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_user_trust_score();

-- Function to award security achievements
CREATE OR REPLACE FUNCTION award_security_achievement(
    p_user_id UUID,
    p_achievement_type VARCHAR(50),
    p_achievement_name VARCHAR(255),
    p_achievement_description TEXT,
    p_bonus_amount DECIMAL(20,6) DEFAULT 0,
    p_bonus_type VARCHAR(20) DEFAULT 'yield_boost',
    p_bonus_duration_days INTEGER DEFAULT 30
)
RETURNS UUID AS $$
DECLARE
    achievement_id UUID;
BEGIN
    -- Check if user already has this achievement
    IF EXISTS (
        SELECT 1 FROM security_achievements 
        WHERE user_id = p_user_id AND achievement_type = p_achievement_type
    ) THEN
        RETURN NULL; -- Already has this achievement
    END IF;
    
    -- Create the achievement
    INSERT INTO security_achievements (
        user_id, achievement_type, achievement_name, achievement_description,
        bonus_amount, bonus_type, bonus_duration_days,
        bonus_expires_at
    ) VALUES (
        p_user_id, p_achievement_type, p_achievement_name, p_achievement_description,
        p_bonus_amount, p_bonus_type, p_bonus_duration_days,
        NOW() + (p_bonus_duration_days || ' days')::INTERVAL
    ) RETURNING id INTO achievement_id;
    
    RETURN achievement_id;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE user_passkeys IS 'WebAuthn passkey credentials for 2FA authentication';
COMMENT ON TABLE webauthn_challenges IS 'Temporary storage for WebAuthn challenges during registration/authentication';
COMMENT ON TABLE security_events IS 'Audit log for security-related events and risk assessment';
COMMENT ON TABLE user_security_preferences IS 'User security preferences and incentive tracking';
COMMENT ON TABLE security_achievements IS 'Gamification system for security feature adoption';

-- Initial data for security achievements
INSERT INTO security_achievements (user_id, achievement_type, achievement_name, achievement_description, bonus_amount, bonus_type, bonus_duration_days, bonus_expires_at, is_active, claimed)
SELECT 
    id as user_id,
    'early_adopter' as achievement_type,
    'Early Security Adopter' as achievement_name,
    'Congratulations! You are among the first users to enable 2FA security features.' as achievement_description,
    0.001 as bonus_amount, -- Small USDC bonus
    'yield_boost' as bonus_type,
    90 as bonus_duration_days,
    NOW() + INTERVAL '90 days' as bonus_expires_at,
    true as is_active,
    false as claimed
FROM users 
WHERE two_factor_enabled = true
ON CONFLICT DO NOTHING;
