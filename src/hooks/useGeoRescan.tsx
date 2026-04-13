import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  persisted?: boolean;
}

export function useGeoRescan() {
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<Record<string, GeoScanResult>>({});
  const [loaded, setLoaded] = useState(false);

  // Load latest scan results from DB on mount
  useEffect(() => {
    if (loaded) return;
    let cancelled = false;

    const loadFromDb = async () => {
      try {
        const { data, error } = await supabase
          .from('geo_scan_results' as any)
          .select('*')
          .order('scanned_at', { ascending: false });

        if (error || !data) return;

        // Group by page_id, keep only latest per page
        const byPage: Record<string, GeoScanResult> = {};
        for (const row of data as any[]) {
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

        if (!cancelled) {
          setScanResults(byPage);
        }
      } catch (err) {
        console.error('Failed to load scan results from DB:', err);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };

    loadFromDb();
    return () => { cancelled = true; };
  }, [loaded]);

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
      setScanResults(prev => ({ ...prev, [pageId]: result }));

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
  }, []);

  const getScanResult = useCallback((pageId: string) => {
    return scanResults[pageId] || null;
  }, [scanResults]);

  return { rescanPage, getScanResult, scanResults, scanning };
}
