-- Add is_adult column to profiles table for legal age confirmation
ALTER TABLE profiles ADD COLUMN is_adult BOOLEAN DEFAULT false NOT NULL;