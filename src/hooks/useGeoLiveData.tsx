/**
 * useGeoLiveData — thin re-export layer on top of GeoLiveDataProvider context.
 * Kept for backward-compat; all state now lives in the shared provider.
 */

import { useMemo } from 'react';
import { useGeoLiveState, useGeoLiveActions, type GeoLiveState } from '@/contexts/GeoLiveDataContext';
import { SCORED_PAGES, type ScoredPage, type DimensionScore, type ScoreDimension } from '@/data/geo-sprint5-data';
import { EXECUTION_TASKS, type ExecutionTask, type TaskStatus } from '@/data/geo-sprint6-data';
import type { GeoScanResult } from '@/hooks/useGeoRescan';

// Re-export types for consumers
export type { GeoLiveState };

/**
 * Primary hook — returns shared provider state + refresh.
 * No local copies; reads directly from GeoLiveDataProvider.
 */
export function useGeoLiveData() {
  const state = useGeoLiveState();
  const { refresh } = useGeoLiveActions();
  return { ...state, refresh };
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

    for (let i = 0; i < tasks.length; i++) {
      const title = tasks[i].title.toLowerCase();
      for (const action of clusterActions.filter(a => a.status === 'completed')) {
        if (action.pageTitle && title.includes(action.pageTitle.substring(0, 10).toLowerCase())) {
          tasks[i] = { ...tasks[i], status: 'done' as TaskStatus };
          break;
        }
      }
    }

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
