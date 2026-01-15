-- Migration: Add goal collaborators and shareable links
-- Created: 2026-01-13

-- ===========================================
-- GOAL COLLABORATORS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS goal_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('editor', 'viewer')),
  added_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(goal_id, user_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_goal_collaborators_goal_id ON goal_collaborators(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_collaborators_user_id ON goal_collaborators(user_id);

-- ===========================================
-- GOAL SHARE LINKS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS goal_share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_by uuid REFERENCES users(id),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Index for token lookups
CREATE INDEX IF NOT EXISTS idx_goal_share_links_token ON goal_share_links(token);
CREATE INDEX IF NOT EXISTS idx_goal_share_links_goal_id ON goal_share_links(goal_id);

-- ===========================================
-- RLS POLICIES FOR GOAL COLLABORATORS
-- ===========================================

ALTER TABLE goal_collaborators ENABLE ROW LEVEL SECURITY;

-- Users can view collaborators for goals in their organization
CREATE POLICY "Users can view collaborators for their org goals"
  ON goal_collaborators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM goals g
      JOIN organization_members om ON om.organization_id = g.organization_id
      WHERE g.id = goal_collaborators.goal_id
      AND om.user_id = auth.uid()
    )
  );

-- Goal owners can insert collaborators
CREATE POLICY "Goal owners can insert collaborators"
  ON goal_collaborators FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM goals WHERE id = goal_collaborators.goal_id AND owner_id = auth.uid()
    )
  );

-- Goal owners can update collaborators
CREATE POLICY "Goal owners can update collaborators"
  ON goal_collaborators FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM goals WHERE id = goal_collaborators.goal_id AND owner_id = auth.uid()
    )
  );

-- Goal owners can delete collaborators
CREATE POLICY "Goal owners can delete collaborators"
  ON goal_collaborators FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM goals WHERE id = goal_collaborators.goal_id AND owner_id = auth.uid()
    )
  );

-- ===========================================
-- RLS POLICIES FOR GOAL SHARE LINKS
-- ===========================================

ALTER TABLE goal_share_links ENABLE ROW LEVEL SECURITY;

-- Goal owners can manage their share links
CREATE POLICY "Goal owners can insert share links"
  ON goal_share_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM goals WHERE id = goal_share_links.goal_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Goal owners can update share links"
  ON goal_share_links FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM goals WHERE id = goal_share_links.goal_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Goal owners can delete share links"
  ON goal_share_links FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM goals WHERE id = goal_share_links.goal_id AND owner_id = auth.uid()
    )
  );

-- Anyone can read active share links (needed for public access via token)
CREATE POLICY "Anyone can read active share links"
  ON goal_share_links FOR SELECT
  USING (is_active = true);

-- Goal owners can also view their own share links (even inactive ones)
CREATE POLICY "Goal owners can view their share links"
  ON goal_share_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM goals WHERE id = goal_share_links.goal_id AND owner_id = auth.uid()
    )
  );

-- ===========================================
-- UPDATE GOALS RLS TO INCLUDE COLLABORATORS
-- ===========================================

-- Drop existing select policy if it exists and recreate with collaborator support
DROP POLICY IF EXISTS "Users can view goals in their organization" ON goals;
DROP POLICY IF EXISTS "Users can view goals in their organization or as collaborator" ON goals;

CREATE POLICY "Users can view goals in their organization or as collaborator"
  ON goals FOR SELECT
  USING (
    -- User is in the same organization
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
    -- OR user is a collaborator on this goal
    OR id IN (
      SELECT goal_id FROM goal_collaborators WHERE user_id = auth.uid()
    )
  );

-- ===========================================
-- UPDATE UPDATES TABLE RLS FOR COLLABORATORS
-- ===========================================

-- Drop existing insert policy and recreate with collaborator support
DROP POLICY IF EXISTS "Goal owners can insert updates" ON updates;
DROP POLICY IF EXISTS "Goal owners and editors can insert updates" ON updates;

CREATE POLICY "Goal owners and editors can insert updates"
  ON updates FOR INSERT
  WITH CHECK (
    -- User is the goal owner
    EXISTS (
      SELECT 1 FROM goals WHERE id = updates.goal_id AND owner_id = auth.uid()
    )
    -- OR user is a collaborator with editor role
    OR EXISTS (
      SELECT 1 FROM goal_collaborators
      WHERE goal_id = updates.goal_id
      AND user_id = auth.uid()
      AND role = 'editor'
    )
  );

-- ===========================================
-- FUNCTION TO GENERATE SHARE LINK
-- ===========================================

CREATE OR REPLACE FUNCTION generate_goal_share_link(p_goal_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token text;
  v_user_id uuid;
BEGIN
  -- Get current user
  v_user_id := auth.uid();

  -- Verify user owns the goal
  IF NOT EXISTS (SELECT 1 FROM goals WHERE id = p_goal_id AND owner_id = v_user_id) THEN
    RAISE EXCEPTION 'Only goal owners can generate share links';
  END IF;

  -- Deactivate any existing active links for this goal
  UPDATE goal_share_links
  SET is_active = false
  WHERE goal_id = p_goal_id AND is_active = true;

  -- Generate new token
  v_token := encode(gen_random_bytes(16), 'hex');

  -- Insert new share link
  INSERT INTO goal_share_links (goal_id, token, created_by, is_active)
  VALUES (p_goal_id, v_token, v_user_id, true);

  RETURN v_token;
END;
$$;
