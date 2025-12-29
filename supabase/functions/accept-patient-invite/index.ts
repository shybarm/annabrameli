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
        JSON.stringify({ ok: false, success: false, code: 'BAD_REQUEST', error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }
    
    if (!invite_code || typeof invite_code !== 'string' || invite_code.trim() === '') {
      console.log('Missing or invalid invite_code:', invite_code);
      return new Response(
        JSON.stringify({ ok: false, success: false, code: 'BAD_REQUEST', error: 'Missing or invalid invite code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    console.log('Accepting invite code:', invite_code.substring(0, 8) + '...');

    // Verify the user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('Missing authorization header');
      return new Response(
        JSON.stringify({ ok: false, success: false, code: 'UNAUTHORIZED', error: 'Missing authorization' }),
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
      console.log('Auth error:', authError?.message);
      return new Response(
        JSON.stringify({ ok: false, success: false, code: 'UNAUTHORIZED', error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    console.log('User authenticated:', user.id);

    // Use service role for database operations
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    // Look up the invitation by code
    const { data: invitation, error: invError } = await adminSupabase
      .from('patient_invitations')
      .select('*')
      .eq('invite_code', invite_code.trim())
      .maybeSingle();

    if (invError) {
      console.error('Error fetching invitation:', invError);
      return new Response(
        JSON.stringify({ ok: false, success: false, code: 'SERVER_ERROR', error: 'Failed to fetch invitation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    if (!invitation) {
      console.log('Invitation not found');
      return new Response(
        JSON.stringify({ ok: false, success: false, code: 'INVITE_NOT_FOUND', error: 'Invitation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // Check if already accepted
    if (invitation.accepted_at) {
      console.log('Invitation already accepted');
      return new Response(
        JSON.stringify({ ok: false, success: false, code: 'INVITE_ALREADY_USED', error: 'Invitation already accepted' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      console.log('Invitation expired');
      return new Response(
        JSON.stringify({ ok: false, success: false, code: 'INVITE_EXPIRED', error: 'Invitation has expired' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    let patientId = invitation.patient_id;

    // CRITICAL: Always resolve patient by ID first, never create duplicates
    if (patientId) {
      console.log('Linking existing patient by patient_id:', patientId);
      
      // Verify patient exists before updating
      const { data: existingPatient, error: checkError } = await adminSupabase
        .from('patients')
        .select('id, user_id')
        .eq('id', patientId)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking patient:', checkError);
      }
      
      if (existingPatient) {
        // Check if already linked to another user
        if (existingPatient.user_id && existingPatient.user_id !== user.id) {
          console.log('Patient already linked to another user');
          return new Response(
            JSON.stringify({ ok: false, success: false, code: 'PATIENT_LINKED', error: 'Patient already linked to another account' }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
          );
        }
        
        // Link patient to user
        const { error: updatePatientError } = await adminSupabase
          .from('patients')
          .update({ user_id: user.id })
          .eq('id', patientId);

        if (updatePatientError) {
          console.error('Error updating patient:', updatePatientError);
          return new Response(
            JSON.stringify({ ok: false, success: false, code: 'SERVER_ERROR', error: 'Failed to link patient record' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
          );
        }
      } else {
        // Patient ID was invalid, clear it so we search/create below
        console.log('Patient not found by ID, will search by phone/email');
        patientId = null;
      }
    }
    
    // If no patient_id or patient not found, search for existing patient
    if (!patientId) {
      console.log('Searching for existing patient by phone/email');
      
      // Try to find by phone first (most reliable)
      if (invitation.phone) {
        const { data: patientByPhone } = await adminSupabase
          .from('patients')
          .select('id, user_id, created_at')
          .eq('phone', invitation.phone)
          .order('created_at', { ascending: true })
          .limit(5);
        
        if (patientByPhone && patientByPhone.length > 0) {
          // Prefer patient already linked to user, else oldest record
          const linkedPatient = patientByPhone.find(p => p.user_id === user.id);
          const unlinkedPatient = patientByPhone.find(p => !p.user_id);
          const chosenPatient = linkedPatient || unlinkedPatient || patientByPhone[0];
          
          if (chosenPatient.user_id && chosenPatient.user_id !== user.id) {
            console.log('Found patient by phone but linked to another user');
            // Skip this one, try email
          } else {
            patientId = chosenPatient.id;
            console.log('Found existing patient by phone:', patientId);
          }
        }
      }
      
      // Try email if still no patient
      if (!patientId && invitation.email) {
        const { data: patientByEmail } = await adminSupabase
          .from('patients')
          .select('id, user_id, created_at')
          .eq('email', invitation.email)
          .order('created_at', { ascending: true })
          .limit(5);
        
        if (patientByEmail && patientByEmail.length > 0) {
          const linkedPatient = patientByEmail.find(p => p.user_id === user.id);
          const unlinkedPatient = patientByEmail.find(p => !p.user_id);
          const chosenPatient = linkedPatient || unlinkedPatient || patientByEmail[0];
          
          if (chosenPatient.user_id && chosenPatient.user_id !== user.id) {
            console.log('Patient with this email already linked to another user');
            return new Response(
              JSON.stringify({ ok: false, success: false, code: 'EMAIL_IN_USE', error: 'Email already linked to another account' }),
              { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
            );
          }
          
          patientId = chosenPatient.id;
          console.log('Found existing patient by email:', patientId);
        }
      }
      
      // If we found an existing patient, link them
      if (patientId) {
        const { error: updatePatientError } = await adminSupabase
          .from('patients')
          .update({ user_id: user.id })
          .eq('id', patientId);

        if (updatePatientError) {
          console.error('Error updating patient:', updatePatientError);
          return new Response(
            JSON.stringify({ ok: false, success: false, code: 'SERVER_ERROR', error: 'Failed to link patient record' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
          );
        }
      }
    }
    
    // Only create new patient if absolutely no existing record found
    if (!patientId) {
      console.log('Creating new patient record (no existing match found)');
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
        return new Response(
          JSON.stringify({ ok: false, success: false, code: 'SERVER_ERROR', error: 'Failed to create patient record' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        );
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
        ok: true,
        success: true,
        patient_id: patientId,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );

  } catch (error) {
    console.error('Error in accept-patient-invite:', error);
    return new Response(
      JSON.stringify({ ok: false, success: false, code: 'SERVER_ERROR', error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );
  }
});
