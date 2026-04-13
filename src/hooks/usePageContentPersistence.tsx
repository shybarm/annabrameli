import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { CurrentPageSection } from '@/data/geo-current-page-content';

export function usePageContentPersistence() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const savePage = useCallback(async (pageId: string, sections: CurrentPageSection[]) => {
    setSaving(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('page_content_overrides' as any)
        .upsert({
          page_id: pageId,
          sections: JSON.parse(JSON.stringify(sections)),
          version_label: 'applied',
          applied_by: user?.user?.id || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'page_id' });

      if (error) throw error;
      toast.success(`תוכן הדף "${pageId}" נשמר לצמיתות`);
      return true;
    } catch (err: any) {
      console.error('Failed to save page content:', err);
      toast.error('שגיאה בשמירת התוכן: ' + (err.message || 'שגיאה לא ידועה'));
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const loadAllOverrides = useCallback(async (): Promise<Record<string, CurrentPageSection[]>> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('page_content_overrides' as any)
        .select('page_id, sections');

      if (error) throw error;
      
      const overrides: Record<string, CurrentPageSection[]> = {};
      if (data) {
        for (const row of data as any[]) {
          overrides[row.page_id] = row.sections as CurrentPageSection[];
        }
      }
      return overrides;
    } catch (err: any) {
      console.error('Failed to load page content overrides:', err);
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  return { savePage, loadAllOverrides, saving, loading };
}
