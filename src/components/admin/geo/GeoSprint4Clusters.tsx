import { useState, useMemo, useCallback } from 'react';
import {
  TOPIC_CLUSTERS, COVERAGE_VERDICT_MAP, ROLE_META, INTENT_LABELS,
  type TopicCluster, type ClusterPage, type IntentType,
} from '@/data/geo-sprint4-data';
import {
  initializeLiveContent, initializeRecommendations,
  type LivePageContent, type EditableRecommendation,
} from '@/data/geo-live-content';

import { usePageContentUpdater } from '@/contexts/PageContentContext';
import { usePageContentPersistence } from '@/hooks/usePageContentPersistence';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GeoLiveEditor } from './GeoLiveEditor';
import {
  AlertTriangle, CheckCircle2, Circle, ExternalLink, Layers, Link2,
  Target, TrendingUp, XCircle, PenLine, Save, Loader2,
} from 'lucide-react';

// Map cluster page paths to transform system pageIds
const PATH_TO_PAGEID: Record<string, string> = {
  '/': 'homepage',
  '/about': 'about',
  '/services': 'allergy-testing',
  '/guides/טעימות-ראשונות-אלרגנים': 'first-foods',
  '/knowledge/פריחה-אחרי-במבה': 'bamba-reaction',
};

function getPageId(path: string): string | null {
  return PATH_TO_PAGEID[path] || null;
}

const roleOrder: ClusterPage['role'][] = ['pillar', 'supporting', 'weak', 'duplicate', 'missing'];
const sortPages = (pages: ClusterPage[]) =>
  [...pages].sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role));

