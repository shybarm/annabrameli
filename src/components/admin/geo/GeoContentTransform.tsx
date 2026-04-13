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
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { DiagnosisTab, StructureTab } from './GeoTransformTabs';
import { PrePublishChecklist } from './GeoPrePublishChecklist';
import { GeoLiveEditor } from './GeoLiveEditor';
import {
  AlertTriangle, ArrowRight, Calendar, FileText, Filter, Save,
  Microscope, PenLine, RefreshCw, StickyNote, User, Zap, Loader2,
  RotateCcw, CheckCircle2, XCircle, ClipboardCheck,
} from 'lucide-react';

// ── Local workflow state ──
interface PageWorkflow {
  status: WorkflowStatus;
  priority: PriorityLevel;
  owner: string;
  lastReviewed: string;
  notes: string;
}

type WorkflowMap = Record<string, PageWorkflow>;

const DEFAULT_WORKFLOWS: WorkflowMap = Object.fromEntries(
  CONTENT_TRANSFORMS.map(t => {
    const brief = WORKSPACE_BRIEFS.find(b => b.id === t.pageId);
    const isNew = brief && brief.currentGeoScore === 0;
    return [t.pageId, {
      status: isNew ? 'rewrite_needed' as WorkflowStatus : 'not_reviewed' as WorkflowStatus,
      priority: t.diagnosis.geoBlockers.length >= 3 ? 'critical' as PriorityLevel : t.diagnosis.geoBlockers.length >= 2 ? 'high' as PriorityLevel : 'medium' as PriorityLevel,
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

function StatusBadge({ status }: { status: WorkflowStatus }) {
  const cfg = WORKFLOW_STATUS_CONFIG[status];
  return <Badge className={`text-[10px] border ${cfg.color}`}>{cfg.label}</Badge>;
}

function PriorityBadge({ priority }: { priority: PriorityLevel }) {
  const cfg = PRIORITY_CONFIG[priority];
  return <Badge className={`text-[10px] ${cfg.color}`}>{cfg.label}</Badge>;
}

function TransformCard({
  transform, workflow, onClick,
}: {
  transform: ContentTransform;
  workflow: PageWorkflow;
  onClick: () => void;
}) {
  const brief = WORKSPACE_BRIEFS.find(b => b.id === transform.pageId);
  if (!brief) return null;
  const blockers = transform.diagnosis.geoBlockers.length;
  const changes = transform.changeLog.length;

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
            </div>
            <h3 className="text-sm font-bold text-foreground">{brief.suggestedTitle}</h3>
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5">{brief.pagePath}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${brief.currentGeoScore >= 7 ? 'text-primary' : brief.currentGeoScore >= 5 ? 'text-amber-600' : brief.currentGeoScore === 0 ? 'text-muted-foreground' : 'text-destructive'}`}>
              {brief.currentGeoScore || '-'}
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{brief.targetGeoScore}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-destructive" />{blockers} חוסמי GEO</span>
          <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{transform.draft.length} סקציות</span>
          <span className="flex items-center gap-1"><RefreshCw className="h-3 w-3" />{changes} שינויים</span>
          {workflow.owner && (
            <span className="flex items-center gap-1"><User className="h-3 w-3" />{workflow.owner}</span>
          )}
          {workflow.lastReviewed && (
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{workflow.lastReviewed}</span>
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

function TransformDetail({
  transform, open, onClose, workflow, onWorkflowChange,
  checklist, onChecklistToggle,
  liveContent, recommendations,
  onLiveContentUpdate, onRecommendationsUpdate,
  onSavePermanent, isSaving, onReAudit,
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
  onReAudit: () => void;
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
          >
            <RefreshCw className="h-4 w-4" />
            בחינה מחדש
          </Button>
          <Button
            onClick={onSavePermanent}
            disabled={isSaving || appliedCount === 0}
            className="gap-2"
            size="sm"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? 'שומר...' : 'שמור קבוע ל-DB'}
          </Button>
        </div>

        <Tabs defaultValue="editor" className="mt-4" dir="rtl">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="editor" className="text-xs">עריכה חיה</TabsTrigger>
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

// ── Main component ──
export function GeoContentTransform() {
  const [selected, setSelected] = useState<ContentTransform | null>(null);
  const [workflows, setWorkflows] = useState<WorkflowMap>(DEFAULT_WORKFLOWS);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [checklists, setChecklists] = useState<Record<string, Record<string, boolean>>>({});
  const { setSections: setPageContentSections } = usePageContentUpdater();
  const { savePage, loadAllOverrides, saving: isSavingPermanent } = usePageContentPersistence();

  // Load persisted overrides on mount
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
    await savePage(selected.pageId, sections);
  }, [selected, liveContents, savePage]);

  const handleReAudit = useCallback(() => {
    if (!selected) return;
    // Reset recommendations to draft, set workflow to re_audit
    const pageId = selected.pageId;
    const recs = initializeRecommendations(pageId);
    setAllRecommendations(prev => ({ ...prev, [pageId]: recs }));
    const content = initializeLiveContent(pageId);
    setLiveContents(prev => ({ ...prev, [pageId]: content }));
    setWorkflows(prev => ({
      ...prev,
      [pageId]: { ...prev[pageId], status: 're_audit' as WorkflowStatus, lastReviewed: new Date().toISOString().split('T')[0] },
    }));
  }, [selected]);

  const handleGeneralAudit = useCallback(() => {
    CONTENT_TRANSFORMS.forEach(t => {
      const recs = initializeRecommendations(t.pageId);
      setAllRecommendations(prev => ({ ...prev, [t.pageId]: recs }));
      const content = initializeLiveContent(t.pageId);
      setLiveContents(prev => ({ ...prev, [t.pageId]: content }));
      setWorkflows(prev => ({
        ...prev,
        [t.pageId]: { ...prev[t.pageId], status: 're_audit' as WorkflowStatus, lastReviewed: new Date().toISOString().split('T')[0] },
      }));
    });
  }, []);

  // Lazy-initialize live content for a page
  const getLiveContent = useCallback((pageId: string): LivePageContent => {
    if (!liveContents[pageId]) {
      const content = initializeLiveContent(pageId);
      setLiveContents(prev => ({ ...prev, [pageId]: content }));
      return content;
    }
    return liveContents[pageId];
  }, [liveContents]);

  const getRecommendations = useCallback((pageId: string): EditableRecommendation[] => {
    if (!allRecommendations[pageId]) {
      const recs = initializeRecommendations(pageId);
      setAllRecommendations(prev => ({ ...prev, [pageId]: recs }));
      return recs;
    }
    return allRecommendations[pageId];
  }, [allRecommendations]);

  const updateWorkflow = useCallback((pageId: string, updated: PageWorkflow) => {
    setWorkflows(prev => ({ ...prev, [pageId]: updated }));
  }, []);

  const toggleChecklistItem = useCallback((pageId: string, itemId: string, checked: boolean) => {
    setChecklists(prev => ({
      ...prev,
      [pageId]: { ...(prev[pageId] || {}), [itemId]: checked },
    }));
  }, []);

  const updateLiveContent = useCallback((pageId: string, content: LivePageContent) => {
    setLiveContents(prev => ({ ...prev, [pageId]: content }));
    // Push to the global PageContent context so actual pages update
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

  const statusCounts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = CONTENT_TRANSFORMS.filter(t => workflows[t.pageId]?.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-xl bg-gradient-to-l from-purple-500/10 to-transparent border border-purple-500/20">
        <h2 className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
          <Microscope className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          Content Transformation - עריכה חיה
        </h2>
        <p className="text-xs text-muted-foreground">
          עריכה ישירה, אישור שינויים, והחלה על הדף. כל שינוי ניתן לעריכה לפני החלה ולביטול לאחר מכן.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
        liveContent={selected ? getLiveContent(selected.pageId) : null}
        recommendations={selected ? getRecommendations(selected.pageId) : []}
        onLiveContentUpdate={(content) => selected && updateLiveContent(selected.pageId, content)}
        onRecommendationsUpdate={(recs) => selected && updateRecommendations(selected.pageId, recs)}
        onSavePermanent={handleSavePermanent}
        isSaving={isSavingPermanent}
        onReAudit={handleReAudit}
      />

      {/* General audit button */}
      <div className="flex justify-center pt-4">
        <Button variant="outline" className="gap-2" onClick={handleGeneralAudit}>
          <RefreshCw className="h-4 w-4" />
          בדיקה כללית – אתחול מחדש לכל הדפים
        </Button>
      </div>
    </div>
  );
}
