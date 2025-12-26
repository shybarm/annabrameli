import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ElectronicSignature {
  id: string;
  record_type: string;
  record_id: string;
  signature_data: string;
  signer_id: string;
  signer_name: string;
  signer_role: string;
  signed_at: string;
  signature_meaning: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface CreateSignatureInput {
  record_type: string;
  record_id: string;
  signature_data: string;
  signer_name: string;
  signer_role: string;
  signature_meaning: string;
}

export function useElectronicSignatures(recordType: string, recordId: string) {
  return useQuery({
    queryKey: ['electronic-signatures', recordType, recordId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('electronic_signatures')
        .select('*')
        .eq('record_type', recordType)
        .eq('record_id', recordId)
        .order('signed_at', { ascending: false });

      if (error) throw error;
      return data as ElectronicSignature[];
    },
    enabled: !!recordId
  });
}

export function useCreateElectronicSignature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSignatureInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('electronic_signatures')
        .insert({
          record_type: input.record_type,
          record_id: input.record_id,
          signature_data: input.signature_data,
          signer_id: user.id,
          signer_name: input.signer_name,
          signer_role: input.signer_role,
          signature_meaning: input.signature_meaning,
          user_agent: navigator.userAgent
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['electronic-signatures', data.record_type, data.record_id] });
      toast.success('החתימה נשמרה בהצלחה');
    },
    onError: (error) => {
      console.error('Error creating signature:', error);
      toast.error('שגיאה בשמירת החתימה');
    }
  });
}
