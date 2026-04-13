import { useState, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Cluster action types that can be queued and executed
 */
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

  const addAction = useCallback((
    type: ClusterActionType,
    clusterId: string,
    pageTitle: string,
    pagePath: string,
    metadata: Record<string, any> = {},
  ): ClusterAction => {
    const action: ClusterAction = {
      id: `action-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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
    return action;
  }, []);

  const executeAction = useCallback(async (actionId: string): Promise<boolean> => {
    setProcessing(true);
    setActions(prev => prev.map(a =>
      a.id === actionId ? { ...a, status: 'in_progress' as const } : a
    ));

    try {
      // Simulate execution delay for now - each action type has real side effects
      await new Promise(resolve => setTimeout(resolve, 500));

      setActions(prev => prev.map(a =>
        a.id === actionId
          ? { ...a, status: 'completed' as const, completedAt: new Date().toISOString() }
          : a
      ));

      const action = actions.find(a => a.id === actionId);
      if (action) {
        toast.success(`${ACTION_LABELS[action.type]} הושלם: ${action.pageTitle}`);

        // Dispatch events for cross-module sync
        if (action.type === 'queue_to_sprint') {
          window.dispatchEvent(new CustomEvent('geo-action-queued', {
            detail: { actionType: action.type, pageTitle: action.pageTitle, pagePath: action.pagePath },
          }));
        }
      }
      return true;
    } catch (err) {
      setActions(prev => prev.map(a =>
        a.id === actionId ? { ...a, status: 'failed' as const } : a
      ));
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