function OverviewStats() {
  const totalPages = TOPIC_CLUSTERS.reduce((s, c) => s + c.pages.length, 0);
  const missing = TOPIC_CLUSTERS.reduce((s, c) => s + c.pages.filter(p => p.role === 'missing').length, 0);
  const weak = TOPIC_CLUSTERS.reduce((s, c) => s + c.pages.filter(p => p.role === 'weak').length, 0);
  const avgCoverage = Math.round(TOPIC_CLUSTERS.reduce((s, c) => s + c.coverageDepth, 0) / TOPIC_CLUSTERS.length);

  const stats = [
    { label: 'אשכולות', value: TOPIC_CLUSTERS.length, icon: Layers, accent: 'text-primary' },
    { label: 'סה"כ דפים', value: totalPages, icon: Target, accent: 'text-primary' },
    { label: 'דפים חסרים', value: missing, icon: XCircle, accent: 'text-destructive' },
    { label: 'דפים חלשים', value: weak, icon: AlertTriangle, accent: 'text-amber-600 dark:text-amber-400' },
    { label: 'כיסוי ממוצע', value: `${avgCoverage}%`, icon: TrendingUp, accent: 'text-emerald-600 dark:text-emerald-400' },
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

function DepthRing({ value }: { value: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const color =
    value >= 75 ? 'hsl(var(--primary))'
    : value >= 50 ? 'hsl(45, 93%, 47%)'
    : value >= 25 ? 'hsl(25, 95%, 53%)'
    : 'hsl(var(--destructive))';
  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-base font-bold text-foreground">{value}%</span>
      </div>
    </div>
  );
}

function PageRow({ page, onTransform }: { page: ClusterPage; onTransform: (page: ClusterPage) => void }) {
  const roleMeta = ROLE_META[page.role];
  const intentMeta = INTENT_LABELS[page.intent];
  const pageId = page.path ? getPageId(page.path) : null;
  const canTransform = page.role !== 'missing' && !!pageId;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors border border-border/30">
      <div className="flex flex-col items-center gap-1 pt-0.5">
        {page.role === 'missing' ? <XCircle className="h-4 w-4 text-destructive" />
        : page.role === 'weak' ? <AlertTriangle className="h-4 w-4 text-amber-500" />
        : page.role === 'pillar' ? <CheckCircle2 className="h-4 w-4 text-primary" />
        : <Circle className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${roleMeta.color}`}>
            {roleMeta.label}
          </span>
          <span className="text-sm font-medium text-foreground truncate">{page.titleHe}</span>
        </div>
        {page.path && <p className="text-[11px] text-muted-foreground font-mono truncate">{page.path}</p>}
        {page.notes && <p className="text-xs text-amber-600 dark:text-amber-400">{page.notes}</p>}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            {intentMeta.icon} {intentMeta.label}
          </span>
          {page.geoScore > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
              GEO {page.geoScore}/10
            </span>
          )}
        </div>
        {page.linksMissing && page.linksMissing.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-destructive">
            <Link2 className="h-3 w-3" />
            קישורים חסרים: {page.linksMissing.join(', ')}
          </div>
        )}
      </div>
      {canTransform ? (
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1 text-[10px] h-7"
          onClick={() => onTransform(page)}
        >
          <PenLine className="h-3 w-3" />
          טרנספורמציה
        </Button>
      ) : page.role !== 'missing' ? (
        <span className="shrink-0 text-[10px] text-muted-foreground text-left">
          טרם חובר לעדכון חי באתר
        </span>
      ) : null}
    </div>
  );
}

// ── Cluster Page Editor Dialog ──
function ClusterPageEditor({
  page,
  open,
  onClose,
}: {
  page: ClusterPage | null;
  open: boolean;
  onClose: () => void;
}) {
  const pageId = page?.path ? getPageId(page.path) : null;
  const { setSections: setPageContentSections } = usePageContentUpdater();
  const { savePage, saving: isSaving } = usePageContentPersistence();

  const [liveContent, setLiveContent] = useState<LivePageContent | null>(null);
  const [recommendations, setRecommendations] = useState<EditableRecommendation[]>([]);
  const [initialized, setInitialized] = useState<string | null>(null);

  // Re-initialize when a different page is selected
  if (open && pageId && initialized !== pageId) {
    const content = initializeLiveContent(pageId);
    const recs = initializeRecommendations(pageId);
    setLiveContent(content);
    setRecommendations(recs);
    setInitialized(pageId);
  }

  // Reset when closed
  if (!open && initialized) {
    setInitialized(null);
    setLiveContent(null);
    setRecommendations([]);
  }

  const handleSave = useCallback(async () => {
    if (!pageId || !liveContent) return;
    const sections = liveContent.sections.map(s => ({
      heading: s.heading,
      tag: s.tag,
      content: s.content,
    }));
    setPageContentSections(pageId, sections);
    const ok = await savePage(pageId, sections);
    if (ok) {
      window.dispatchEvent(new CustomEvent('geo-page-saved', { detail: { pageId } }));
    }
  }, [pageId, liveContent, savePage, setPageContentSections]);

  if (!page || !pageId || !liveContent) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <PenLine className="h-4 w-4 text-primary" />
            טרנספורמציה: {page.titleHe}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">{page.path}</p>
        </DialogHeader>

        <GeoLiveEditor
          liveContent={liveContent}
          recommendations={recommendations}
          onLiveContentUpdate={setLiveContent}
          onRecommendationsUpdate={setRecommendations}
        />

        <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
          <Button variant="outline" size="sm" onClick={onClose}>סגור</Button>
          <Button
            size="sm"
            className="gap-2"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? 'שומר...' : 'שמור קבוע ל-DB'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ClusterCard({ cluster, onTransformPage }: { cluster: TopicCluster; onTransformPage: (page: ClusterPage) => void }) {
  const [expanded, setExpanded] = useState(false);
  const v = COVERAGE_VERDICT_MAP[cluster.coverageVerdict];
  const missing = cluster.pages.filter(p => p.role === 'missing').length;
  const weak = cluster.pages.filter(p => p.role === 'weak').length;
  const existing = cluster.pages.filter(p => p.role !== 'missing').length;
  const editableCount = cluster.pages.filter(p => p.role !== 'missing' && p.path && getPageId(p.path)).length;

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardHeader className="cursor-pointer hover:bg-muted/20 transition-colors pb-3" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-4">
          <DepthRing value={cluster.coverageDepth} />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base">{cluster.nameHe}</CardTitle>
              <Badge variant="outline" className="text-[10px]">{cluster.nameEn}</Badge>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${v.color} ${v.bg}`}>{v.label}</span>
              {editableCount > 0 && (
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <PenLine className="h-2.5 w-2.5" />
                  {editableCount} ניתנים לעריכה
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{cluster.summary}</p>
            <div className="flex gap-3 text-[11px]">
              <span className="text-primary font-medium">{existing} קיימים</span>
              {missing > 0 && <span className="text-destructive font-medium">{missing} חסרים</span>}
              {weak > 0 && <span className="text-amber-600 dark:text-amber-400 font-medium">{weak} חלשים</span>}
            </div>
            {cluster.missingIntents.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {cluster.missingIntents.map(i => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">
                    {INTENT_LABELS[i].icon} {INTENT_LABELS[i].label} חסר
                  </span>
                ))}
              </div>
            )}
          </div>
          <ExternalLink className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0 space-y-2">
          <Progress value={cluster.coverageDepth} className="h-1.5" />
          <div className="space-y-2">
            {sortPages(cluster.pages).map((p, i) => (
              <PageRow key={i} page={p} onTransform={onTransformPage} />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function CoverageDepthPanel() {
  const sorted = [...TOPIC_CLUSTERS].sort((a, b) => b.coverageDepth - a.coverageDepth);
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          עומק כיסוי נושאי - AI Coverage Depth
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          האם האתר נראה כמקור מקיף בעיני מערכות AI? ציון גבוה = סיכוי גבוה יותר להיות מצוטט.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.map(c => {
          const v = COVERAGE_VERDICT_MAP[c.coverageVerdict];
          return (
            <div key={c.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{c.nameHe}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${v.color} ${v.bg}`}>{v.label}</span>
                  <span className="text-xs font-bold text-foreground w-10 text-left">{c.coverageDepth}%</span>
                </div>
              </div>
              <Progress value={c.coverageDepth} className="h-2" />
            </div>
          );
        })}
        <div className="mt-4 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
          <p className="text-xs font-semibold text-destructive mb-1">⚠️ פערים קריטיים</p>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            {sorted.filter(c => c.coverageVerdict === 'minimal' || c.coverageVerdict === 'thin').map(c => (
              <li key={c.id}>• {c.nameHe} - {c.summary}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function IntentMapPanel() {
  const intentGroups = useMemo(() => {
    const map: Record<IntentType, { existing: ClusterPage[]; missing: ClusterPage[]; cluster: string }[]> = {
      definition: [], symptom: [], diagnosis: [], treatment: [], reassurance: [], emergency: [], booking: [],
    };
    TOPIC_CLUSTERS.forEach(c => {
      const byIntent: Record<string, { existing: ClusterPage[]; missing: ClusterPage[] }> = {};
      c.pages.forEach(p => {
        if (!byIntent[p.intent]) byIntent[p.intent] = { existing: [], missing: [] };
        if (p.role === 'missing') byIntent[p.intent].missing.push(p);
        else byIntent[p.intent].existing.push(p);
      });
      Object.entries(byIntent).forEach(([intent, data]) => {
        map[intent as IntentType].push({ ...data, cluster: c.nameHe });
      });
    });
    return map;
  }, []);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          מפת כוונות תשובה
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          קיבוץ דפים לפי סוג הכוונה. חושף פערים בסוגי תשובות שהאתר לא מכסה.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {(Object.keys(INTENT_LABELS) as IntentType[]).map(intent => {
          const meta = INTENT_LABELS[intent];
          const groups = intentGroups[intent];
          const totalExisting = groups.reduce((s, g) => s + g.existing.length, 0);
          const totalMissing = groups.reduce((s, g) => s + g.missing.length, 0);

          return (
            <div key={intent} className="p-3 rounded-lg border border-border/50 bg-card">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{meta.icon}</span>
                  <span className="text-sm font-semibold text-foreground">{meta.label}</span>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-[10px]">{totalExisting} קיימים</Badge>
                  {totalMissing > 0 && <Badge variant="destructive" className="text-[10px]">{totalMissing} חסרים</Badge>}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-1.5">
                {groups.flatMap(g =>
                  [...g.existing, ...g.missing].map((p, i) => (
                    <div key={`${g.cluster}-${i}`}
                      className={`text-[11px] px-2 py-1.5 rounded flex items-center gap-1.5 ${
                        p.role === 'missing' ? 'bg-destructive/10 text-destructive' : 'bg-muted/30 text-foreground'
                      }`}>
                      {p.role === 'missing' ? <XCircle className="h-3 w-3 flex-shrink-0" /> : <CheckCircle2 className="h-3 w-3 flex-shrink-0 text-primary" />}
                      <span className="truncate">{p.titleHe}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function GeoSprint4Clusters() {
  const [editingPage, setEditingPage] = useState<ClusterPage | null>(null);

  return (
    <div className="space-y-6">
      <OverviewStats />

      <Tabs defaultValue="clusters" className="w-full">
        <TabsList className="w-full h-auto gap-1 bg-muted/30 p-1 rounded-xl flex-wrap">
          <TabsTrigger value="clusters" className="text-xs rounded-lg">אשכולות</TabsTrigger>
          <TabsTrigger value="coverage" className="text-xs rounded-lg">עומק כיסוי</TabsTrigger>
          <TabsTrigger value="intents" className="text-xs rounded-lg">מפת כוונות</TabsTrigger>
        </TabsList>

        <TabsContent value="clusters" className="mt-4 space-y-4">
          {TOPIC_CLUSTERS.map(c => (
            <ClusterCard
              key={c.id}
              cluster={c}
              onTransformPage={setEditingPage}
            />
          ))}
        </TabsContent>
        <TabsContent value="coverage" className="mt-4"><CoverageDepthPanel /></TabsContent>
        <TabsContent value="intents" className="mt-4"><IntentMapPanel /></TabsContent>
      </Tabs>

      <ClusterPageEditor
        page={editingPage}
        open={!!editingPage}
        onClose={() => setEditingPage(null)}
      />
    </div>
  );
}
