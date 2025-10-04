-- Fix NULL type values in work_stations table
UPDATE work_stations 
SET type = 'DESKTOP' 
WHERE type IS NULL;

-- Verify the update
SELECT id, name, type, status FROM work_stations; 