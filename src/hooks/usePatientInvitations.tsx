import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PatientInvitation {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  invite_code: string;
  invited_by: string | null;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  patient_id: string | null;
}

export function usePatientInvitations() {
  return useQuery({
    queryKey: ['patient-invitations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PatientInvitation[];
    },
  });
}

export function useCreatePatientInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitation: {
      email: string;
      first_name: string;
      last_name: string;
      phone?: string;
      patient_id?: string; // Allow explicit patient_id
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      let patientId = invitation.patient_id;
      
      // CRITICAL: Always try to find existing patient to prevent duplicates
      if (!patientId) {
        // Try to find existing patient by phone first (more reliable)
        if (invitation.phone) {
          const { data: byPhone } = await supabase
            .from('patients')
            .select('id')
            .eq('phone', invitation.phone.trim())
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();
          
          if (byPhone) {
            patientId = byPhone.id;
          }
        }
        
        // Try email if no phone match
        if (!patientId && invitation.email) {
          const { data: byEmail } = await supabase
            .from('patients')
            .select('id')
            .eq('email', invitation.email.trim().toLowerCase())
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();
          
          if (byEmail) {
            patientId = byEmail.id;
          }
        }
      }
      
      const { data, error } = await supabase
        .from('patient_invitations')
        .insert({
          email: invitation.email.trim().toLowerCase(),
          first_name: invitation.first_name.trim(),
          last_name: invitation.last_name.trim(),
          phone: invitation.phone?.trim() || null,
          invited_by: user?.id,
          patient_id: patientId || null, // Link to existing patient if found
        })
        .select()
        .single();

      if (error) throw error;
      return data as PatientInvitation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-invitations'] });
      toast({ title: 'הזמנה נשלחה בהצלחה' });
    },
    onError: (error) => {
      toast({ 
        title: 'שגיאה בשליחת הזמנה', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
}

export function useDeletePatientInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('patient_invitations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-invitations'] });
      toast({ title: 'הזמנה נמחקה' });
    },
    onError: (error) => {
      toast({ 
        title: 'שגיאה במחיקת הזמנה', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
}

// Helper to get user-friendly error message in Hebrew
function getErrorMessage(code: string | undefined, fallback: string): string {
  switch (code) {
    case 'INVITE_NOT_FOUND':
      return 'הזמנה לא נמצאה. ייתכן שהקישור שגוי.';
    case 'INVITE_ALREADY_USED':
      return 'ההזמנה כבר מומשה. ניתן להתחבר לפורטל.';
    case 'INVITE_EXPIRED':
      return 'פג תוקף ההזמנה. אנא פנה למרפאה לקבלת הזמנה חדשה.';
    case 'BAD_REQUEST':
      return 'בקשה שגויה. אנא נסה שוב.';
    case 'UNAUTHORIZED':
      return 'יש להתחבר למערכת כדי לקבל את ההזמנה.';
    case 'SERVER_ERROR':
      return 'שגיאת שרת. אנא נסה שוב מאוחר יותר.';
    default:
      return fallback;
  }
}

export function usePatientInvitationByCode(code: string | undefined) {
  return useQuery({
    queryKey: ['patient-invitation', code],
    queryFn: async () => {
      // Validate code before making request
      if (!code || code.trim() === '') {
        console.log('usePatientInvitationByCode: No code provided');
        return {
          valid: false,
          accepted: false,
          expired: false,
          error: 'קישור הזמנה חסר',
        } as any;
      }

      console.log('usePatientInvitationByCode: Verifying code:', code.substring(0, 8) + '...');

      // Use edge function to verify invite code securely
      const { data, error } = await supabase.functions.invoke('verify-patient-invite', {
        body: { invite_code: code.trim() }
      });

      console.log('usePatientInvitationByCode: Response:', { data, error });

      // Handle edge function errors (non-2xx responses)
      if (error) {
        console.error('usePatientInvitationByCode: Edge function error:', error);
        
        // Try to parse error context for specific error codes
        const errorCode = error.context?.code || 'SERVER_ERROR';
        const errorMsg = getErrorMessage(errorCode, error.message || 'שגיאה באימות ההזמנה');
        
        // For known error codes, return a structured response instead of throwing
        if (errorCode === 'INVITE_NOT_FOUND') {
          return { valid: false, accepted: false, expired: false, error: errorMsg };
        }
        if (errorCode === 'INVITE_ALREADY_USED') {
          return { valid: false, accepted: true, expired: false, error: errorMsg };
        }
        if (errorCode === 'INVITE_EXPIRED') {
          return { valid: false, accepted: false, expired: true, error: errorMsg };
        }
        
        throw new Error(errorMsg);
      }
      
      if (!data?.valid) {
        // Return special object to indicate status
        return {
          valid: false,
          accepted: data?.accepted || false,
          expired: data?.expired || false,
          error: data?.error || 'הזמנה לא תקינה',
        } as any;
      }

      return {
        valid: true,
        ...data.invitation
      } as PatientInvitation & { valid: boolean };
    },
    enabled: !!code && code.trim() !== '',
    retry: false, // Don't retry on 404/409/410 errors
  });
}

export function useAcceptPatientInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code }: { code: string; userId?: string }) => {
      // Validate code before making request
      if (!code || code.trim() === '') {
        throw new Error('קוד הזמנה חסר');
      }

      console.log('useAcceptPatientInvitation: Accepting code:', code.substring(0, 8) + '...');

      // Use edge function to accept invitation securely
      const { data, error } = await supabase.functions.invoke('accept-patient-invite', {
        body: { invite_code: code.trim() }
      });

      console.log('useAcceptPatientInvitation: Response:', { data, error });

      // Handle edge function errors
      if (error) {
        console.error('useAcceptPatientInvitation: Edge function error:', error);
        const errorCode = error.context?.code;
        throw new Error(getErrorMessage(errorCode, error.message || 'שגיאה בקבלת ההזמנה'));
      }
      
      if (!data?.success) {
        const errorCode = data?.code;
        throw new Error(getErrorMessage(errorCode, data?.error || 'שגיאה בקבלת ההזמנה'));
      }

      return { id: data.patient_id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-invitations'] });
      toast({ title: 'הזמנה התקבלה בהצלחה' });
    },
    onError: (error) => {
      console.error('useAcceptPatientInvitation: Mutation error:', error);
      toast({ 
        title: 'שגיאה בקבלת הזמנה', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
}

// Invite existing patient to portal
export function useInviteExistingPatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patientId: string) => {
      // Get patient details
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id, first_name, last_name, email, phone, user_id')
        .eq('id', patientId)
        .single();

      if (patientError) throw patientError;
      if (!patient) throw new Error('מטופל לא נמצא');
      if (patient.user_id) throw new Error('למטופל זה כבר יש חשבון בפורטל');
      if (!patient.email) throw new Error('לא ניתן לשלוח הזמנה ללא כתובת אימייל');

      const { data: { user } } = await supabase.auth.getUser();

      // Check if invitation already exists for this patient
      const { data: existingInvite } = await supabase
        .from('patient_invitations')
        .select('*')
        .eq('patient_id', patientId)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // If valid invitation exists, return it (resend link scenario)
      if (existingInvite) {
        return existingInvite as PatientInvitation;
      }

      // Create new invitation linked to existing patient
      const { data, error } = await supabase
        .from('patient_invitations')
        .insert({
          email: patient.email,
          first_name: patient.first_name,
          last_name: patient.last_name,
          phone: patient.phone || null,
          invited_by: user?.id,
          patient_id: patientId,
        })
        .select()
        .single();

      if (error) throw error;
      return data as PatientInvitation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-invitations'] });
      toast({ title: 'הזמנה לפורטל נוצרה בהצלחה' });
    },
    onError: (error) => {
      toast({ 
        title: 'שגיאה ביצירת הזמנה', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
}

// Get portal invitation for a specific patient
export function usePatientPortalInvitation(patientId: string | undefined) {
  return useQuery({
    queryKey: ['patient-portal-invitation', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_invitations')
        .select('*')
        .eq('patient_id', patientId!)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as PatientInvitation | null;
    },
    enabled: !!patientId,
  });
}
