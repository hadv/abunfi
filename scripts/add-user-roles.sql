-- Add role-based access control to users table
-- This migration adds role support for strategy managers and admins

-- Add role column to users table
ALTER TABLE users 
ADD COLUMN role VARCHAR(20) DEFAULT 'user' 
CHECK (role IN ('user', 'strategy_manager', 'admin'));

-- Create index for role-based queries
CREATE INDEX idx_users_role ON users(role);

-- Update existing users to have 'user' role (already default)
-- Admin users can be manually updated later

-- Add role to the allowed fields for updates in UserRepository
-- (This will need to be updated in the application code)

-- Create a sample admin user for testing (optional)
-- Uncomment and modify as needed:
-- INSERT INTO users (
--   email, 
--   wallet_address, 
--   name, 
--   role,
--   kyc_status, 
--   is_email_verified,
--   is_active
-- ) VALUES (
--   'admin@abunfi.com',
--   '0x0000000000000000000000000000000000000001',
--   'Strategy Manager',
--   'strategy_manager',
--   'verified',
--   true,
--   true
-- ) ON CONFLICT (email) DO NOTHING;

-- Create another admin user
-- INSERT INTO users (
--   email, 
--   wallet_address, 
--   name, 
--   role,
--   kyc_status, 
--   is_email_verified,
--   is_active
-- ) VALUES (
--   'superadmin@abunfi.com',
--   '0x0000000000000000000000000000000000000002',
--   'Super Admin',
--   'admin',
--   'verified',
--   true,
--   true
-- ) ON CONFLICT (email) DO NOTHING;

COMMENT ON COLUMN users.role IS 'User role for access control: user, strategy_manager, admin';
