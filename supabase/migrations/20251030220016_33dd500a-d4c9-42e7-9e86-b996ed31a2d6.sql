-- Make age column nullable to support new profiles without age
ALTER TABLE public.profiles ALTER COLUMN age DROP NOT NULL;