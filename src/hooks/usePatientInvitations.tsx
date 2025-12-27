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

      // Check if there's an existing patient to link
      if (invitation.patient_id) {
        // Link existing patient record to user
        const { error: updatePatientError } = await supabase
          .from('patients')
          .update({ user_id: userId })
          .eq('id', invitation.patient_id);

        if (updatePatientError) throw updatePatientError;

        // Assign patient role
        await supabase
          .from('user_roles')
          .upsert({
            user_id: userId,
            role: 'patient',
          }, { onConflict: 'user_id,role' });

        // Mark invitation as accepted
        await supabase
          .from('patient_invitations')
          .update({ accepted_at: new Date().toISOString() })
          .eq('id', invitation.id);

        return { id: invitation.patient_id };
      }

      // Create new patient record
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

      // Create invitation linked to existing patient
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
