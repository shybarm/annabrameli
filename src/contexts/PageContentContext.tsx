import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CURRENT_PAGE_CONTENT, type CurrentPageSection } from '@/data/geo-current-page-content';

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
