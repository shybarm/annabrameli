/**
 * Live page content state for the Content Transformation editing system.
 * This is the "source of truth" for each page's content,
 * which the transformation system reads from and writes to.
 */

import { CONTENT_TRANSFORMS } from './geo-content-transforms';

// ── Recommendation status per change item ──
export type RecommendationStatus = 'draft' | 'edited' | 'approved' | 'applied' | 'rejected';

export const RECOMMENDATION_STATUS_CONFIG: Record<RecommendationStatus, { label: string; color: string }> = {
  draft:    { label: 'טיוטה',   color: 'bg-muted text-muted-foreground' },
  edited:   { label: 'נערך',    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  approved: { label: 'מאושר',   color: 'bg-primary/10 text-primary' },
  applied:  { label: 'הוחל',    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
  rejected: { label: 'נדחה',    color: 'bg-destructive/10 text-destructive' },
};

// ── Version type labels ──
export type VersionType = 'original' | 'working_draft' | 'applied';

export const VERSION_TYPE_CONFIG: Record<VersionType, { label: string; color: string; description: string }> = {
  original:      { label: 'גרסה מקורית',      color: 'bg-muted text-muted-foreground',     description: 'התוכן המקורי לפני כל שינוי' },
  working_draft: { label: 'טיוטת עבודה',       color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', description: 'עריכות ידניות שטרם הוחלו' },
  applied:       { label: 'גרסה מוחלת אחרונה', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300', description: 'הגרסה האחרונה שהוחלה מהמלצות' },
};

// ── A single editable recommendation ──
export interface EditableRecommendation {
  id: string;
  sectionIndex: number;           // which draft section this targets
  area: string;                   // from ChangeLogItem.area
  originalBefore: string;         // immutable original "before"
  originalAfter: string;          // immutable original "after" 
  editedAfter: string;            // user-editable version of "after"
  reason: string;
  status: RecommendationStatus;
  appliedAt?: string;
}

// ── Live page content: the actual content sections ──
export interface LivePageContent {
  pageId: string;
  sections: LiveSection[];
  history: ContentSnapshot[];     // for revert
  currentVersion: VersionType;    // which version is currently displayed
  lastAppliedAt?: string;         // when the last apply happened
  appliedSections?: LiveSection[];  // snapshot of the last applied state
}

export interface LiveSection {
  heading: string;
  tag: 'h1' | 'h2' | 'h3';
  content: string;
}

export interface ContentSnapshot {
  timestamp: string;
  label: string;
  sections: LiveSection[];
  versionType: VersionType;
}

// ── Initialize live content from the static transforms ──
export function initializeLiveContent(pageId: string): LivePageContent {
  const transform = CONTENT_TRANSFORMS.find(t => t.pageId === pageId);
  if (!transform) {
    return { pageId, sections: [], history: [], currentVersion: 'original' };
  }
  const sections: LiveSection[] = transform.draft.map(d => ({
    heading: d.heading,
    tag: d.tag,
    content: d.content,
  }));
  return {
    pageId,
    sections,
    currentVersion: 'original',
    history: [{
      timestamp: new Date().toISOString(),
      label: 'גרסה מקורית',
      sections: JSON.parse(JSON.stringify(sections)),
      versionType: 'original',
    }],
  };
}

// ── Initialize editable recommendations from static changeLog ──
export function initializeRecommendations(pageId: string): EditableRecommendation[] {
  const transform = CONTENT_TRANSFORMS.find(t => t.pageId === pageId);
  if (!transform) return [];
  return transform.changeLog.map((item, i) => ({
    id: `${pageId}-rec-${i}`,
    sectionIndex: Math.min(i, (transform.draft.length || 1) - 1),
    area: item.area,
    originalBefore: item.before,
    originalAfter: item.after,
    editedAfter: item.after,
    reason: item.reason,
    status: 'draft' as RecommendationStatus,
  }));
}
