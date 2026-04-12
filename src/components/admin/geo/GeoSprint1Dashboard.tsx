import { useState } from 'react';
import {
  SPRINT1_PAGES, GeoAuditPage, PageType, PriorityImpact,
  PAGE_TYPE_LABELS, DIMENSION_LABELS, DimensionScore,
} from '@/data/geo-sprint1-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Search, TrendingUp, AlertTriangle,
  CheckCircle, Target, Sparkles, ArrowUp, ArrowRight, ArrowDown,
} from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────

function scoreGrade(s: number): { label: string; class: string; bg: string } {
  if (s >= 8) return { label: 'מעולה', class: 'text-emerald-600', bg: 'bg-emerald-500' };
  if (s >= 6) return { label: 'טוב', class: 'text-sky-600', bg: 'bg-sky-500' };
  if (s >= 4) return { label: 'בינוני', class: 'text-amber-600', bg: 'bg-amber-500' };
  return { label: 'חלש', class: 'text-destructive', bg: 'bg-destructive' };
}

function PriorityBadge({ p }: { p: PriorityImpact }) {
  const map = {
    high: { label: 'עדיפות גבוהה', icon: ArrowUp, class: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300' },
    medium: { label: 'עדיפות בינונית', icon: ArrowRight, class: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300' },
    low: { label: 'עדיפות נמוכה', icon: ArrowDown, class: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
  };
  const m = map[p];
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${m.class}`}>
      <m.icon className="h-3 w-3" />
      {m.label}
    </span>
  );
}

function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const g = scoreGrade(score);
  const pct = (score / 10) * 100;
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={3} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor"
          strokeWidth={3} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className={g.class}
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${g.class}`}>
        {score}
      </span>
    </div>
  );
}

function DimensionBar({ label, icon, score }: { label: string; icon: string; score: number }) {
  const g = scoreGrade(score);
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm w-5">{icon}</span>
      <span className="text-xs text-muted-foreground w-24 truncate">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${g.bg}`} style={{ width: `${score * 10}%` }} />
      </div>
      <span className={`text-xs font-semibold w-5 text-left ${g.class}`}>{score}</span>
    </div>
  );
}

// ── Overview Stats ─────────────────────────────────────────────────────

function OverviewStats({ pages }: { pages: GeoAuditPage[] }) {
  const avgScore = Math.round(pages.reduce((s, p) => s + p.geoScore, 0) / pages.length * 10) / 10;
  const highPriority = pages.filter(p => p.priority === 'high').length;
  const missingPages = pages.filter(p => p.geoScore <= 2).length;
  const strongPages = pages.filter(p => p.geoScore >= 7).length;

  const dims = Object.keys(DIMENSION_LABELS) as (keyof typeof DIMENSION_LABELS)[];
  const dimAvgs = dims.map(d => ({
    key: d,
    ...DIMENSION_LABELS[d],
    avg: Math.round(pages.reduce((s, p) => s + (p[d as keyof GeoAuditPage] as DimensionScore).score, 0) / pages.length * 10) / 10,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'ציון GEO ממוצע', value: avgScore, icon: Sparkles, color: scoreGrade(avgScore).class },
          { label: 'עדיפות גבוהה', value: highPriority, icon: AlertTriangle, color: 'text-rose-600' },
          { label: 'דפים חזקים (7+)', value: strongPages, icon: CheckCircle, color: 'text-emerald-600' },
          { label: 'דפים חסרים', value: missingPages, icon: Target, color: 'text-destructive' },
        ].map(s => (
          <Card key={s.label} className="border-border/40">
            <CardContent className="p-4 text-center">
              <s.icon className={`h-5 w-5 mx-auto mb-1.5 ${s.color}`} />
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">ביצועים לפי ממד</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {dimAvgs.map(d => (
            <DimensionBar key={d.key} label={d.labelHe} icon={d.icon} score={d.avg} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Page Card ──────────────────────────────────────────────────────────

function PageCard({ page, onSelect }: { page: GeoAuditPage; onSelect: () => void }) {
  const g = scoreGrade(page.geoScore);
  const dims = Object.keys(DIMENSION_LABELS) as (keyof typeof DIMENSION_LABELS)[];
  const topFix = [...page.entityClarity.fixes, ...page.answerClarity.fixes, ...page.citationReadiness.fixes][0];
  const totalWeaknesses = dims.reduce((s, d) => s + (page[d as keyof GeoAuditPage] as DimensionScore).weaknesses.length, 0);

  return (
    <Card
      className="cursor-pointer hover:shadow-md hover:border-primary/20 transition-all group border-border/40"
      onClick={onSelect}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <ScoreRing score={page.geoScore} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-sm font-semibold">{page.titleHe}</h3>
              <Badge variant="outline" className="text-[10px] font-normal">{PAGE_TYPE_LABELS[page.pageType]}</Badge>
              <PriorityBadge p={page.priority} />
            </div>
            <p className="text-xs text-muted-foreground font-mono mb-2.5 truncate">{page.path}</p>

            {/* Mini dimension bars */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-x-3 gap-y-1.5">
              {dims.map(d => {
                const dim = page[d as keyof GeoAuditPage] as DimensionScore;
                const meta = DIMENSION_LABELS[d];
                const dg = scoreGrade(dim.score);
                return (
                  <div key={d} className="flex items-center gap-1">
                    <span className="text-xs">{meta.icon}</span>
                    <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${dg.bg}`} style={{ width: `${dim.score * 10}%` }} />
                    </div>
                    <span className={`text-[10px] font-semibold ${dg.class}`}>{dim.score}</span>
                  </div>
                );
              })}
            </div>

            {/* Top fix */}
            {topFix && (
              <div className="mt-2.5 flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/30 px-2.5 py-1.5 rounded-lg">
                <TrendingUp className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                <span className="line-clamp-1">{topFix}</span>
              </div>
            )}
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
            <Badge className={`${g.bg} text-white text-[10px]`}>{g.label}</Badge>
            {totalWeaknesses > 0 && (
              <span className="text-[10px] text-muted-foreground">{totalWeaknesses} בעיות</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Detail Dialog ──────────────────────────────────────────────────────

function PageDetailDialog({ page, open, onClose }: { page: GeoAuditPage | null; open: boolean; onClose: () => void }) {
  const dims = Object.keys(DIMENSION_LABELS) as (keyof typeof DIMENSION_LABELS)[];

  if (!page) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <ScoreRing score={page.geoScore} size={56} />
            <div>
              <DialogTitle className="text-right text-lg">{page.titleHe}</DialogTitle>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">{page.path}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="outline" className="text-[10px]">{PAGE_TYPE_LABELS[page.pageType]}</Badge>
                <PriorityBadge p={page.priority} />
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {dims.map(d => {
            const dim = page[d as keyof GeoAuditPage] as DimensionScore;
            const meta = DIMENSION_LABELS[d];
            const dg = scoreGrade(dim.score);
            return (
              <Card key={d} className="border-border/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <span>{meta.icon}</span>
                      {meta.labelHe}
                      <span className="text-xs text-muted-foreground font-normal">({meta.labelEn})</span>
                    </CardTitle>
                    <Badge className={`${dg.bg} text-white text-xs`}>{dim.score}/10</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {dim.strengths.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold text-emerald-600 mb-1 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> חוזקות
                      </p>
                      {dim.strengths.map((s, i) => (
                        <p key={i} className="text-xs text-muted-foreground mr-4">• {s}</p>
                      ))}
                    </div>
                  )}
                  {dim.weaknesses.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold text-amber-600 mb-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> חולשות
                      </p>
                      {dim.weaknesses.map((w, i) => (
                        <p key={i} className="text-xs text-muted-foreground mr-4">• {w}</p>
                      ))}
                    </div>
                  )}
                  {dim.fixes.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold text-primary mb-1 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> תיקונים מומלצים
                      </p>
                      {dim.fixes.map((f, i) => (
                        <p key={i} className="text-xs text-muted-foreground mr-4 flex gap-1.5">
                          <span className="text-primary">→</span> {f}
                        </p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ─────────────────────────────────────────────────────

export function GeoSprint1Dashboard() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<PageType | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityImpact | 'all'>('all');
  const [sortBy, setSortBy] = useState<'score-asc' | 'score-desc' | 'priority'>('priority');
  const [selectedPage, setSelectedPage] = useState<GeoAuditPage | null>(null);

  const filtered = SPRINT1_PAGES
    .filter(p => {
      if (search && !p.titleHe.includes(search) && !p.path.includes(search) && !p.titleEn.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter !== 'all' && p.pageType !== typeFilter) return false;
      if (priorityFilter !== 'all' && p.priority !== priorityFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'score-asc') return a.geoScore - b.geoScore;
      if (sortBy === 'score-desc') return b.geoScore - a.geoScore;
      // priority
      const pOrder = { high: 0, medium: 1, low: 2 };
      return pOrder[a.priority] - pOrder[b.priority] || a.geoScore - b.geoScore;
    });

  const typeButtons: { value: PageType | 'all'; label: string }[] = [
    { value: 'all', label: 'הכל' },
    { value: 'homepage', label: 'דף הבית' },
    { value: 'about', label: 'אודות' },
    { value: 'contact', label: 'קשר' },
    { value: 'faq', label: 'FAQ' },
    { value: 'guide', label: 'מדריכים' },
    { value: 'article', label: 'מאמרים' },
    { value: 'service', label: 'שירותים' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Sprint 1 — ביקורת GEO מעמיקה
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            6 ממדי מוכנות AI • {SPRINT1_PAGES.length} דפים • ציון 1–10
          </p>
        </div>
      </div>

      {/* Overview Tab */}
      <Tabs defaultValue="pages" className="w-full">
        <TabsList className="bg-muted/30 p-1 rounded-xl">
          <TabsTrigger value="overview" className="text-xs rounded-lg">סקירה כללית</TabsTrigger>
          <TabsTrigger value="pages" className="text-xs rounded-lg">ביקורת דפים</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewStats pages={SPRINT1_PAGES} />
        </TabsContent>

        <TabsContent value="pages" className="mt-4 space-y-4">
          {/* Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חיפוש דף לפי שם או נתיב..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* Type filter chips */}
            <div className="flex flex-wrap gap-1.5">
              {typeButtons.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTypeFilter(t.value)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                    typeFilter === t.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border/50 text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Priority + Sort */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex gap-1">
                {(['all', 'high', 'medium', 'low'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPriorityFilter(p)}
                    className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                      priorityFilter === p
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border/50 text-muted-foreground hover:border-primary/30'
                    }`}
                  >
                    {p === 'all' ? 'כל העדיפויות' : p === 'high' ? '🔴 גבוהה' : p === 'medium' ? '🟡 בינונית' : '🟢 נמוכה'}
                  </button>
                ))}
              </div>

              <div className="mr-auto flex gap-1">
                {([
                  { v: 'priority' as const, l: 'עדיפות' },
                  { v: 'score-asc' as const, l: 'ציון ↑' },
                  { v: 'score-desc' as const, l: 'ציון ↓' },
                ]).map(s => (
                  <button
                    key={s.v}
                    onClick={() => setSortBy(s.v)}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                      sortBy === s.v
                        ? 'bg-muted text-foreground border-border'
                        : 'text-muted-foreground border-transparent hover:border-border/50'
                    }`}
                  >
                    {s.l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          <p className="text-xs text-muted-foreground">{filtered.length} דפים</p>

          <div className="space-y-2.5">
            {filtered.map(page => (
              <PageCard key={page.id} page={page} onSelect={() => setSelectedPage(page)} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">לא נמצאו דפים מתאימים</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <PageDetailDialog
        page={selectedPage}
        open={!!selectedPage}
        onClose={() => setSelectedPage(null)}
      />
    </div>
  );
}
