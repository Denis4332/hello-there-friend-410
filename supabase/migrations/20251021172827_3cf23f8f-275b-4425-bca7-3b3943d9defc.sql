-- Table for admin moderation history
CREATE TABLE profile_moderation_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE profile_moderation_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view moderation notes"
ON profile_moderation_notes FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create moderation notes"
ON profile_moderation_notes FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Indexes for performance
CREATE INDEX idx_moderation_notes_profile ON profile_moderation_notes(profile_id);
CREATE INDEX idx_moderation_notes_created ON profile_moderation_notes(created_at DESC);