/**
 * GeoLiveDataProvider — single source of truth for all GEO live state.
 * Wraps the GEO admin page so every module shares one in-memory store
 * backed by Supabase persistence.
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { GeoScanResult } from '@/hooks/useGeoRescan';

export interface GeoLiveState {
  scanResults: Record<string, GeoScanResult>;
  contentOverrides: Record<string, { updatedAt: string; appliedBy: string | null }>;
  clusterActions: Array<{
    id: string;
    actionType: string;
    clusterId: string;
    pageTitle: string;
    pagePath: string;
    status: string;
    completedAt: string | null;
    createdAt: string;
    metadata: any;
  }>;
  contentBriefs: Array<{
    id: string;
    pageTitle: string;
    pagePath: string;
    briefType: string;
    clusterId: string;
    content: any;
    createdAt: string;
  }>;
  sprintTasks: Array<{
    id: string;
    pageTitle: string;
    pagePath: string;
    actionType: string;
    status: string;
    createdAt: string;
  }>;
  loading: boolean;
  loaded: boolean;
}

export interface GeoLiveActions {
  /** Full reload from DB */
  refresh: () => Promise<void>;
  /** Targeted upsert of a single scan result (avoids full reload) */
  upsertScanResult: (pageId: string, result: GeoScanResult) => void;
  /** Targeted update of content override metadata */
  upsertContentOverride: (pageId: string, meta: { updatedAt: string; appliedBy: string | null }) => void;
}

const GeoLiveStateCtx = createContext<GeoLiveState | null>(null);
const GeoLiveActionsCtx = createContext<GeoLiveActions | null>(null);

export function GeoLiveDataProvider({ children }: { children: ReactNode }) {
  const [scanResults, setScanResults] = useState<Record<string, GeoScanResult>>({});
  const [contentOverrides, setContentOverrides] = useState<Record<string, { updatedAt: string; appliedBy: string | null }>>({});
  const [clusterActions, setClusterActions] = useState<GeoLiveState['clusterActions']>([]);
  const [contentBriefs, setContentBriefs] = useState<GeoLiveState['contentBriefs']>([]);
  const [sprintTasks, setSprintTasks] = useState<GeoLiveState['sprintTasks']>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [scansRes, overridesRes, actionsRes, briefsRes] = await Promise.all([
        supabase.from('geo_scan_results' as any).select('*').order('scanned_at', { ascending: false }),
        supabase.from('page_content_overrides' as any).select('page_id, updated_at, applied_by'),
        supabase.from('geo_cluster_actions' as any).select('*').order('created_at', { ascending: false }),
        supabase.from('geo_content_briefs' as any).select('*').order('created_at', { ascending: false }),
      ]);

      if (scansRes.data) {
        const byPage: Record<string, GeoScanResult> = {};
        for (const row of scansRes.data as any[]) {
          if (!byPage[row.page_id]) {
            byPage[row.page_id] = {
              pageId: row.page_id,
              scannedAt: row.scanned_at,
              dimensions: row.dimensions,
              overallScore: Number(row.overall_score),
              blockers: row.blockers || [],
              recommendations: row.recommendations || [],
              strengths: row.strengths || [],
              weaknesses: row.weaknesses || [],
              persisted: true,
            };
          }
        }
        setScanResults(byPage);
      }

      if (overridesRes.data) {
        const overrides: Record<string, { updatedAt: string; appliedBy: string | null }> = {};
        for (const row of overridesRes.data as any[]) {
          overrides[row.page_id] = { updatedAt: row.updated_at, appliedBy: row.applied_by };
        }
        setContentOverrides(overrides);
      }

      if (actionsRes.data) {
        setClusterActions((actionsRes.data as any[]).map(row => ({
          id: row.id,
          actionType: row.action_type,
          clusterId: row.cluster_id,
          pageTitle: row.page_title,
          pagePath: row.page_path,
          status: row.status,
          completedAt: row.completed_at,
          createdAt: row.created_at,
          metadata: row.metadata,
        })));
      }

      if (briefsRes.data) {
        const briefs: GeoLiveState['contentBriefs'] = [];
        const tasks: GeoLiveState['sprintTasks'] = [];
        for (const row of briefsRes.data as any[]) {
          if (row.brief_type === 'sprint_task') {
            tasks.push({
              id: row.id,
              pageTitle: row.page_title,
              pagePath: row.page_path,
              actionType: row.content?.actionType || 'unknown',
              status: row.content?.status || 'todo',
              createdAt: row.created_at,
            });
          } else {
            briefs.push({
              id: row.id,
              pageTitle: row.page_title,
              pagePath: row.page_path,
              briefType: row.brief_type,
              clusterId: row.cluster_id,
              content: row.content,
              createdAt: row.created_at,
            });
          }
        }
        setContentBriefs(briefs);
        setSprintTasks(tasks);
      }
    } catch (err) {
      console.error('Failed to load GEO live data:', err);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, []);

  // Hydrate on mount
  useEffect(() => {
    if (!loaded) refresh();
  }, [loaded, refresh]);

  const upsertScanResult = useCallback((pageId: string, result: GeoScanResult) => {
    setScanResults(prev => ({ ...prev, [pageId]: result }));
  }, []);

  const upsertContentOverride = useCallback((pageId: string, meta: { updatedAt: string; appliedBy: string | null }) => {
    setContentOverrides(prev => ({ ...prev, [pageId]: meta }));
  }, []);

  const state = useMemo<GeoLiveState>(() => ({
    scanResults, contentOverrides, clusterActions, contentBriefs, sprintTasks, loading, loaded,
  }), [scanResults, contentOverrides, clusterActions, contentBriefs, sprintTasks, loading, loaded]);

  const actions = useMemo<GeoLiveActions>(() => ({
    refresh, upsertScanResult, upsertContentOverride,
  }), [refresh, upsertScanResult, upsertContentOverride]);

  return (
    <GeoLiveStateCtx.Provider value={state}>
      <GeoLiveActionsCtx.Provider value={actions}>
        {children}
      </GeoLiveActionsCtx.Provider>
    </GeoLiveStateCtx.Provider>
  );
}

export function useGeoLiveState(): GeoLiveState {
  const ctx = useContext(GeoLiveStateCtx);
  if (!ctx) throw new Error('useGeoLiveState must be used within GeoLiveDataProvider');
  return ctx;
}

export function useGeoLiveActions(): GeoLiveActions {
  const ctx = useContext(GeoLiveActionsCtx);
  if (!ctx) throw new Error('useGeoLiveActions must be used within GeoLiveDataProvider');
  return ctx;
}
