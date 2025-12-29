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
 * Opens WhatsApp Web with a prefilled message.
 * @param phone - Phone number (will be normalized to E.164)
 * @param message - Message text to prefill
 * @returns true if opened successfully, false if phone is invalid
 */
export function openWhatsAppChat(phone: string | null | undefined, message: string): boolean {
  const normalizedPhone = normalizePhoneToE164(phone);
  if (!normalizedPhone) return false;
  
  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;
  
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}
