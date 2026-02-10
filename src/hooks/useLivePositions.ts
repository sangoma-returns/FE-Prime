/**
 * Live Positions Hook
 * 
 * React hook for tracking live position performance with real-time PNL updates.
 * Automatically subscribes to price and funding rate changes for all open positions.
 * 
 * IMPORTANT: This hook uses useMemo to prevent unnecessary re-renders.
 * Do not add conditional hooks or early returns to maintain stable hook order.
 * 
 * @example
 * ```tsx
 * const { positions, totalPnl, totalPnlPercent } = useLivePositions();
 * ```
 */

import { useMemo } from 'react';
import { usePositionsStore } from '../stores/positionsStore';

/**
 * Hook to automatically update position PNL with live market data
 * Note: Automatic PNL cache updates are currently disabled to prevent infinite loops
 */
export function useLivePositions() {
  // Select only the data we need from stores
  const positions = usePositionsStore((state) => state.positions);
  const pnlCache = usePositionsStore((state) => state.pnlCache);
  
  // Calculate metrics based on positions and pnlCache (memoized)
  return useMemo(() => {
    const openPositions = positions.filter(p => p.status === 'open');
    
    const positionsWithPnl = openPositions.map((position) => {
      const pnl = pnlCache[position.id] || null;
      return {
        position,
        pnl,
      };
    });
    
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
      positions: positionsWithPnl,
      totalPnl,
      totalPnlPercent,
      totalFundingPnl,
      totalFundingPercent,
      totalUnrealizedPnl,
      totalUnrealizedPercent,
      totalNotional,
      openPositionCount: openPositions.length,
    };
  }, [positions, pnlCache]);
}

export default useLivePositions;