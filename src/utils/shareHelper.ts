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
 * 2. WhatsApp deep link - opens WhatsApp Web/App
 * 3. Copy to clipboard - fallback for all devices
 * 
 * All sharing is user-initiated only. Does not automatically include PHI.
 */
export async function shareViaWhatsApp(options: ShareOptions): Promise<boolean> {
  const { title, text, phone } = options;
  
  // Try native share first (works on mobile)
  if (navigator.share && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: title || 'שיתוף',
        text: text,
      });
      return true;
    } catch (error: any) {
      // User cancelled or share failed - try fallback
      if (error.name !== 'AbortError') {
        console.log('Native share failed, trying WhatsApp deep link');
      } else {
        // User cancelled - don't show error
        return false;
      }
    }
  }
  
  // Fallback: WhatsApp deep link (no API, just URL)
  try {
    const encodedText = encodeURIComponent(text);
    // Use wa.me without phone to let user choose recipient
    // If phone provided, include it for convenience
    const whatsappUrl = phone 
      ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;
    
    const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    
    if (newWindow) {
      return true;
    }
    
    // Popup might be blocked - try direct navigation
    window.location.href = whatsappUrl;
    return true;
  } catch (error) {
    console.log('WhatsApp deep link failed, falling back to clipboard');
  }
  
  // Final fallback: copy to clipboard
  return copyToClipboard(text);
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
