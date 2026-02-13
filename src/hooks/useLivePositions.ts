/**
 * Live Positions Hook
 * 
 * React hook for tracking live position performance with real-time PNL updates.
 * Automatically subscribes to price and funding rate changes for all open positions.
 * 
 * @example
 * ```tsx
 * const { positions, totalPnl, totalPnlPercent } = useLivePositions();
 * ```
 */

import { useEffect } from 'react';
import { usePositionsStore } from '../stores/positionsStore';
import { usePricesStore } from '../stores/pricesStore';
import { useFundingRatesStore } from '../stores/fundingRatesStore';

/**
 * Hook to automatically update position PNL with live market data
 */
export function useLivePositions() {
  const { 
    positions, 
    getOpenPositions, 
    updatePnlCache, 
    getCachedPnl,
  } = usePositionsStore();
  
  const { prices } = usePricesStore();
  const { rates: fundingRates } = useFundingRatesStore();
  
  // Update PNL cache whenever prices or funding rates change
  useEffect(() => {
    const openPositions = getOpenPositions();
    
    if (openPositions.length > 0) {
      updatePnlCache(prices, fundingRates);
    }
  }, [prices, fundingRates, getOpenPositions, updatePnlCache]);
  
  // Get open positions with their cached PNL
  const openPositions = getOpenPositions();
  const positionsWithPnl = openPositions.map((position) => {
    const pnl = getCachedPnl(position.id);
    return {
      position, // Keep position as a separate property
      pnl,
    };
  });
  
  // Calculate aggregate metrics
  let totalPnl = 0;
  let totalNotional = 0;
  let totalFundingPnl = 0;
  let totalUnrealizedPnl = 0;
  
  positionsWithPnl.forEach(({ position, pnl }) => {
    if (pnl) {
      totalPnl += pnl.totalPnl;
      totalNotional += position.notionalValue;
      totalFundingPnl += pnl.fundingPnl;
      totalUnrealizedPnl += pnl.unrealizedPnl;
    }
  });
  
  const totalPnlPercent = totalNotional > 0 ? (totalPnl / totalNotional) * 100 : 0;
  const totalFundingPercent = totalNotional > 0 ? (totalFundingPnl / totalNotional) * 100 : 0;
  const totalUnrealizedPercent = totalNotional > 0 ? (totalUnrealizedPnl / totalNotional) * 100 : 0;
  
  return {
    // Positions with PNL data
    positions: positionsWithPnl,
    // Aggregate metrics
    totalPnl,
    totalPnlPercent,
    totalFundingPnl,
    totalFundingPercent,
    totalUnrealizedPnl,
    totalUnrealizedPercent,
    totalNotional,
    // Count
    openPositionCount: openPositions.length,
  };
}

export default useLivePositions;