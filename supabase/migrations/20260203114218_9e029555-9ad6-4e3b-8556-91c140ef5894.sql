-- Add 'combined' type to profile_change_requests constraint
ALTER TABLE public.profile_change_requests 
DROP CONSTRAINT IF EXISTS profile_change_requests_request_type_check;

ALTER TABLE public.profile_change_requests 
ADD CONSTRAINT profile_change_requests_request_type_check 
CHECK (request_type = ANY (ARRAY['text', 'photos', 'contact', 'categories', 'location', 'other', 'combined']));