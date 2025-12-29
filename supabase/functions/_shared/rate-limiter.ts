import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  'chat-assistant': { maxRequests: 20, windowSeconds: 60 },
  'guest-booking': { maxRequests: 5, windowSeconds: 300 },
  'guest-upload-document': { maxRequests: 10, windowSeconds: 300 },
  'submit-intake': { maxRequests: 3, windowSeconds: 300 },
  'transcribe-audio': { maxRequests: 10, windowSeconds: 60 },
  'default': { maxRequests: 30, windowSeconds: 60 }
};

export function getClientIdentifier(req: Request): string {
  // Get IP from various headers (in order of preference)
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  
  const ip = cfConnectingIp || realIp || forwardedFor?.split(',')[0]?.trim() || 'unknown';
  
  // Get fingerprint from header if provided
  const fingerprint = req.headers.get('x-client-fingerprint') || '';
  
  // Combine for unique identifier
  return `${ip}:${fingerprint}`.substring(0, 255);
}

export async function checkRateLimit(
  supabase: SupabaseClient,
  identifier: string,
  endpoint: string
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const config = RATE_LIMIT_CONFIGS[endpoint] || RATE_LIMIT_CONFIGS['default'];
  
  try {
    // Direct database query for rate limiting
    const windowStart = new Date(Date.now() - config.windowSeconds * 1000).toISOString();
    
    // Count requests in current window
    const { count, error: countError } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart);
    
    if (countError) {
      console.error('Rate limit count error:', countError);
      return { allowed: true, remaining: config.maxRequests, resetIn: config.windowSeconds };
    }
    
    const currentCount = count || 0;
    
    if (currentCount >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: config.windowSeconds
      };
    }
    
    // Record this request
    const now = new Date();
    const windowStartTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
    
    await supabase
      .from('rate_limits')
      .insert({
        identifier,
        endpoint,
        window_start: windowStartTime.toISOString(),
        request_count: 1
      });
    
    return {
      allowed: true,
      remaining: config.maxRequests - currentCount - 1,
      resetIn: config.windowSeconds
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fail open but log
    return { allowed: true, remaining: config.maxRequests, resetIn: config.windowSeconds };
  }
}

export function createRateLimitResponse(resetIn: number): Response {
  return new Response(
    JSON.stringify({ 
      error: 'Rate limit exceeded. Please try again later.',
      retryAfter: resetIn 
    }),
    { 
      status: 429, 
      headers: { 
        'Content-Type': 'application/json',
        'Retry-After': String(resetIn),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      } 
    }
  );
}
