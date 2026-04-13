import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ClusterActionType =
  | 'add_internal_link'
  | 'assign_to_cluster'
  | 'create_brief'
  | 'generate_draft'
  | 'queue_to_sprint';

export interface ClusterAction {
  id: string;
  type: ClusterActionType;
  clusterId: string;
  pageTitle: string;
  pagePath: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  metadata: Record<string, any>;
  createdAt: string;
  completedAt?: string;
}

const ACTION_LABELS: Record<ClusterActionType, string> = {
  add_internal_link: 'הוספת קישור פנימי',
  assign_to_cluster: 'שיוך לאשכול',
  create_brief: 'יצירת בריף',
  generate_draft: 'יצירת טיוטה',
  queue_to_sprint: 'הוספה לתוכנית 90 יום',
};

export function useClusterActions() {
  const [actions, setActions] = useState<ClusterAction[]>([]);
  const [processing, setProcessing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load persisted actions from DB on mount
  useEffect(() => {
    if (loaded) return;
    let cancelled = false;

    const loadActions = async () => {
      try {
        const { data, error } = await supabase
          .from('geo_cluster_actions' as any)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error || !data) return;

        if (!cancelled) {
          setActions((data as any[]).map(row => ({
            id: row.id,
            type: row.action_type as ClusterActionType,
            clusterId: row.cluster_id,
            pageTitle: row.page_title,
            pagePath: row.page_path || '',
            status: row.status as ClusterAction['status'],
            metadata: row.metadata || {},
            createdAt: row.created_at,
            completedAt: row.completed_at || undefined,
          })));
        }
      } catch (err) {
        console.error('Failed to load cluster actions:', err);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };

    loadActions();
    return () => { cancelled = true; };
  }, [loaded]);

  const addAction = useCallback((
    type: ClusterActionType,
    clusterId: string,
    pageTitle: string,
    pagePath: string,
    metadata: Record<string, any> = {},
  ): ClusterAction => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const action: ClusterAction = {
      id: tempId,
      type,
      clusterId,
      pageTitle,
      pagePath,
      status: 'pending',
      metadata,
      createdAt: new Date().toISOString(),
    };
    setActions(prev => [action, ...prev]);
    toast.info(`${ACTION_LABELS[type]}: ${pageTitle}`);

    // Persist to DB in background
    (async () => {
      try {
        const { data, error } = await supabase
          .from('geo_cluster_actions' as any)
          .insert({
            action_type: type,
            cluster_id: clusterId,
            page_title: pageTitle,
            page_path: pagePath,
            status: 'pending',
            metadata,
          })
          .select('id')
          .single();

        if (!error && data) {
          // Replace temp ID with real DB ID
          setActions(prev => prev.map(a =>
            a.id === tempId ? { ...a, id: (data as any).id } : a
          ));
        }
      } catch (err) {
        console.error('Failed to persist action:', err);
      }
    })();

    return action;
  }, []);

  const executeAction = useCallback(async (actionId: string): Promise<boolean> => {
    setProcessing(true);
    setActions(prev => prev.map(a =>
      a.id === actionId ? { ...a, status: 'in_progress' as const } : a
    ));

    const action = actions.find(a => a.id === actionId);
    if (!action) {
      setProcessing(false);
      return false;
    }

    try {
      // Execute real side effects based on action type
      let success = false;

      switch (action.type) {
        case 'add_internal_link': {
          // Persist internal link metadata to page_content_overrides or content brief
          const { error } = await supabase
            .from('geo_content_briefs' as any)
            .insert({
              page_title: action.pageTitle,
              page_path: action.pagePath,
              cluster_id: action.clusterId,
              brief_type: 'internal_link',
              content: {
                action: 'add_internal_link',
                linksMissing: action.metadata.linksMissing || [],
                appliedAt: new Date().toISOString(),
              },
            });
          success = !error;
          if (error) console.error('add_internal_link failed:', error);
          break;
        }

        case 'assign_to_cluster': {
          // Persist cluster assignment
          const { error } = await supabase
            .from('geo_content_briefs' as any)
            .insert({
              page_title: action.pageTitle,
              page_path: action.pagePath,
              cluster_id: action.clusterId,
              brief_type: 'cluster_assignment',
              content: {
                action: 'assign_to_cluster',
                clusterId: action.clusterId,
                intent: action.metadata.intent,
                role: action.metadata.role,
                assignedAt: new Date().toISOString(),
              },
            });
          success = !error;
          if (error) console.error('assign_to_cluster failed:', error);
          break;
        }

        case 'create_brief': {
          // Persist the brief content
          const { error } = await supabase
            .from('geo_content_briefs' as any)
            .insert({
              page_title: action.pageTitle,
              page_path: action.pagePath,
              cluster_id: action.clusterId,
              brief_type: 'brief',
              content: {
                briefContent: action.metadata.briefContent || '',
                intent: action.metadata.intent,
                role: action.metadata.role,
                createdAt: new Date().toISOString(),
              },
            });
          success = !error;
          if (error) console.error('create_brief failed:', error);
          break;
        }

        case 'generate_draft': {
          // Persist draft placeholder
          const { error } = await supabase
            .from('geo_content_briefs' as any)
            .insert({
              page_title: action.pageTitle,
              page_path: action.pagePath,
              cluster_id: action.clusterId,
              brief_type: 'draft',
              content: {
                action: 'generate_draft',
                intent: action.metadata.intent,
                status: 'draft_generated',
                generatedAt: new Date().toISOString(),
              },
            });
          success = !error;
          if (error) console.error('generate_draft failed:', error);
          break;
        }

        case 'queue_to_sprint': {
          // Persist sprint task
          const { error } = await supabase
            .from('geo_content_briefs' as any)
            .insert({
              page_title: action.pageTitle,
              page_path: action.pagePath,
              cluster_id: action.clusterId,
              brief_type: 'sprint_task',
              content: {
                action: 'queue_to_sprint',
                intent: action.metadata.intent,
                role: action.metadata.role,
                queuedAt: new Date().toISOString(),
              },
            });
          success = !error;
          if (error) console.error('queue_to_sprint failed:', error);

          if (success) {
            window.dispatchEvent(new CustomEvent('geo-action-queued', {
              detail: { actionType: action.type, pageTitle: action.pageTitle, pagePath: action.pagePath },
            }));
          }
          break;
        }
      }

      const completedAt = new Date().toISOString();
      const newStatus = success ? 'completed' as const : 'failed' as const;

      setActions(prev => prev.map(a =>
        a.id === actionId
          ? { ...a, status: newStatus, completedAt: success ? completedAt : undefined }
          : a
      ));

      // Update status in DB
      if (!actionId.startsWith('temp-')) {
        await supabase
          .from('geo_cluster_actions' as any)
          .update({
            status: newStatus,
            completed_at: success ? completedAt : null,
          })
          .eq('id', actionId);
      }

      if (success) {
        toast.success(`${ACTION_LABELS[action.type]} הושלם: ${action.pageTitle}`);
      } else {
        toast.error(`${ACTION_LABELS[action.type]} נכשל: ${action.pageTitle}`);
      }

      return success;
    } catch (err) {
      console.error('Action execution error:', err);
      setActions(prev => prev.map(a =>
        a.id === actionId ? { ...a, status: 'failed' as const } : a
      ));

      // Update status in DB
      if (!actionId.startsWith('temp-')) {
        await supabase
          .from('geo_cluster_actions' as any)
          .update({ status: 'failed' })
          .eq('id', actionId);
      }

      toast.error('שגיאה בביצוע הפעולה');
      return false;
    } finally {
      setProcessing(false);
    }
  }, [actions]);

  const getActionsForCluster = useCallback((clusterId: string) => {
    return actions.filter(a => a.clusterId === clusterId);
  }, [actions]);

  const getPendingCount = useCallback(() => {
    return actions.filter(a => a.status === 'pending').length;
  }, [actions]);

  const getCompletedCount = useCallback(() => {
    return actions.filter(a => a.status === 'completed').length;
  }, [actions]);

  return {
    actions,
    addAction,
    executeAction,
    getActionsForCluster,
    getPendingCount,
    getCompletedCount,
    processing,
    ACTION_LABELS,
  };
}
