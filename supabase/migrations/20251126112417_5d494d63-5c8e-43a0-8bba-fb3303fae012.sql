-- Fix: Change default listing_type from 'free' to 'basic' to match CHECK constraint
ALTER TABLE profiles ALTER COLUMN listing_type SET DEFAULT 'basic';