/**
 * Prices Store (Zustand)
 * 
 * Global state management for real-time token prices.
 * Provides dynamic pricing for all trading operations.
 * 
 * Features:
 * - Token price tracking (USD denominated)
 * - Last updated timestamps
 * - Batch price updates
 * - Price history for charts
 * 
 * @example
 * ```tsx
 * const { prices, updatePrice } = usePricesStore();
 * const btcPrice = prices['BTC'] || 0;
 * updatePrice('BTC', 89500);
 * ```
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Price data point for historical tracking
 */
export interface PriceDataPoint {
  token: string;
  price: number;
  timestamp: number;
}

/**
 * Prices state shape
 */
interface PricesState {
  /** Current prices for each token (token symbol -> USD price) */
  prices: Record<string, number>;
  /** Last updated timestamp for each token */
  lastUpdated: Record<string, number>;
  /** Historical price data for charts (limited to recent data) */
  priceHistory: PriceDataPoint[];
}

/**
 * Prices actions
 */
interface PricesActions {
  /** Update price for a single token */
  updatePrice: (token: string, price: number) => void;
  /** Batch update multiple token prices */
  updatePrices: (updates: Record<string, number>) => void;
  /** Get price for a token (with fallback) */
  getPrice: (token: string, fallback?: number) => number;
  /** Clear all prices (on reset) */
  clearPrices: () => void;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

/**
 * Default prices for common tokens
 * These are realistic starting values that will be updated dynamically
 */
const DEFAULT_PRICES: Record<string, number> = {
  'BTC': 89128,
  'ETH': 3245,
  'SOL': 142,
  'AVAX': 35,
  'MATIC': 0.85,
  'LINK': 18,
  'UNI': 12,
  'AAVE': 285,
  'CRV': 0.95,
  'SUSHI': 1.45,
  'COMP': 68,
  'MKR': 2100,
  'SNX': 3.2,
  'YFI': 9500,
  'DOGE': 0.08,
  'SHIB': 0.000024,
  'PEPE': 0.0000085,
  'ARB': 0.92,
  'OP': 2.15,
  'APT': 8.5,
  'SUI': 3.8,
  'INJ': 28,
  'TIA': 6.2,
  'SEI': 0.45,
  'FTM': 0.72,
  'ATOM': 9.8,
  'DOT': 6.5,
  'ADA': 0.62,
  'XRP': 2.35,
  'LTC': 105,
  'USDC': 1.0,
  'USDT': 1.0,
  'ZETA': 0.85,
  'RAVE': 0.12,
  'TAI': 1.5,
  'AT': 0.35,
  'ASTER': 0.28,
  'FARTCOIN': 0.015,
  'SONIC': 0.95,
  'ORDER': 0.42,
  'ARIA': 0.18,
  'BLUR1': 0.38,
  'BZEC': 404.25,
  'HYPE': 24.25,
  // RWA assets
  'GOLD': 4900,
  'SILVER': 32,
  'COPPER': 4.5,
  'OIL': 75,
};

const initialState: PricesState = {
  prices: { ...DEFAULT_PRICES },
  lastUpdated: {},
  priceHistory: [],
};

// ============================================================================
// STORE
// ============================================================================

/**
 * Prices Store
 * 
 * Manages dynamic token pricing across the application.
 * Provides real-time price updates and historical tracking.
 */
export const usePricesStore = create<PricesState & PricesActions>()(
  devtools(
    (set, get) => ({
      // Initial state
      ...initialState,

      // Actions
      updatePrice: (token: string, price: number) =>
        set(
          (state) => {
            const timestamp = Date.now();
            
            return {
              prices: {
                ...state.prices,
                [token]: price,
              },
              lastUpdated: {
                ...state.lastUpdated,
                [token]: timestamp,
              },
              // Add to price history (keep last 1000 points)
              priceHistory: [
                ...state.priceHistory.slice(-999),
                { token, price, timestamp },
              ],
            };
          },
          false,
          'prices/updatePrice'
        ),

      updatePrices: (updates: Record<string, number>) =>
        set(
          (state) => {
            const timestamp = Date.now();
            const newLastUpdated: Record<string, number> = { ...state.lastUpdated };
            const newPriceHistory: PriceDataPoint[] = [...state.priceHistory];
            
            Object.entries(updates).forEach(([token, price]) => {
              newLastUpdated[token] = timestamp;
              newPriceHistory.push({ token, price, timestamp });
            });
            
            return {
              prices: {
                ...state.prices,
                ...updates,
              },
              lastUpdated: newLastUpdated,
              // Keep last 1000 points
              priceHistory: newPriceHistory.slice(-1000),
            };
          },
          false,
          'prices/updatePrices'
        ),

      getPrice: (token: string, fallback = 0) => {
        const state = get();
        return state.prices[token] || fallback;
      },

      clearPrices: () =>
        set(
          () => ({
            prices: { ...DEFAULT_PRICES },
            lastUpdated: {},
            priceHistory: [],
          }),
          false,
          'prices/clearPrices'
        ),
    }),
    { name: 'PricesStore' }
  )
);

export default usePricesStore;