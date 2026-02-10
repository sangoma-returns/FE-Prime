/**
 * Funding Rates Hook
 * 
 * Custom hook for fetching and managing funding rate data with
 * real-time WebSocket updates.
 * 
 * Usage:
 * ```tsx
 * function ExplorePage() {
 *   const { data, loading, error, refetch } = useFundingRates('day');
 *   
 *   if (loading) return <LoadingSkeleton />;
 *   if (error) return <ErrorMessage error={error} />;
 *   
 *   return <FundingRateTable data={data} />;
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { getFundingRates } from '../services/api/funding';
import { wsClient } from '../services/websocket';
import { logger } from '../utils/logger';
import type { FundingRate, FundingRateUpdate } from '../types';

// ============================================================================
// TYPES
// ============================================================================

interface UseFundingRatesReturn {
  data: FundingRate[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to fetch funding rates with real-time updates
 * 
 * Features:
 * - Initial data fetch from REST API
 * - Real-time updates via WebSocket
 * - Automatic reconnection on disconnect
 * - Manual refetch function
 * 
 * @param timeframe - Time period for annualized calculation
 * @param enableRealtime - Enable WebSocket updates (default: true)
 * @returns Funding rate data, loading state, error state, and refetch function
 * 
 * Example:
 * ```tsx
 * const { data, loading, error, refetch } = useFundingRates('day', true);
 * 
 * // Manual refresh
 * <button onClick={refetch}>Refresh</button>
 * 
 * // Display data
 * {data.map(rate => (
 *   <div key={rate.token}>
 *     {rate.token}: {rate.exchanges.binance?.rate}%
 *   </div>
 * ))}
 * ```
 */
export function useFundingRates(
  timeframe: 'day' | 'week' | 'month' | 'year' = 'day',
  enableRealtime: boolean = true
): UseFundingRatesReturn {
  const [data, setData] = useState<FundingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch funding rates from API
   */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const rates = await getFundingRates(timeframe);
      setData(rates);
    } catch (err) {
      logger.error('Error fetching funding rates', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  /**
   * Handle WebSocket funding rate update
   */
  const handleUpdate = useCallback((update: FundingRateUpdate) => {
    setData(prevData => {
      // Find the token in current data
      const index = prevData.findIndex(rate => rate.token === update.token);
      
      if (index === -1) {
        // Token not in list yet, you might want to add it or ignore
        return prevData;
      }
      
      // Update the specific exchange rate for this token
      const newData = [...prevData];
      newData[index] = {
        ...newData[index],
        exchanges: {
          ...newData[index].exchanges,
          [update.exchange]: {
            rate: update.rate,
            rateAnnualized: update.rateAnnualized,
            nextFundingTime: update.nextFundingTime,
            indexPrice: 0, // These might not be in update
            markPrice: 0,
          },
        },
        lastUpdated: update.timestamp,
      };
      
      return newData;
    });
  }, []);

  /**
   * Initial fetch on mount
   */
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Setup WebSocket subscription for real-time updates
   */
  useEffect(() => {
    if (!enableRealtime) return;

    // Connect WebSocket if not already connected
    if (!wsClient.isConnected) {
      wsClient.connect();
    }

    // Subscribe to funding rate updates
    const unsubscribe = wsClient.subscribe('funding_rate_update', handleUpdate);

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [enableRealtime, handleUpdate]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * Hook to fetch funding rate for a specific token
 */
export function useTokenFundingRate(
  token: string,
  timeframe: 'day' | 'week' | 'month' | 'year' = 'day'
) {
  const { data, loading, error, refetch } = useFundingRates(timeframe);
  
  const tokenData = data.find(rate => rate.token === token) || null;
  
  return {
    data: tokenData,
    loading,
    error,
    refetch,
  };
}