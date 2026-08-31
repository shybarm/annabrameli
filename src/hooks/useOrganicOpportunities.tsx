/**
 * useOrganicOpportunities — loads the Stage 1A windows and runs the engine.
 *
 * All calculation lives in src/lib/geo/opportunity-engine.ts. This hook only
 * fetches and hands data over, so scoring can never drift between the UI and
 * the tests.
 *
 * DATA CONTRACT: traffic figures come from the page and totals grains. Query
 * rows are fetched for themes only and are never summed into traffic.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  buildOpportunities,
  type Opportunity,
  type PageWindow,
  type QueryRow,
  type Ga4PageRow,
  type CtrCurveRow,
} from '@/lib/geo/opportunity-engine';

export const PRIMARY_HOST = 'ihaveallergy.com';
export const SEO_HOST = 'seo.ihaveallergy.com';

/**
 * Whole-domain reporting uses the main property, which already includes the
 * subdomain. The two are never summed.
 */
export const MAIN_PROPERTY = 'sc-domain:ihaveallergy.com';

export type WindowDays = 7 | 28 | 90;

export interface SiteTotals {
  property: string;
  clicks: number;
  impressions: number;
  ctr: number;
  avg_position: number;
  days_with_data: number;
  prev_clicks: number;
  prev_impressions: number;
  prev_days: number;
  window_start: string;
  window_end: string;
}

export interface OrganicOpportunitiesData {
  opportunities: Opportunity[];
  /** Site traffic truth, straight from Google's undimensioned totals. */
  totals: SiteTotals | null;
  /** True when the Stage 1B SQL functions are not deployed yet. */
  unavailable: boolean;
  unavailableReason?: string;
}

const EMPTY: OrganicOpportunitiesData = {
  opportunities: [],
  totals: null,
  unavailable: true,
  unavailableReason: 'טרם הופעלו פונקציות הניתוח במסד הנתונים',
};

export function useOrganicOpportunities(
  windowDays: WindowDays = 28,
  host: string = PRIMARY_HOST,
) {
  return useQuery<OrganicOpportunitiesData>({
    queryKey: ['organic-opportunities', windowDays, host],
    queryFn: async () => {
      // Page grain — the page-performance source of truth.
      const pagesRes = await supabase.rpc('geo_page_window' as never, {
        p_host: host,
        p_window_days: windowDays,
      } as never);

      // A missing function means the Stage 1B migration has not been applied.
      // Report that honestly instead of rendering an empty dashboard that
      // looks like "no opportunities".
      if (pagesRes.error) return { ...EMPTY, unavailableReason: pagesRes.error.message };

      const pages = (pagesRes.data ?? []) as unknown as PageWindow[];
      if (pages.length === 0) {
        return {
          opportunities: [],
          totals: null,
          unavailable: true,
          unavailableReason: 'אין עדיין נתוני Search Console לתקופה שנבחרה',
        };
      }

      const [queriesRes, ga4Res, curveRes, totalsRes] = await Promise.all([
        supabase.rpc('geo_query_window' as never, {
          p_host: host,
          p_window_days: windowDays,
        } as never),
        supabase.rpc('geo_ga4_page_window' as never, {
          p_window_days: windowDays,
        } as never),
        supabase.rpc('geo_ctr_curve' as never, {
          p_host: host,
          p_window_days: 90,
        } as never),
        supabase.rpc('geo_totals_window' as never, {
          p_property: MAIN_PROPERTY,
          p_window_days: windowDays,
        } as never),
      ]);

      // Queries, GA4 and the CTR curve are all optional enrichment: if any of
      // them fails the page grain still stands on its own.
      const queries = (queriesRes.data ?? []) as unknown as QueryRow[];
      const ga4Rows = (ga4Res.data ?? []) as unknown as Ga4PageRow[];
      const curve = (curveRes.data ?? []) as unknown as CtrCurveRow[];
      const totalsRows = (totalsRes.data ?? []) as unknown as SiteTotals[];

      return {
        opportunities: buildOpportunities(pages, queries, ga4Rows, curve, {
          primaryHost: PRIMARY_HOST,
          windowDays,
        }),
        totals: totalsRows[0] ?? null,
        unavailable: false,
      };
    },
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}
