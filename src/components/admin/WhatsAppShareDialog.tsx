import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MessageCircle, FileText, Receipt, ClipboardList, Link2, Send } from 'lucide-react';
import { openWhatsAppHandoff, buildWhatsAppMessage } from '@/lib/whatsapp';

export interface ShareOption {
  id: string;
  label: string;
  icon: 'document' | 'invoice' | 'form' | 'summary' | 'link';
  body: string;
  url?: string;
  isFileWithoutUrl?: boolean;
}

interface WhatsAppShareDialogProps {
  phone: string | null | undefined;
  patientName: string;
  clinicName?: string;
  options: ShareOption[];
  triggerClassName?: string;
  triggerVariant?: 'default' | 'outline' | 'ghost' | 'secondary';
  triggerSize?: 'default' | 'sm' | 'lg' | 'icon';
}

const iconMap = {
  document: FileText,
  invoice: Receipt,
  form: ClipboardList,
  summary: FileText,
  link: Link2,
};

export function WhatsAppShareDialog({
  phone,
  patientName,
  clinicName = 'המרפאה',
  options,
  triggerClassName = '',
  triggerVariant = 'outline',
  triggerSize = 'sm',
}: WhatsAppShareDialogProps) {
  const [open, setOpen] = useState(false);

  const handleShare = (option: ShareOption) => {
    const message = buildWhatsAppMessage({
      patientName,
      clinicName,
      body: option.body,
      url: option.url,
      isFileWithoutUrl: option.isFileWithoutUrl,
    });
    
    openWhatsAppHandoff(phone, message);
    setOpen(false);
  };

  if (options.length === 0) {
    return null;
  }

  // If only one option, send directly without dialog
  if (options.length === 1) {
    return (
      <Button
        variant={triggerVariant}
        size={triggerSize}
        className={`gap-1 ${triggerClassName}`}
        onClick={() => handleShare(options[0])}
      >
        <MessageCircle className="h-4 w-4" />
        שלח ב-WhatsApp
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant}
          size={triggerSize}
          className={`gap-1 ${triggerClassName}`}
        >
          <MessageCircle className="h-4 w-4" />
          שלח ב-WhatsApp
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">בחר מה לשתף</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2 mt-4">
          {options.map((option) => {
            const IconComponent = iconMap[option.icon];
            return (
              <Button
                key={option.id}
                variant="outline"
                className="justify-between h-auto py-3"
                onClick={() => handleShare(option)}
              >
                <div className="flex items-center gap-2">
                  <IconComponent className="h-4 w-4 text-muted-foreground" />
                  <span>{option.label}</span>
                </div>
                <Send className="h-4 w-4 text-primary" />
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
