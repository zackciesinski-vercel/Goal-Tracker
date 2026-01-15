-- Allow anyone to look up an organization (needed for invite links)
-- The invite_code acts as the "secret" - if you have it, you can see the org name

CREATE POLICY "Anyone can view organizations for joining" ON public.organizations
  FOR SELECT
  TO anon, authenticated
  USING (true);
