-- CRITICAL SECURITY FIX: Remove public access to profile_contacts
-- This policy allowed ANYONE to read all contact data (emails, phones, addresses)
-- which is a severe privacy and GDPR violation

DROP POLICY IF EXISTS "Public can view contact data of active profiles" ON profile_contacts;

-- After this fix, only these access patterns remain:
-- 1. Profile owners can view/update/delete their own contact data
-- 2. Admins can view/update all contact data
-- 3. Public users CANNOT see any contact data anymore