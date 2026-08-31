/**
 * GeoOrganicOpportunities — "מה כדאי לעשות עכשיו כדי להגדיל תנועה אורגנית?"
 *
 * Renders what src/lib/geo/opportunity-engine.ts returns. It performs no
 * scoring of its own: every number, reason and recommendation shown here comes
 * from the engine, so the dashboard and the tests can never disagree.
 *
 * Nothing on this screen changes the website. These are recommendations.
 */

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp, TrendingDown, Sparkles, Target, MousePointerClick,
  Trophy, AlertTriangle, Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useOrganicOpportunities,
  PRIMARY_HOST,
  SEO_HOST,
  type WindowDays,
} from '@/hooks/useOrganicOpportunities';
import type {
  Confidence, Opportunity, SignalType, CtrBenchmarkSource,
} from '@/lib/geo/opportunity-engine';

const WINDOWS: { value: WindowDays; label: string }[] = [
  { value: 7, label: '7 ימים' },
  { value: 28, label: '28 ימים' },
  { value: 90, label: '90 ימים' },
];

const SIGNAL_META: Record<SignalType, { label: string; icon: typeof Target; cls: string }> = {
  striking_distance:        { label: 'מרחק נגיעה',        icon: Target,             cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  high_impressions_low_ctr: { label: 'CTR נמוך',           icon: MousePointerClick,  cls: 'bg-orange-100 text-orange-800 border-orange-200' },
  rising:                   { label: 'עלייה',              icon: TrendingUp,         cls: 'bg-green-100 text-green-800 border-green-200' },
  declining:                { label: 'ירידה',              icon: TrendingDown,       cls: 'bg-red-100 text-red-800 border-red-200' },
  emerging:                 { label: 'נראות חדשה',         icon: Sparkles,           cls: 'bg-purple-100 text-purple-800 border-purple-200' },
  high_potential_winner:    { label: 'פוטנציאל גבוה',      icon: Trophy,             cls: 'bg-blue-100 text-blue-800 border-blue-200' },
  query_opportunity:        { label: 'הזדמנות שאילתה',     icon: Info,               cls: 'bg-slate-100 text-slate-800 border-slate-200' },
  content_gap:              { label: 'פער תוכן',           icon: AlertTriangle,      cls: 'bg-pink-100 text-pink-800 border-pink-200' },
};

const CONFIDENCE_META: Record<Confidence, { label: string; cls: string }> = {
  high:   { label: 'ביטחון גבוה', cls: 'bg-green-100 text-green-800 border-green-200' },
  medium: { label: 'ביטחון בינוני', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  low:    { label: 'ביטחון נמוך', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
};

const CTR_SOURCE_META: Record<CtrBenchmarkSource, { label: string; cls: string }> = {
  first_party: { label: 'CTR: נתוני האתר', cls: 'bg-green-50 text-green-700 border-green-200' },
  fallback:    { label: 'CTR: הנחה חיצונית', cls: 'bg-slate-50 text-slate-600 border-slate-200' },
  insufficient:{ label: 'CTR: אין מספיק נתונים', cls: 'bg-slate-50 text-slate-500 border-slate-200' },
};

const pct = (n: number, dp = 1) => `${(n * 100).toFixed(dp)}%`;
const signed = (n: number | null, dp = 0) =>
  n === null ? '—' : `${n > 0 ? '+' : ''}${n.toFixed(dp)}%`;

function ScoreDial({ score }: { score: number }) {
  const tone =
    score >= 70 ? 'text-green-700 bg-green-50 border-green-200'
    : score >= 45 ? 'text-amber-700 bg-amber-50 border-amber-200'
    : 'text-slate-600 bg-slate-50 border-slate-200';
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-xl border w-16 h-16 shrink-0', tone)}>
      <span className="text-xl font-bold leading-none tabular-nums">{score}</span>
      <span className="text-[10px] opacity-70">ציון</span>
    </div>
  );
}

function OpportunityCard({ opp }: { opp: Opportunity }) {
  const conf = CONFIDENCE_META[opp.confidence];
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <ScoreDial score={opp.score} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-semibold text-sm text-foreground break-all">
                {opp.pagePath}
              </span>
              {opp.pageHost !== PRIMARY_HOST && (
                <Badge variant="outline" className="text-[10px]">{opp.pageHost}</Badge>
              )}
              <Badge variant="outline" className={cn('text-[10px]', conf.cls)}>{conf.label}</Badge>
              <Badge
                variant="outline"
                className={cn('text-[10px]', CTR_SOURCE_META[opp.ctrBenchmarkSource].cls)}
                title={opp.ctrBenchmarkNote}
              >
                {CTR_SOURCE_META[opp.ctrBenchmarkSource].label}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2">
              {opp.signals.map((s) => {
                const meta = SIGNAL_META[s.type];
                const Icon = meta.icon;
                return (
                  <Badge key={s.type} variant="outline" className={cn('text-[10px] gap-1', meta.cls)}>
                    <Icon className="h-3 w-3" />{meta.label}
                  </Badge>
                );
              })}
            </div>

            {/* Page-grain metrics. Never query-grain. */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <Metric label="קליקים" value={String(opp.clicks)} sub={signed(opp.trend.clicksChangePct)} />
              <Metric label="חשיפות" value={String(opp.impressions)} sub={signed(opp.trend.impressionsChangePct)} />
              <Metric label="CTR" value={pct(opp.ctr, 2)} />
              <Metric label="מיקום" value={opp.position.toFixed(1)}
                sub={opp.trend.positionChange === null ? undefined
                  : `${opp.trend.positionChange > 0 ? '↑' : '↓'} ${Math.abs(opp.trend.positionChange).toFixed(1)}`} />
              <Metric
                label="אפסייד משוער"
                value={opp.upside.incrementalClicks === null ? '—' : `+${opp.upside.incrementalClicks}`}
                sub={opp.upside.targetPosition ? `יעד ${opp.upside.targetPosition}` : undefined}
              />
            </div>
          </div>
        </div>

        <Accordion type="single" collapsible className="mt-3">
          <AccordionItem value="why" className="border-b-0">
            <AccordionTrigger className="text-xs py-2 hover:no-underline">
              למה ההמלצה הזו? הצג נימוקים ונתונים
            </AccordionTrigger>
            <AccordionContent className="space-y-3 text-xs">
              <Section title="המלצות">
                {opp.recommendations.length === 0 && (
                  <p className="text-muted-foreground">אין המלצה מובהקת לעמוד זה בתקופה הנוכחית.</p>
                )}
                <ul className="space-y-1.5">
                  {opp.recommendations.map((r, i) => (
                    <li key={i} className="rounded-md bg-muted/40 p-2">
                      <div className="font-medium text-foreground">{r.label}</div>
                      <div className="text-muted-foreground mt-0.5">{r.evidence}</div>
                    </li>
                  ))}
                </ul>
              </Section>

              <Section title="מרכיבי הציון">
                <ul className="space-y-1">
                  {opp.scoreComponents.map((c) => (
                    <li key={c.key} className="flex items-start justify-between gap-3">
                      <span className="text-muted-foreground flex-1">{c.label}: {c.reason}</span>
                      <span className="tabular-nums font-medium shrink-0">
                        {c.points > 0 ? '+' : ''}{c.points}{c.max > 0 ? ` / ${c.max}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </Section>

              <Section title="בסיס הביטחון">
                <ul className="list-disc pr-4 space-y-0.5 text-muted-foreground">
                  {opp.confidenceReasons.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </Section>

              <Section title="אפסייד משוער">
                <p className="text-muted-foreground">{opp.upside.assumptions}</p>
                {opp.upside.basedOnAssumedCtr && opp.upside.incrementalClicks !== null && (
                  <p className="text-amber-700 mt-1">
                    ההערכה נשענת על עקומת CTR מונחת ולא על נתוני האתר — יש להתייחס אליה כהשערה.
                  </p>
                )}
              </Section>

              <Section title="בסיס ההשוואה ל-CTR">
                <p className="text-muted-foreground">{opp.ctrBenchmarkNote}</p>
              </Section>

              <Section title="התנהגות בפועל (GA4)">
                {opp.ga4 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <Metric label="סשנים" value={String(opp.ga4.sessions)} />
                    <Metric label="משתמשים" value={String(opp.ga4.users)} />
                    <Metric label="סשנים מעורבים" value={String(opp.ga4.engaged_sessions)} />
                    <Metric label="שיעור מעורבות" value={pct(opp.ga4.engagement_rate, 0)} />
                    <Metric label="אירועי מפתח" value={String(opp.ga4.key_events)} />
                  </div>
                ) : (
                  <p className="text-muted-foreground">{opp.ga4Note}</p>
                )}
              </Section>

              <Section title="שאילתות ידועות (נתון חלקי)">
                <p className="text-muted-foreground mb-1.5">{opp.knownQueries.note}</p>
                {opp.knownQueries.themes.length === 0 ? (
                  <p className="text-muted-foreground">אין שאילתות ידועות לעמוד זה בתקופה.</p>
                ) : (
                  <ul className="space-y-1">
                    {opp.knownQueries.themes.map((t) => (
                      <li key={t.theme} className="rounded-md bg-muted/40 p-2">
                        <span className="font-medium text-foreground">{t.label}</span>
                        <span className="text-muted-foreground">
                          {' '}— {t.impressions} חשיפות ידועות, מיקום מיטבי {t.bestPosition.toFixed(1)}
                        </span>
                        <div className="text-muted-foreground mt-0.5">
                          {t.queries.slice(0, 5).join(' · ')}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-muted/40 px-2 py-1.5">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="font-semibold text-foreground tabular-nums">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground tabular-nums">{sub}</div>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-semibold text-foreground mb-1">{title}</div>
      {children}
    </div>
  );
}

export function GeoOrganicOpportunities() {
  const [windowDays, setWindowDays] = useState<WindowDays>(28);
  const [host, setHost] = useState<string>(PRIMARY_HOST);
  const [signalFilter, setSignalFilter] = useState<SignalType | 'all'>('all');
  const [confFilter, setConfFilter] = useState<Confidence | 'all'>('all');

  const { data, isLoading } = useOrganicOpportunities(windowDays, host);

  const filtered = useMemo(() => {
    const list = data?.opportunities ?? [];
    return list.filter((o) => {
      if (signalFilter !== 'all' && !o.signals.some((s) => s.type === signalFilter)) return false;
      if (confFilter !== 'all' && o.confidence !== confFilter) return false;
      return true;
    });
  }, [data, signalFilter, confFilter]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">מה כדאי לעשות עכשיו כדי להגדיל תנועה אורגנית?</CardTitle>
          <p className="text-xs text-muted-foreground">
            הזדמנויות מדורגות מנתוני Search Console ו-GA4 אמיתיים. אלו המלצות בלבד — שום פעולה כאן אינה משנה את האתר.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {WINDOWS.map((w) => (
              <Button key={w.value} size="sm"
                variant={windowDays === w.value ? 'default' : 'outline'}
                onClick={() => setWindowDays(w.value)}>{w.label}</Button>
            ))}
            <span className="w-px bg-border mx-1" />
            {[PRIMARY_HOST, SEO_HOST].map((h) => (
              <Button key={h} size="sm"
                variant={host === h ? 'default' : 'outline'}
                onClick={() => setHost(h)}>{h}</Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            <FilterChip active={signalFilter === 'all'} onClick={() => setSignalFilter('all')}>הכל</FilterChip>
            {(Object.keys(SIGNAL_META) as SignalType[])
              .filter((t) => t !== 'query_opportunity' && t !== 'content_gap')
              .map((t) => (
                <FilterChip key={t} active={signalFilter === t} onClick={() => setSignalFilter(t)}>
                  {SIGNAL_META[t].label}
                </FilterChip>
              ))}
            <span className="w-px bg-border mx-1" />
            <FilterChip active={confFilter === 'all'} onClick={() => setConfFilter('all')}>כל רמות הביטחון</FilterChip>
            {(['high', 'medium', 'low'] as Confidence[]).map((c) => (
              <FilterChip key={c} active={confFilter === c} onClick={() => setConfFilter(c)}>
                {CONFIDENCE_META[c].label}
              </FilterChip>
            ))}
          </div>

          {/* Site traffic truth, kept visually separate from page rows so it is
              never confused with the sum of anything below. */}
          {data?.totals && (
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="text-xs font-semibold text-foreground mb-1.5">
                סך תנועה לאתר ({data.totals.property}) — {data.totals.window_start} עד {data.totals.window_end}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <Metric label="קליקים" value={String(data.totals.clicks)}
                  sub={`תקופה קודמת: ${data.totals.prev_clicks}`} />
                <Metric label="חשיפות" value={String(data.totals.impressions)}
                  sub={`תקופה קודמת: ${data.totals.prev_impressions}`} />
                <Metric label="CTR" value={pct(data.totals.ctr, 2)} />
                <Metric label="מיקום ממוצע" value={data.totals.avg_position.toFixed(1)} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                מקור אמת לתנועה: נתוני סך-הכל של Search Console. אינו סכום של העמודים ואינו סכום של השאילתות.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
      )}

      {!isLoading && data?.unavailable && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="font-medium text-foreground">אין נתונים זמינים</p>
            <p className="text-sm text-muted-foreground mt-1">{data.unavailableReason}</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !data?.unavailable && (
        <>
          <div className="text-xs text-muted-foreground">
            {filtered.length} הזדמנויות מתוך {data?.opportunities.length ?? 0} עמודים
          </div>
          <div className="space-y-2">
            {filtered.map((opp) => (
              <OpportunityCard key={`${opp.pageHost}${opp.pagePath}`} opp={opp} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FilterChip({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-[11px] px-2.5 py-1 rounded-full border transition-colors',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-background text-muted-foreground border-border hover:bg-muted',
      )}
    >
      {children}
    </button>
  );
}
