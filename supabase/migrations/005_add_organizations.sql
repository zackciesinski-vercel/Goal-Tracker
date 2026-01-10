-- =============================================
-- Multi-Organization Support Migration
-- =============================================

-- 1. Create organizations table
CREATE TABLE public.organizations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  invite_code text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create organization_members table
CREATE TABLE public.organization_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (organization_id, user_id)
);

-- 3. Create invitations table
CREATE TABLE public.invitations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  invited_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at timestamp with time zone DEFAULT (timezone('utc'::text, now()) + interval '7 days') NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast invite lookups
CREATE INDEX invitations_token_idx ON public.invitations(token);
CREATE INDEX invitations_email_idx ON public.invitations(email);
CREATE INDEX organization_members_user_idx ON public.organization_members(user_id);

-- 4. Add organization_id to goals
ALTER TABLE public.goals ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 5. Add organization_id to org_settings
ALTER TABLE public.org_settings ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE;

-- =============================================
-- Migrate Existing Data
-- =============================================

-- Create a default organization for existing users
INSERT INTO public.organizations (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'My Organization', 'default-org');

-- Add all existing users to the default org
-- First user becomes owner, others become members
INSERT INTO public.organization_members (organization_id, user_id, role)
SELECT
  '00000000-0000-0000-0000-000000000001',
  id,
  CASE WHEN role = 'admin' THEN 'owner' ELSE 'member' END
FROM public.users;

-- Update all existing goals to belong to default org
UPDATE public.goals SET organization_id = '00000000-0000-0000-0000-000000000001';

-- Update existing org_settings to belong to default org
UPDATE public.org_settings SET organization_id = '00000000-0000-0000-0000-000000000001';

-- Make organization_id NOT NULL now that data is migrated
ALTER TABLE public.goals ALTER COLUMN organization_id SET NOT NULL;

-- =============================================
-- RLS Policies for Organizations
-- =============================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Organizations: users can see orgs they're members of
CREATE POLICY "Users can view their organizations" ON public.organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = organizations.id
        AND organization_members.user_id = auth.uid()
    )
  );

-- Organizations: owners/admins can update
CREATE POLICY "Admins can update their organization" ON public.organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = organizations.id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role IN ('owner', 'admin')
    )
  );

-- Organizations: anyone can create (for new orgs)
CREATE POLICY "Authenticated users can create organizations" ON public.organizations
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Organization Members: users can see members of their orgs
CREATE POLICY "Users can view members of their organizations" ON public.organization_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
    )
  );

-- Organization Members: owners/admins can add members
CREATE POLICY "Admins can add members" ON public.organization_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
    OR
    -- Allow users to add themselves when joining via invite
    organization_members.user_id = auth.uid()
  );

-- Organization Members: owners can update roles
CREATE POLICY "Owners can update member roles" ON public.organization_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'owner'
    )
  );

-- Organization Members: owners can remove members (except themselves)
CREATE POLICY "Owners can remove members" ON public.organization_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'owner'
    )
    AND organization_members.user_id != auth.uid()
  );

-- Invitations: members can see invitations for their org
CREATE POLICY "Members can view org invitations" ON public.invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = invitations.organization_id
        AND organization_members.user_id = auth.uid()
    )
  );

-- Invitations: admins can create invitations
CREATE POLICY "Admins can create invitations" ON public.invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = invitations.organization_id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role IN ('owner', 'admin')
    )
  );

-- Invitations: admins can update (cancel) invitations
CREATE POLICY "Admins can update invitations" ON public.invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = invitations.organization_id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role IN ('owner', 'admin')
    )
  );

-- Invitations: anyone can read by token (for accepting)
CREATE POLICY "Anyone can read invitation by token" ON public.invitations
  FOR SELECT TO authenticated
  USING (true);

-- =============================================
-- Update Existing RLS Policies
-- =============================================

-- Drop old goals policies and recreate with org scope
DROP POLICY IF EXISTS "Users can view all goals" ON public.goals;
DROP POLICY IF EXISTS "Users can create own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can update own unlocked goals" ON public.goals;
DROP POLICY IF EXISTS "Admins can update any goal" ON public.goals;

-- Goals: users can see goals in their org
CREATE POLICY "Users can view org goals" ON public.goals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = goals.organization_id
        AND organization_members.user_id = auth.uid()
    )
  );

-- Goals: users can create goals in their org
CREATE POLICY "Users can create org goals" ON public.goals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = goals.organization_id
        AND organization_members.user_id = auth.uid()
    )
    AND owner_id = auth.uid()
  );

-- Goals: users can update their own unlocked goals
CREATE POLICY "Users can update own unlocked goals" ON public.goals
  FOR UPDATE USING (
    owner_id = auth.uid() AND is_locked = false
  );

-- Goals: org admins can update any goal in their org
CREATE POLICY "Org admins can update goals" ON public.goals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = goals.organization_id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role IN ('owner', 'admin')
    )
  );

-- Drop old org_settings policies and recreate with org scope
DROP POLICY IF EXISTS "Authenticated users can view org settings" ON public.org_settings;
DROP POLICY IF EXISTS "Admins can update org settings" ON public.org_settings;
DROP POLICY IF EXISTS "Admins can insert org settings" ON public.org_settings;

-- Org Settings: users can see settings for their org
CREATE POLICY "Users can view their org settings" ON public.org_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = org_settings.organization_id
        AND organization_members.user_id = auth.uid()
    )
  );

-- Org Settings: admins can update their org settings
CREATE POLICY "Admins can update org settings" ON public.org_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = org_settings.organization_id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role IN ('owner', 'admin')
    )
  );

-- Org Settings: admins can insert org settings
CREATE POLICY "Admins can insert org settings" ON public.org_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = org_settings.organization_id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role IN ('owner', 'admin')
    )
  );

-- =============================================
-- Helper Functions
-- =============================================

-- Function to get user's current organization
CREATE OR REPLACE FUNCTION public.get_user_organization(user_uuid uuid)
RETURNS uuid AS $$
  SELECT organization_id
  FROM public.organization_members
  WHERE user_id = user_uuid
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to check if user is org admin
CREATE OR REPLACE FUNCTION public.is_org_admin(user_uuid uuid, org_uuid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = user_uuid
      AND organization_id = org_uuid
      AND role IN ('owner', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to accept an invitation
CREATE OR REPLACE FUNCTION public.accept_invitation(invite_token text)
RETURNS uuid AS $$
DECLARE
  invite_record public.invitations;
  new_member_id uuid;
BEGIN
  -- Get the invitation
  SELECT * INTO invite_record
  FROM public.invitations
  WHERE token = invite_token
    AND status = 'pending'
    AND expires_at > now();

  IF invite_record IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;

  -- Add user to organization
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (invite_record.organization_id, auth.uid(), invite_record.role)
  ON CONFLICT (organization_id, user_id) DO NOTHING
  RETURNING id INTO new_member_id;

  -- Mark invitation as accepted
  UPDATE public.invitations
  SET status = 'accepted'
  WHERE id = invite_record.id;

  RETURN invite_record.organization_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to join via invite code
CREATE OR REPLACE FUNCTION public.join_organization(org_invite_code text)
RETURNS uuid AS $$
DECLARE
  org_record public.organizations;
BEGIN
  -- Get the organization
  SELECT * INTO org_record
  FROM public.organizations
  WHERE invite_code = org_invite_code;

  IF org_record IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  -- Add user to organization as member
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (org_record.id, auth.uid(), 'member')
  ON CONFLICT (organization_id, user_id) DO NOTHING;

  RETURN org_record.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
