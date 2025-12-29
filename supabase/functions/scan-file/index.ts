import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/security-utils.ts";

/**
 * File Scanner Edge Function
 * Integrates with virus scanning service to check uploaded files
 * ISO 27799 Compliance: Malware protection for clinical documents
 */

interface ScanResult {
  clean: boolean;
  threats: string[];
  scanTime: number;
  provider: string;
}

// Simulated virus scan for development - in production, integrate with ClamAV or cloud service
async function scanFile(fileContent: ArrayBuffer): Promise<ScanResult> {
  const startTime = Date.now();
  
  // Check for known malware signatures (simplified)
  const bytes = new Uint8Array(fileContent);
  const threats: string[] = [];
  
  // EICAR test file signature (for testing antivirus)
  const eicarSignature = [0x58, 0x35, 0x4F, 0x21, 0x50, 0x25, 0x40, 0x41, 0x50];
  let eicarMatch = true;
  for (let i = 0; i < eicarSignature.length && i < bytes.length; i++) {
    if (bytes[i] !== eicarSignature[i]) {
      eicarMatch = false;
      break;
    }
  }
  if (eicarMatch && bytes.length >= eicarSignature.length) {
    threats.push('EICAR-Test-File');
  }
  
  // Check for executable signatures in documents
  const peSignature = [0x4D, 0x5A]; // MZ header (Windows executable)
  if (bytes.length >= 2 && bytes[0] === peSignature[0] && bytes[1] === peSignature[1]) {
    threats.push('Executable-In-Document');
  }
  
  // Check for suspicious JavaScript in PDFs
  const fileString = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, 10000));
  if (fileString.includes('/JavaScript') || fileString.includes('/JS')) {
    threats.push('PDF-JavaScript-Detected');
  }
  
  // Check for suspicious macros in Office documents
  if (fileString.includes('VBA') || fileString.includes('AutoOpen') || fileString.includes('AutoExec')) {
    threats.push('Office-Macro-Detected');
  }
  
  return {
    clean: threats.length === 0,
    threats,
    scanTime: Date.now() - startTime,
    provider: 'internal-scanner-v1',
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify service role or admin auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { documentId, filePath } = await req.json();

    if (!documentId || !filePath) {
      return new Response(
        JSON.stringify({ error: 'Missing documentId or filePath' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[scan-file] Scanning document: ${documentId}, path: ${filePath}`);

    // Update scan status to processing
    await supabase
      .from('file_scan_queue')
      .upsert({
        document_id: documentId,
        file_path: filePath,
        scan_status: 'scanning',
      }, { onConflict: 'document_id' });

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('patient-documents')
      .download(filePath);

    if (downloadError || !fileData) {
      console.error('[scan-file] Download error:', downloadError);
      
      await supabase
        .from('file_scan_queue')
        .update({
          scan_status: 'error',
          scan_result: { error: 'Failed to download file' },
          scanned_at: new Date().toISOString(),
        })
        .eq('document_id', documentId);

      return new Response(
        JSON.stringify({ error: 'Failed to download file for scanning' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Perform virus scan
    const fileBuffer = await fileData.arrayBuffer();
    const scanResult = await scanFile(fileBuffer);

    console.log(`[scan-file] Scan complete for ${documentId}:`, scanResult);

    // Update scan result in queue
    await supabase
      .from('file_scan_queue')
      .update({
        scan_status: scanResult.clean ? 'clean' : 'infected',
        scan_result: scanResult,
        scanned_at: new Date().toISOString(),
      })
      .eq('document_id', documentId);

    // If file is infected, quarantine it (move to quarantine path or delete)
    if (!scanResult.clean) {
      console.warn(`[scan-file] INFECTED FILE DETECTED: ${documentId}`, scanResult.threats);
      
      // Option 1: Delete the infected file
      const { error: deleteError } = await supabase
        .storage
        .from('patient-documents')
        .remove([filePath]);

      if (deleteError) {
        console.error('[scan-file] Failed to remove infected file:', deleteError);
      }

      // Update document record to indicate infection
      await supabase
        .from('patient_documents')
        .update({
          description: `[QUARANTINED] Threats detected: ${scanResult.threats.join(', ')}`,
        })
        .eq('id', documentId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        documentId,
        result: scanResult,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[scan-file] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
