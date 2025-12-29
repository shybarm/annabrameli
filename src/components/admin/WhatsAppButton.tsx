import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { normalizePhoneToE164, openWhatsAppChat } from '@/lib/whatsapp';

interface WhatsAppButtonProps {
  phone: string | null | undefined;
  message: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function WhatsAppButton({ 
  phone, 
  message, 
  variant = 'outline',
  size = 'sm',
  className = ''
}: WhatsAppButtonProps) {
  const isValid = !!normalizePhoneToE164(phone);
  
  const handleClick = () => {
    openWhatsAppChat(phone, message);
  };
  
  return (
    <div className="flex flex-col">
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={!isValid}
        className={`gap-1 ${className}`}
      >
        <MessageCircle className="h-4 w-4" />
        שלח ב-WhatsApp
      </Button>
      {!isValid && (
        <span className="text-xs text-destructive mt-1">
          חסר מספר טלפון תקין לשליחה ב-WhatsApp
        </span>
      )}
    </div>
  );
}
