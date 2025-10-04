#!/bin/bash

# Fix the role column in the database
echo "Updating role column in users table..."
mysql -u root booking_system < update-role-column.sql

echo "Creating an admin user directly in the database..."
mysql -u root booking_system << EOF
-- Insert an admin user with bcrypt-encoded password 'admin123'
INSERT INTO users (email, password, first_name, last_name, role, created_at, updated_at, enabled)
VALUES 
('admin@example.com', 
 '\$2a\$10\$vV7I9vp0jfwIxs5JA.GBuO/nHOTbp9sNSPQ58/oWGKdPkvwqaVyEm', 
 'Admin', 
 'User', 
 'ADMIN', 
 NOW(), 
 NOW(), 
 true)
ON DUPLICATE KEY UPDATE 
 password='\$2a\$10\$vV7I9vp0jfwIxs5JA.GBuO/nHOTbp9sNSPQ58/oWGKdPkvwqaVyEm',
 role='ADMIN',
 updated_at=NOW();
EOF

echo "Done! You can now login with email 'admin@example.com' and password 'admin123'." 