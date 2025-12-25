import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

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
    if (!patientId || !file) {
      console.log("Missing required fields:", { patientId: !!patientId, file: !!file });
      return new Response(
        JSON.stringify({ error: "patient_id and file are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      console.log("Invalid file type:", file.type);
      return new Response(
        JSON.stringify({ error: "Invalid file type. Only PDF and images are allowed." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.log("File too large:", file.size);
      return new Response(
        JSON.stringify({ error: "File too large. Maximum size is 10MB." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Validate the patient exists and was recently created (within 30 minutes)
    // This ensures uploads are only allowed during the booking flow
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    const { data: patientData, error: patientError } = await supabase
      .from("patients")
      .select("id, created_at")
      .eq("id", patientId)
      .gte("created_at", thirtyMinutesAgo)
      .single();

    if (patientError || !patientData) {
      console.log("Patient validation failed - patient not found or too old:", { patientId, patientError });
      return new Response(
        JSON.stringify({ error: "Invalid patient or upload session expired" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If upload token is provided, validate it (legacy flow)
    if (uploadToken) {
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
        // Don't fail - the patient creation time check is sufficient
      } else {
        // Mark token as used
        await supabase
          .from("upload_tokens")
          .update({ used_at: new Date().toISOString() })
          .eq("id", tokenData.id);
      }
    }

    // Upload file to storage
    const fileBuffer = await file.arrayBuffer();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${Date.now()}_${sanitizedFileName}`;
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
        title: title.substring(0, 255), // Limit title length
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