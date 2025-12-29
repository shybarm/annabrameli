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
    let invite_code: string | undefined;
    
    try {
      const body = await req.json();
      invite_code = body?.invite_code;
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ ok: false, code: 'BAD_REQUEST', error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }
    
    if (!invite_code || typeof invite_code !== 'string' || invite_code.trim() === '') {
      console.log('Missing or invalid invite_code:', invite_code);
      return new Response(
        JSON.stringify({ ok: false, code: 'BAD_REQUEST', error: 'Missing or invalid invite code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    console.log('Verifying invite code:', invite_code.substring(0, 8) + '...');

    // Use service role to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Look up the invitation by code
    const { data: invitation, error } = await supabase
      .from('patient_invitations')
      .select('id, email, first_name, last_name, phone, patient_id, expires_at, accepted_at')
      .eq('invite_code', invite_code.trim())
      .maybeSingle();

    if (error) {
      console.error('Error fetching invitation:', error);
      return new Response(
        JSON.stringify({ ok: false, code: 'SERVER_ERROR', error: 'Failed to fetch invitation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    if (!invitation) {
      console.log('Invitation not found for code:', invite_code.substring(0, 8) + '...');
      return new Response(
        JSON.stringify({ ok: false, valid: false, code: 'INVITE_NOT_FOUND', error: 'Invitation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // Check if already accepted
    if (invitation.accepted_at) {
      console.log('Invitation already accepted:', invitation.id);
      return new Response(
        JSON.stringify({ 
          ok: false,
          valid: false, 
          accepted: true,
          code: 'INVITE_ALREADY_USED',
          error: 'Invitation already accepted' 
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      console.log('Invitation expired:', invitation.id);
      return new Response(
        JSON.stringify({ ok: false, valid: false, expired: true, code: 'INVITE_EXPIRED', error: 'Invitation has expired' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    console.log('Invitation valid:', invitation.id);

    // Return sanitized invitation data (no invite_code or invited_by)
    return new Response(
      JSON.stringify({
        ok: true,
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
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );

  } catch (error) {
    console.error('Error in verify-patient-invite:', error);
    return new Response(
      JSON.stringify({ ok: false, code: 'SERVER_ERROR', error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );
  }
});
