import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function usePatientDocumentUpload() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ file, title, description }: { file: File; title?: string; description?: string }) => {
      // Get patient record
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (patientError || !patient) {
        throw new Error('לא נמצא רשומת מטופל');
      }

      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        throw new Error('סוג קובץ לא נתמך. ניתן להעלות PDF, תמונות או מסמכי Word');
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('הקובץ גדול מדי. גודל מקסימלי: 10MB');
      }

      // Upload file
      const fileExt = file.name.split('.').pop();
      const filePath = `${patient.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('patient-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data: doc, error: dbError } = await supabase
        .from('patient_documents')
        .insert({
          patient_id: patient.id,
          title: title || file.name,
          description: description || null,
          file_path: filePath,
          document_type: 'other', // Patient uploads are categorized as 'other'
          mime_type: file.type,
          file_size: file.size,
          uploaded_by: user!.id,
        })
        .select()
        .single();

      if (dbError) throw dbError;
      return doc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-portal-documents'] });
      toast({ title: 'המסמך הועלה בהצלחה' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'שגיאה בהעלאת המסמך', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
}
