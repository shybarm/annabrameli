import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

/**
 * Site visitor figures for the admin dashboard.
 *
 * This hook previously returned Math.random() values shaped to look like a
 * plausible daily traffic curve, presented in the UI as real numbers. It was
 * never connected to anything. Displaying invented figures as measurement is
 * worse than displaying nothing, so it now reports honestly.
 *
 * Data comes from `analytics_daily`, populated by the ga4-sync edge function.
 * Until that function is deployed and its credentials configured, every read
 * returns `available: false` and the dashboard says so.
 */

export interface AnalyticsData {
  available: boolean;
  /** Why there is no data, when there is none. Shown in the UI. */
  unavailableReason?: string;
  visitors: {
    today: number;
    yesterday: number;
    change: number;
    trend: 'up' | 'down' | 'neutral';
  };
  pageviews: {
    today: number;
    yesterday: number;
  };
}

const NO_DATA: AnalyticsData = {
  available: false,
  unavailableReason: 'טרם חובר מקור נתונים',
  visitors: { today: 0, yesterday: 0, change: 0, trend: 'neutral' },
  pageviews: { today: 0, yesterday: 0 },
};

interface AnalyticsDailyRow {
  date: string;
  sessions: number | null;
  pageviews: number | null;
}

export function useProjectAnalytics() {
  return useQuery<AnalyticsData>({
    queryKey: ['project-analytics'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('analytics_daily' as never)
        .select('date, sessions, pageviews')
        .in('date', [today, yesterday]);

      // The table may not exist yet, or the sync may not have run. Either way
      // the honest answer is "no data", not a guess.
      if (error || !data || data.length === 0) return NO_DATA;

      const rows = data as unknown as AnalyticsDailyRow[];
      const todayRow = rows.find((r) => r.date === today);
      const yesterdayRow = rows.find((r) => r.date === yesterday);

      if (!todayRow && !yesterdayRow) return NO_DATA;

      const todayVisitors = todayRow?.sessions ?? 0;
      const yesterdayVisitors = yesterdayRow?.sessions ?? 0;
      const change = todayVisitors - yesterdayVisitors;

      return {
        available: true,
        visitors: {
          today: todayVisitors,
          yesterday: yesterdayVisitors,
          change: Math.abs(change),
          trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
        },
        pageviews: {
          today: todayRow?.pageviews ?? 0,
          yesterday: yesterdayRow?.pageviews ?? 0,
        },
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: false,
  });
}
