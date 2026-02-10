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
import { useLivePositions } from './useLivePositions';

/**
 * Interval for recording data points (milliseconds)
 * Default: 30 seconds
 */
const RECORDING_INTERVAL = 30 * 1000;

/**
 * Hook to automatically track and record PNL history
 */
export function usePnlTracking() {
  const { addDataPoint, pruneOldData } = usePnlHistoryStore();
  const {
    positions,
    totalPnl,
    totalFundingPnl,
    totalUnrealizedPnl,
    openPositionCount,
  } = useLivePositions();
  
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

      // Calculate position exposures
      let longExposure = 0;
      let shortExposure = 0;

      positions.forEach(({ position }) => {
        // Safety check: ensure position and legs exist
        if (!position || !position.legs) {
          return;
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
        positionCount: openPositionCount,
      });

      lastRecordedRef.current = now;
      console.log(`✓ Recorded PNL data point: Net PNL = $${totalPnl.toFixed(2)}, Positions = ${openPositionCount}`);
    };

    // Record initial data point if we have positions
    if (positions.length > 0 && lastRecordedRef.current === 0) {
      recordDataPoint();
    }

    // Set up interval to record data points
    intervalRef.current = setInterval(() => {
      if (positions.length > 0) {
        recordDataPoint();
      }
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
  }, [positions, totalPnl, totalFundingPnl, totalUnrealizedPnl, openPositionCount, addDataPoint, pruneOldData]);
}

export default usePnlTracking;