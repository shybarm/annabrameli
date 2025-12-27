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
  clinic_id?: string;
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

    const { email, role, permissions, clinic_id }: InviteRequest = await req.json();

    if (!email || !role) {
      return new Response(JSON.stringify({ error: "Email and role are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Creating invitation for ${email} with role ${role} for clinic ${clinic_id || 'all'}`);

    // Create invitation record
    const { data: invitation, error: inviteError } = await supabase
      .from("team_invitations")
      .insert({
        email: email.toLowerCase().trim(),
        role,
        permissions,
        invited_by: user.id,
        clinic_id: clinic_id || null,
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

    console.log("Invitation created:", invitation.id);

    // Get clinic name
    const { data: clinicSetting } = await supabase
      .from("clinic_settings")
      .select("value")
      .eq("key", "clinic_name")
      .maybeSingle();

    const clinicName = clinicSetting?.value || "המרפאה";

    // Build invitation link
    const origin = req.headers.get("origin") || "https://lovable.app";
    const inviteLink = `${origin}/join/${invitation.invite_code}`;

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
        from: "המרפאה <onboarding@resend.dev>",
        to: [email],
        subject: `הזמנה להצטרף לצוות ${clinicName}`,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #7c3aed;">הוזמנת להצטרף לצוות!</h1>
            <p>שלום,</p>
            <p>הוזמנת להצטרף לצוות של <strong>${clinicName}</strong> בתפקיד <strong>${roleLabels[role] || role}</strong>.</p>
            <p>לחץ על הכפתור למטה כדי להשלים את ההרשמה:</p>
            <a href="${inviteLink}" style="display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
              הצטרף לצוות
            </a>
            <p style="margin-top: 20px; color: #666;">
              <strong>קוד ההזמנה שלך:</strong> ${invitation.invite_code}
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
        inviteCode: invitation.invite_code,
        inviteLink 
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
