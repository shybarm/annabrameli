import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SendConfirmationEmailParams {
  appointmentId: string;
  patientEmail: string;
  patientName: string;
  appointmentDate: string;
  appointmentTypeName: string;
  clinicName: string;
  clinicAddress: string;
  clinicCity: string;
  clinicPhone?: string;
}

/**
 * Hook to send appointment confirmation email with calendar invite
 * NO PHI is included in the email - only appointment logistics
 */
export function useSendAppointmentConfirmation() {
  return useMutation({
    mutationFn: async (params: SendConfirmationEmailParams) => {
      console.log('Sending confirmation email for appointment:', params.appointmentId);
      
      const { data, error } = await supabase.functions.invoke('send-appointment-confirmation', {
        body: params
      });
      
      if (error) {
        console.error('Error sending confirmation email:', error);
        throw new Error(error.message || 'Failed to send confirmation email');
      }
      
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to send confirmation email');
      }
      
      return data;
    },
    onSuccess: () => {
      toast({ title: 'אישור התור נשלח בהצלחה', description: 'המטופל יקבל אימייל עם פרטי התור ואפשרות להוספה ליומן' });
    },
    onError: (error: Error) => {
      console.error('Failed to send confirmation:', error);
      toast({ 
        title: 'שגיאה בשליחת אישור', 
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}
