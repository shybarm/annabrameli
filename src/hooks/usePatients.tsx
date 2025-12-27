import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
}

export function usePatients(clinicId?: string | null) {
  return useQuery({
    queryKey: ['patients', clinicId],
    queryFn: async () => {
      let query = supabase
        .from('patients')
        .select('*, clinic:clinics(id, name)')
        .order('created_at', { ascending: false });
      
      if (clinicId) {
        // Show patients assigned to this clinic OR patients without a clinic (legacy)
        query = query.or(`clinic_id.eq.${clinicId},clinic_id.is.null`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Patient[];
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
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast({ title: 'המטופל נמחק בהצלחה' });
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
        .limit(20);
      
      if (error) throw error;
      return data as Patient[];
    },
    enabled: query.length >= 2,
  });
}
