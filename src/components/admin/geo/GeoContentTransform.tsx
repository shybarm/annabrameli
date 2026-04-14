import { useState, useCallback, useEffect } from 'react';
import {
  CONTENT_TRANSFORMS, WORKFLOW_STATUS_CONFIG, PRIORITY_CONFIG,
  type ContentTransform, type WorkflowStatus, type PriorityLevel,
} from '@/data/geo-content-transforms';
import {
  initializeLiveContent, initializeRecommendations,
  type LivePageContent, type EditableRecommendation,
} from '@/data/geo-live-content';
import { usePageContentUpdater } from '@/contexts/PageContentContext';
import { WORKSPACE_BRIEFS } from '@/data/geo-workspace-briefs';
import { usePageContentPersistence } from '@/hooks/usePageContentPersistence';
import { useGeoRescan, type GeoScanResult } from '@/hooks/useGeoRescan';
import { useGeoWorkflows, type PageWorkflow } from '@/hooks/useGeoWorkflows';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

import { DiagnosisTab, StructureTab } from './GeoTransformTabs';
import { PrePublishChecklist } from './GeoPrePublishChecklist';
import { GeoLiveEditor } from './GeoLiveEditor';
import {
  AlertTriangle, ArrowRight, Calendar, FileText, Filter, Save,
  Microscope, PenLine, RefreshCw, StickyNote, User, Zap, Loader2,
  CheckCircle2, XCircle, TrendingUp,
} from 'lucide-react';

// ── Default workflow seeds (used as fallback before DB loads) ──
const DEFAULT_WORKFLOWS: Record<string, PageWorkflow> = Object.fromEntries(
  CONTENT_TRANSFORMS.map(t => {
    const brief = WORKSPACE_BRIEFS.find(b => b.id === t.pageId);
    const isNew = brief && brief.currentGeoScore === 0;
    return [t.pageId, {
      status: isNew ? 'rewrite_needed' : 'not_reviewed',
      priority: t.diagnosis.geoBlockers.length >= 3 ? 'critical' : t.diagnosis.geoBlockers.length >= 2 ? 'high' : 'medium',
      owner: '',
      lastReviewed: '',
      notes: '',
    }];
  })
);

const ALL_STATUSES: WorkflowStatus[] = [
  'not_reviewed', 'rewrite_needed', 'in_progress', 'medical_review',
  'approved', 'ready_to_publish', 'published', 're_audit',
];

function StatusBadge({ status }: { status: string }) {
  const cfg = WORKFLOW_STATUS_CONFIG[status as WorkflowStatus] || WORKFLOW_STATUS_CONFIG['not_reviewed'];
  return <Badge className={`text-[10px] border ${cfg.color}`}>{cfg.label}</Badge>;
}

function PriorityBadge({ priority }: { priority: string }) {
  const cfg = PRIORITY_CONFIG[priority as PriorityLevel] || PRIORITY_CONFIG['medium'];
  return <Badge className={`text-[10px] ${cfg.color}`}>{cfg.label}</Badge>;
}

