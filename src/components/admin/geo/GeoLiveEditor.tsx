import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  type EditableRecommendation,
  type LivePageContent,
  type LiveSection,
  type RecommendationStatus,
  type VersionType,
  RECOMMENDATION_STATUS_CONFIG,
  VERSION_TYPE_CONFIG,
} from '@/data/geo-live-content';
import {
  Check, ChevronDown, ChevronUp, Clock, Edit3, Eye,
  History, RotateCcw, Send, ShieldCheck, X,
} from 'lucide-react';

// ── Version label banner ──
function VersionBanner({ version, lastAppliedAt }: { version: VersionType; lastAppliedAt?: string }) {
  const cfg = VERSION_TYPE_CONFIG[version];
  return (
    <div className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs ${cfg.color}`}>
      <div className="flex items-center gap-2">
        <Clock className="h-3.5 w-3.5" />
        <span className="font-bold">{cfg.label}</span>
        <span className="opacity-70">— {cfg.description}</span>
      </div>
      {lastAppliedAt && version === 'applied' && (
        <span className="text-[10px] opacity-60">
          {new Date(lastAppliedAt).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}
        </span>
      )}
    </div>
  );
}

// ── Status badge ──
function RecStatusBadge({ status }: { status: RecommendationStatus }) {
  const cfg = RECOMMENDATION_STATUS_CONFIG[status];
  return <Badge className={`text-[10px] ${cfg.color}`}>{cfg.label}</Badge>;
}

// ── View mode selector ──
type ViewMode = 'live' | 'recommendation' | 'applied';

const VIEW_LABELS: Record<ViewMode, { label: string; icon: typeof Eye }> = {
  live:           { label: 'תוכן נוכחי', icon: Eye },
  recommendation: { label: 'המלצה',      icon: Edit3 },
  applied:        { label: 'תוצאה',      icon: Check },
};

// ── Single recommendation card with inline editing ──
function RecommendationCard({
  rec,
  liveValue,
  onEdit,
  onStatusChange,
  onApply,
  onRevert,
}: {
  rec: EditableRecommendation;
  liveValue: string;
  onEdit: (id: string, newText: string) => void;
  onStatusChange: (id: string, status: RecommendationStatus) => void;
  onApply: (id: string) => void;
  onRevert: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(rec.editedAfter);
  const [expanded, setExpanded] = useState(false);

  const handleSaveEdit = () => {
    onEdit(rec.id, editText);
    setIsEditing(false);
  };

  const isApplied = rec.status === 'applied';
  const isRejected = rec.status === 'rejected';

  return (
    <div className={`rounded-lg border transition-colors ${
      isApplied
        ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/10'
        : isRejected
          ? 'border-destructive/30 bg-destructive/5 opacity-60'
          : 'border-border/50 bg-card'
    }`}>
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <RecStatusBadge status={rec.status} />
          <Badge variant="outline" className="text-[10px]">{rec.area}</Badge>
          <span className="text-xs text-muted-foreground truncate">
            סקציה {rec.sectionIndex + 1}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Before / After comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Current live */}
            <div className="p-2.5 rounded bg-muted/30 border border-border/50">
              <p className="text-[10px] font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                <Eye className="h-3 w-3" /> {rec.targetField === 'heading' ? 'כותרת נוכחית באתר' : 'תוכן נוכחי באתר'}
              </p>
              <p className="text-foreground whitespace-pre-wrap">{liveValue || rec.originalBefore}</p>
            </div>

            {/* Editable recommendation */}
            <div className={`p-2.5 rounded border ${
              isApplied
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-primary/5 border-primary/20'
            }`}>
              <p className={`text-[10px] font-semibold mb-1 flex items-center gap-1 ${
                isApplied ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'
              }`}>
                {isApplied ? <Check className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
                {isApplied ? 'הוחל בהצלחה — הדף עודכן' : rec.targetField === 'heading' ? 'כותרת מומלצת (ניתנת לעריכה)' : 'גרסה מומלצת (ניתנת לעריכה)'}
              </p>
              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    className="text-xs min-h-[80px] bg-background"
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    dir="rtl"
                  />
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="default" className="h-6 text-[10px] px-2" onClick={handleSaveEdit}>
                      שמור
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => { setIsEditing(false); setEditText(rec.editedAfter); }}>
                      ביטול
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-foreground whitespace-pre-wrap">{rec.editedAfter}</p>
              )}
            </div>
          </div>

          {/* Reason */}
          <p className="text-[11px] text-muted-foreground italic" dir="rtl">
            💡 {rec.reason}
          </p>

          {isApplied && rec.appliedAt && (
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="h-3 w-3" />
              הוחל ב-{new Date(rec.appliedAt).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}
            </p>
          )}

          <Separator />

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {!isApplied && !isRejected && (
              <>
                <Button size="sm" variant="ghost" className="h-7 text-[11px] px-2" onClick={() => setIsEditing(true)}>
                  <Edit3 className="h-3 w-3 mr-1" /> ערוך
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-[11px] px-2" onClick={() => onStatusChange(rec.id, 'approved')}>
                  <ShieldCheck className="h-3 w-3 mr-1" /> אשר
                </Button>
                <Button size="sm" variant="default" className="h-7 text-[11px] px-2" onClick={() => onApply(rec.id)}>
                  <Send className="h-3 w-3 mr-1" /> החל על הדף
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-[11px] px-2 text-destructive hover:text-destructive" onClick={() => onStatusChange(rec.id, 'rejected')}>
                  <X className="h-3 w-3 mr-1" /> דחה
                </Button>
              </>
            )}
            {isApplied && (
              <Button size="sm" variant="ghost" className="h-7 text-[11px] px-2 text-amber-600" onClick={() => onRevert(rec.id)}>
                <RotateCcw className="h-3 w-3 mr-1" /> בטל החלה ושחזר
              </Button>
            )}
            {isRejected && (
              <Button size="sm" variant="ghost" className="h-7 text-[11px] px-2" onClick={() => onStatusChange(rec.id, 'draft')}>
                <RotateCcw className="h-3 w-3 mr-1" /> החזר לטיוטה
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Live content section viewer/editor ──
function LiveSectionCard({
  section,
  index,
  isModified,
  onEdit,
}: {
  section: LiveSection;
  index: number;
  isModified: boolean;
  onEdit: (index: number, updated: LiveSection) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(section.content);
  const [editHeading, setEditHeading] = useState(section.heading);

  const save = () => {
    onEdit(index, { ...section, heading: editHeading, content: editContent });
    setEditing(false);
  };

  return (
    <div className={`rounded-lg border p-3 space-y-2 ${
      isModified
        ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-950/10'
        : 'border-border/50 bg-card'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
            section.tag === 'h1' ? 'text-primary bg-primary/10' : 'text-muted-foreground bg-muted'
          }`}>
            {section.tag.toUpperCase()}
          </span>
          {isModified && (
            <Badge className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              עודכן
            </Badge>
          )}
        </div>
        <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => setEditing(!editing)}>
          <Edit3 className="h-3 w-3 mr-1" /> {editing ? 'סגור' : 'ערוך'}
        </Button>
      </div>

      {editing ? (
        <div className="space-y-2">
          {section.heading && (
            <input
              className="w-full text-sm font-bold border rounded px-2 py-1 bg-background text-foreground"
              value={editHeading}
              onChange={e => setEditHeading(e.target.value)}
              dir="rtl"
            />
          )}
          <Textarea className="text-xs min-h-[80px]" value={editContent} onChange={e => setEditContent(e.target.value)} dir="rtl" />
          <Button size="sm" className="h-6 text-[10px] px-2" onClick={save}>שמור</Button>
        </div>
      ) : (
        <>
          {section.heading && (
            <h3 className={`font-bold text-foreground ${section.tag === 'h1' ? 'text-base' : 'text-sm'}`}>{section.heading}</h3>
          )}
          {section.content && (
            <div className="text-xs text-foreground leading-relaxed whitespace-pre-wrap" dir="rtl">{section.content}</div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main live editor component ──
export interface GeoLiveEditorProps {
  liveContent: LivePageContent;
  recommendations: EditableRecommendation[];
  onLiveContentUpdate: (content: LivePageContent) => void;
  onRecommendationsUpdate: (recs: EditableRecommendation[]) => void;
}

export function GeoLiveEditor({
  liveContent,
  recommendations,
  onLiveContentUpdate,
  onRecommendationsUpdate,
}: GeoLiveEditorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('recommendation');
  const [originalSections] = useState(() =>
    liveContent.history[0]?.sections || liveContent.sections
  );

  // Derive current version type from state
  const deriveVersionType = (content: LivePageContent): VersionType => {
    const hasApplied = content.lastAppliedAt != null;
    const origSections = content.history[0]?.sections;
    if (!origSections) return 'original';
    const isOriginal = JSON.stringify(content.sections) === JSON.stringify(origSections);
    if (isOriginal) return 'original';
    return hasApplied ? 'applied' : 'working_draft';
  };

  // ── Edit recommendation text ──
  const handleEditRec = (id: string, newText: string) => {
    onRecommendationsUpdate(
      recommendations.map(r =>
        r.id === id ? { ...r, editedAfter: newText, status: r.status === 'draft' ? 'edited' : r.status } : r
      )
    );
  };

  // ── Change recommendation status ──
  const handleStatusChange = (id: string, status: RecommendationStatus) => {
    onRecommendationsUpdate(
      recommendations.map(r => r.id === id ? { ...r, status } : r)
    );
  };

  // ── Apply single recommendation to live content ──
  const handleApply = (id: string) => {
    const rec = recommendations.find(r => r.id === id);
    if (!rec) return;

    const snapshot = {
      timestamp: new Date().toISOString(),
      label: `לפני החלת "${rec.area}"`,
      sections: JSON.parse(JSON.stringify(liveContent.sections)),
      versionType: deriveVersionType(liveContent) as VersionType,
    };

    const updatedSections = [...liveContent.sections];
    const idx = Math.min(rec.sectionIndex, updatedSections.length - 1);
    if (idx >= 0 && updatedSections[idx]) {
      updatedSections[idx] = {
        ...updatedSections[idx],
        [rec.targetField]: rec.editedAfter,
      };
    }

    const now = new Date().toISOString();
    const updated: LivePageContent = {
      ...liveContent,
      sections: updatedSections,
      history: [...liveContent.history, snapshot],
      currentVersion: 'applied',
      lastAppliedAt: now,
      appliedSections: JSON.parse(JSON.stringify(updatedSections)),
    };

    onLiveContentUpdate(updated);
    onRecommendationsUpdate(
      recommendations.map(r =>
        r.id === id ? { ...r, status: 'applied', appliedAt: now } : r
      )
    );
  };

  // ── Revert single recommendation ──
  const handleRevert = (id: string) => {
    const rec = recommendations.find(r => r.id === id);
    if (!rec) return;

    const idx = Math.min(rec.sectionIndex, liveContent.sections.length - 1);
    if (idx >= 0 && originalSections[idx]) {
      const updatedSections = [...liveContent.sections];
      updatedSections[idx] = { ...originalSections[idx] };

      const hasOtherApplied = recommendations.some(r => r.id !== id && r.status === 'applied');
      const updated: LivePageContent = {
        ...liveContent,
        sections: updatedSections,
        currentVersion: hasOtherApplied ? 'applied' : 'original',
      };
      onLiveContentUpdate(updated);
    }

    onRecommendationsUpdate(
      recommendations.map(r =>
        r.id === id ? { ...r, status: 'draft', appliedAt: undefined } : r
      )
    );
  };

  // ── Apply all approved ──
  const handleApplyAllApproved = () => {
    const approved = recommendations.filter(r => r.status === 'approved');
    if (approved.length === 0) return;

    const snapshot = {
      timestamp: new Date().toISOString(),
      label: `לפני החלת ${approved.length} שינויים`,
      sections: JSON.parse(JSON.stringify(liveContent.sections)),
      versionType: deriveVersionType(liveContent) as VersionType,
    };

    const updatedSections = [...liveContent.sections];
    approved.forEach(rec => {
      const idx = Math.min(rec.sectionIndex, updatedSections.length - 1);
      if (idx >= 0) {
        updatedSections[idx] = {
          ...updatedSections[idx],
          [rec.targetField]: rec.editedAfter,
        };
      }
    });

    const now = new Date().toISOString();
    const updated: LivePageContent = {
      ...liveContent,
      sections: updatedSections,
      history: [...liveContent.history, snapshot],
      currentVersion: 'applied',
      lastAppliedAt: now,
      appliedSections: JSON.parse(JSON.stringify(updatedSections)),
    };

    onLiveContentUpdate(updated);
    onRecommendationsUpdate(
      recommendations.map(r =>
        r.status === 'approved' ? { ...r, status: 'applied', appliedAt: now } : r
      )
    );
  };

  // ── Full page revert to original ──
  const handleFullRevert = () => {
    if (liveContent.history.length < 1) return;
    const original = liveContent.history[0]; // always the original
    onLiveContentUpdate({
      ...liveContent,
      sections: JSON.parse(JSON.stringify(original.sections)),
      currentVersion: 'original',
      lastAppliedAt: undefined,
      appliedSections: undefined,
    });
    onRecommendationsUpdate(
      recommendations.map(r =>
        r.status === 'applied' ? { ...r, status: 'draft', appliedAt: undefined } : r
      )
    );
  };

  // ── Edit live section directly ──
  const handleEditSection = (index: number, updated: LiveSection) => {
    const snapshot = {
      timestamp: new Date().toISOString(),
      label: `עריכה ידנית - סקציה ${index + 1}`,
      sections: JSON.parse(JSON.stringify(liveContent.sections)),
      versionType: deriveVersionType(liveContent) as VersionType,
    };
    const updatedSections = [...liveContent.sections];
    updatedSections[index] = updated;
    onLiveContentUpdate({
      ...liveContent,
      sections: updatedSections,
      history: [...liveContent.history, snapshot],
      currentVersion: 'working_draft',
    });
  };

  const isSectionModified = (index: number) => {
    if (!originalSections[index]) return false;
    const orig = originalSections[index];
    const curr = liveContent.sections[index];
    return orig.content !== curr?.content || orig.heading !== curr?.heading;
  };

  const approvedCount = recommendations.filter(r => r.status === 'approved').length;
  const appliedCount = recommendations.filter(r => r.status === 'applied').length;
  const totalCount = recommendations.length;
  const currentVersion = deriveVersionType(liveContent);

  return (
    <div className="space-y-4" dir="rtl">
      {/* Version banner */}
      <VersionBanner version={currentVersion} lastAppliedAt={liveContent.lastAppliedAt} />

      {/* View mode & stats */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-0.5">
          {(Object.entries(VIEW_LABELS) as [ViewMode, typeof VIEW_LABELS[ViewMode]][]).map(([mode, cfg]) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {cfg.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{appliedCount}/{totalCount} הוחלו</span>
          {approvedCount > 0 && (
            <Button size="sm" className="h-6 text-[10px] px-2" onClick={handleApplyAllApproved}>
              <Send className="h-3 w-3 mr-1" /> החל {approvedCount} מאושרים
            </Button>
          )}
          {currentVersion !== 'original' && (
            <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={handleFullRevert}>
              <RotateCcw className="h-3 w-3 mr-1" /> שחזר לגרסה מקורית
            </Button>
          )}
        </div>
      </div>

      {/* Recommendation view */}
      {viewMode === 'recommendation' && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            כל שינוי ניתן לעריכה, אישור, והחלה ישירה על הדף. לחצו "החל על הדף" כדי לעדכן את התוכן בפועל.
          </p>
          {recommendations.map(rec => (
            <RecommendationCard
              key={rec.id}
              rec={rec}
              liveValue={
                rec.targetField === 'heading'
                  ? (liveContent.sections[rec.sectionIndex]?.heading || '')
                  : (liveContent.sections[rec.sectionIndex]?.content || '')
              }
              onEdit={handleEditRec}
              onStatusChange={handleStatusChange}
              onApply={handleApply}
              onRevert={handleRevert}
            />
          ))}
        </div>
      )}

      {/* Live content view */}
      {viewMode === 'live' && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            זהו התוכן הנוכחי של הדף. סקציות שעודכנו מסומנות בירוק. ניתן לערוך ישירות.
          </p>
          {liveContent.sections.map((section, i) => (
            <LiveSectionCard
              key={i}
              section={section}
              index={i}
              isModified={isSectionModified(i)}
              onEdit={handleEditSection}
            />
          ))}
        </div>
      )}

      {/* Applied result view */}
      {viewMode === 'applied' && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            תצוגת תוצאה: התוכן הנוכחי לאחר כל השינויים שהוחלו.
          </p>
          {liveContent.sections.map((section, i) => (
            <div
              key={i}
              className={`rounded-lg border p-3 ${
                isSectionModified(i)
                  ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-950/10'
                  : 'border-border/50 bg-card'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold text-muted-foreground bg-muted">
                  {section.tag.toUpperCase()}
                </span>
                {isSectionModified(i) && (
                  <Badge className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    שונה מהמקור
                  </Badge>
                )}
              </div>
              {section.heading && (
                <h3 className={`font-bold text-foreground mb-1 ${section.tag === 'h1' ? 'text-base' : 'text-sm'}`}>{section.heading}</h3>
              )}
              {section.content && (
                <div className="text-xs text-foreground leading-relaxed whitespace-pre-wrap" dir="rtl">{section.content}</div>
              )}
            </div>
          ))}

          {/* Version history */}
          {liveContent.history.length > 1 && (
            <>
              <Separator />
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5" /> היסטוריית גרסאות
                </h4>
                {[...liveContent.history].reverse().map((snap, i) => {
                  const vCfg = VERSION_TYPE_CONFIG[snap.versionType || 'original'];
                  return (
                    <div key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="font-mono">{new Date(snap.timestamp).toLocaleTimeString('he-IL')}</span>
                      <Badge className={`text-[9px] ${vCfg.color}`}>{vCfg.label}</Badge>
                      <span>{snap.label}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
