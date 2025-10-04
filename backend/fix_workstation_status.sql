-- Convert the status column to VARCHAR to allow all possible enum values
ALTER TABLE work_stations 
MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE';

-- Update any existing records that might have truncated values
UPDATE work_stations SET status = 'AVAILABLE' WHERE status = 'AVAI';
UPDATE work_stations SET status = 'MAINTENANCE' WHERE status = 'MAIN';
UPDATE work_stations SET status = 'RESERVED' WHERE status = 'RESE'; 