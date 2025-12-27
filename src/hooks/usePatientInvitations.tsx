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
      const { data, error } = await supabase
        .from('patient_invitations')
        .select('*')
        .eq('invite_code', code!)
        .single();

      if (error) throw error;
      return data as PatientInvitation;
    },
    enabled: !!code,
  });
}

export function useAcceptPatientInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code, userId }: { code: string; userId: string }) => {
      // Get the invitation
      const { data: invitation, error: invError } = await supabase
        .from('patient_invitations')
        .select('*')
        .eq('invite_code', code)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (invError || !invitation) {
        throw new Error('הזמנה לא נמצאה או שפג תוקפה');
      }

      // Create patient record
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .insert({
          user_id: userId,
          first_name: invitation.first_name,
          last_name: invitation.last_name,
          email: invitation.email,
          phone: invitation.phone,
        })
        .select()
        .single();

      if (patientError) throw patientError;

      // Assign patient role
      await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'patient',
        })
        .select();

      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('patient_invitations')
        .update({ 
          accepted_at: new Date().toISOString(),
          patient_id: patient.id,
        })
        .eq('id', invitation.id);

      if (updateError) throw updateError;

      return patient;
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
