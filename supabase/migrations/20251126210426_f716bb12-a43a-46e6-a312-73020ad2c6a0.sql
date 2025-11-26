-- Add contact and duration fields to advertisements table
ALTER TABLE advertisements 
ADD COLUMN IF NOT EXISTS contact_email text,
ADD COLUMN IF NOT EXISTS contact_phone text,
ADD COLUMN IF NOT EXISTS requested_duration text;

COMMENT ON COLUMN advertisements.contact_email IS 'Customer email for banner inquiry';
COMMENT ON COLUMN advertisements.contact_phone IS 'Customer phone for banner inquiry';
COMMENT ON COLUMN advertisements.requested_duration IS 'Requested duration: day, week, or month';