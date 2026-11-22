import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { reportingBatches, settledSearchDay } from '@/lib/geo/reporting-window';
import { MAIN_PROPERTY, PRIMARY_HOST, type WindowDays } from './useOrganicOpportunities';

type Source = 'gsc-sync' | 'ga4-sync';

async function syncRange(source: Source, body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke(source, { body });
  if (error) {
    const response = error.context;
    const status = response instanceof Response ? response.status : undefined;
    const detail = response instanceof Response ? await response.clone().json().catch(() => null) : null;
    if (status === 401 || status === 403) throw new Error('יש לבדוק את הרשאת הסנכרון של החשבון');
    if (status === 404) throw new Error('שירות הסנכרון אינו זמין');
    if (/not configured|missing|invalid_grant/i.test(String(detail?.error))) {
      throw new Error('יש לבדוק את הגדרות החיבור לגוגל בשרת');
    }
    throw new Error(status ? 'שגיאת שרת ' + status : 'החיבור לשירות הסנכרון נכשל');
  }
  const grains = Object.values<{ timedOut?: boolean; failureCount?: number }>(data?.grains ?? {});
  if (data?.status !== 'ok' || data.timedOut || grains.some(g => g.timedOut || g.failureCount)) {
    throw new Error('הטעינה חלקית. אפשר לנסות שוב כדי להשלים את הימים החסרים');
  }
}

export function useGeoSync(windowDays: WindowDays, host: string, needsRepair: boolean) {
  const cache = useQueryClient();
  const [progress, setProgress] = useState('');
  const mutation = useMutation({
    mutationFn: async () => {
      const ranges = reportingBatches(settledSearchDay(), windowDays * 2);
      const errors = new Map<Source, string>();
      const sources: Source[] = ['gsc-sync', 'ga4-sync'];
      const properties = host === PRIMARY_HOST ? [MAIN_PROPERTY] : [MAIN_PROPERTY, 'sc-domain:' + host];
      for (const [i, range] of ranges.entries()) {
        setProgress('מסנכרן תקופה ' + (i + 1) + ' מתוך ' + ranges.length);
        await Promise.all(sources.filter(source => !errors.has(source)).map(async source => {
          try {
            await syncRange(source, source === 'gsc-sync'
              ? { ...range, mode: 'backfill', properties, maxDays: 7 * properties.length }
              : { ...range, mode: 'sync' });
          } catch (e) {
            errors.set(source, (source === 'gsc-sync' ? 'Search Console' : 'GA4') + ': ' +
              (e instanceof Error ? e.message : 'הסנכרון נכשל'));
          }
        }));
        if (errors.size === sources.length) break;
      }
      if (errors.size) throw new Error([...errors.values()].join(' · '));
    },
    onSettled: async () => {
      await cache.invalidateQueries({ queryKey: ['organic-opportunities'] });
    },
  });
  // Daily cron is primary. A staff visit can recover a missed run using the
  // same restricted endpoints. Never retry an unavailable source on each render.
  const lastAttempt = useRef('');
  const { mutate, isPending } = mutation;
  const key = ['geo-sync', host, windowDays, settledSearchDay()].join(':');
  useEffect(() => {
    if (!needsRepair || isPending || lastAttempt.current === key) return;
    lastAttempt.current = key;
    const storageKey = 'geo-sync:' + host + ':' + windowDays;
    try {
      if (localStorage.getItem(storageKey) === key) return;
      localStorage.setItem(storageKey, key);
    } catch { /* An in-memory guard also works when storage is disabled. */ }
    mutate();
  }, [key, host, windowDays, needsRepair, isPending, mutate]);
  return { ...mutation, progress };
}
