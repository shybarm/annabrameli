import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // SECURITY: This function should only be called by cron scheduler or staff
  // Verify authorization - either service role token or staff authentication
  const authHeader = req.headers.get('Authorization');
  
  if (authHeader) {
    // Check if it's a service role call (from cron) or a staff user
    const token = authHeader.replace('Bearer ', '');
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // If not service role, verify it's a staff user
    if (token !== supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });

      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.error("Authentication failed: Invalid or expired token");
        return new Response(
          JSON.stringify({ error: 'Unauthorized - invalid token' }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify staff role
      const { data: staffCheck, error: rpcError } = await supabase.rpc('is_staff', { _user_id: user.id });
      if (rpcError || !staffCheck) {
        console.error("Authorization failed: Not a staff member");
        return new Response(
          JSON.stringify({ error: 'Forbidden - staff only' }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
  } else {
    // No auth header - reject
    console.error("Authentication failed: No authorization header");
    return new Response(
      JSON.stringify({ error: 'Unauthorized - missing authorization' }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.log("Starting appointment reminder check...");

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get active reminder schedules
    const { data: schedules, error: schedulesError } = await supabase
      .from("reminder_schedules")
      .select("*")
      .eq("is_active", true)
      .order("hours_before", { ascending: false });

    if (schedulesError) {
      console.error("Error fetching schedules:", schedulesError);
      throw schedulesError;
    }

    console.log(`Found ${schedules?.length || 0} active reminder schedules`);

    if (!schedules || schedules.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No active reminder schedules" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = new Date();
    let totalSent = 0;

    for (const schedule of schedules) {
      const reminderTime = new Date(now.getTime() + schedule.hours_before * 60 * 60 * 1000);
      const windowStart = new Date(reminderTime.getTime() - 15 * 60 * 1000); // 15 min window
      const windowEnd = new Date(reminderTime.getTime() + 15 * 60 * 1000);

      console.log(`Checking for appointments ${schedule.hours_before}h before, window: ${windowStart.toISOString()} - ${windowEnd.toISOString()}`);

      // Get appointments in the reminder window that haven't received this reminder
      const reminderColumn = schedule.hours_before >= 24 ? "reminder_24h_sent_at" : "reminder_2h_sent_at";

      const { data: appointments, error: appointmentsError } = await supabase
        .from("appointments")
        .select(`
          *,
          patients (first_name, last_name, phone, email),
          appointment_types (name_he)
        `)
        .gte("scheduled_at", windowStart.toISOString())
        .lte("scheduled_at", windowEnd.toISOString())
        .in("status", ["scheduled", "confirmed"])
        .is(reminderColumn, null);

      if (appointmentsError) {
        console.error("Error fetching appointments:", appointmentsError);
        continue;
      }

      console.log(`Found ${appointments?.length || 0} appointments needing reminders`);

      for (const appointment of appointments || []) {
        const patient = appointment.patients;
        if (!patient) continue;

        const appointmentDate = new Date(appointment.scheduled_at);
        const dateStr = appointmentDate.toLocaleDateString("he-IL", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });
        const timeStr = appointmentDate.toLocaleTimeString("he-IL", {
          hour: "2-digit",
          minute: "2-digit",
        });

        const appointmentType = appointment.appointment_types?.name_he || "ביקור";

        // Send WhatsApp (via link - will be opened manually or through automation)
        if (schedule.send_whatsapp && patient.phone) {
          const phone = patient.phone.replace(/\D/g, "");
          const message = `שלום ${patient.first_name}! 🏥\n\nזוהי תזכורת לתור שלך:\n📅 ${dateStr}\n🕐 ${timeStr}\n📋 ${appointmentType}\n\nמרפאת ד"ר אנה ברמלי`;
          
          console.log(`WhatsApp reminder prepared for ${patient.first_name} ${patient.last_name}`);
          
          // Update that WhatsApp reminder was prepared
          await supabase
            .from("appointments")
            .update({ reminder_whatsapp_sent_at: new Date().toISOString() })
            .eq("id", appointment.id);
        }

        // Send Email
        if (schedule.send_email && patient.email && resendApiKey) {
          try {
            const resend = new Resend(resendApiKey);
            
            const emailResponse = await resend.emails.send({
              from: "מרפאת ד\"ר אנה ברמלי <onboarding@resend.dev>",
              to: [patient.email],
              subject: `תזכורת לתור - ${dateStr} בשעה ${timeStr}`,
              html: `
                <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #2563eb;">תזכורת לתור 🏥</h2>
                  <p>שלום ${patient.first_name},</p>
                  <p>זוהי תזכורת לתור שלך במרפאה:</p>
                  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>📅 תאריך:</strong> ${dateStr}</p>
                    <p><strong>🕐 שעה:</strong> ${timeStr}</p>
                    <p><strong>📋 סוג ביקור:</strong> ${appointmentType}</p>
                  </div>
                  <p>נשמח לראותך!</p>
                  <p>בברכה,<br>מרפאת ד"ר אנה ברמלי</p>
                </div>
              `,
            });

            console.log(`Email sent to ${patient.email}:`, emailResponse);

            await supabase
              .from("appointments")
              .update({ reminder_email_sent_at: new Date().toISOString() })
              .eq("id", appointment.id);

            totalSent++;
          } catch (emailError) {
            console.error(`Failed to send email to ${patient.email}:`, emailError);
          }
        }

        // Mark the reminder as sent
        await supabase
          .from("appointments")
          .update({ [reminderColumn]: new Date().toISOString() })
          .eq("id", appointment.id);
      }
    }

    console.log(`Reminder check complete. Total emails sent: ${totalSent}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed reminders. Emails sent: ${totalSent}`,
        totalSent 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-appointment-reminders:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
