import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resendImport = async () => {
  const { Resend } = await import("https://esm.sh/resend@2.0.0");
  return Resend;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  role: string;
  permissions: Record<string, boolean>;
  clinic_ids?: string[];
  clinic_id?: string; // legacy support
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { email, role, permissions, clinic_ids, clinic_id }: InviteRequest = await req.json();

    if (!email || !role) {
      return new Response(JSON.stringify({ error: "Email and role are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Determine which clinic IDs to use - support both new array and legacy single ID
    const clinicIdsToUse = clinic_ids && clinic_ids.length > 0 
      ? clinic_ids 
      : (clinic_id ? [clinic_id] : []);

    console.log(`Creating invitation for ${email} with role ${role} for clinics: ${clinicIdsToUse.join(', ') || 'none'}`);

    if (clinicIdsToUse.length === 0) {
      return new Response(JSON.stringify({ error: "At least one clinic must be selected" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create invitation records for each clinic
    const invitations = [];
    for (const cid of clinicIdsToUse) {
      const { data: invitation, error: inviteError } = await supabase
        .from("team_invitations")
        .insert({
          email: email.toLowerCase().trim(),
          role,
          permissions,
          invited_by: user.id,
          clinic_id: cid,
        })
        .select()
        .single();

      if (inviteError) {
        console.error("Invite error:", inviteError);
        return new Response(JSON.stringify({ error: inviteError.message }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      invitations.push(invitation);
    }

    console.log(`Created ${invitations.length} invitation(s)`);

    // Use first invitation for the link
    const primaryInvitation = invitations[0];

    // Get clinic names for email
    const { data: clinics } = await supabase
      .from("clinics")
      .select("name")
      .in("id", clinicIdsToUse);

    const clinicNames = clinics?.map(c => c.name).join(", ") || "המרפאה";

    // Build invitation link
    const origin = req.headers.get("origin") || "https://lovable.app";
    const inviteLink = `${origin}/join/${primaryInvitation.invite_code}`;

    const roleLabels: Record<string, string> = {
      admin: "מנהל",
      doctor: "רופא",
      secretary: "מזכירה",
    };

    // Send email if Resend is configured
    if (resendApiKey) {
      const ResendClass = await resendImport();
      const resendClient = new ResendClass(resendApiKey);
      
      const emailResponse = await resendClient.emails.send({
        from: "המרפאה <info@ihaveallergy.com>",
        to: [email],
        subject: `הזמנה להצטרף לצוות ${clinicNames}`,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #7c3aed;">הוזמנת להצטרף לצוות!</h1>
            <p>שלום,</p>
            <p>הוזמנת להצטרף לצוות של <strong>${clinicNames}</strong> בתפקיד <strong>${roleLabels[role] || role}</strong>.</p>
            <p>לחץ על הכפתור למטה כדי להשלים את ההרשמה:</p>
            <a href="${inviteLink}" style="display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
              הצטרף לצוות
            </a>
            <p style="margin-top: 20px; color: #666;">
              <strong>קוד ההזמנה שלך:</strong> ${primaryInvitation.invite_code}
            </p>
            <p style="color: #999; font-size: 12px;">
              הזמנה זו תקפה ל-7 ימים.
            </p>
          </div>
        `,
      });

      console.log("Email sent:", emailResponse);
    } else {
      console.log("Resend API key not configured, skipping email");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        inviteCode: primaryInvitation.invite_code,
        inviteLink,
        invitationsCreated: invitations.length
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-team-invite:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
