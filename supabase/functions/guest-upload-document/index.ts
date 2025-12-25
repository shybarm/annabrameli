import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const formData = await req.formData();
    const patientId = formData.get("patient_id") as string;
    const uploadToken = formData.get("upload_token") as string;
    const file = formData.get("file") as File;
    const title = formData.get("title") as string || file.name;
    const documentType = formData.get("document_type") as string || "other";

    // Validate required fields
    if (!patientId || !file || !uploadToken) {
      console.log("Missing required fields:", { patientId: !!patientId, file: !!file, uploadToken: !!uploadToken });
      return new Response(
        JSON.stringify({ error: "patient_id, upload_token, and file are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate upload token - must match patient_id, not be expired, and not be used
    const { data: tokenData, error: tokenError } = await supabase
      .from("upload_tokens")
      .select("*")
      .eq("token", uploadToken)
      .eq("patient_id", patientId)
      .gt("expires_at", new Date().toISOString())
      .is("used_at", null)
      .single();

    if (tokenError || !tokenData) {
      console.log("Token validation failed:", { tokenError, uploadToken: uploadToken?.substring(0, 8) + "..." });
      return new Response(
        JSON.stringify({ error: "Invalid or expired upload token" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark token as used (but don't block if this fails)
    await supabase
      .from("upload_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", tokenData.id);

    // Upload file to storage
    const fileBuffer = await file.arrayBuffer();
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `${patientId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("patient-documents")
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to upload file" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create document record
    const { data: document, error: docError } = await supabase
      .from("patient_documents")
      .insert({
        patient_id: patientId,
        title: title,
        document_type: documentType,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single();

    if (docError) {
      console.error("Document record error:", docError);
      // Try to delete uploaded file
      await supabase.storage.from("patient-documents").remove([filePath]);
      return new Response(
        JSON.stringify({ error: "Failed to create document record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Document uploaded successfully:", { documentId: document.id, patientId });

    return new Response(
      JSON.stringify({ success: true, document }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
