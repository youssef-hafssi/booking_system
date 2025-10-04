-- Copy values from is_active to active column
UPDATE maintenances SET active = is_active;

-- Drop the old is_active column
ALTER TABLE maintenances DROP COLUMN is_active;

-- Ensure active column has correct default
ALTER TABLE maintenances MODIFY COLUMN active BOOLEAN NOT NULL DEFAULT TRUE; 