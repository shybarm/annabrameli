import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { CURRENT_PAGE_CONTENT, type CurrentPageSection } from '@/data/geo-current-page-content';
import { supabase } from '@/integrations/supabase/client';

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
    return overrides[pageId] || CURRENT_PAGE_CONTENT[pageId] || [];
  }, [overrides]);

  const getSection = useCallback((pageId: string, sectionIndex: number): CurrentPageSection | undefined => {
    const sections = overrides[pageId] || CURRENT_PAGE_CONTENT[pageId] || [];
    return sections[sectionIndex];
  }, [overrides]);

  const setSections = useCallback((pageId: string, sections: CurrentPageSection[]) => {
    setOverrides(prev => ({ ...prev, [pageId]: sections }));
  }, []);

  const hasOverride = useCallback((pageId: string) => {
    return pageId in overrides;
  }, [overrides]);

  const resetPage = useCallback((pageId: string) => {
    setOverrides(prev => {
      const next = { ...prev };
      delete next[pageId];
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
      sections: CURRENT_PAGE_CONTENT[pageId] || [],
      getSection: (index: number) => (CURRENT_PAGE_CONTENT[pageId] || [])[index],
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
    };
  }
  return {
    setSections: ctx.setSections,
    resetPage: ctx.resetPage,
  };
}
