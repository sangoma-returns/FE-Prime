/**
 * Navigation Hook
 * 
 * Provides a type-safe routing abstraction using browser history API.
 * Simple and reliable - just updates the URL and triggers re-renders.
 */

import { useCallback, useMemo, useState, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type Page = 'portfolio' | 'explore' | 'aggregator' | 'funding-arb' | 'market-maker' | 'more';

interface UseNavigationReturn {
  /** Current active page */
  currentPage: Page;
  /** Navigate to a specific page */
  navigateTo: (page: Page, queryParams?: string) => void;
  /** Check if given page is current */
  isCurrentPage: (page: Page) => boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert page name to URL path
 */
const pageToPath = (page: Page): string => {
  switch (page) {
    case 'portfolio':
      return '/portfolio';
    case 'explore':
      return '/explore';
    case 'aggregator':
      return '/aggregator';
    case 'funding-arb':
      return '/trade';
    case 'market-maker':
      return '/market-maker';
    case 'more':
      return '/more';
    default:
      return '/explore';
  }
};

/**
 * Convert URL path to page name
 */
const pathToPage = (pathname: string): Page => {
  if (pathname.startsWith('/portfolio')) return 'portfolio';
  if (pathname.startsWith('/trade')) return 'funding-arb';
  if (pathname.startsWith('/aggregator')) return 'aggregator';
  if (pathname.startsWith('/explore')) return 'explore';
  if (pathname.startsWith('/market-maker')) return 'market-maker';
  if (pathname.startsWith('/blockchain-explorer')) return 'more';
  if (pathname.startsWith('/more')) return 'more';
  return 'explore'; // default
};

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing application navigation using browser history API
 * 
 * @returns Navigation state and control functions
 */
export function useNavigation(): UseNavigationReturn {
  const [pathname, setPathname] = useState(() => 
    typeof window !== 'undefined' ? window.location.pathname : '/explore'
  );

  // Listen to browser back/forward buttons and any URL changes
  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Get current page from URL
  const currentPage = useMemo(() => pathToPage(pathname), [pathname]);

  // Navigate to a page with optional query params
  const navigateTo = useCallback((page: Page, queryParams?: string) => {
    const path = pageToPath(page);
    const fullPath = queryParams ? `${path}?${queryParams}` : path;
    
    // Always push to history and update state
    window.history.pushState({}, '', fullPath);
    setPathname(path); // Just store the path without query params for page detection
    
    // Dispatch a custom event to notify AppRouter
    window.dispatchEvent(new CustomEvent('navigation'));
  }, []);

  // Check if page is current
  const isCurrentPage = useCallback((page: Page) => {
    return currentPage === page;
  }, [currentPage]);

  return {
    currentPage,
    navigateTo,
    isCurrentPage,
  };
}