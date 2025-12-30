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
 * Opens WhatsApp handoff page with prefilled message.
 * Uses wa.me which shows "Open app / Continue to WhatsApp Web" flow.
 * 
 * @param phone - Phone number (will be normalized to E.164). If invalid, opens share mode.
 * @param text - Message text to prefill
 */
export function openWhatsAppHandoff(phone: string | null | undefined, text: string): void {
  const normalizedPhone = normalizePhoneToE164(phone);
  const encoded = encodeURIComponent(text);
  
  // If valid phone, open direct chat; otherwise use share mode
  const url = normalizedPhone 
    ? `https://wa.me/${normalizedPhone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
  
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Builds a WhatsApp message with standard header and body.
 */
export function buildWhatsAppMessage({
  patientName,
  clinicName,
  body,
  url,
  isFileWithoutUrl = false,
}: {
  patientName: string;
  clinicName: string;
  body: string;
  url?: string;
  isFileWithoutUrl?: boolean;
}): string {
  let message = `היי ${patientName}, כאן ${clinicName}.\n\n${body}`;
  
  if (url) {
    message += `\n\n${url}`;
  }
  
  if (isFileWithoutUrl) {
    message += `\n\nצרפתי קובץ. הורד/י אותו מהמערכת וצרף/י אותו ב-WhatsApp.`;
  }
  
  return message;
}
