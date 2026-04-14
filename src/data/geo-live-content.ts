/**
 * Live page content state for the Content Transformation editing system.
 * This is the "source of truth" for each page's content,
 * which the transformation system reads from and writes to.
 */

import { CONTENT_TRANSFORMS } from './geo-content-transforms';
import { CURRENT_PAGE_CONTENT } from './geo-current-page-content';

export type RecommendationStatus = 'draft' | 'edited' | 'approved' | 'applied' | 'rejected';
export type EditableField = 'heading' | 'content';

export const RECOMMENDATION_STATUS_CONFIG: Record<RecommendationStatus, { label: string; color: string }> = {
  draft:    { label: 'טיוטה',   color: 'bg-muted text-muted-foreground' },
  edited:   { label: 'נערך',    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  approved: { label: 'מאושר',   color: 'bg-primary/10 text-primary' },
  applied:  { label: 'הוחל',    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
  rejected: { label: 'נדחה',    color: 'bg-destructive/10 text-destructive' },
};

export type VersionType = 'original' | 'working_draft' | 'applied';

export const VERSION_TYPE_CONFIG: Record<VersionType, { label: string; color: string; description: string }> = {
  original:      { label: 'גרסה מקורית',      color: 'bg-muted text-muted-foreground', description: 'התוכן הנוכחי של הדף לפני החלה' },
  working_draft: { label: 'טיוטת עבודה',       color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', description: 'עריכות שנשמרו אך עדיין לא הוחלו' },
  applied:       { label: 'גרסה מוחלת אחרונה', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300', description: 'הגרסה האחרונה שהוחלה מהמלצות' },
};

export interface EditableRecommendation {
  id: string;
  sectionIndex: number;
  sectionHeading: string;
  targetField: EditableField;
  area: string;
  originalBefore: string;
  originalAfter: string;
  editedAfter: string;
  reason: string;
  status: RecommendationStatus;
  appliedAt?: string;
}

export interface LivePageContent {
  pageId: string;
  sections: LiveSection[];
  history: ContentSnapshot[];
  currentVersion: VersionType;
  lastAppliedAt?: string;
  appliedSections?: LiveSection[];
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

function cloneSections(sections: LiveSection[]): LiveSection[] {
  return JSON.parse(JSON.stringify(sections));
}

function buildCurrentSections(pageId: string): LiveSection[] {
  const transform = CONTENT_TRANSFORMS.find(t => t.pageId === pageId);
  const currentSections = CURRENT_PAGE_CONTENT[pageId];

  if (currentSections) {
    return cloneSections(currentSections);
  }

  // Support knowledge:slug pattern - build from static page content registry
  if (pageId.startsWith('knowledge:')) {
    const slug = pageId.replace('knowledge:', '');
    // Return minimal structure for knowledge articles
    return [
      { heading: slug, tag: 'h1', content: '' },
      { heading: '', tag: 'h2', content: '' },
    ];
  }

  if (!transform) {
    return [];
  }

  return transform.draft.map((section, index) => ({
    heading: index === 0 ? 'דף חדש - טרם פורסם' : section.heading,
    tag: section.tag,
    content: '',
  }));
}

/**
 * Initialize live content for a page.
 * @param pageId - The page identifier
 * @param persistedSections - Optional sections from page_content_overrides (DB).
 *   When provided, these are used as the canonical content instead of static seed data.
 */
export function initializeLiveContent(
  pageId: string,
  persistedSections?: { heading: string; tag: string; content: string }[],
): LivePageContent {
  const sections: LiveSection[] = persistedSections
    ? persistedSections.map(s => ({
        heading: s.heading,
        tag: s.tag as LiveSection['tag'],
        content: s.content,
      }))
    : buildCurrentSections(pageId);

  return {
    pageId,
    sections,
    currentVersion: persistedSections ? 'applied' : 'original',
    history: [{
      timestamp: new Date().toISOString(),
      label: persistedSections ? 'גרסה שמורה (DB)' : 'גרסה מקורית',
      sections: cloneSections(sections),
      versionType: persistedSections ? 'applied' : 'original',
    }],
  };
}

export function initializeRecommendations(
  pageId: string,
  currentContent?: LiveSection[],
): EditableRecommendation[] {
  const transform = CONTENT_TRANSFORMS.find(t => t.pageId === pageId);
  if (!transform) return [];

  const liveSections = currentContent || buildCurrentSections(pageId);

  return transform.changeLog.map((item, i) => {
    const sectionIndex = Math.min(i, (transform.draft.length || 1) - 1);
    const draftSection = transform.draft[sectionIndex];
    const currentSection = liveSections[sectionIndex] || draftSection;
    const targetField: EditableField = draftSection.content?.trim() ? 'content' : 'heading';
    const originalAfter = targetField === 'heading' ? draftSection.heading : draftSection.content;
    const originalBefore = targetField === 'heading'
      ? currentSection?.heading || ''
      : currentSection?.content || '';

    // Reconcile: check if the recommended change is already present in the current content
    const currentValue = targetField === 'heading'
      ? currentSection?.heading || ''
      : currentSection?.content || '';
    const isAlreadyApplied = reconcileRecommendation(originalAfter, currentValue);

    return {
      id: `${pageId}-rec-${i}`,
      sectionIndex,
      sectionHeading: draftSection.heading || `סקציה ${sectionIndex + 1}`,
      targetField,
      area: item.area,
      originalBefore,
      originalAfter,
      editedAfter: originalAfter,
      reason: item.reason,
      status: isAlreadyApplied ? 'applied' as RecommendationStatus : 'draft' as RecommendationStatus,
      appliedAt: isAlreadyApplied ? new Date().toISOString() : undefined,
    };
  });
}

/**
 * Reconcile a recommendation against current content.
 * Returns true if the recommendation text is already present/satisfied.
 */
function reconcileRecommendation(recommendedText: string, currentContent: string): boolean {
  if (!recommendedText || !currentContent) return false;

  const normalise = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
  const recNorm = normalise(recommendedText);
  const curNorm = normalise(currentContent);

  // Exact or substring match
  if (curNorm.includes(recNorm) || recNorm === curNorm) return true;

  // Significant-word overlap: if >70% of recommendation words exist in content
  const recWords = recNorm.split(/\s+/).filter(w => w.length > 3);
  if (recWords.length === 0) return false;
  const matchCount = recWords.filter(w => curNorm.includes(w)).length;
  return (matchCount / recWords.length) >= 0.7;
}
