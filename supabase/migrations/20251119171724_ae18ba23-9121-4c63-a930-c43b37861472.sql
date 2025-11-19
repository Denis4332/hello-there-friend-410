-- Add payment tracking fields to advertisements
ALTER TABLE advertisements 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' 
  CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'twint', 'saferpay', 'manual'));

-- Add payment tracking fields to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending'
  CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'twint', 'saferpay', 'manual'));

-- Create index for faster payment status queries
CREATE INDEX IF NOT EXISTS idx_ads_payment_status ON advertisements(payment_status) WHERE payment_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_profiles_payment_status ON profiles(payment_status) WHERE payment_status = 'pending';

COMMENT ON COLUMN advertisements.payment_status IS 'Payment status: pending (awaiting payment), paid (payment confirmed), cancelled';
COMMENT ON COLUMN advertisements.payment_reference IS 'Payment reference number for tracking';
COMMENT ON COLUMN advertisements.payment_method IS 'Payment method used: bank_transfer, twint, saferpay, manual';