import { createClient } from "npm:@supabase/supabase-js@2.49.4";
import { telephoneMessage, whatsappPhone } from "../_shared/telephone-message.ts";

// Only a single-use job capability, generated inside the database, can claim a job.
// No patient data or capabilities are returned by this endpoint or written to logs.
Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response(null, { status: 405 });
  const token = Deno.env.get("GREEN_API_TOKEN");
  if (!token) return new Response(null, { status: 503 });
  let input;
  try {
    input = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuid.test(input?.appointment_id || "") || !uuid.test(input?.dispatch_token || ""))
    return new Response(null, { status: 400 });
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: job, error } = await db.rpc("claim_telephone_whatsapp", {
    p_visit: input.appointment_id,
    p_dispatch_token: input.dispatch_token,
  });
  if (error) return new Response(null, { status: 503 });
  if (!job) return new Response(null, { status: 204 });

  const finish = async (state: string, code: string | null, messageId: string | null = null) => {
    const result = await db.rpc("finish_telephone_whatsapp", {
      p_visit: input.appointment_id,
      p_dispatch_token: input.dispatch_token,
      p_state: state,
      p_error_code: code,
      p_message_id: messageId,
    });
    if (result.error) console.error("telephone_whatsapp", "status_save_failed");
  };
  const phone = whatsappPhone(job.phone || "");
  if (!phone || phone === "972555070399") {
    await finish("failed", "invalid_recipient");
    return new Response(null, { status: 204 });
  }
  let message;
  try {
    message = telephoneMessage(
      job,
      "https://ihaveallergy.com/intake/" + job.intake_token,
      "https://ihaveallergy.com/visit.html#" + job.invitation_token,
    );
  } catch {
    await finish("failed", "invalid_invitation");
    return new Response(null, { status: 204 });
  }
  try {
    const response = await fetch(
      "https://7107.api.greenapi.com/waInstance710722808546/sendMessage/" + encodeURIComponent(token),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: phone + "@c.us", message }),
        signal: AbortSignal.timeout(15000),
      },
    );
    const result = await response.json().catch(() => ({}));
    if (response.ok && typeof result.idMessage === "string" && result.idMessage) {
      await finish("accepted", null, result.idMessage);
      console.info("telephone_whatsapp", "provider_accepted");
    } else {
      // Never retry automatically after a provider request: a response can be ambiguous.
      await finish(
        "failed",
        response.status >= 400 && response.status < 500 ? "provider_rejected" : "delivery_uncertain",
      );
      console.warn("telephone_whatsapp", "needs_review");
    }
  } catch {
    await finish("failed", "delivery_uncertain");
    console.warn("telephone_whatsapp", "delivery_uncertain");
  }
  return new Response(null, { status: 204 });
});

// Automatic appointment invitations, dispatched by the clinic queue.
