-- Drop the existing constraint that doesn't include 'free'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_payment_status_check;

-- Add the constraint with 'free' included
ALTER TABLE profiles ADD CONSTRAINT profiles_payment_status_check 
CHECK (payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'cancelled'::text, 'free'::text]));