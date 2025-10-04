-- Update the status column in the work_stations table to support the UNAVAILABLE value
ALTER TABLE work_stations 
MODIFY COLUMN status ENUM('AVAILABLE', 'MAINTENANCE', 'RESERVED', 'UNAVAILABLE') NOT NULL DEFAULT 'AVAILABLE'; 