import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, validateInput, verifyCaptcha, createAuditLog, hashData } from "../_shared/security-utils.ts";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "../_shared/rate-limiter.ts";

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

    // Rate limiting
    const clientId = getClientIdentifier(req);
    const rateLimit = await checkRateLimit(supabase, clientId, 'guest-upload-document');
    
    if (!rateLimit.allowed) {
      createAuditLog('guest-upload-document', 'rate_limit_exceeded', undefined, { clientId: clientId.substring(0, 20) });
      return createRateLimitResponse(rateLimit.resetIn);
    }

    const formData = await req.formData();
    const patientId = formData.get("patient_id") as string;
    const uploadToken = formData.get("upload_token") as string;
    const file = formData.get("file") as File;
    const title = formData.get("title") as string || file?.name || 'document';
    const documentType = formData.get("document_type") as string || "other";

    // Validate required fields
    if (!patientId || !file) {
      createAuditLog('guest-upload-document', 'validation_failed', undefined, { reason: 'missing_fields' });
      return new Response(
        JSON.stringify({ error: "patient_id and file are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      createAuditLog('guest-upload-document', 'invalid_file_type', undefined, { fileType: file.type });
      return new Response(
        JSON.stringify({ error: "Invalid file type. Only PDF and images are allowed." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Validate file size
    if (file.size > MAX_FILE_SIZE) {
      createAuditLog('guest-upload-document', 'file_too_large', undefined, { fileSize: file.size });
      return new Response(
        JSON.stringify({ error: "File too large. Maximum size is 10MB." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Validate the patient exists and was recently created (within 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    const { data: patientData, error: patientError } = await supabase
      .from("patients")
      .select("id, created_at")
      .eq("id", patientId)
      .gte("created_at", thirtyMinutesAgo)
      .single();

    if (patientError || !patientData) {
      createAuditLog('guest-upload-document', 'patient_validation_failed', undefined, { patientId: patientId.substring(0, 8) });
      return new Response(
        JSON.stringify({ error: "Invalid patient or upload session expired" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If upload token is provided, validate it
    if (uploadToken) {
      const { data: tokenData, error: tokenError } = await supabase
        .from("upload_tokens")
        .select("*")
        .eq("token", uploadToken)
        .eq("patient_id", patientId)
        .gt("expires_at", new Date().toISOString())
        .is("used_at", null)
        .single();

      if (!tokenError && tokenData) {
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
        title: title.substring(0, 255),
        document_type: documentType,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single();

    if (docError) {
      console.error("Document record error:", docError);
      await supabase.storage.from("patient-documents").remove([filePath]);
      return new Response(
        JSON.stringify({ error: "Failed to create document record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Queue file for virus scanning
    await supabase
      .from("file_scan_queue")
      .insert({
        document_id: document.id,
        file_path: filePath,
        scan_status: 'pending'
      });

    createAuditLog('guest-upload-document', 'upload_success', undefined, { 
      documentId: document.id,
      fileType: file.type,
      fileSize: file.size
    });

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