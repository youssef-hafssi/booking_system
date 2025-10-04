-- Test script to add some sample reservations including cancelled ones
-- This will help us verify that cancelled reservations are now showing

-- First, let's make sure we have some basic data
-- Insert some test reservations with different statuses

INSERT INTO reservations (user_id, work_station_id, start_time, end_time, status, notes, created_at, updated_at) VALUES
-- Some confirmed reservations
(1, 1, '2024-09-15 09:00:00', '2024-09-15 11:00:00', 'CONFIRMED', 'Morning coding session', NOW(), NOW()),
(1, 2, '2024-09-16 14:00:00', '2024-09-16 16:00:00', 'CONFIRMED', 'Afternoon development', NOW(), NOW()),

-- Some cancelled reservations (THIS IS WHAT WE WANT TO TEST)
(1, 3, '2024-09-14 10:00:00', '2024-09-14 12:00:00', 'CANCELLED', 'Had to cancel due to meeting', NOW(), NOW()),
(1, 4, '2024-09-13 15:00:00', '2024-09-13 17:00:00', 'CANCELLED', 'Project postponed', NOW(), NOW()),

-- Some pending reservations
(1, 5, '2024-09-17 09:00:00', '2024-09-17 11:00:00', 'PENDING', 'Waiting for approval', NOW(), NOW()),

-- Some completed reservations  
(1, 6, '2024-09-12 09:00:00', '2024-09-12 11:00:00', 'COMPLETED', 'Successfully completed session', NOW(), NOW())

ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Check what we have
SELECT 'Test reservations created!' as message;
SELECT status, COUNT(*) as count FROM reservations GROUP BY status;
SELECT * FROM reservations ORDER BY created_at DESC LIMIT 10;