-- Add contact fields to profiles table
ALTER TABLE profiles 
ADD COLUMN phone TEXT,
ADD COLUMN whatsapp TEXT,
ADD COLUMN email TEXT,
ADD COLUMN website TEXT,
ADD COLUMN telegram TEXT,
ADD COLUMN instagram TEXT;

COMMENT ON COLUMN profiles.phone IS 'Phone number for direct calls';
COMMENT ON COLUMN profiles.whatsapp IS 'WhatsApp number (can differ from phone)';
COMMENT ON COLUMN profiles.email IS 'Contact email address';
COMMENT ON COLUMN profiles.website IS 'Personal website URL';
COMMENT ON COLUMN profiles.telegram IS 'Telegram username/handle';
COMMENT ON COLUMN profiles.instagram IS 'Instagram username/handle';