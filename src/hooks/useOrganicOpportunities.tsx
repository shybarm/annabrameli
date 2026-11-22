/**
 * useOrganicOpportunities - loads the Stage 1A windows and runs the engine.
 *
 * All calculation lives in src/lib/geo/opportunity-engine.ts. This hook only
 * fetches and hands data over, so scoring can never drift between the UI and
 * the tests.
 *
 * DATA CONTRACT: traffic figures come from the page and totals grains. Query
 * rows are fetched for themes only and are never summed into traffic.
 *
 * The RPC calls below are deliberately UNCAST. The generated Supabase types
 * now carry the live Stage 1B function signatures, so assigning each result
 * into the engine's own input type is a compile-time check that the database
 * contract still matches what the engine expects. If a returned column is
 * renamed or dropped in the database - the failure mode that produced the
 * position/avg_position break - this file stops compiling instead of silently
 * handing the engine undefined at runtime. Do not reintroduce `as never`,
 * `as any` or `as unknown as`: each of them switches that check off.
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

import { settledSearchDay, shiftDay } from '@/lib/geo/reporting-window';

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
  endDate: string;
  pageDate: string | null;
  queryDate: string | null;
  ga4Date: string | null;
  totalsDate: string | null;
  pageDays: number | null;
  prevPageDays: number | null;
  /** True when the Stage 1B SQL functions are not deployed yet. */
  unavailable: boolean;
  unavailableReason?: string;
}

export function useOrganicOpportunities(
  windowDays: WindowDays = 28,
  host: string = PRIMARY_HOST,
) {
  const endDate = settledSearchDay();
  const startDate = shiftDay(endDate, 1 - windowDays);
  const priorStart = shiftDay(startDate, -windowDays);
  return useQuery<OrganicOpportunitiesData>({
    queryKey: ['organic-opportunities', windowDays, host, endDate],
    queryFn: async () => {
      const bounds = { p_window_days: windowDays, p_end_date: endDate };
      const [pages, queries, ga4, curve, totals, pageDate, queryDate, ga4Date, totalsDate, coverage] =
        await Promise.all([
          supabase.rpc('geo_page_window', { ...bounds, p_host: host }),
          supabase.rpc('geo_query_window', { ...bounds, p_host: host, p_min_impressions: 1 }),
          supabase.rpc('geo_ga4_page_window', bounds),
          supabase.rpc('geo_ctr_curve', { ...bounds, p_host: host, p_window_days: 90 }),
          supabase.rpc('geo_totals_window', { ...bounds, p_property: MAIN_PROPERTY }),
          supabase.from('search_console_page_daily').select('date').eq('page_host', host)
            .lte('date', endDate).order('date', { ascending: false }).limit(1),
          supabase.from('search_console_daily').select('date').eq('page_host', host)
            .lte('date', endDate).order('date', { ascending: false }).limit(1),
          supabase.from('analytics_landing_daily').select('date').eq('channel_group', 'Organic Search')
            .lte('date', endDate).order('date', { ascending: false }).limit(1),
          supabase.from('search_console_totals_daily').select('date').eq('property', MAIN_PROPERTY)
            .lte('date', endDate).order('date', { ascending: false }).limit(1),
          supabase.from('gsc_dataset_sync_cursor').select('date').eq('dataset', 'page')
            .eq('property', MAIN_PROPERTY).eq('status', 'ok').gte('date', priorStart).lte('date', endDate),
        ]);
      const pageRows: PageWindow[] = pages.data ?? [];
      const queryRows: QueryRow[] = queries.data ?? [];
      const ga4Rows: Ga4PageRow[] = ga4.data ?? [];
      const ctrRows: CtrCurveRow[] = curve.data ?? [];
      const total = totals.data?.[0];
      const unavailable = Boolean(pages.error) || !pageRows.length;

      return {
        opportunities: buildOpportunities(pageRows, queryRows, host === PRIMARY_HOST ? ga4Rows : [], ctrRows, {
          primaryHost: PRIMARY_HOST, windowDays,
        }),
        totals: total?.days_with_data ? total : null,
        endDate,
        pageDate: pageDate.data?.[0]?.date ?? null,
        queryDate: queryDate.data?.[0]?.date ?? null,
        ga4Date: ga4Date.data?.[0]?.date ?? null,
        totalsDate: totalsDate.data?.[0]?.date ?? null,
        pageDays: coverage.data?.filter(row => row.date >= startDate).length ?? null,
        prevPageDays: coverage.data?.filter(row => row.date < startDate).length ?? null,
        unavailable,
        unavailableReason: pages.error ? 'טעינת נתוני העמודים נכשלה' :
          'טרם התקבלו נתוני עמודים לתקופה שנבחרה. אפשר לסנכרן מגוגל.',
      };
    },
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}
