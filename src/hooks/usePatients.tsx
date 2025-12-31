import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Normalize phone to E.164 format for Israel (consistent with backend)
export function normalizePhoneForStorage(phone: string): string {
  // Remove all non-digit characters except +
  let normalized = phone.replace(/[^\d+]/g, '');
  
  // Handle Israeli phone numbers
  if (normalized.startsWith('0')) {
    // Israeli local format: 05xxxxxxxx -> +9725xxxxxxxx
    normalized = '+972' + normalized.substring(1);
  } else if (normalized.startsWith('972') && !normalized.startsWith('+')) {
    normalized = '+' + normalized;
  } else if (!normalized.startsWith('+') && normalized.length > 0) {
    // Assume Israeli number without prefix
    normalized = '+972' + normalized;
  }
  
  return normalized;
}

export interface Patient {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  id_number: string | null;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  insurance_provider: string | null;
  insurance_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  medical_notes: string | null;
  allergies: string[] | null;
  consent_signed: boolean;
  consent_signed_at: string | null;
  gdpr_consent: boolean;
  gdpr_consent_at: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  clinic_id: string | null;
  clinic?: { id: string; name: string } | null;
  intake_completed_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface PatientInput {
  first_name: string;
  last_name: string;
  id_number?: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  insurance_provider?: string;
  insurance_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_notes?: string;
  allergies?: string[];
  clinic_id?: string;
  status?: string;
}

export function usePatients(clinicId?: string | null) {
  return useQuery({
    queryKey: ['patients', clinicId],
    queryFn: async () => {
      // Get staff user IDs to exclude
      const { data: staffRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin', 'doctor', 'secretary']);
      
      const staffUserIds = staffRoles?.map(r => r.user_id).filter(Boolean) || [];

      let query = supabase
        .from('patients')
        .select('*, clinic:clinics(id, name)')
        .order('created_at', { ascending: false });
      
      if (clinicId) {
        // Show ONLY patients assigned to this clinic
        query = query.eq('clinic_id', clinicId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Filter out patients who are staff members and those pending email verification (inactive from guest booking)
      const filteredData = (data || []).filter(patient => {
        if (patient.status === 'inactive') return false;
        return !patient.user_id || !staffUserIds.includes(patient.user_id);
      });

      return filteredData as Patient[];
    },
  });
}

export function usePatient(id: string | undefined) {
  return useQuery({
    queryKey: ['patients', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Patient | null;
    },
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: PatientInput) => {
      const { data, error } = await supabase
        .from('patients')
        .insert(input)
        .select()
        .single();
      
      if (error) throw error;
      return data as Patient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast({ title: 'מטופל נוסף בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    },
  });
}

// Find existing patient by clinic_id + normalized phone (duplicate prevention)
export function useFindExistingPatient() {
  return async (clinicId: string, normalizedPhone: string): Promise<Patient | null> => {
    if (!clinicId || !normalizedPhone) return null;
    
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('phone', normalizedPhone)
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error('Error finding existing patient:', error);
      return null;
    }
    
    return data as Patient | null;
  };
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...input }: PatientInput & { id: string }) => {
      const { data, error } = await supabase
        .from('patients')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Patient;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patients', variables.id] });
      toast({ title: 'המטופל עודכן בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Delete all appointments for this patient first
      const { error: appointmentsError } = await supabase
        .from('appointments')
        .delete()
        .eq('patient_id', id);
      
      if (appointmentsError) throw appointmentsError;
      
      // Delete patient documents records (storage files remain for audit)
      const { error: docsError } = await supabase
        .from('patient_documents')
        .delete()
        .eq('patient_id', id);
      
      if (docsError) throw docsError;
      
      // Delete messages
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('patient_id', id);
      
      if (messagesError) throw messagesError;
      
      // Delete invoices and invoice items (cascade via FK) 
      const { error: invoicesError } = await supabase
        .from('invoices')
        .delete()
        .eq('patient_id', id);
      
      if (invoicesError) throw invoicesError;
      
      // Delete patient invitations
      const { error: invitationsError } = await supabase
        .from('patient_invitations')
        .delete()
        .eq('patient_id', id);
      
      if (invitationsError) throw invitationsError;
      
      // Delete intake tokens
      const { error: tokensError } = await supabase
        .from('intake_tokens')
        .delete()
        .eq('patient_id', id);
      
      if (tokensError) throw tokensError;
      
      // Delete waitlist entries
      const { error: waitlistError } = await supabase
        .from('waitlist')
        .delete()
        .eq('patient_id', id);
      
      if (waitlistError) throw waitlistError;
      
      // Delete email verifications
      const { error: emailVerError } = await supabase
        .from('email_verifications')
        .delete()
        .eq('patient_id', id);
      
      if (emailVerError) throw emailVerError;
      
      // Delete upload tokens
      const { error: uploadTokensError } = await supabase
        .from('upload_tokens')
        .delete()
        .eq('patient_id', id);
      
      if (uploadTokensError) throw uploadTokensError;
      
      // Finally delete the patient
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'המטופל וכל הנתונים הקשורים נמחקו בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה במחיקת המטופל', description: error.message, variant: 'destructive' });
    },
  });
}

export function useSearchPatients(query: string) {
  return useQuery({
    queryKey: ['patients', 'search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      
      const { data, error } = await supabase
        .from('patients')
        .select('*, clinic:clinics(id, name)')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%,id_number.ilike.%${query}%`)
        .neq('status', 'pending_verification')
        .limit(20);
      
      if (error) throw error;
      return data as Patient[];
    },
    enabled: query.length >= 2,
  });
}
