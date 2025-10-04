@echo off
echo Fixing the role column in the database...

REM First, execute the SQL file to update the column length
echo Updating role column in users table...
mysql -u root booking_system < update-role-column.sql

REM Create a temporary SQL file for creating admin user
echo Creating temporary SQL file...
(
echo -- Insert an admin user with bcrypt-encoded password 'admin123'
echo INSERT INTO users ^(email, password, first_name, last_name, role, created_at, updated_at, enabled^)
echo VALUES
echo ^('admin@example.com',
echo  '$2a$10$vV7I9vp0jfwIxs5JA.GBuO/nHOTbp9sNSPQ58/oWGKdPkvwqaVyEm',
echo  'Admin',
echo  'User',
echo  'ADMIN',
echo  NOW^(^),
echo  NOW^(^),
echo  true^)
echo ON DUPLICATE KEY UPDATE
echo  password='$2a$10$vV7I9vp0jfwIxs5JA.GBuO/nHOTbp9sNSPQ58/oWGKdPkvwqaVyEm',
echo  role='ADMIN',
echo  updated_at=NOW^(^);
) > create-admin.sql

REM Execute the temporary SQL file
echo Creating admin user...
mysql -u root booking_system < create-admin.sql

REM Clean up
del create-admin.sql

echo Done! You can now login with email 'admin@example.com' and password 'admin123'.
pause 