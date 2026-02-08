import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MedicalUpdate {
  id: string;
  title: string;
  title_he: string;
  summary_he: string;
  source: string;
  source_url: string | null;
  pubmed_id: string | null;
  published_date: string;
  is_published: boolean;
  created_at: string;
}

export function useMedicalUpdates(limit?: number) {
  return useQuery({
    queryKey: ["medical-updates", limit],
    queryFn: async () => {
      let query = supabase
        .from("medical_updates")
        .select("*")
        .eq("is_published", true)
        .order("published_date", { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as MedicalUpdate[];
    },
  });
}
