import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAllergySuggestions() {
  return useQuery({
    queryKey: ['allergy-suggestions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('allergies')
        .not('allergies', 'is', null);
      
      if (error) throw error;
      
      // Collect all unique allergies
      const allergiesSet = new Set<string>();
      data.forEach(patient => {
        if (patient.allergies && Array.isArray(patient.allergies)) {
          patient.allergies.forEach((allergy: string) => {
            if (allergy && allergy.trim()) {
              allergiesSet.add(allergy.trim());
            }
          });
        }
      });
      
      return Array.from(allergiesSet).sort();
    },
  });
}
