-- Sample data for workstation booking system
-- This script creates test centers, rooms, workstations, and users

-- Clear existing data (optional - comment out if you want to keep existing data)
-- DELETE FROM reservations;
-- DELETE FROM work_stations;
-- DELETE FROM rooms;
-- DELETE FROM centers;
-- DELETE FROM users WHERE email != 'admin@example.com';

-- Insert sample centers
INSERT INTO centers (name, address, city, postal_code, phone_number, email, created_at, updated_at) VALUES
('Coding Center Paris', '123 Rue de la Tech', 'Paris', '75001', '+33 1 23 45 67 89', 'paris@codingcenter.com', NOW(), NOW()),
('Coding Center Lyon', '456 Avenue du Code', 'Lyon', '69001', '+33 4 56 78 90 12', 'lyon@codingcenter.com', NOW(), NOW()),
('Coding Center Marseille', '789 Boulevard des Développeurs', 'Marseille', '13001', '+33 4 91 23 45 67', 'marseille@codingcenter.com', NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Insert sample rooms for each center
INSERT INTO rooms (name, floor, capacity, center_id, created_at, updated_at) VALUES
-- Paris center rooms
('Room A - Development', 1, 20, 1, NOW(), NOW()),
('Room B - Design', 1, 15, 1, NOW(), NOW()),
('Room C - Meeting', 2, 10, 1, NOW(), NOW()),
-- Lyon center rooms
('Room 1 - Coding', 1, 25, 2, NOW(), NOW()),
('Room 2 - Collaboration', 2, 12, 2, NOW(), NOW()),
-- Marseille center rooms
('Room Alpha - Programming', 1, 18, 3, NOW(), NOW()),
('Room Beta - Innovation', 2, 8, 3, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Insert sample workstations
INSERT INTO work_stations (name, description, specifications, status, room_id, position, created_at, updated_at) VALUES
-- Paris Room A workstations
('WS-PA-01', 'High-end development workstation', '{"cpu": "Intel i7", "ram": "16GB", "gpu": "RTX 3060"}', 'AVAILABLE', 1, 'A1', NOW(), NOW()),
('WS-PA-02', 'Development workstation', '{"cpu": "Intel i5", "ram": "8GB", "gpu": "GTX 1660"}', 'AVAILABLE', 1, 'A2', NOW(), NOW()),
('WS-PA-03', 'Development workstation', '{"cpu": "Intel i7", "ram": "16GB", "gpu": "RTX 3070"}', 'AVAILABLE', 1, 'A3', NOW(), NOW()),
('WS-PA-04', 'Development workstation', '{"cpu": "Intel i5", "ram": "8GB", "gpu": "GTX 1650"}', 'AVAILABLE', 1, 'A4', NOW(), NOW()),
('WS-PA-05', 'Development workstation', '{"cpu": "Intel i7", "ram": "16GB", "gpu": "RTX 3080"}', 'AVAILABLE', 1, 'A5', NOW(), NOW()),

-- Paris Room B workstations
('WS-PB-01', 'Design workstation', '{"cpu": "Intel i7", "ram": "32GB", "gpu": "RTX 4070"}', 'AVAILABLE', 2, 'B1', NOW(), NOW()),
('WS-PB-02', 'Design workstation', '{"cpu": "Intel i9", "ram": "64GB", "gpu": "RTX 4080"}', 'AVAILABLE', 2, 'B2', NOW(), NOW()),
('WS-PB-03', 'Design workstation', '{"cpu": "Intel i7", "ram": "32GB", "gpu": "RTX 4070"}', 'AVAILABLE', 2, 'B3', NOW(), NOW()),

-- Lyon Room 1 workstations
('WS-L1-01', 'Coding workstation', '{"cpu": "AMD Ryzen 7", "ram": "16GB", "gpu": "RTX 3060"}', 'AVAILABLE', 4, 'L1-1', NOW(), NOW()),
('WS-L1-02', 'Coding workstation', '{"cpu": "AMD Ryzen 5", "ram": "8GB", "gpu": "GTX 1660"}', 'AVAILABLE', 4, 'L1-2', NOW(), NOW()),
('WS-L1-03', 'Coding workstation', '{"cpu": "AMD Ryzen 7", "ram": "16GB", "gpu": "RTX 3070"}', 'AVAILABLE', 4, 'L1-3', NOW(), NOW()),
('WS-L1-04', 'Coding workstation', '{"cpu": "AMD Ryzen 9", "ram": "32GB", "gpu": "RTX 4080"}', 'AVAILABLE', 4, 'L1-4', NOW(), NOW()),

-- Marseille Room Alpha workstations
('WS-MA-01', 'Programming workstation', '{"cpu": "Intel i7", "ram": "16GB", "gpu": "RTX 3060"}', 'AVAILABLE', 6, 'MA-1', NOW(), NOW()),
('WS-MA-02', 'Programming workstation', '{"cpu": "Intel i5", "ram": "8GB", "gpu": "GTX 1650"}', 'AVAILABLE', 6, 'MA-2', NOW(), NOW()),
('WS-MA-03', 'Programming workstation', '{"cpu": "Intel i7", "ram": "16GB", "gpu": "RTX 3070"}', 'AVAILABLE', 6, 'MA-3', NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Insert sample users (if they don't exist)
INSERT INTO users (email, password, first_name, last_name, role, phone_number, center_id, created_at, updated_at, enabled, user_status, strike_count, total_no_shows) VALUES
-- Admin user (already exists from manual-fix.sql)
('admin@example.com', '$2a$10$vV7I9vp0jfwIxs5JA.GBuO/nHOTbp9sNSPQ58/oWGKdPkvwqaVyEm', 'Admin', 'User', 'ADMIN', '+33 1 00 00 00 00', NULL, NOW(), NOW(), true, 'GOOD', 0, 0),

-- Center managers
('manager.paris@codingcenter.com', '$2a$10$vV7I9vp0jfwIxs5JA.GBuO/nHOTbp9sNSPQ58/oWGKdPkvwqaVyEm', 'Jean', 'Dupont', 'CENTER_MANAGER', '+33 1 23 45 67 89', 1, NOW(), NOW(), true, 'GOOD', 0, 0),
('manager.lyon@codingcenter.com', '$2a$10$vV7I9vp0jfwIxs5JA.GBuO/nHOTbp9sNSPQ58/oWGKdPkvwqaVyEm', 'Marie', 'Martin', 'CENTER_MANAGER', '+33 4 56 78 90 12', 2, NOW(), NOW(), true, 'GOOD', 0, 0),
('manager.marseille@codingcenter.com', '$2a$10$vV7I9vp0jfwIxs5JA.GBuO/nHOTbp9sNSPQ58/oWGKdPkvwqaVyEm', 'Pierre', 'Bernard', 'CENTER_MANAGER', '+33 4 91 23 45 67', 3, NOW(), NOW(), true, 'GOOD', 0, 0),

-- Students
('student1@example.com', '$2a$10$vV7I9vp0jfwIxs5JA.GBuO/nHOTbp9sNSPQ58/oWGKdPkvwqaVyEm', 'Alice', 'Johnson', 'STUDENT', '+33 6 12 34 56 78', 1, NOW(), NOW(), true, 'GOOD', 0, 0),
('student2@example.com', '$2a$10$vV7I9vp0jfwIxs5JA.GBuO/nHOTbp9sNSPQ58/oWGKdPkvwqaVyEm', 'Bob', 'Smith', 'STUDENT', '+33 6 23 45 67 89', 1, NOW(), NOW(), true, 'GOOD', 0, 0),
('student3@example.com', '$2a$10$vV7I9vp0jfwIxs5JA.GBuO/nHOTbp9sNSPQ58/oWGKdPkvwqaVyEm', 'Charlie', 'Brown', 'STUDENT', '+33 6 34 56 78 90', 2, NOW(), NOW(), true, 'GOOD', 0, 0),
('student4@example.com', '$2a$10$vV7I9vp0jfwIxs5JA.GBuO/nHOTbp9sNSPQ58/oWGKdPkvwqaVyEm', 'Diana', 'Wilson', 'STUDENT', '+33 6 45 67 89 01', 2, NOW(), NOW(), true, 'GOOD', 0, 0),
('student5@example.com', '$2a$10$vV7I9vp0jfwIxs5JA.GBuO/nHOTbp9sNSPQ58/oWGKdPkvwqaVyEm', 'Eve', 'Davis', 'STUDENT', '+33 6 56 78 90 12', 3, NOW(), NOW(), true, 'GOOD', 0, 0)
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Insert some sample reservations (optional - for testing)
INSERT INTO reservations (user_id, work_station_id, start_time, end_time, status, notes, created_at, updated_at) VALUES
-- Past reservation (completed)
(6, 1, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 9 HOUR, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 11 HOUR, 'COMPLETED', 'Development session', NOW(), NOW()),

-- Current reservation (active)
(7, 2, DATE_ADD(CURDATE(), INTERVAL 10 HOUR), DATE_ADD(CURDATE(), INTERVAL 12 HOUR), 'CONFIRMED', 'Coding practice', NOW(), NOW()),

-- Future reservation (upcoming)
(8, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 14 HOUR, DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 16 HOUR, 'CONFIRMED', 'Project work', NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Display summary
SELECT 'Sample data inserted successfully!' as message;
SELECT COUNT(*) as centers_count FROM centers;
SELECT COUNT(*) as rooms_count FROM rooms;
SELECT COUNT(*) as workstations_count FROM work_stations;
SELECT COUNT(*) as users_count FROM users;
SELECT COUNT(*) as reservations_count FROM reservations; 