-- Remove old constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_payment_method_check;

-- Add new constraint with 'payport' included
ALTER TABLE profiles ADD CONSTRAINT profiles_payment_method_check 
  CHECK (payment_method = ANY (ARRAY['bank_transfer', 'twint', 'saferpay', 'manual', 'payport']));