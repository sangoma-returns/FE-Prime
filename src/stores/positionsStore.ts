/**
 * Positions Store (Zustand)
 * 
 * Global state management for trading positions with live PNL tracking.
 * Simulates real trading positions with entry prices, current prices,
 * and accumulated funding rates.
 * 
 * Features:
 * - Multi-exchange position tracking
 * - Real-time PNL calculations
 * - Funding rate accumulation
 * - Position history and performance metrics
 * 
 * @example
 * ```tsx
 * const { positions, addPosition, getPositionPnl } = usePositionsStore();
 * const btcPnl = getPositionPnl('position-id');
 * ```
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Side of the position (Long = Buy, Short = Sell)
 */
export type PositionSide = 'long' | 'short';

/**
 * Status of the position
 */
export type PositionStatus = 'open' | 'closed';

/**
 * Individual exchange leg of a position
 */
export interface PositionLeg {
  /** Unique identifier for this leg */
  id: string;
  /** Exchange name */
  exchange: string;
  /** Side of the position (long/short) */
  side: PositionSide;
  /** Quantity in tokens (BASE AMOUNT, not leveraged) */
  quantity: number;
  /** Leverage multiplier (e.g., 30 for 30x) */
  leverage: number;
  /** Entry price in USD */
  entryPrice: number;
  /** Entry funding rate (APR %) */
  entryFundingRate: number;
  /** Timestamp when position was opened */
  timestamp: number;
}

/**
 * Complete trading position (may span multiple exchanges)
 */
export interface Position {
  /** Unique identifier */
  id: string;
  /** Token symbol (e.g., 'BTC', 'ETH') */
  token: string;
  /** Position legs across different exchanges */
  legs: PositionLeg[];
  /** Total notional value in USD */
  notionalValue: number;
  /** Position status */
  status: PositionStatus;
  /** Timestamp when position was opened */
  openedAt: number;
  /** Timestamp when position was closed (null if open) */
  closedAt: number | null;
  /** User notes or strategy description */
  notes?: string;
}

/**
 * Real-time PNL metrics for a position
 */
export interface PositionPnl {
  /** Position ID */
  positionId: string;
  /** Unrealized PNL from price movement (USD) */
  unrealizedPnl: number;
  /** Unrealized PNL percentage */
  unrealizedPnlPercent: number;
  /** Accumulated funding PNL (USD) */
  fundingPnl: number;
  /** Accumulated funding PNL percentage */
  fundingPnlPercent: number;
  /** Total PNL (unrealized + funding) */
  totalPnl: number;
  /** Total PNL percentage */
  totalPnlPercent: number;
  /** Current position value (USD) */
  currentValue: number;
  /** Time held (milliseconds) */
  timeHeld: number;
}

/**
 * Positions state shape
 */
interface PositionsState {
  /** All positions (open and closed) */
  positions: Position[];
  /** Cache of latest PNL calculations */
  pnlCache: Record<string, PositionPnl>;
}

/**
 * Positions actions
 */
interface PositionsActions {
  /** Add a new position */
  addPosition: (position: Omit<Position, 'id' | 'openedAt' | 'status'>) => string;
  /** Close a position */
  closePosition: (positionId: string) => void;
  /** Get position by ID */
  getPosition: (positionId: string) => Position | null;
  /** Get all open positions */
  getOpenPositions: () => Position[];
  /** Get all closed positions */
  getClosedPositions: () => Position[];
  /** Get positions for a specific token */
  getTokenPositions: (token: string) => Position[];
  /** Calculate real-time PNL for a position */
  calculatePositionPnl: (positionId: string, currentPrices: Record<string, number>, currentFundingRates: Record<string, Record<string, number | null>>) => PositionPnl | null;
  /** Update PNL cache for all open positions */
  updatePnlCache: (currentPrices: Record<string, number>, currentFundingRates: Record<string, Record<string, number | null>>) => void;
  /** Get cached PNL for a position */
  getCachedPnl: (positionId: string) => PositionPnl | null;
  /** Clear all positions (for testing/reset) */
  clearPositions: () => void;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: PositionsState = {
  positions: [],
  pnlCache: {},
};

// ============================================================================
// STORE
// ============================================================================

/**
 * Positions Store
 * 
 * Manages trading positions with real-time PNL tracking.
 * Persists to localStorage for data continuity.
 */
export const usePositionsStore = create<PositionsState & PositionsActions>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        ...initialState,

