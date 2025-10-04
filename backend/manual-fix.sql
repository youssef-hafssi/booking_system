-- Script to fix the role column and create an admin user

-- 1. Alter the role column to VARCHAR(30)
ALTER TABLE users MODIFY COLUMN role VARCHAR(30);

-- 2. Insert an admin user (or update if exists)
-- Password is 'admin123' encoded with BCrypt
INSERT INTO users (email, password, first_name, last_name, role, created_at, updated_at, enabled)
VALUES 
('admin@example.com', 
 '$2a$10$vV7I9vp0jfwIxs5JA.GBuO/nHOTbp9sNSPQ58/oWGKdPkvwqaVyEm', 
 'Admin', 
 'User', 
 'ADMIN', 
 NOW(), 
 NOW(), 
 true)
ON DUPLICATE KEY UPDATE 
 password='$2a$10$vV7I9vp0jfwIxs5JA.GBuO/nHOTbp9sNSPQ58/oWGKdPkvwqaVyEm',
 role='ADMIN',
 updated_at=NOW();

-- 3. Verify the column was changed correctly
SELECT COLUMN_NAME, COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'booking_system' 
  AND TABLE_NAME = 'users' 
  AND COLUMN_NAME = 'role';

-- 4. Verify the admin user was created
SELECT id, email, role FROM users WHERE email = 'admin@example.com'; 