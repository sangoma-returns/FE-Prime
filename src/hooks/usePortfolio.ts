/**
 * Portfolio Data Hook
 * 
 * Custom hook for fetching and managing portfolio data with
 * automatic error handling, loading states, and data caching.
 * 
 * Usage:
 * ```tsx
 * function PortfolioPage() {
 *   const { data, loading, error, refetch } = usePortfolio();
 *   
 *   if (loading) return <LoadingSkeleton />;
 *   if (error) return <ErrorMessage error={error} />;
 *   
 *   return <div>Total: ${data.totalEquity}</div>;
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { getPortfolioSummary, getExchangeBalances } from '../services/api/portfolio';
import type { PortfolioSummary, ExchangeBalance } from '../types';

// ============================================================================
// TYPES
// ============================================================================

interface UsePortfolioReturn {
  summary: PortfolioSummary | null;
  exchanges: ExchangeBalance[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to fetch portfolio summary and exchange balances
 * 
 * @param autoRefresh - Auto-refresh interval in ms (default: 30000 = 30s)
 * @returns Portfolio data, loading state, error state, and refetch function
 * 
 * Example:
 * ```tsx
 * const { summary, exchanges, loading, error, refetch } = usePortfolio();
 * 
 * // Manual refresh
 * <button onClick={refetch}>Refresh</button>
 * 
 * // Display data
 * {summary && <div>${summary.totalEquity}</div>}
 * ```
 */
export function usePortfolio(autoRefresh: number | false = 30000): UsePortfolioReturn {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [exchanges, setExchanges] = useState<ExchangeBalance[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch portfolio data from API
   */
  const fetchPortfolio = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both summary and exchange data in parallel
      const [summaryData, exchangeData] = await Promise.all([
        getPortfolioSummary(),
        getExchangeBalances(),
      ]);

      setSummary(summaryData);
      setExchanges(exchangeData);
    } catch (err) {
      console.error('Error fetching portfolio:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Initial fetch on mount
   */
  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  /**
   * Auto-refresh interval
   */
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Only refresh if not currently loading
      if (!loading) {
        fetchPortfolio();
      }
    }, autoRefresh);

    return () => clearInterval(interval);
  }, [autoRefresh, loading, fetchPortfolio]);

  return {
    summary,
    exchanges,
    loading,
    error,
    refetch: fetchPortfolio,
  };
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

/*
// In your component:

import { usePortfolio } from '../hooks/usePortfolio';

export function PortfolioPage() {
  const { summary, exchanges, loading, error, refetch } = usePortfolio();

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div>
        <p>Error loading portfolio: {error.message}</p>
        <button onClick={refetch}>Retry</button>
      </div>
    );
  }

  if (!summary || !exchanges) {
    return <EmptyState />;
  }

  return (
    <div>
      <h1>Portfolio</h1>
      
      {/* Stats *//*}
      <div>
        <div>Total Equity: ${summary.totalEquity}</div>
        <div>Unrealized PnL: ${summary.unrealizedPnL}</div>
      </div>

      {/* Exchanges *//*}
      <div>
        {exchanges.map(exchange => (
          <div key={exchange.exchangeId}>
            <h3>{exchange.exchangeName}</h3>
            <p>Balance: ${exchange.balance}</p>
          </div>
        ))}
      </div>

      {/* Refresh Button *//*}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
*/
