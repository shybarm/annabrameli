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
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('patient_invitations')
        .insert({
          email: invitation.email,
          first_name: invitation.first_name,
          last_name: invitation.last_name,
          phone: invitation.phone || null,
          invited_by: user?.id,
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

export function usePatientInvitationByCode(code: string | undefined) {
  return useQuery({
    queryKey: ['patient-invitation', code],
    queryFn: async () => {
      // Use edge function to verify invite code securely
      const { data, error } = await supabase.functions.invoke('verify-patient-invite', {
        body: { invite_code: code }
      });

      if (error) throw error;
      
      if (!data.valid) {
        // Return special object to indicate status
        return {
          valid: false,
          accepted: data.accepted || false,
          expired: data.expired || false,
          error: data.error,
        } as any;
      }

      return {
        valid: true,
        ...data.invitation
      } as PatientInvitation & { valid: boolean };
    },
    enabled: !!code,
  });
}

export function useAcceptPatientInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code }: { code: string; userId?: string }) => {
      // Use edge function to accept invitation securely
      const { data, error } = await supabase.functions.invoke('accept-patient-invite', {
        body: { invite_code: code }
      });

      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to accept invitation');
      }

      return { id: data.patient_id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-invitations'] });
      toast({ title: 'הזמנה התקבלה בהצלחה' });
    },
    onError: (error) => {
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
