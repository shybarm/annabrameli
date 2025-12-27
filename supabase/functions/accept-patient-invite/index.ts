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

    // Verify the user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Client with user auth to get current user
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader }}
    });

    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // Use service role for database operations
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    // Look up the invitation by code
    const { data: invitation, error: invError } = await adminSupabase
      .from('patient_invitations')
      .select('*')
      .eq('invite_code', invite_code)
      .maybeSingle();

    if (invError) {
      console.error('Error fetching invitation:', invError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch invitation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    if (!invitation) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invitation not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // Check if already accepted
    if (invitation.accepted_at) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invitation already accepted' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invitation has expired' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    let patientId = invitation.patient_id;

    // Check if there's an existing patient to link
    if (patientId) {
      // Link existing patient record to user
      const { error: updatePatientError } = await adminSupabase
        .from('patients')
        .update({ user_id: user.id })
        .eq('id', patientId);

      if (updatePatientError) {
        console.error('Error updating patient:', updatePatientError);
        throw new Error('Failed to link patient record');
      }
    } else {
      // Create new patient record
      const { data: newPatient, error: patientError } = await adminSupabase
        .from('patients')
        .insert({
          user_id: user.id,
          first_name: invitation.first_name,
          last_name: invitation.last_name,
          email: invitation.email,
          phone: invitation.phone,
        })
        .select()
        .single();

      if (patientError) {
        console.error('Error creating patient:', patientError);
        throw new Error('Failed to create patient record');
      }
      
      patientId = newPatient.id;
    }

    // Assign patient role
    const { error: roleError } = await adminSupabase
      .from('user_roles')
      .upsert({
        user_id: user.id,
        role: 'patient',
      }, { onConflict: 'user_id,role' });

    if (roleError) {
      console.error('Error assigning role:', roleError);
      // Continue anyway - user can still access as patient
    }

    // Mark invitation as accepted
    const { error: updateError } = await adminSupabase
      .from('patient_invitations')
      .update({ 
        accepted_at: new Date().toISOString(),
        patient_id: patientId,
      })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('Error updating invitation:', updateError);
      // Continue anyway - patient was created
    }

    console.log(`Patient invitation accepted: user=${user.id}, patient=${patientId}`);

    return new Response(
      JSON.stringify({
        success: true,
        patient_id: patientId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );

  } catch (error) {
    console.error('Error in accept-patient-invite:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );
  }
});
