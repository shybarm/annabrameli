/**
 * Normalizes a phone number to E.164 format (digits only, with country code).
 * Assumes Israel (+972) if the number starts with 0.
 * Returns null if the phone is empty or invalid.
 */
export function normalizePhoneToE164(phone: string | null | undefined): string | null {
  if (!phone) return null;

  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Handle + prefix
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }
  
  // Remove remaining non-digits
  cleaned = cleaned.replace(/\D/g, '');
  
  if (!cleaned || cleaned.length < 7) return null;
  
  // If starts with 0 (Israeli local format), convert to 972
  if (cleaned.startsWith('0')) {
    cleaned = '972' + cleaned.slice(1);
  }
  
  // Validate: should now be at least 10 digits with country code
  if (cleaned.length < 10 || cleaned.length > 15) return null;
  
  return cleaned;
}

/**
 * Central WhatsApp opener (single source of truth).
 * NOTE: `wa.me` commonly redirects to `api.whatsapp.com`.
 * In environments where `api.whatsapp.com` is blocked, open `web.whatsapp.com` directly.
 */
export function openWhatsApp({
  phone,
  text,
}: {
  phone?: string | null;
  text?: string;
}): void {
  const encoded = encodeURIComponent(text || '');
  const normalizedPhone = normalizePhoneToE164(phone);

  // Prefer direct Web WhatsApp to avoid `wa.me` → `api.whatsapp.com` redirects.
  // Phone chat:
  //   https://web.whatsapp.com/send?phone=<E164>&text=<ENCODED>
  // Share-mode:
  //   https://web.whatsapp.com/send?text=<ENCODED>
  let url = normalizedPhone
    ? `https://web.whatsapp.com/send?phone=${normalizedPhone}&text=${encoded}`
    : `https://web.whatsapp.com/send?text=${encoded}`;

  // Minimal runtime guard: never open api.whatsapp.com
  if (url.includes('api.whatsapp.com')) {
    url = url.replace('https://api.whatsapp.com', 'https://wa.me');
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Backwards-compatible helper used across the app.
 */
export function openWhatsAppChat(phone: string | null | undefined, message: string): void {
  openWhatsApp({ phone, text: message });
}
