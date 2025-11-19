-- ============================================
-- PHASE 3: Availability Status System
-- ============================================

-- Add availability status and last seen columns to profiles
ALTER TABLE profiles 
ADD COLUMN availability_status text DEFAULT 'offline' CHECK (availability_status IN ('online', 'offline', 'busy')),
ADD COLUMN last_seen_at timestamptz DEFAULT now();

-- Create indexes for performance
CREATE INDEX idx_profiles_availability_status ON profiles(availability_status);
CREATE INDEX idx_profiles_last_seen_at ON profiles(last_seen_at);

-- ============================================
-- PHASE 4: Favorites System
-- ============================================

-- Create user_favorites table
CREATE TABLE user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, profile_id)
);

-- Create indexes for performance
CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_profile_id ON user_favorites(profile_id);

-- Enable RLS
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_favorites
CREATE POLICY "Users can view own favorites"
  ON user_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON user_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON user_favorites FOR DELETE
  USING (auth.uid() = user_id);