/**
 * Centralized GEO Live Data Hook
 * Single source of truth merging static seed data with persisted DB state.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SCORED_PAGES, type ScoredPage, type DimensionScore, type ScoreDimension } from '@/data/geo-sprint5-data';
import { EXECUTION_TASKS, type ExecutionTask, type TaskStatus } from '@/data/geo-sprint6-data';
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
  refresh: () => Promise<void>;
}

function mergeScanWithStatic(scanResult: GeoScanResult, staticPage?: ScoredPage): ScoredPage {
  const dims = scanResult.dimensions;
  const dimArray: DimensionScore[] = Array.isArray(dims)
    ? dims.map((d: any) => ({
        dimension: d.dimension as ScoreDimension,
        score: d.score || 0,
        working: d.working || [],
        missing: d.missing || [],
        fixes: d.fixes || [],
        impact: d.impact || '',
      }))
    : Object.entries(dims).map(([key, val]: [string, any]) => ({
        dimension: key as ScoreDimension,
        score: val.score || 0,
        working: val.working || [],
        missing: val.missing || [],
        fixes: val.fixes || [],
        impact: val.impact || '',
      }));

  const recs = (scanResult.recommendations || []).map((r: any) => ({
    label: r.label || 'quick-win',
    text: r.text || '',
  }));

  return {
    id: scanResult.pageId,
    path: staticPage?.path || `/${scanResult.pageId}`,
    titleHe: staticPage?.titleHe || scanResult.pageId,
    type: staticPage?.type || 'service',
    weightedScore: scanResult.overallScore,
    dimensions: dimArray,
    recommendations: recs,
    strategicTags: staticPage?.strategicTags || [],
  };
}

export function useGeoLiveData(): GeoLiveState {
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

  useEffect(() => {
    if (!loaded) refresh();
  }, [loaded, refresh]);

  useEffect(() => {
    const handler = () => { refresh(); };
    window.addEventListener('geo-page-saved', handler);
    window.addEventListener('geo-scan-complete', handler);
    window.addEventListener('geo-action-complete', handler);
    return () => {
      window.removeEventListener('geo-page-saved', handler);
      window.removeEventListener('geo-scan-complete', handler);
      window.removeEventListener('geo-action-complete', handler);
    };
  }, [refresh]);

  return { scanResults, contentOverrides, clusterActions, contentBriefs, sprintTasks, loading, loaded, refresh };
}

export function useLiveScoredPages(scanResults: Record<string, GeoScanResult>): ScoredPage[] {
  return useMemo(() => {
    const livePages = new Map<string, ScoredPage>();
    for (const page of SCORED_PAGES) {
      livePages.set(page.id, page);
    }
    for (const [pageId, scan] of Object.entries(scanResults)) {
      const staticPage = SCORED_PAGES.find(p => p.id === pageId);
      livePages.set(pageId, mergeScanWithStatic(scan, staticPage));
    }
    return Array.from(livePages.values());
  }, [scanResults]);
}

export function useLiveExecutionTasks(
  sprintTasks: GeoLiveState['sprintTasks'],
  clusterActions: GeoLiveState['clusterActions']
): ExecutionTask[] {
  return useMemo(() => {
    const tasks = [...EXECUTION_TASKS];

    // Mark static tasks as done if related cluster action completed
    for (let i = 0; i < tasks.length; i++) {
      const title = tasks[i].title.toLowerCase();
      for (const action of clusterActions.filter(a => a.status === 'completed')) {
        if (action.pageTitle && title.includes(action.pageTitle.substring(0, 10).toLowerCase())) {
          tasks[i] = { ...tasks[i], status: 'done' as TaskStatus };
          break;
        }
      }
    }

    // Add DB sprint tasks
    for (const st of sprintTasks) {
      if (!tasks.find(t => t.id === st.id)) {
        tasks.push({
          id: st.id,
          phase: 1,
          title: `${st.pageTitle} — ${st.actionType}`,
          description: `פעולה מאשכולות: ${st.actionType}`,
          owner: 'content',
          difficulty: 'easy',
          impact: 'medium',
          dependency: null,
          estimatedOutcome: 'שיפור כיסוי GEO',
          status: (st.status === 'completed' ? 'done' : 'todo') as TaskStatus,
          week: 1,
          daysEstimate: 1,
        });
      }
    }

    return tasks;
  }, [sprintTasks, clusterActions]);
}
