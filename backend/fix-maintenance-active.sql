-- Rename is_active column to active in maintenances table
ALTER TABLE maintenances CHANGE COLUMN is_active active BOOLEAN NOT NULL DEFAULT TRUE; 