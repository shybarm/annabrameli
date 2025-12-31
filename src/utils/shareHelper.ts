import { toast } from 'sonner';

interface ShareOptions {
  title?: string;
  text: string;
  phone?: string; // Optional phone number for WhatsApp deep link
}

/**
 * Manual share helper - NO WhatsApp API, NO backend calls
 * 
 * Priority:
 * 1. navigator.share() - native share sheet (mobile)
 * 2. whatsapp://send deep link - opens WhatsApp app directly
 * 3. wa.me web link - last resort fallback
 * 4. Copy to clipboard - final fallback for all devices
 * 
 * All sharing is user-initiated only. Does not automatically include PHI.
 */
export function shareViaWhatsApp(options: ShareOptions): boolean {
  const { title, text, phone } = options;
  const encodedText = encodeURIComponent(text);
  
  // Try native share first (works on mobile)
  if (navigator.share && typeof navigator.share === 'function') {
    // Fire and forget - don't await to keep it synchronous for click handlers
    navigator.share({
      title: title || 'שיתוף',
      text: text,
    }).catch((error: any) => {
      if (error.name !== 'AbortError') {
        // Native share failed, try WhatsApp deep link
        tryWhatsAppDeepLink(encodedText, phone);
      }
    });
    return true;
  }
  
  // Fallback A: WhatsApp app deep link (whatsapp:// protocol)
  // This must be triggered directly by click - no async before
  return tryWhatsAppDeepLink(encodedText, phone);
}

/**
 * Try WhatsApp deep link, fallback to wa.me, then clipboard
 */
function tryWhatsAppDeepLink(encodedText: string, phone?: string): boolean {
  // Build whatsapp:// deep link (opens app directly)
  const whatsappAppUrl = phone 
    ? `whatsapp://send?phone=${phone.replace(/\D/g, '')}&text=${encodedText}`
    : `whatsapp://send?text=${encodedText}`;
  
  // Try app deep link first
  const appLink = document.createElement('a');
  appLink.href = whatsappAppUrl;
  appLink.style.display = 'none';
  document.body.appendChild(appLink);
  
  try {
    appLink.click();
    document.body.removeChild(appLink);
    
    // Set a short timeout to detect if app didn't open, then try wa.me
    setTimeout(() => {
      // If we're still here after 1.5s, try wa.me as fallback
      tryWaMeLink(encodedText, phone);
    }, 1500);
    
    return true;
  } catch (error) {
    document.body.removeChild(appLink);
    // App link failed, try wa.me
    return tryWaMeLink(encodedText, phone);
  }
}

/**
 * Try wa.me web link as fallback
 */
function tryWaMeLink(encodedText: string, phone?: string): boolean {
  const waMeUrl = phone 
    ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;
  
  try {
    const newWindow = window.open(waMeUrl, '_blank', 'noopener,noreferrer');
    if (newWindow) {
      return true;
    }
  } catch (error) {
    console.log('wa.me link failed, falling back to clipboard');
  }
  
  // Final fallback: copy to clipboard
  copyToClipboard(decodeURIComponent(encodedText));
  return false;
}

/**
 * Copy text to clipboard with toast notification
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      toast.success('הטקסט הועתק ללוח', {
        description: 'כעת ניתן להדביק בוואטסאפ או בכל אפליקציה אחרת'
      });
      return true;
    }
    
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) {
      toast.success('הטקסט הועתק ללוח', {
        description: 'כעת ניתן להדביק בוואטסאפ או בכל אפליקציה אחרת'
      });
      return true;
    }
    
    throw new Error('Copy command failed');
  } catch (error) {
    toast.error('לא ניתן להעתיק', {
      description: 'נסה לסמן את הטקסט ולהעתיק ידנית'
    });
    return false;
  }
}

/**
 * Share dialog component helper - shows options for sharing
 */
export function getShareMethods(): { native: boolean; whatsapp: boolean; clipboard: boolean } {
  return {
    native: typeof navigator.share === 'function',
    whatsapp: true, // Always available via deep link
    clipboard: typeof navigator.clipboard?.writeText === 'function' || typeof document.execCommand === 'function'
  };
}
