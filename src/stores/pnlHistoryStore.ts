/**
 * PNL History Store (Zustand)
 * 
 * Tracks historical PNL data points for live charting.
 * Records snapshots of position performance over time.
 * 
 * Features:
 * - Time-series PNL tracking
 * - Position exposure tracking
 * - Automatic data point recording
 * - Configurable history retention
 * 
 * @example
 * ```tsx
 * const { addDataPoint, getChartData } = usePnlHistoryStore();
 * const chartData = getChartData('1h');
 * ```
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Single PNL data point for charting
 */
export interface PnlDataPoint {
  /** Timestamp in milliseconds */
  timestamp: number;
  /** Formatted time string for display */
  time: string;
  /** Total unrealized PNL */
  unrealizedPnl: number;
  /** Total funding PNL */
  fundingPnl: number;
  /** Net PNL (unrealized + funding) */
  netPnl: number;
  /** Total long exposure (notional) */
  longExposure: number;
  /** Total short exposure (notional) */
  shortExposure: number;
  /** Net position (long - short) */
  netPosition: number;
  /** Number of open positions */
  positionCount: number;
}

/**
 * PNL History state shape
 */
interface PnlHistoryState {
  /** Historical data points */
  dataPoints: PnlDataPoint[];
  /** Last update timestamp */
  lastUpdate: number;
}

/**
 * PNL History actions
 */
interface PnlHistoryActions {
  /** Add a new data point */
  addDataPoint: (point: Omit<PnlDataPoint, 'timestamp' | 'time'>) => void;
  /** Get chart data for a specific time range */
  getChartData: (range: '1h' | '4h' | '24h' | '7d' | 'all') => PnlDataPoint[];
  /** Clear old data points (keep last N hours) */
  pruneOldData: (hoursToKeep?: number) => void;
  /** Clear all history */
  clearHistory: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Format timestamp as HH:MM string
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Get time range in milliseconds
 */
function getTimeRangeMs(range: '1h' | '4h' | '24h' | '7d' | 'all'): number {
  switch (range) {
    case '1h':
      return 60 * 60 * 1000;
    case '4h':
      return 4 * 60 * 60 * 1000;
    case '24h':
      return 24 * 60 * 60 * 1000;
    case '7d':
      return 7 * 24 * 60 * 60 * 1000;
    case 'all':
      return Infinity;
  }
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: PnlHistoryState = {
  dataPoints: [],
  lastUpdate: 0,
};

// ============================================================================
// STORE
// ============================================================================

/**
 * PNL History Store
 * 
 * Records historical PNL snapshots for charting.
 * Persists to localStorage for data continuity.
 */
export const usePnlHistoryStore = create<PnlHistoryState & PnlHistoryActions>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        ...initialState,

        // Actions
        addDataPoint: (pointData) => {
          const timestamp = Date.now();
          const time = formatTime(timestamp);

          const newPoint: PnlDataPoint = {
            ...pointData,
            timestamp,
            time,
          };

          set(
            (state) => ({
              dataPoints: [...state.dataPoints, newPoint],
              lastUpdate: timestamp,
            }),
            false,
            'pnlHistory/addDataPoint'
          );
        },

        getChartData: (range) => {
          const state = get();
          const now = Date.now();
          const rangeMs = getTimeRangeMs(range);
          const cutoffTime = now - rangeMs;

          // Filter data points within the time range
          const filteredData = state.dataPoints.filter(
            (point) => point.timestamp >= cutoffTime
          );

          // If no data, return empty array
          if (filteredData.length === 0) {
            return [];
          }

          // Downsample data for better performance if too many points
          const maxPoints = 100;
          if (filteredData.length <= maxPoints) {
            return filteredData;
          }

          // Keep every Nth point to reduce to maxPoints
          const step = Math.ceil(filteredData.length / maxPoints);
          const downsampled = filteredData.filter((_, index) => index % step === 0);
          
          // Always include the last point
          if (downsampled[downsampled.length - 1] !== filteredData[filteredData.length - 1]) {
            downsampled.push(filteredData[filteredData.length - 1]);
          }

          return downsampled;
        },

        pruneOldData: (hoursToKeep = 168) => {
          const cutoffTime = Date.now() - hoursToKeep * 60 * 60 * 1000;

          set(
            (state) => ({
              dataPoints: state.dataPoints.filter(
                (point) => point.timestamp >= cutoffTime
              ),
            }),
            false,
            'pnlHistory/pruneOldData'
          );
        },

        clearHistory: () =>
          set(
            () => ({
              dataPoints: [],
              lastUpdate: 0,
            }),
            false,
            'pnlHistory/clearHistory'
          ),
      }),
      {
        name: 'bitfrost-pnl-history-storage',
        version: 1,
      }
    ),
    { name: 'PnlHistoryStore' }
  )
);

export default usePnlHistoryStore;
