-- Add type column to work_stations table for AI recommendations
ALTER TABLE work_stations 
ADD COLUMN type VARCHAR(20) DEFAULT 'DESKTOP' AFTER description;

-- Update existing workstations to have a default type
UPDATE work_stations 
SET type = 'DESKTOP' 
WHERE type IS NULL;

-- Add constraint to ensure type is one of the valid values
ALTER TABLE work_stations 
ADD CONSTRAINT check_workstation_type 
CHECK (type IN ('DESKTOP', 'LAPTOP', 'SPECIALIZED')); 