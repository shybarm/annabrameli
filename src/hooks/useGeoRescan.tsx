/**
 * useGeoRescan — mutation-only hook.
 * Performs rescans via the edge function and writes results
 * directly into the shared GeoLiveDataProvider state.
 * Does NOT own its own scanResults copy.
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGeoLiveState, useGeoLiveActions } from '@/contexts/GeoLiveDataContext';
import { toast } from 'sonner';

export interface GeoScanDimension {
  dimension?: string;
  score: number;
  working: string[];
  missing: string[];
  fixes: string[];
  impact: string;
}

export interface GeoScanResult {
  pageId: string;
  scannedAt: string;
  dimensions: Record<string, GeoScanDimension> | GeoScanDimension[];
  overallScore: number;
  blockers: string[];
  recommendations: { label: string; text: string }[];
  strengths: string[];
  weaknesses: string[];
  contentHash?: string;
  persisted?: boolean;
  dataSource?: string;
  recommendationsFilteredCount?: number;
}

export function useGeoRescan() {
  const [scanning, setScanning] = useState(false);
  const { scanResults } = useGeoLiveState();
  const { upsertScanResult } = useGeoLiveActions();

  const rescanPage = useCallback(async (
    pageId: string,
    sections: { heading: string; tag: string; content: string }[],
    pageTitle?: string,
    pagePath?: string,
  ): Promise<GeoScanResult | null> => {
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke('geo-rescan', {
        body: { pageId, sections, pageTitle, pagePath },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const result = data as GeoScanResult;
      
      // Write directly into shared provider state — no local copy
      upsertScanResult(pageId, result);

      if (result.persisted) {
        toast.success(`סריקת GEO הושלמה ונשמרה — ציון: ${result.overallScore}`);
      } else {
        toast.warning(`סריקת GEO הושלמה (ציון: ${result.overallScore}) אך השמירה ל-DB נכשלה`);
      }
      return result;
    } catch (err: any) {
      console.error('GEO rescan failed:', err);
      toast.error('שגיאה בסריקת GEO: ' + (err.message || 'שגיאה לא ידועה'));
      return null;
    } finally {
      setScanning(false);
    }
  }, [upsertScanResult]);

  const getScanResult = useCallback((pageId: string) => {
    return scanResults[pageId] || null;
  }, [scanResults]);

  return { rescanPage, getScanResult, scanResults, scanning };
}
