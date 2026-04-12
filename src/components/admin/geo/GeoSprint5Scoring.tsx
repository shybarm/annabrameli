import { useState, useMemo } from 'react';
import {
  SCORED_PAGES, DIMENSION_META, REC_LABEL_META,
  getAICitableFirst, getHighValueWeakFormat, getOverbroadPages,
  type ScoredPage, type ScoreDimension,
} from '@/data/geo-sprint5-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Award, ChevronDown, ChevronUp, Filter, Lightbulb, Search,
  Star, Target, TrendingUp, Zap,
} from 'lucide-react';

function ScoreRing({ value, size = 64 }: { value: number; size?: number }) {
  const r = size * 0.44;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 10) * circ;
  const color =
    value >= 7.5 ? 'hsl(var(--primary))'
    : value >= 5.5 ? 'hsl(45, 93%, 47%)'
    : value >= 3.5 ? 'hsl(25, 95%, 53%)'
    : 'hsl(var(--destructive))';
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
          strokeWidth="4" strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-foreground">{value}</span>
      </div>
    </div>
  );
}

function OverviewStats() {
  const avg = Math.round(SCORED_PAGES.reduce((s, p) => s + p.weightedScore, 0) / SCORED_PAGES.length * 10) / 10;
  const quickWins = SCORED_PAGES.reduce((s, p) => s + p.recommendations.filter(r => r.label === 'quick-win').length, 0);
  const rewrites = SCORED_PAGES.reduce((s, p) => s + p.recommendations.filter(r => r.label === 'rewrite-required').length, 0);
  const citable = getAICitableFirst().length;

  const stats = [
    { label: 'ציון ממוצע', value: avg, icon: Award, accent: 'text-primary' },
    { label: 'דפים מנותחים', value: SCORED_PAGES.length, icon: Target, accent: 'text-primary' },
    { label: 'ניצחונות מהירים', value: quickWins, icon: Zap, accent: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'שכתוב נדרש', value: rewrites, icon: Filter, accent: 'text-amber-600 dark:text-amber-400' },
    { label: 'מוכנים לציטוט AI', value: citable, icon: Star, accent: 'text-purple-600 dark:text-purple-400' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {stats.map(s => (
        <Card key={s.label} className="border-border/50">
          <CardContent className="p-4 flex flex-col items-center text-center gap-1">
            <s.icon className={`h-5 w-5 ${s.accent}`} />
            <span className="text-2xl font-bold text-foreground">{s.value}</span>
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DimBar({ dimension, score }: { dimension: ScoreDimension; score: number }) {
  const meta = DIMENSION_META[dimension];
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-5 text-center">{meta.icon}</span>
      <span className="text-[11px] text-muted-foreground w-24 truncate">{meta.label}</span>
      <div className="flex-1"><Progress value={score * 10} className="h-1.5" /></div>
      <span className="text-[11px] font-bold text-foreground w-6 text-left">{score}</span>
    </div>
  );
}

function PageDetailDialog({ page, open, onClose }: { page: ScoredPage | null; open: boolean; onClose: () => void }) {
  if (!page) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-3">
            <ScoreRing value={page.weightedScore} size={48} />
            <div>
              <p>{page.titleHe}</p>
              <p className="text-xs font-mono text-muted-foreground">{page.path}</p>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          {page.dimensions.map(d => {
            const meta = DIMENSION_META[d.dimension];
            return (
              <div key={d.dimension} className="p-3 rounded-lg border border-border/50 bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold flex items-center gap-2">
                    {meta.icon} {meta.label}
                    <Badge variant="outline" className="text-[10px]">{meta.labelEn}</Badge>
                  </span>
                  <span className="text-sm font-bold text-foreground">{d.score}/10</span>
                </div>
                <Progress value={d.score * 10} className="h-1.5" />
                {d.working.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mb-0.5">✓ עובד</p>
                    {d.working.map((w, i) => <p key={i} className="text-xs text-muted-foreground">• {w}</p>)}
                  </div>
                )}
                {d.missing.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-destructive mb-0.5">✗ חסר</p>
                    {d.missing.map((m, i) => <p key={i} className="text-xs text-muted-foreground">• {m}</p>)}
                  </div>
                )}
                {d.fixes.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-primary mb-0.5">🔧 תיקון</p>
                    {d.fixes.map((f, i) => <p key={i} className="text-xs text-muted-foreground">• {f}</p>)}
                  </div>
                )}
                {d.impact && <p className="text-[10px] text-muted-foreground italic">💡 השפעה: {d.impact}</p>}
              </div>
            );
          })}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-foreground">המלצות</h4>
            {page.recommendations.map((r, i) => {
              const rm = REC_LABEL_META[r.label];
              return (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/20">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${rm.color} ${rm.bg}`}>{rm.label}</span>
                  <span className="text-xs text-foreground">{r.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PageRow({ page, onClick }: { page: ScoredPage; onClick: () => void }) {
  return (
    <Card className="border-border/50 cursor-pointer hover:border-primary/40 transition-colors" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <ScoreRing value={page.weightedScore} />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground">{page.titleHe}</span>
              <Badge variant="outline" className="text-[10px]">{page.type}</Badge>
            </div>
            <p className="text-[11px] font-mono text-muted-foreground truncate">{page.path}</p>
            <div className="space-y-1">
              {[...page.dimensions].sort((a, b) => a.score - b.score).slice(0, 3).map(d =>
                <DimBar key={d.dimension} dimension={d.dimension} score={d.score} />
              )}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {page.recommendations.map((r, i) => {
                const rm = REC_LABEL_META[r.label];
                return <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${rm.color} ${rm.bg}`}>{rm.label}</span>;
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StrategicList({ title, icon: Icon, pages, accent, description }: {
  title: string; icon: React.ElementType; pages: ScoredPage[]; accent: string; description: string;
}) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2"><Icon className={`h-5 w-5 ${accent}`} />{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {pages.length === 0 && <p className="text-xs text-muted-foreground">אין דפים בקטגוריה זו.</p>}
        {pages.map(p => (
          <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20">
            <ScoreRing value={p.weightedScore} size={40} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{p.titleHe}</p>
              <p className="text-[10px] font-mono text-muted-foreground truncate">{p.path}</p>
            </div>
            <div className="flex gap-1 flex-wrap justify-end">
              {p.recommendations.slice(0, 2).map((r, i) => {
                const rm = REC_LABEL_META[r.label];
                return <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${rm.color} ${rm.bg}`}>{rm.label}</span>;
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function WeightBreakdown() {
  const dims = Object.entries(DIMENSION_META) as [ScoreDimension, typeof DIMENSION_META[ScoreDimension]][];
  const sorted = dims.sort((a, b) => b[1].weight - a[1].weight);
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary" />משקלות הציון</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sorted.map(([key, meta]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-xs w-5 text-center">{meta.icon}</span>
            <span className="text-xs text-foreground flex-1">{meta.label}</span>
            <div className="w-32"><Progress value={meta.weight * (100 / 15)} className="h-1.5" /></div>
            <span className="text-xs font-bold text-foreground w-8 text-left">{meta.weight}%</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function GeoSprint5Scoring() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedPage, setSelectedPage] = useState<ScoredPage | null>(null);

  const types = useMemo(() => {
    const s = new Set(SCORED_PAGES.map(p => p.type));
    return ['all', ...Array.from(s)];
  }, []);

  const filtered = useMemo(() => {
    let list = SCORED_PAGES;
    if (typeFilter !== 'all') list = list.filter(p => p.type === typeFilter);
    if (search) list = list.filter(p => p.titleHe.includes(search) || p.path.includes(search));
    list = [...list].sort((a, b) => sortDir === 'asc' ? a.weightedScore - b.weightedScore : b.weightedScore - a.weightedScore);
    return list;
  }, [search, typeFilter, sortDir]);

  return (
    <div className="space-y-6">
      <OverviewStats />

      <Tabs defaultValue="pages" className="w-full">
        <TabsList className="w-full h-auto gap-1 bg-muted/30 p-1 rounded-xl flex-wrap">
          <TabsTrigger value="pages" className="text-xs rounded-lg">ניתוח דפים</TabsTrigger>
          <TabsTrigger value="strategic" className="text-xs rounded-lg">הזדמנויות</TabsTrigger>
          <TabsTrigger value="weights" className="text-xs rounded-lg">משקלות</TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="mt-4 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="חפש דף..." value={search} onChange={e => setSearch(e.target.value)} className="pr-9 text-sm" />
            </div>
            <div className="flex gap-1 flex-wrap">
              {types.map(t => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${
                    typeFilter === t ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}>
                  {t === 'all' ? 'הכל' : t}
                </button>
              ))}
            </div>
            <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-muted/50 text-muted-foreground hover:bg-muted">
              {sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}ציון
            </button>
          </div>
          <div className="space-y-3">
            {filtered.map(p => <PageRow key={p.id} page={p} onClick={() => setSelectedPage(p)} />)}
          </div>
        </TabsContent>

        <TabsContent value="strategic" className="mt-4 space-y-4">
          <StrategicList title="מוכנים לציטוט AI ראשונים" icon={Star} pages={getAICitableFirst()}
            accent="text-purple-600 dark:text-purple-400"
            description="דפים שהכי קרובים למצב שבו AI יצטט אותם. שיפורים קטנים = impact גדול." />
          <StrategicList title="ערך נושאי גבוה — פורמט חלש" icon={TrendingUp} pages={getHighValueWeakFormat()}
            accent="text-amber-600 dark:text-amber-400"
            description="תוכן חזק, מבנה לא מותאם. שכתוב מבני ישפר אותם משמעותית." />
          <StrategicList title="דפים רחבים מדי — צריכים צמצום" icon={Target} pages={getOverbroadPages()}
            accent="text-destructive"
            description="דפים שמנסים לכסות יותר מדי. פיצול לדפים ממוקדים ישפר דירוג." />
        </TabsContent>

        <TabsContent value="weights" className="mt-4"><WeightBreakdown /></TabsContent>
      </Tabs>

      <PageDetailDialog page={selectedPage} open={!!selectedPage} onClose={() => setSelectedPage(null)} />
    </div>
  );
}
