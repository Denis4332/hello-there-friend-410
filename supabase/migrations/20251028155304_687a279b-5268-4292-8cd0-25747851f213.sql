-- Fix Admin Login: RLS Policy Anpassung für user_roles
-- Problem: Users konnten ihre eigene Rolle nicht lesen, was zu Login-Problemen führte

-- Alte Policy entfernen
DROP POLICY IF EXISTS "Admins can view roles" ON user_roles;

-- Neue Policy: Jeder authentifizierte User kann seine eigene Rolle lesen
CREATE POLICY "Users can view own role"
ON user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins können zusätzlich alle Rollen sehen (für User-Management)
CREATE POLICY "Admins can view all roles"
ON user_roles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));