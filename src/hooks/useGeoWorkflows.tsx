import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PageWorkflow {
  status: string;
  priority: string;
  owner: string;
  lastReviewed: string;
  notes: string;
}

export type ChecklistMap = Record<string, Record<string, boolean>>;
export type WorkflowMap = Record<string, PageWorkflow>;

/**
 * Persists GEO page workflow state (status, priority, owner, notes, checklist)
 * to the `geo_page_workflows` table and keeps a local cache in sync.
 */
export function useGeoWorkflows(defaultWorkflows: WorkflowMap) {
  const [workflows, setWorkflows] = useState<WorkflowMap>(defaultWorkflows);
  const [checklists, setChecklists] = useState<ChecklistMap>({});
  const [loaded, setLoaded] = useState(false);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Load from DB on mount
  useEffect(() => {
    if (loaded) return;
    let cancelled = false;

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('geo_page_workflows' as any)
          .select('*');

        if (error || !data) {
          console.error('Failed to load workflows:', error);
          return;
        }

        if (cancelled) return;

        const wf: WorkflowMap = { ...defaultWorkflows };
        const cl: ChecklistMap = {};

        for (const row of data as any[]) {
          wf[row.page_id] = {
            status: row.status || 'not_reviewed',
            priority: row.priority || 'medium',
            owner: row.owner || '',
            lastReviewed: row.last_reviewed || '',
            notes: row.notes || '',
          };
          if (row.checklist && typeof row.checklist === 'object') {
            cl[row.page_id] = row.checklist as Record<string, boolean>;
          }
        }

        setWorkflows(wf);
        setChecklists(cl);
      } catch (err) {
        console.error('Failed to load geo workflows:', err);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced save to DB
  const persistWorkflow = useCallback((pageId: string, wf: PageWorkflow, cl?: Record<string, boolean>) => {
    // Clear any pending save for this page
    if (saveTimers.current[pageId]) {
      clearTimeout(saveTimers.current[pageId]);
    }

    saveTimers.current[pageId] = setTimeout(async () => {
      try {
        const row = {
          page_id: pageId,
          status: wf.status,
          priority: wf.priority,
          owner: wf.owner,
          notes: wf.notes,
          last_reviewed: wf.lastReviewed,
          checklist: cl ?? {},
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('geo_page_workflows' as any)
          .upsert(row, { onConflict: 'page_id' });

        if (error) {
          console.error('Failed to persist workflow:', error);
        }
      } catch (err) {
        console.error('Failed to persist workflow:', err);
      }
    }, 500); // 500ms debounce
  }, []);

  const updateWorkflow = useCallback((pageId: string, updated: PageWorkflow) => {
    setWorkflows(prev => {
      const next = { ...prev, [pageId]: updated };
      persistWorkflow(pageId, updated, checklists[pageId]);
      return next;
    });
  }, [persistWorkflow, checklists]);

  const toggleChecklistItem = useCallback((pageId: string, itemId: string, checked: boolean) => {
    setChecklists(prev => {
      const pageChecklist = { ...prev[pageId], [itemId]: checked };
      const next = { ...prev, [pageId]: pageChecklist };
      // Persist with current workflow
      const wf = workflows[pageId];
      if (wf) {
        persistWorkflow(pageId, wf, pageChecklist);
      }
      return next;
    });
  }, [persistWorkflow, workflows]);

  return {
    workflows,
    checklists,
    updateWorkflow,
    toggleChecklistItem,
    loaded,
  };
}
