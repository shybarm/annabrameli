-- Allow anyone to view team invitations by invite_code (for the join page)
CREATE POLICY "Anyone can view invitations by code"
ON public.team_invitations
FOR SELECT
USING (true);