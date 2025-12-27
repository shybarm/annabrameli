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
      .from('patient_invitations')
      .select('id, email, first_name, last_name, phone, patient_id, expires_at, accepted_at')
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
        JSON.stringify({ 
          valid: false, 
          accepted: true,
          error: 'Invitation already accepted' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ valid: false, expired: true, error: 'Invitation has expired' }),
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
          first_name: invitation.first_name,
          last_name: invitation.last_name,
          phone: invitation.phone,
          patient_id: invitation.patient_id,
          expires_at: invitation.expires_at,
          accepted_at: invitation.accepted_at,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );

  } catch (error) {
    console.error('Error in verify-patient-invite:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );
  }
});
