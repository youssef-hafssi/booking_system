-- Migration to add penalty system columns to users table
-- This adds strike tracking, user status, and no-show counting

ALTER TABLE users 
ADD COLUMN user_status VARCHAR(20) DEFAULT 'GOOD',
ADD COLUMN strike_count INT DEFAULT 0,
ADD COLUMN total_no_shows INT DEFAULT 0,
ADD COLUMN last_strike_date DATETIME NULL;

-- Update existing users to have default values
UPDATE users 
SET 
    user_status = 'GOOD',
    strike_count = 0,
    total_no_shows = 0,
    last_strike_date = NULL
WHERE 
    user_status IS NULL 
    OR strike_count IS NULL 
    OR total_no_shows IS NULL;

-- Add index for performance on user_status queries
CREATE INDEX idx_users_status ON users(user_status);
CREATE INDEX idx_users_strikes ON users(strike_count);

-- Add check constraint to ensure valid user status values
ALTER TABLE users 
ADD CONSTRAINT chk_user_status 
CHECK (user_status IN ('GOOD', 'WARNING', 'BAD'));

-- Add check constraint to ensure non-negative values
ALTER TABLE users 
ADD CONSTRAINT chk_strike_count_positive 
CHECK (strike_count >= 0);

ALTER TABLE users 
ADD CONSTRAINT chk_total_no_shows_positive 
CHECK (total_no_shows >= 0); 