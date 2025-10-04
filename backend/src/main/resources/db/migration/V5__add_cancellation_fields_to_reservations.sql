-- Add cancellation fields to reservations table
ALTER TABLE reservations 
ADD COLUMN cancellation_reason TEXT,
ADD COLUMN cancelled_by_user_id BIGINT,
ADD COLUMN cancelled_at TIMESTAMP NULL,
ADD CONSTRAINT fk_reservations_cancelled_by_user 
    FOREIGN KEY (cancelled_by_user_id) REFERENCES users(id);

-- Add index for better performance on cancelled_by_user_id lookups
CREATE INDEX idx_reservations_cancelled_by_user_id ON reservations(cancelled_by_user_id); 