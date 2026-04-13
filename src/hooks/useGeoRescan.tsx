import { useState, useCallback } from 'react';
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
}

export function useGeoRescan() {
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<Record<string, GeoScanResult>>({});

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
      toast.success(`סריקת GEO הושלמה עבור ${pageTitle || pageId} — ציון: ${result.overallScore}`);
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
