import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, verifyStaffAuth, createAuditLog } from "../_shared/security-utils.ts";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "../_shared/rate-limiter.ts";

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Verify staff authentication
    const { isStaff, userId, error: authError } = await verifyStaffAuth(req);
    if (!isStaff) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - staff only' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // Rate limiting (even for authenticated users)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    const clientId = getClientIdentifier(req);
    const rateLimit = await checkRateLimit(supabase, clientId, 'transcribe-audio');
    
    if (!rateLimit.allowed) {
      createAuditLog('transcribe-audio', 'rate_limit_exceeded', userId);
      return createRateLimitResponse(rateLimit.resetIn);
    }

    const { audio } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    // SECURITY: Validate audio data size (max 25MB for Whisper API)
    const maxAudioSize = 25 * 1024 * 1024;
    if (audio.length > maxAudioSize * 1.37) { // Base64 is ~37% larger
      createAuditLog('transcribe-audio', 'audio_too_large', userId);
      return new Response(
        JSON.stringify({ error: 'Audio file too large. Maximum size is 25MB.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    createAuditLog('transcribe-audio', 'transcription_started', userId);

    // Process audio in chunks
    const binaryAudio = processBase64Chunks(audio);
    
    // Prepare form data for Whisper API
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('prompt', 'This is a medical consultation in Hebrew and English. תמלול שיחה רפואית.');

    // Send to OpenAI Whisper
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const result = await response.json();
    
    createAuditLog('transcribe-audio', 'transcription_completed', userId, {
      transcriptionLength: result.text?.length || 0
    });

    // SECURITY: Audio data is processed and not stored - only transcription text is returned
    // The raw audio is never persisted

    return new Response(
      JSON.stringify({ transcription: result.text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Transcription error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});