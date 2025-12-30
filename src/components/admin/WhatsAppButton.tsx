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
  const handleClick = () => {
    openWhatsAppChat(phone, message);
  };
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={`gap-1 ${className}`}
    >
      <MessageCircle className="h-4 w-4" />
      שלח ב-WhatsApp
    </Button>
  );
}