        // Actions
        addPosition: (positionData) => {
          const positionId = `pos-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const timestamp = Date.now();

          const newPosition: Position = {
            id: positionId,
            ...positionData,
            status: 'open',
            openedAt: timestamp,
            closedAt: null,
          };

          set(
            (state) => ({
              positions: [...state.positions, newPosition],
            }),
            false,
            'positions/addPosition'
          );

          console.log(`✓ Position created: ${positionId} for ${newPosition.token}`);
          return positionId;
        },

        closePosition: (positionId) => {
          set(
            (state) => ({
              positions: state.positions.map((pos) =>
                pos.id === positionId
                  ? { ...pos, status: 'closed' as PositionStatus, closedAt: Date.now() }
                  : pos
              ),
            }),
            false,
            'positions/closePosition'
          );

          console.log(`✓ Position closed: ${positionId}`);
        },

        getPosition: (positionId) => {
          const state = get();
          return state.positions.find((pos) => pos.id === positionId) || null;
        },

        getOpenPositions: () => {
          const state = get();
          return state.positions.filter((pos) => pos.status === 'open');
        },

        getClosedPositions: () => {
          const state = get();
          return state.positions.filter((pos) => pos.status === 'closed');
        },

        getTokenPositions: (token) => {
          const state = get();
          return state.positions.filter((pos) => pos.token === token);
        },

        calculatePositionPnl: (positionId, currentPrices, currentFundingRates) => {
          const position = get().getPosition(positionId);
          if (!position || position.status !== 'open') {
            return null;
          }

          const currentPrice = currentPrices[position.token];
          if (!currentPrice) {
            // No current price data available
            return null;
          }

          let totalUnrealizedPnl = 0;
          let totalFundingPnl = 0;
          let totalCurrentValue = 0;

          // Calculate PNL for each leg
          position.legs.forEach((leg) => {
            // Base notional (unleveraged)
            const baseNotional = leg.quantity * leg.entryPrice;
            // Leveraged notional for funding calculation
            const leveragedNotional = baseNotional * leg.leverage;
            const currentLegValue = leg.quantity * currentPrice;

            // Unrealized PNL from price movement (on base quantity, not leveraged)
            let legUnrealizedPnl = 0;
            if (leg.side === 'long') {
              legUnrealizedPnl = (currentPrice - leg.entryPrice) * leg.quantity;
            } else {
              // Short position
              legUnrealizedPnl = (leg.entryPrice - currentPrice) * leg.quantity;
            }

            // Funding PNL (calculated on LEVERAGED notional)
            const currentFundingRate = currentFundingRates[position.token]?.[leg.exchange];
            const timeHeldHours = (Date.now() - leg.timestamp) / (1000 * 60 * 60);
            
            // Funding payments happen every 8 hours
            const fundingPeriods = timeHeldHours / 8;

            let legFundingPnl = 0;
            if (currentFundingRate !== null && currentFundingRate !== undefined) {
              // Convert APR% to per-period rate
              // APR% / 365 days / 3 periods per day = rate per funding period
              const ratePerPeriod = (currentFundingRate / 100) / (365 * 3);
              
              // For long positions: pay funding if rate is positive (negative PNL)
              // For short positions: receive funding if rate is positive (positive PNL)
              const fundingMultiplier = leg.side === 'long' ? -1 : 1;
              legFundingPnl = ratePerPeriod * leveragedNotional * fundingPeriods * fundingMultiplier;
            }

            totalUnrealizedPnl += legUnrealizedPnl;
            totalFundingPnl += legFundingPnl;
            totalCurrentValue += currentLegValue;
          });

          const totalPnl = totalUnrealizedPnl + totalFundingPnl;
          const notionalValue = position.notionalValue;

          return {
            positionId: position.id,
            unrealizedPnl: totalUnrealizedPnl,
            unrealizedPnlPercent: (totalUnrealizedPnl / notionalValue) * 100,
            fundingPnl: totalFundingPnl,
            fundingPnlPercent: (totalFundingPnl / notionalValue) * 100,
            totalPnl,
            totalPnlPercent: (totalPnl / notionalValue) * 100,
            currentValue: totalCurrentValue,
            timeHeld: Date.now() - position.openedAt,
          };
        },

        updatePnlCache: (currentPrices, currentFundingRates) => {
          const openPositions = get().getOpenPositions();
          const newPnlCache: Record<string, PositionPnl> = {};

          openPositions.forEach((position) => {
            const pnl = get().calculatePositionPnl(position.id, currentPrices, currentFundingRates);
            if (pnl) {
              newPnlCache[position.id] = pnl;
            }
          });

          set(
            () => ({
              pnlCache: newPnlCache,
            }),
            false,
            'positions/updatePnlCache'
          );
        },

        getCachedPnl: (positionId) => {
          const state = get();
          return state.pnlCache[positionId] || null;
        },

        clearPositions: () =>
          set(
            () => ({
              positions: [],
              pnlCache: {},
            }),
            false,
            'positions/clearPositions'
          ),
      }),
      {
        name: 'bitfrost-positions-storage',
        version: 1,
      }
    ),
    { name: 'PositionsStore' }
  )
);

export default usePositionsStore;