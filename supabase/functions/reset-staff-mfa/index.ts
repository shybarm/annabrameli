import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's JWT to check their role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the requesting user is authenticated and is an admin
    const { data: { user: requestingUser }, error: authError } = await userClient.auth.getUser();
    if (authError || !requestingUser) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if requesting user is admin
    const { data: roles, error: rolesError } = await userClient
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .eq('role', 'admin');

    if (rolesError || !roles || roles.length === 0) {
      console.error('Not admin:', rolesError);
      return new Response(
        JSON.stringify({ error: 'Only admins can reset MFA for staff' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the target user ID from request body
    const { targetUserId } = await req.json();
    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: 'Target user ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify target user is a staff member (not admin themselves)
    const { data: targetRoles, error: targetRolesError } = await userClient
      .from('user_roles')
      .select('role')
      .eq('user_id', targetUserId)
      .in('role', ['admin', 'doctor', 'secretary']);

    if (targetRolesError || !targetRoles || targetRoles.length === 0) {
      console.error('Target not staff:', targetRolesError);
      return new Response(
        JSON.stringify({ error: 'Target user is not a staff member' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role client to access admin auth API
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get the target user's MFA factors using admin API
    const { data: factorsData, error: factorsError } = await adminClient.auth.admin.mfa.listFactors({
      userId: targetUserId,
    });

    if (factorsError) {
      console.error('Error listing factors:', factorsError);
      return new Response(
        JSON.stringify({ error: 'Failed to list MFA factors' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${factorsData.factors?.length || 0} MFA factors for user ${targetUserId}`);

    // Remove all MFA factors
    let deletedCount = 0;
    if (factorsData.factors && factorsData.factors.length > 0) {
      for (const factor of factorsData.factors) {
        const { error: deleteError } = await adminClient.auth.admin.mfa.deleteFactor({
          userId: targetUserId,
          id: factor.id,
        });
        
        if (deleteError) {
          console.error(`Error deleting factor ${factor.id}:`, deleteError);
        } else {
          deletedCount++;
          console.log(`Deleted factor ${factor.id}`);
        }
      }
    }

    console.log(`Successfully reset MFA for user ${targetUserId}, deleted ${deletedCount} factors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `MFA reset successful. Removed ${deletedCount} factor(s).`,
        deletedCount 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