function TransformCard({
  transform, workflow, onClick, scanResult,
}: {
  transform: ContentTransform;
  workflow: PageWorkflow;
  onClick: () => void;
  scanResult?: GeoScanResult | null;
}) {
  const brief = WORKSPACE_BRIEFS.find(b => b.id === transform.pageId);
  if (!brief) return null;
  const blockers = scanResult?.blockers?.length ?? transform.diagnosis.geoBlockers.length;
  const changes = transform.changeLog.length;
  const currentScore = scanResult?.overallScore ?? brief.currentGeoScore;

  return (
    <Card
      className="border-border/50 cursor-pointer hover:border-primary/40 transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <StatusBadge status={workflow.status} />
              <PriorityBadge priority={workflow.priority} />
              <Badge variant="outline" className="text-[10px]">{brief.pageType}</Badge>
              {scanResult && (
                <Badge className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 gap-1">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  נסרק
                </Badge>
              )}
            </div>
            <h3 className="text-sm font-bold text-foreground">{brief.suggestedTitle}</h3>
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5">{brief.pagePath}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${currentScore >= 7 ? 'text-primary' : currentScore >= 5 ? 'text-amber-600' : currentScore === 0 ? 'text-muted-foreground' : 'text-destructive'}`}>
              {currentScore || '-'}
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{brief.targetGeoScore}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-destructive" />{blockers} חוסמי GEO</span>
          <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{transform.draft.length} סקציות</span>
          <span className="flex items-center gap-1"><RefreshCw className="h-3 w-3" />{changes} שינויים</span>
          {scanResult?.scannedAt && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              נסרק: {new Date(scanResult.scannedAt).toLocaleDateString('he-IL')}
            </span>
          )}
          {workflow.owner && (
            <span className="flex items-center gap-1"><User className="h-3 w-3" />{workflow.owner}</span>
          )}
          {workflow.notes && (
            <span className="flex items-center gap-1"><StickyNote className="h-3 w-3" />הערה</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function WorkflowTab({
  workflow, onChange,
}: {
  workflow: PageWorkflow;
  onChange: (updated: PageWorkflow) => void;
}) {
  return (
    <div className="space-y-5" dir="rtl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">סטטוס</label>
          <Select value={workflow.status} onValueChange={(v) => onChange({ ...workflow, status: v as WorkflowStatus })}>
            <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ALL_STATUSES.map(s => (
                <SelectItem key={s} value={s} className="text-xs">{WORKFLOW_STATUS_CONFIG[s].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">עדיפות</label>
          <Select value={workflow.priority} onValueChange={(v) => onChange({ ...workflow, priority: v as PriorityLevel })}>
            <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(['critical', 'high', 'medium', 'low'] as PriorityLevel[]).map(p => (
                <SelectItem key={p} value={p} className="text-xs">{PRIORITY_CONFIG[p].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">אחראי</label>
          <Input className="text-xs" placeholder="שם האחראי..." value={workflow.owner} onChange={(e) => onChange({ ...workflow, owner: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">תאריך בדיקה אחרון</label>
          <Input type="date" className="text-xs" value={workflow.lastReviewed} onChange={(e) => onChange({ ...workflow, lastReviewed: e.target.value })} />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground">הערות</label>
        <Textarea className="text-xs min-h-[80px]" placeholder="הערות לצוות התוכן או לרופאה..." value={workflow.notes} onChange={(e) => onChange({ ...workflow, notes: e.target.value })} />
      </div>
    </div>
  );
}

// ── Scan Results Panel ──
function ScanResultsPanel({ scanResult, previousScore }: { scanResult: GeoScanResult; previousScore: number }) {
  const dims = scanResult.dimensions;
  const dimArray = Array.isArray(dims) ? dims : Object.entries(dims).map(([key, val]) => ({ ...val, dimension: key }));
  const scoreDiff = scanResult.overallScore - previousScore;

  return (
    <div className="space-y-4" dir="rtl">
      {/* Score header */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-l from-primary/10 to-transparent border border-primary/20">
        <div className="text-center">
          <div className="text-3xl font-bold text-foreground">{scanResult.overallScore}</div>
          <div className="text-[10px] text-muted-foreground">ציון GEO</div>
        </div>
        {previousScore > 0 && (
          <div className={`flex items-center gap-1 text-sm font-bold ${scoreDiff > 0 ? 'text-emerald-600' : scoreDiff < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
            <TrendingUp className="h-4 w-4" />
            {scoreDiff > 0 ? '+' : ''}{scoreDiff.toFixed(1)}
            <span className="text-xs font-normal text-muted-foreground mr-1">מהסריקה הקודמת ({previousScore})</span>
          </div>
        )}
        <div className="text-[10px] text-muted-foreground mr-auto">
          נסרק: {new Date(scanResult.scannedAt).toLocaleString('he-IL')}
        </div>
      </div>

      {/* Dimensions */}
      <div className="space-y-2">
        <h4 className="text-sm font-bold text-foreground">ציון לפי ממד</h4>
        {dimArray.map((d: any, i: number) => (
          <div key={d.dimension || i} className="p-3 rounded-lg border border-border/50 bg-card space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">{d.dimension || `ממד ${i + 1}`}</span>
              <span className="text-xs font-bold text-foreground">{d.score}/10</span>
            </div>
            <Progress value={d.score * 10} className="h-1.5" />
            {d.working?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {d.working.map((w: string, j: number) => (
                  <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">✓ {w}</span>
                ))}
              </div>
            )}
            {d.missing?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {d.missing.map((m: string, j: number) => (
                  <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">✗ {m}</span>
                ))}
              </div>
            )}
            {d.fixes?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {d.fixes.map((f: string, j: number) => (
                  <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">🔧 {f}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Blockers */}
      {scanResult.blockers.length > 0 && (
        <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 space-y-1">
          <h4 className="text-xs font-bold text-destructive flex items-center gap-1">
            <XCircle className="h-3.5 w-3.5" />חוסמי GEO ({scanResult.blockers.length})
          </h4>
          {scanResult.blockers.map((b, i) => (
            <p key={i} className="text-xs text-muted-foreground">• {b}</p>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {scanResult.recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-foreground">המלצות</h4>
          {scanResult.recommendations.map((r, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/20">
              <Badge variant="outline" className="text-[10px] shrink-0">{r.label}</Badge>
              <span className="text-xs text-foreground">{r.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TransformDetail({
  transform, open, onClose, workflow, onWorkflowChange,
  checklist, onChecklistToggle,
  liveContent, recommendations,
  onLiveContentUpdate, onRecommendationsUpdate,
  onSavePermanent, isSaving, savePhase, saveButtonLabel,
  onReAudit, isScanning,
  scanResult,
}: {
  transform: ContentTransform | null;
  open: boolean;
  onClose: () => void;
  workflow: PageWorkflow | null;
  onWorkflowChange: (w: PageWorkflow) => void;
  checklist: Record<string, boolean>;
  onChecklistToggle: (itemId: string, checked: boolean) => void;
  liveContent: LivePageContent | null;
  recommendations: EditableRecommendation[];
  onLiveContentUpdate: (content: LivePageContent) => void;
  onRecommendationsUpdate: (recs: EditableRecommendation[]) => void;
  onSavePermanent: () => void;
  isSaving: boolean;
  savePhase?: string;
  saveButtonLabel?: string;
  onReAudit: () => void;
  isScanning: boolean;
  scanResult: GeoScanResult | null;
}) {
  if (!transform || !workflow || !liveContent) return null;
  const brief = WORKSPACE_BRIEFS.find(b => b.id === transform.pageId);
  if (!brief) return null;

  const appliedCount = recommendations.filter(r => r.status === 'applied').length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-3">
            <Microscope className="h-5 w-5 text-primary" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="truncate">{brief.suggestedTitle}</p>
                <StatusBadge status={workflow.status} />
                <PriorityBadge priority={workflow.priority} />
                {appliedCount > 0 && (
                  <Badge className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    {appliedCount} הוחלו
                  </Badge>
                )}
                {scanResult && (
                  <Badge className="text-[9px] bg-primary/10 text-primary gap-1">
                    GEO {scanResult.overallScore}
                  </Badge>
                )}
              </div>
              <p className="text-xs font-mono text-muted-foreground font-normal">{brief.pagePath}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Save & Re-audit buttons */}
        <div className="flex justify-end gap-2 mt-2">
          <Button
            onClick={onReAudit}
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={isScanning}
          >
            {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {isScanning ? 'סורק...' : 'בחינה מחדש (AI)'}
          </Button>
          <Button
            onClick={onSavePermanent}
            disabled={isSaving || appliedCount === 0}
            className="gap-2"
            size="sm"
          >
            {(savePhase === 'saving' || savePhase === 'rescanning') ? <Loader2 className="h-4 w-4 animate-spin" /> : savePhase === 'done' ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saveButtonLabel || 'שמור קבוע ל-DB'}
          </Button>
        </div>

        <Tabs defaultValue="editor" className="mt-4" dir="rtl">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="editor" className="text-xs">עריכה חיה</TabsTrigger>
            <TabsTrigger value="scan" className="text-xs gap-1">
              סריקת GEO
              {scanResult && <span className="text-[9px] bg-primary/20 px-1 rounded">{scanResult.overallScore}</span>}
            </TabsTrigger>
            <TabsTrigger value="workflow" className="text-xs">מעקב</TabsTrigger>
            <TabsTrigger value="diagnosis" className="text-xs">אבחון</TabsTrigger>
            <TabsTrigger value="structure" className="text-xs">מבנה GEO</TabsTrigger>
            <TabsTrigger value="checklist" className="text-xs">צ׳קליסט</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="mt-4">
            <GeoLiveEditor
              liveContent={liveContent}
              recommendations={recommendations}
              onLiveContentUpdate={onLiveContentUpdate}
              onRecommendationsUpdate={onRecommendationsUpdate}
            />
          </TabsContent>
          <TabsContent value="scan" className="mt-4">
            {scanResult ? (
              <ScanResultsPanel scanResult={scanResult} previousScore={brief.currentGeoScore} />
            ) : (
              <div className="text-center py-12 space-y-3">
                <RefreshCw className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">לחץ "בחינה מחדש (AI)" כדי לסרוק את הדף</p>
                <p className="text-xs text-muted-foreground">הסריקה מנתחת את התוכן הנוכחי של הדף ומחשבת ציון GEO חדש</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="workflow" className="mt-4">
            <WorkflowTab workflow={workflow} onChange={onWorkflowChange} />
          </TabsContent>
          <TabsContent value="diagnosis" className="mt-4">
            <DiagnosisTab transform={transform} />
          </TabsContent>
          <TabsContent value="structure" className="mt-4">
            <StructureTab transform={transform} />
          </TabsContent>
          <TabsContent value="checklist" className="mt-4">
            <PrePublishChecklist checkedItems={checklist} onToggle={onChecklistToggle} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ── Save lifecycle phase ──
type SavePhase = 'idle' | 'saving' | 'rescanning' | 'done' | 'error';

// ── Main component ──
export function GeoContentTransform() {
  const [selected, setSelected] = useState<ContentTransform | null>(null);
  const { workflows, checklists, updateWorkflow, toggleChecklistItem } = useGeoWorkflows(DEFAULT_WORKFLOWS);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { setSections: setPageContentSections, getSections: getPersistedSections } = usePageContentUpdater();
  const { savePage, loadAllOverrides, saving: isSavingPermanent } = usePageContentPersistence();
  const { rescanPage, getScanResult, scanResults, scanning: isScanning } = useGeoRescan();
  const [savePhase, setSavePhase] = useState<SavePhase>('idle');

  // Load persisted overrides on mount and push into PageContentContext
  useEffect(() => {
    loadAllOverrides().then(overrides => {
      for (const [pageId, sections] of Object.entries(overrides)) {
        setPageContentSections(pageId, sections);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Live content and recommendations state per page
  const [liveContents, setLiveContents] = useState<Record<string, LivePageContent>>({});
  const [allRecommendations, setAllRecommendations] = useState<Record<string, EditableRecommendation[]>>({});

  const handleSavePermanent = useCallback(async () => {
    if (!selected) return;
    const content = liveContents[selected.pageId];
    if (!content) return;
    const sections = content.sections.map(s => ({
      heading: s.heading,
      tag: s.tag,
      content: s.content,
    }));

    // Phase 1: Save
    setSavePhase('saving');
    const ok = await savePage(selected.pageId, sections);
    if (!ok) {
      setSavePhase('error');
      setTimeout(() => setSavePhase('idle'), 3000);
      return;
    }

    window.dispatchEvent(new CustomEvent('geo-page-saved', { detail: { pageId: selected.pageId } }));

    // Phase 2: Auto-rescan the exact saved content
    setSavePhase('rescanning');
    const brief = WORKSPACE_BRIEFS.find(b => b.id === selected.pageId);
    const result = await rescanPage(
      selected.pageId,
      sections, // Use the exact sections that were just persisted
      brief?.suggestedTitle,
      brief?.pagePath,
    );

    if (result) {
      window.dispatchEvent(new CustomEvent('geo-scan-complete', { detail: { pageId: selected.pageId } }));
      setSavePhase('done');
    } else {
      setSavePhase('error');
    }
    setTimeout(() => setSavePhase('idle'), 4000);
  }, [selected, liveContents, savePage, rescanPage]);

  const handleReAudit = useCallback(async () => {
    if (!selected) return;
    const pageId = selected.pageId;
    // Use existing editor state, or load from persisted content, then static fallback
    let content = liveContents[pageId];
    if (!content) {
      const persisted = getPersistedSections(pageId);
      content = initializeLiveContent(pageId, persisted.length > 0 ? persisted : undefined);
    }
    const brief = WORKSPACE_BRIEFS.find(b => b.id === pageId);

    const result = await rescanPage(
      pageId,
      content.sections.map(s => ({ heading: s.heading, tag: s.tag, content: s.content })),
      brief?.suggestedTitle,
      brief?.pagePath,
    );

    if (result) {
      updateWorkflow(pageId, {
        ...workflows[pageId],
        status: 're_audit',
        lastReviewed: new Date().toISOString().split('T')[0],
      });
    }
  }, [selected, liveContents, rescanPage, getPersistedSections]);

  const handleGeneralAudit = useCallback(async () => {
    for (const t of CONTENT_TRANSFORMS) {
      let content = liveContents[t.pageId];
      if (!content) {
        const persisted = getPersistedSections(t.pageId);
        content = initializeLiveContent(t.pageId, persisted.length > 0 ? persisted : undefined);
      }
      const brief = WORKSPACE_BRIEFS.find(b => b.id === t.pageId);

      await rescanPage(
        t.pageId,
        content.sections.map(s => ({ heading: s.heading, tag: s.tag, content: s.content })),
        brief?.suggestedTitle,
        brief?.pagePath,
      );

      updateWorkflow(t.pageId, {
        ...workflows[t.pageId],
        status: 're_audit',
        lastReviewed: new Date().toISOString().split('T')[0],
      });
    }
  }, [liveContents, rescanPage, getPersistedSections]);

  // Initialize live content via effect instead of during render
  const ensureLiveContent = useCallback((pageId: string) => {
    if (liveContents[pageId]) return;
    const persisted = getPersistedSections(pageId);
    const content = initializeLiveContent(
      pageId,
      persisted.length > 0 ? persisted : undefined,
    );
    setLiveContents(prev => ({ ...prev, [pageId]: content }));
  }, [liveContents, getPersistedSections]);

  const ensureRecommendations = useCallback((pageId: string) => {
    if (allRecommendations[pageId]) return;
    const recs = initializeRecommendations(pageId);
    setAllRecommendations(prev => ({ ...prev, [pageId]: recs }));
  }, [allRecommendations]);

  // Initialize content when a page is selected (via effect, not during render)
  useEffect(() => {
    if (!selected) return;
    ensureLiveContent(selected.pageId);
    ensureRecommendations(selected.pageId);
  }, [selected?.pageId]); // eslint-disable-line react-hooks/exhaustive-deps


  const updateLiveContent = useCallback((pageId: string, content: LivePageContent) => {
    setLiveContents(prev => ({ ...prev, [pageId]: content }));
    setPageContentSections(pageId, content.sections.map(s => ({
      heading: s.heading,
      tag: s.tag,
      content: s.content,
    })));
  }, [setPageContentSections]);

  const updateRecommendations = useCallback((pageId: string, recs: EditableRecommendation[]) => {
    setAllRecommendations(prev => ({ ...prev, [pageId]: recs }));
  }, []);

  const filtered = statusFilter === 'all'
    ? CONTENT_TRANSFORMS
    : CONTENT_TRANSFORMS.filter(t => workflows[t.pageId]?.status === statusFilter);

  const totalBlockers = CONTENT_TRANSFORMS.reduce((s, t) => s + t.diagnosis.geoBlockers.length, 0);
  const totalChanges = CONTENT_TRANSFORMS.reduce((s, t) => s + t.changeLog.length, 0);
  const scannedCount = Object.keys(scanResults).length;

  const statusCounts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = CONTENT_TRANSFORMS.filter(t => workflows[t.pageId]?.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  // Derive save button label from phase
  const saveButtonLabel = savePhase === 'saving' ? 'שומר...'
    : savePhase === 'rescanning' ? 'סורק GEO...'
    : savePhase === 'done' ? '✓ נשמר ונסרק'
    : savePhase === 'error' ? '✗ שגיאה'
    : 'שמור קבוע ל-DB';

  const isSaveDisabled = savePhase === 'saving' || savePhase === 'rescanning' || isSavingPermanent;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-xl bg-gradient-to-l from-purple-500/10 to-transparent border border-purple-500/20">
        <h2 className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
          <Microscope className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          Content Transformation - עריכה חיה
        </h2>
        <p className="text-xs text-muted-foreground">
          עריכה ישירה, סריקת GEO בזמן אמת עם AI, ושמירה קבועה. כל שינוי ניתן לעריכה לפני החלה.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4 flex flex-col items-center text-center gap-1">
            <PenLine className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold text-foreground">{CONTENT_TRANSFORMS.length}</span>
            <span className="text-xs text-muted-foreground">דפים</span>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex flex-col items-center text-center gap-1">
            <Zap className="h-5 w-5 text-destructive" />
            <span className="text-2xl font-bold text-foreground">{totalBlockers}</span>
            <span className="text-xs text-muted-foreground">חוסמי GEO</span>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex flex-col items-center text-center gap-1">
            <RefreshCw className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <span className="text-2xl font-bold text-foreground">{totalChanges}</span>
            <span className="text-xs text-muted-foreground">שינויים</span>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex flex-col items-center text-center gap-1">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-2xl font-bold text-foreground">{scannedCount}</span>
            <span className="text-xs text-muted-foreground">נסרקו</span>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex flex-col items-center text-center gap-1">
            <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <span className="text-2xl font-bold text-foreground">
              {CONTENT_TRANSFORMS.filter(t => workflows[t.pageId]?.status === 'published').length}
            </span>
            <span className="text-xs text-muted-foreground">פורסמו</span>
          </CardContent>
        </Card>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
            statusFilter === 'all'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-muted/30 text-muted-foreground border-border hover:border-primary/40'
          }`}
        >
          הכל ({CONTENT_TRANSFORMS.length})
        </button>
        {ALL_STATUSES.map(s => {
          const count = statusCounts[s] || 0;
          if (count === 0) return null;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                statusFilter === s
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/30 text-muted-foreground border-border hover:border-primary/40'
              }`}
            >
              {WORKFLOW_STATUS_CONFIG[s].label} ({count})
            </button>
          );
        })}
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {filtered.map(t => (
          <TransformCard
            key={t.pageId}
            transform={t}
            workflow={workflows[t.pageId]}
            onClick={() => setSelected(t)}
            scanResult={getScanResult(t.pageId)}
          />
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">אין דפים בסטטוס זה</p>
        )}
      </div>

      <TransformDetail
        transform={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        workflow={selected ? workflows[selected.pageId] : null}
        onWorkflowChange={(w) => selected && updateWorkflow(selected.pageId, w)}
        checklist={selected ? (checklists[selected.pageId] || {}) : {}}
        onChecklistToggle={(itemId, checked) => selected && toggleChecklistItem(selected.pageId, itemId, checked)}
        liveContent={selected ? (liveContents[selected.pageId] || null) : null}
        recommendations={selected ? (allRecommendations[selected.pageId] || []) : []}
        onLiveContentUpdate={(content) => selected && updateLiveContent(selected.pageId, content)}
        onRecommendationsUpdate={(recs) => selected && updateRecommendations(selected.pageId, recs)}
        onSavePermanent={handleSavePermanent}
        isSaving={isSaveDisabled}
        savePhase={savePhase}
        saveButtonLabel={saveButtonLabel}
        onReAudit={handleReAudit}
        isScanning={isScanning}
        scanResult={selected ? getScanResult(selected.pageId) : null}
      />

      {/* General audit button */}
      <div className="flex justify-center pt-4">
        <Button variant="outline" className="gap-2" onClick={handleGeneralAudit} disabled={isScanning}>
          {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {isScanning ? 'סורק את כל הדפים...' : 'סריקת GEO כללית (AI) – כל הדפים'}
        </Button>
      </div>
    </div>
  );
}
