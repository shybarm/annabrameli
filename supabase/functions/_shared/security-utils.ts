import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-client-fingerprint, x-captcha-token",
};

// PHI detection patterns
const PHI_PATTERNS = [
  /\b\d{9}\b/, // Israeli ID number
  /\b\d{3}-?\d{2}-?\d{4}\b/, // SSN-like
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, // Email
  /\b0[0-9]{1,2}[-\s]?\d{7,8}\b/, // Israeli phone
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card
];

// Medical advice patterns to filter from AI output
const MEDICAL_ADVICE_PATTERNS = [
  /אני ממליץ לך לקחת/,
  /you should take/i,
  /אבחנה שלך היא/,
  /your diagnosis is/i,
  /המינון המומלץ/,
  /recommended dosage/i,
];

export interface SecurityValidation {
  valid: boolean;
  error?: string;
  sanitizedInput?: string;
}

/**
 * Verify staff authentication for protected endpoints
 */
export async function verifyStaffAuth(req: Request): Promise<{ 
  isStaff: boolean; 
  userId?: string; 
  error?: string 
}> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { isStaff: false, error: 'Missing authorization header' };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { isStaff: false, error: 'Invalid or expired token' };
  }

  const { data: staffCheck, error: rpcError } = await supabase.rpc('is_staff', { _user_id: user.id });
  if (rpcError || !staffCheck) {
    return { isStaff: false, error: 'Access denied - staff only' };
  }

  return { isStaff: true, userId: user.id };
}

/**
 * Detect PHI in text content
 */
export function detectPHI(text: string): { hasPHI: boolean; types: string[] } {
  const detectedTypes: string[] = [];
  
  if (PHI_PATTERNS[0].test(text)) detectedTypes.push('id_number');
  if (PHI_PATTERNS[1].test(text)) detectedTypes.push('ssn_like');
  if (PHI_PATTERNS[2].test(text)) detectedTypes.push('email');
  if (PHI_PATTERNS[3].test(text)) detectedTypes.push('phone');
  if (PHI_PATTERNS[4].test(text)) detectedTypes.push('credit_card');
  
  return {
    hasPHI: detectedTypes.length > 0,
    types: detectedTypes
  };
}

/**
 * Sanitize AI output - remove unintended PHI and medical advice
 */
export function sanitizeAIOutput(text: string): { 
  sanitized: string; 
  hadPHI: boolean; 
  hadMedicalAdvice: boolean 
} {
  let sanitized = text;
  let hadPHI = false;
  let hadMedicalAdvice = false;
  
  // Check and mask PHI
  for (const pattern of PHI_PATTERNS) {
    if (pattern.test(sanitized)) {
      hadPHI = true;
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }
  }
  
  // Check for medical advice patterns and add disclaimer
  for (const pattern of MEDICAL_ADVICE_PATTERNS) {
    if (pattern.test(sanitized)) {
      hadMedicalAdvice = true;
      break;
    }
  }
  
  // If medical advice detected, append disclaimer
  if (hadMedicalAdvice) {
    sanitized += '\n\n⚠️ הערה: המידע לעיל הוא כללי בלבד ואינו מהווה ייעוץ רפואי. יש לפנות לרופא לאבחון מקצועי.';
  }
  
  return { sanitized, hadPHI, hadMedicalAdvice };
}

/**
 * Validate input schema - basic validation
 */
export function validateInput(
  input: unknown,
  schema: { required?: string[]; maxLength?: Record<string, number> }
): SecurityValidation {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Invalid input format' };
  }
  
  const obj = input as Record<string, unknown>;
  
  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in obj) || obj[field] === null || obj[field] === undefined) {
        return { valid: false, error: `Missing required field: ${field}` };
      }
    }
  }
  
  // Check max lengths
  if (schema.maxLength) {
    for (const [field, maxLen] of Object.entries(schema.maxLength)) {
      if (field in obj && typeof obj[field] === 'string' && (obj[field] as string).length > maxLen) {
        return { valid: false, error: `Field ${field} exceeds maximum length of ${maxLen}` };
      }
    }
  }
  
  return { valid: true };
}

/**
 * Verify hCaptcha token
 */
export async function verifyCaptcha(token: string): Promise<boolean> {
  const HCAPTCHA_SECRET = Deno.env.get('HCAPTCHA_SECRET_KEY');

  if (!HCAPTCHA_SECRET) {
    console.warn('HCAPTCHA_SECRET_KEY not configured - skipping CAPTCHA verification');
    return true; // Fail open if not configured (should be configured in production)
  }

  try {
    console.log(`Verifying hCaptcha token (len=${token?.length ?? 0})...`);

    const response = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${encodeURIComponent(HCAPTCHA_SECRET)}&response=${encodeURIComponent(token)}`
    });

    const data = await response.json();
    console.log('hCaptcha verification response:', JSON.stringify(data));

    if (!data.success) {
      console.error('hCaptcha failed. Error codes:', data['error-codes']);
    }

    return data.success === true;
  } catch (error) {
    console.error('CAPTCHA verification error:', error);
    return false;
  }
}

/**
 * Log access for audit purposes (no PHI in logs)
 */
export function createAuditLog(
  functionName: string,
  action: string,
  userId?: string,
  metadata?: Record<string, unknown>
): void {
  const sanitizedMetadata = metadata ? { ...metadata } : {};
  
  // Remove any potential PHI from metadata
  for (const key of Object.keys(sanitizedMetadata)) {
    if (typeof sanitizedMetadata[key] === 'string') {
      const { hasPHI } = detectPHI(sanitizedMetadata[key] as string);
      if (hasPHI) {
        sanitizedMetadata[key] = '[REDACTED]';
      }
    }
  }
  
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    function: functionName,
    action,
    userId: userId || 'anonymous',
    ...sanitizedMetadata
  }));
}

/**
 * Hash sensitive data for storage/comparison
 */
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
