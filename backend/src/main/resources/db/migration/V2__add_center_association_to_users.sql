-- Add center_id column to users table
ALTER TABLE users ADD COLUMN center_id BIGINT;

-- Add foreign key constraint
ALTER TABLE users ADD CONSTRAINT fk_user_center FOREIGN KEY (center_id) REFERENCES centers(id);

-- Update existing MANAGER role to CENTER_MANAGER
UPDATE users SET role = 'CENTER_MANAGER' WHERE role = 'MANAGER';