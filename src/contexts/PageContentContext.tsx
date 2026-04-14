import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { CURRENT_PAGE_CONTENT, type CurrentPageSection } from '@/data/geo-current-page-content';
import { supabase } from '@/integrations/supabase/client';

const PAGE_ID_ALIASES: Record<string, string[]> = {
  'knowledge:פריחה-אחרי-במבה': ['bamba-reaction'],
  'bamba-reaction': ['knowledge:פריחה-אחרי-במבה'],
};

function getPageIdCandidates(pageId: string) {
  return [pageId, ...(PAGE_ID_ALIASES[pageId] ?? [])];
}

function getSectionsForPage(source: Record<string, CurrentPageSection[]>, pageId: string): CurrentPageSection[] {
  for (const candidate of getPageIdCandidates(pageId)) {
    const sections = source[candidate];
    if (sections) {
      return sections;
    }
  }

  return [];
}

function hasOverrideForPage(overrides: PageContentOverrides, pageId: string) {
  return getPageIdCandidates(pageId).some((candidate) => candidate in overrides);
}

interface PageContentOverrides {
  [pageId: string]: CurrentPageSection[];
}

interface PageContentContextType {
  getSection: (pageId: string, sectionIndex: number) => CurrentPageSection | undefined;
  getSections: (pageId: string) => CurrentPageSection[];
  setSections: (pageId: string, sections: CurrentPageSection[]) => void;
  hasOverride: (pageId: string) => boolean;
  resetPage: (pageId: string) => void;
}

const PageContentContext = createContext<PageContentContextType | null>(null);

export function PageContentProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<PageContentOverrides>({});

  useEffect(() => {
    let isMounted = true;

    const hydrateOverrides = async () => {
      try {
        let rows: Array<{ page_id: string; sections: CurrentPageSection[] }> = [];

        const { data: functionData, error: functionError } = await supabase.functions.invoke('get-page-content-overrides');

        if (!functionError && Array.isArray(functionData?.overrides)) {
          rows = functionData.overrides;
        } else {
          const { data: directData, error: directError } = await supabase
            .from('page_content_overrides' as any)
            .select('page_id, sections');

          if (directError) throw directError;
          rows = ((directData ?? []) as unknown[]).map((row) => {
            const typedRow = row as { page_id: string; sections: CurrentPageSection[] };
            return {
              page_id: typedRow.page_id,
              sections: typedRow.sections,
            };
          });
        }

        if (!isMounted || rows.length === 0) return;

        const nextOverrides = rows.reduce<PageContentOverrides>((acc, row) => {
          if (row?.page_id && Array.isArray(row.sections)) {
            acc[row.page_id] = row.sections;
          }
          return acc;
        }, {});

        setOverrides((prev) => ({ ...nextOverrides, ...prev }));
      } catch (error) {
        console.error('Failed to hydrate page content overrides:', error);
      }
    };

    hydrateOverrides();

    return () => {
      isMounted = false;
    };
  }, []);

  const getSections = useCallback((pageId: string): CurrentPageSection[] => {
    const overrideSections = getSectionsForPage(overrides, pageId);
    if (overrideSections.length > 0) {
      return overrideSections;
    }

    return getSectionsForPage(CURRENT_PAGE_CONTENT, pageId);
  }, [overrides]);

  const getSection = useCallback((pageId: string, sectionIndex: number): CurrentPageSection | undefined => {
    const sections = getSections(pageId);
    return sections[sectionIndex];
  }, [getSections]);

  const setSections = useCallback((pageId: string, sections: CurrentPageSection[]) => {
    setOverrides(prev => ({ ...prev, [pageId]: sections }));
  }, []);

  const hasOverride = useCallback((pageId: string) => {
    return hasOverrideForPage(overrides, pageId);
  }, [overrides]);

  const resetPage = useCallback((pageId: string) => {
    setOverrides(prev => {
      const next = { ...prev };

      for (const candidate of getPageIdCandidates(pageId)) {
        delete next[candidate];
      }

      return next;
    });
  }, []);

  return (
    <PageContentContext.Provider value={{ getSection, getSections, setSections, hasOverride, resetPage }}>
      {children}
    </PageContentContext.Provider>
  );
}

export function usePageContent(pageId: string) {
  const ctx = useContext(PageContentContext);
  if (!ctx) {
    // Fallback if not wrapped in provider
    return {
      sections: getSectionsForPage(CURRENT_PAGE_CONTENT, pageId),
      getSection: (index: number) => getSectionsForPage(CURRENT_PAGE_CONTENT, pageId)[index],
      hasOverride: false,
    };
  }
  return {
    sections: ctx.getSections(pageId),
    getSection: (index: number) => ctx.getSection(pageId, index),
    hasOverride: ctx.hasOverride(pageId),
  };
}

export function usePageContentUpdater() {
  const ctx = useContext(PageContentContext);
  if (!ctx) {
    return {
      setSections: () => {},
      resetPage: () => {},
      getSections: (_pageId: string) => [] as CurrentPageSection[],
      hasOverride: (_pageId: string) => false,
    };
  }
  return {
    setSections: ctx.setSections,
    resetPage: ctx.resetPage,
    getSections: ctx.getSections,
    hasOverride: ctx.hasOverride,
  };
}
