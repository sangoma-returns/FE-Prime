/**
 * PNL Tracking Hook
 * 
 * Automatically records PNL data points for live charting.
 * Monitors position changes and updates history at regular intervals.
 * 
 * @example
 * ```tsx
 * // In your main App component:
 * usePnlTracking();
 * ```
 */

import { useEffect, useRef } from 'react';
import { usePnlHistoryStore } from '../stores/pnlHistoryStore';
import { usePositionsStore } from '../stores/positionsStore';
import { usePricesStore } from '../stores/pricesStore';
import { useFundingRatesStore } from '../stores/fundingRatesStore';

/**
 * Interval for recording data points (milliseconds)
 * Default: 30 seconds
 */
const RECORDING_INTERVAL = 30 * 1000;

/**
 * Hook to automatically track and record PNL history
 */
export function usePnlTracking() {
  const addDataPoint = usePnlHistoryStore((s) => s.addDataPoint);
  const pruneOldData = usePnlHistoryStore((s) => s.pruneOldData);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRecordedRef = useRef<number>(0);

  useEffect(() => {
    // Function to record current PNL state
    const recordDataPoint = () => {
      const now = Date.now();
      
      // Avoid recording too frequently
      if (now - lastRecordedRef.current < RECORDING_INTERVAL - 1000) {
        return;
      }

      const positionsStore = usePositionsStore.getState();
      const pricesStore = usePricesStore.getState();
      const fundingRatesStore = useFundingRatesStore.getState();

      const openPositions = positionsStore.getOpenPositions();
      if (openPositions.length === 0) {
        return;
      }

      // Update cached PNL using latest prices and funding rates
      positionsStore.updatePnlCache(pricesStore.prices, fundingRatesStore.rates);

      // Calculate position exposures
      let longExposure = 0;
      let shortExposure = 0;
      let totalPnl = 0;
      let totalFundingPnl = 0;
      let totalUnrealizedPnl = 0;

      openPositions.forEach((position) => {
        if (!position.legs) {
          return;
        }

        const pnl = positionsStore.getCachedPnl(position.id);
        if (pnl) {
          totalPnl += pnl.totalPnl;
          totalFundingPnl += pnl.fundingPnl;
          totalUnrealizedPnl += pnl.unrealizedPnl;
        }

        position.legs.forEach((leg) => {
          const notional = leg.quantity * leg.entryPrice;
          if (leg.side === 'long') {
            longExposure += notional;
          } else {
            shortExposure += notional;
          }
        });
      });

      const netPosition = longExposure - shortExposure;

      // Record the data point
      addDataPoint({
        unrealizedPnl: totalUnrealizedPnl,
        fundingPnl: totalFundingPnl,
        netPnl: totalPnl,
        longExposure,
        shortExposure,
        netPosition,
        positionCount: openPositions.length,
      });

      lastRecordedRef.current = now;
      console.log(`✓ Recorded PNL data point: Net PNL = $${totalPnl.toFixed(2)}, Positions = ${openPositions.length}`);
    };

    // Record initial data point
    recordDataPoint();

    // Set up interval to record data points
    intervalRef.current = setInterval(() => {
      recordDataPoint();
    }, RECORDING_INTERVAL);

    // Prune old data daily (keep last 7 days)
    const pruneInterval = setInterval(() => {
      pruneOldData(168); // 7 days
    }, 24 * 60 * 60 * 1000);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      clearInterval(pruneInterval);
    };
  }, [addDataPoint, pruneOldData]);
}

export default usePnlTracking;
