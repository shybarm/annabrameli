import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGeoLiveActions } from '@/contexts/GeoLiveDataContext';
import { usePageContentUpdater } from '@/contexts/PageContentContext';
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
  const liveActions = useGeoLiveActions();

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

        if (error || !data) {
          console.error('Failed to load cluster actions:', error);
          return;
        }

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
      id: tempId, type, clusterId, pageTitle, pagePath,
      status: 'pending', metadata, createdAt: new Date().toISOString(),
    };
    setActions(prev => [action, ...prev]);
    toast.info(`${ACTION_LABELS[type]}: ${pageTitle}`);

    (async () => {
      try {
        const { data, error } = await supabase
          .from('geo_cluster_actions' as any)
          .insert({
            action_type: type, cluster_id: clusterId,
            page_title: pageTitle, page_path: pagePath,
            status: 'pending', metadata,
          })
          .select('id')
          .single();

        if (!error && data) {
          setActions(prev => prev.map(a =>
            a.id === tempId ? { ...a, id: (data as any).id } : a
          ));
        }
      } catch (err) {
        console.error('Failed to persist action to DB:', err);
      }
    })();

    return action;
  }, []);

  // ── Real side-effect executors ──

  /** add_internal_link: Inject an internal-links section into page_content_overrides */
  const execAddInternalLink = async (action: ClusterAction): Promise<boolean> => {
    const linksMissing: string[] = action.metadata.linksMissing || [];
    if (linksMissing.length === 0) return false;

    // Derive pageId from pagePath
    const pageId = derivePageId(action.pagePath);
    if (!pageId) {
      console.error('Cannot derive pageId from path:', action.pagePath);
      return false;
    }

    // Read current page_content_overrides
    const { data: existing } = await supabase
      .from('page_content_overrides' as any)
      .select('*')
      .eq('page_id', pageId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    const currentSections: any[] = (existing as any)?.sections || [];

    // Build link block content
    const linkBlock = linksMissing.map(l => `• <a href="${l}">${l}</a>`).join('\n');
    const newSection = {
      heading: 'קישורים פנימיים קשורים',
      tag: 'h2',
      content: linkBlock,
    };

    // Check if internal links section already exists
    const idx = currentSections.findIndex((s: any) =>
      s.heading?.includes('קישורים פנימיים')
    );
    const updatedSections = [...currentSections];
    if (idx >= 0) {
      updatedSections[idx] = newSection;
    } else {
      updatedSections.push(newSection);
    }

    // Upsert page_content_overrides
    const { error } = existing
      ? await supabase
          .from('page_content_overrides' as any)
          .update({ sections: updatedSections, updated_at: new Date().toISOString() })
          .eq('id', (existing as any).id)
      : await supabase
          .from('page_content_overrides' as any)
          .insert({
            page_id: pageId,
            sections: updatedSections,
            version_label: 'applied',
          });

    if (error) {
      console.error('add_internal_link: failed to update page content:', error);
      return false;
    }

    // Also log to briefs for traceability
    await supabase
      .from('geo_content_briefs' as any)
      .insert({
        page_title: action.pageTitle, page_path: action.pagePath,
        cluster_id: action.clusterId, brief_type: 'internal_link',
        content: { action: 'add_internal_link', linksAdded: linksMissing, appliedAt: new Date().toISOString() },
      });

    // Update shared provider
    liveActions.upsertContentOverride(pageId, {
      updatedAt: new Date().toISOString(),
      appliedBy: null,
    });

    return true;
  };

  /** assign_to_cluster: Persist real cluster membership */
  const execAssignToCluster = async (action: ClusterAction): Promise<boolean> => {
    const { error } = await supabase
      .from('geo_content_briefs' as any)
      .insert({
        page_title: action.pageTitle, page_path: action.pagePath,
        cluster_id: action.clusterId, brief_type: 'cluster_assignment',
        content: {
          action: 'assign_to_cluster',
          clusterId: action.clusterId,
          intent: action.metadata.intent,
          role: action.metadata.role,
          assignedAt: new Date().toISOString(),
        },
      });
    if (error) {
      console.error('assign_to_cluster failed:', error);
      return false;
    }
    return true;
  };

  /** create_brief: Persist structured brief artifact */
  const execCreateBrief = async (action: ClusterAction): Promise<boolean> => {
    const { error } = await supabase
      .from('geo_content_briefs' as any)
      .insert({
        page_title: action.pageTitle, page_path: action.pagePath,
        cluster_id: action.clusterId, brief_type: 'brief',
        content: {
          briefContent: action.metadata.briefContent || '',
          intent: action.metadata.intent,
          role: action.metadata.role,
          targetAudience: 'הורים לילדים אלרגיים',
          status: 'draft',
          createdAt: new Date().toISOString(),
        },
      });
    if (error) {
      console.error('create_brief failed:', error);
      return false;
    }
    return true;
  };

  /** generate_draft: Create a real draft in page_content_overrides */
  const execGenerateDraft = async (action: ClusterAction): Promise<boolean> => {
    const pageId = derivePageId(action.pagePath) || action.pageTitle.replace(/\s+/g, '-').toLowerCase();

    // Generate structured draft sections based on metadata
    const draftSections = [
      { heading: action.pageTitle, tag: 'h1', content: '' },
      { heading: 'מהי הבעיה?', tag: 'h2', content: `[תוכן לכתיבה — כוונה: ${action.metadata.intent || 'general'}]` },
      { heading: 'מה ההמלצה?', tag: 'h2', content: '[תוכן לכתיבה]' },
      { heading: 'מתי לפנות לרופא?', tag: 'h2', content: '[תוכן לכתיבה]' },
      { heading: 'שאלות נפוצות', tag: 'h2', content: '[FAQ לכתיבה]' },
    ];

    // Save as draft version in page_content_overrides
    const { error } = await supabase
      .from('page_content_overrides' as any)
      .insert({
        page_id: pageId,
        sections: draftSections,
        version_label: 'draft',
      });

    if (error) {
      console.error('generate_draft: failed to create draft:', error);
      return false;
    }

    // Also record in briefs for tracking
    await supabase
      .from('geo_content_briefs' as any)
      .insert({
        page_title: action.pageTitle, page_path: action.pagePath,
        cluster_id: action.clusterId, brief_type: 'draft',
        content: {
          action: 'generate_draft',
          pageId, intent: action.metadata.intent,
          status: 'draft_created',
          sectionCount: draftSections.length,
          generatedAt: new Date().toISOString(),
        },
      });

    liveActions.upsertContentOverride(pageId, {
      updatedAt: new Date().toISOString(),
      appliedBy: null,
    });

    return true;
  };

  /** queue_to_sprint: Create a real structured sprint task */
  const execQueueToSprint = async (action: ClusterAction): Promise<boolean> => {
    const { error } = await supabase
      .from('geo_content_briefs' as any)
      .insert({
        page_title: action.pageTitle, page_path: action.pagePath,
        cluster_id: action.clusterId, brief_type: 'sprint_task',
        content: {
          actionType: action.metadata.actionLabel || action.type,
          status: 'todo',
          intent: action.metadata.intent,
          role: action.metadata.role,
          priority: action.metadata.role === 'missing' ? 'high' : 'medium',
          estimatedDays: 1,
          queuedAt: new Date().toISOString(),
        },
      });
    if (error) {
      console.error('queue_to_sprint failed:', error);
      return false;
    }
    return true;
  };

  const executeAction = useCallback(async (actionId: string): Promise<boolean> => {
    setProcessing(true);

    const action = actions.find(a => a.id === actionId);
    if (!action) {
      setProcessing(false);
      return false;
    }

    setActions(prev => prev.map(a =>
      a.id === actionId ? { ...a, status: 'in_progress' as const } : a
    ));

    try {
      let success = false;

      switch (action.type) {
        case 'add_internal_link':
          success = await execAddInternalLink(action);
          break;
        case 'assign_to_cluster':
          success = await execAssignToCluster(action);
          break;
        case 'create_brief':
          success = await execCreateBrief(action);
          break;
        case 'generate_draft':
          success = await execGenerateDraft(action);
          break;
        case 'queue_to_sprint':
          success = await execQueueToSprint(action);
          break;
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
          .update({ status: newStatus, completed_at: success ? completedAt : null })
          .eq('id', actionId);
      }

      // Refresh shared provider to pick up new briefs/tasks/overrides
      if (success) {
        await liveActions.refresh();
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
  }, [actions, liveActions]);

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
    actions, addAction, executeAction,
    getActionsForCluster, getPendingCount, getCompletedCount,
    processing, ACTION_LABELS,
  };
}

// ── Helpers ──

const PATH_TO_PAGEID: Record<string, string> = {
  '/': 'homepage',
  '/about': 'about',
  '/services': 'allergy-testing',
  '/guides/טעימות-ראשונות-אלרגנים': 'first-foods',
  '/knowledge/פריחה-אחרי-במבה': 'bamba-reaction',
};

function derivePageId(path: string): string | null {
  if (!path) return null;
  if (PATH_TO_PAGEID[path]) return PATH_TO_PAGEID[path];
  // Try to extract from path
  const segments = path.split('/').filter(Boolean);
  return segments.length > 0 ? segments[segments.length - 1] : null;
}
