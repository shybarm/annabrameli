import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invite_code } = await req.json();
    
    if (!invite_code) {
      return new Response(
        JSON.stringify({ error: 'Missing invite code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // Use service role to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Look up the invitation by code
    const { data: invitation, error } = await supabase
      .from('team_invitations')
      .select('id, email, role, permissions, expires_at, accepted_at, clinic_id')
      .eq('invite_code', invite_code)
      .maybeSingle();

    if (error) {
      console.error('Error fetching invitation:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch invitation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    if (!invitation) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Invitation not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // Check if already accepted
    if (invitation.accepted_at) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Invitation already accepted' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Invitation has expired' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // Return sanitized invitation data (no invite_code or invited_by)
    return new Response(
      JSON.stringify({
        valid: true,
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          permissions: invitation.permissions,
          expires_at: invitation.expires_at,
          clinic_id: invitation.clinic_id,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );

  } catch (error) {
    console.error('Error in verify-team-invite:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );
  }
});
