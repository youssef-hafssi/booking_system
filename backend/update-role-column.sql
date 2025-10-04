-- Script to update the role column in the users table to support longer role names

-- Alter the role column to VARCHAR(30)
ALTER TABLE users MODIFY COLUMN role VARCHAR(30);
 
-- Verify the changes (run separately)
-- SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_SCHEMA = 'booking_system' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'; 