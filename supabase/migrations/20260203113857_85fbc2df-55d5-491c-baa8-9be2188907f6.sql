-- Erweitere den CHECK-Constraint um 'location' 
ALTER TABLE public.profile_change_requests 
DROP CONSTRAINT profile_change_requests_request_type_check;

ALTER TABLE public.profile_change_requests 
ADD CONSTRAINT profile_change_requests_request_type_check 
CHECK (request_type = ANY (ARRAY['text'::text, 'photos'::text, 'contact'::text, 'categories'::text, 'location'::text, 'other'::text]));