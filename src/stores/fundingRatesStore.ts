/**
 * Funding Rates Store (Zustand)
 * 
 * Global state management for funding rate data across exchanges.
 * Critical for funding rate arbitrage functionality.
 * 
 * Features:
 * - Multi-exchange funding rate tracking
 * - Token-specific rates per exchange
 * - Historical rate tracking
 * - Rate spread calculations
 * - Live data from Loris API (https://loris.tools/api-docs)
 * 
 * @example
 * ```tsx
 * const { rates, updateRates, getRate } = useFundingRatesStore();
 * const btcBinanceRate = getRate('BTC', 'Binance');
 * ```
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// MARKET CAP DATA
// ============================================================================

/**
 * Market cap ranks for major cryptocurrencies (approximate, as of Jan 2025)
 * Used for sorting tokens by market cap
 */
const MARKET_CAP_RANKS: Record<string, number> = {
  // Top 10
  'BTC': 1,
  'ETH': 2,
  'USDT': 3,
  'BNB': 4,
  'SOL': 5,
  'USDC': 6,
  'XRP': 7,
  'DOGE': 8,
  'ADA': 9,
  'TRX': 10,
  
  // 11-30
  'AVAX': 11,
  'SHIB': 12,
  'TON': 13,
  'LINK': 14,
  'DOT': 15,
  'MATIC': 16,
  'DAI': 17,
  'LTC': 18,
  'BCH': 19,
  'UNI': 20,
  'ATOM': 21,
  'XLM': 22,
  'XMR': 23,
  'OKB': 24,
  'ICP': 25,
  'ETC': 26,
  'FIL': 27,
  'HBAR': 28,
  'APT': 29,
  'VET': 30,
  
  // 31-60
  'NEAR': 31,
  'ARB': 32,
  'OP': 33,
  'INJ': 34,
  'STX': 35,
  'IMX': 36,
  'RUNE': 37,
  'GRT': 38,
  'ALGO': 39,
  'MKR': 40,
  'AAVE': 41,
  'SNX': 42,
  'SAND': 43,
  'MANA': 44,
  'AXS': 45,
  'EGLD': 46,
  'XTZ': 47,
  'THETA': 48,
  'FTM': 49,
  'EOS': 50,
  'KAVA': 51,
  'FLOW': 52,
  'CHZ': 53,
  'ZEC': 54,
  'DASH': 55,
  'NEO': 56,
  'IOTA': 57,
  'MINA': 58,
  'QNT': 59,
  'CRV': 60,
  
  // 61-100
  'COMP': 61,
  'YFI': 62,
  'SUSHI': 63,
  'ZIL': 64,
  'ENJ': 65,
  'BAT': 66,
  'LRC': 67,
  'ONE': 68,
  'CELO': 69,
  'QTUM': 70,
  'ZRX': 71,
  'RVN': 72,
  'WAVES': 73,
  'ICX': 74,
  'OMG': 75,
  'SC': 76,
  'ZEN': 77,
  'ANKR': 78,
  'BNT': 79,
  'KLAY': 80,
  'PEPE': 81,
  'SEI': 82,
  'TIA': 83,
  'SUI': 84,
  'FET': 85,
  'BONK': 86,
  'WIF': 87,
  'FLOKI': 88,
  'GALA': 89,
  'ROSE': 90,
  'WLD': 91,
  'BLUR': 92,
  'RNDR': 93,
  'JUP': 94,
  'ORDI': 95,
  'BEAM': 96,
  'PYTH': 97,
  'STRK': 98,
  'DYM': 99,
  'MEME': 100,
  
  // Additional tokens (beyond top 100)
  'ZETA': 150,
  'RAVE': 200,
  'TAI': 250,
  'AT': 300,
  'ASTER': 350,
  'FARTCOIN': 400,
  'SONIC': 450,
  'ORDER': 500,
  'ARIA': 550,
  'BLUR1': 600,
};

// ============================================================================
// API INTEGRATION
// ============================================================================

/**
 * Exchange mapping from Loris API to our exchange names
 */
const EXCHANGE_MAP: Record<string, string> = {
  'binance': 'Binance',
  'bybit': 'Bybit',
  'okx': 'OKX',
  'hyperliquid': 'Hyperliquid',
  'bitget': 'Bitget',
  'paradex': 'Paradex',
  'aster': 'Aster',
  'pacifica': 'Pacifica',
  'drift': 'Drift',
  'lighter': 'Lighter',
  // Note: Extended is not in Loris API (might be a custom exchange in your app)
};

/**
 * Fetch funding rates from Loris API via backend proxy
 */
/**
 * Fetch funding rates from backend (Tread proxy)
 */
async function fetchFundingRatesFromBackend(): Promise<TokenFundingRates[]> {
  try {
    const response = await fetch('/api/v1/funding/rates', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`❌ Funding rates API error: ${response.status}`);
      return [];
    }

    const payload = await response.json();
    const data = Array.isArray(payload?.data) ? payload.data : payload;

    if (!Array.isArray(data)) {
      console.warn('⚠️ Funding rates API returned unexpected format:', payload);
      return [];
    }

    const tokenMap = new Map<string, TokenFundingRates>();

    data.forEach((item: any) => {
      const token = item.token || item.symbol;
      if (!token) return;

      if (!tokenMap.has(token)) {
        tokenMap.set(token, {
          token,
          rates: {},
          normalizedRates: {},
          lastUpdated: Date.now(),
        });
      }

      const tokenData = tokenMap.get(token)!;
      const exchanges = item.exchanges || {};

      Object.entries(exchanges).forEach(([exchangeId, details]) => {
        if (!details) return;
        const exchangeKey = exchangeId.toLowerCase();
        const exchangeName = EXCHANGE_MAP[exchangeKey] || exchangeId;
        const rate = (details as any).rateAnnualized ?? (details as any).rate ?? null;
        tokenData.rates[exchangeName] = rate;
      });
    });

    return Array.from(tokenMap.values());
  } catch (error) {
    console.error('❌ Error fetching funding rates:', error);
    return [];
  }
}

// ============================================================================
// TYPES
// ============================================================================

/**
 * Funding rate for a specific token on a specific exchange
 */
export interface FundingRate {
  token: string;
  exchange: string;
  rate: number; // Annual percentage rate
  rawRate: number; // Raw rate from API (in bps)
  interval: '1hr' | '8hr'; // Funding interval
  timestamp: number;
}

/**
 * Normalized funding rates for display
 */
export interface NormalizedFundingRates {
  raw: number; // Raw rate in bps (basis points)
  oneHour: number; // 1hr rate in bps
  eightHour: number; // 8hr rate in bps
  daily: number; // Daily rate in bps
  yearly: number; // Yearly APY as percentage
}

/**
 * Aggregated funding rate data for a token across all exchanges
 */
export interface TokenFundingRates {
  token: string;
  rates: Record<string, number | null>; // exchange -> rate (null if not available)
  normalizedRates: Record<string, NormalizedFundingRates | null>; // exchange -> normalized rates
  lastUpdated: number;
}

/**
 * Funding rates state shape
 */
interface FundingRatesState {
  /** Funding rates organized by token -> exchange -> rate */
  rates: Record<string, Record<string, number | null>>;
  /** Last updated timestamp for each token */
  lastUpdated: Record<string, number>;
  /** Historical funding rate data (limited to recent data) */
  rateHistory: FundingRate[];
}

/**
 * Funding rates actions
 */
interface FundingRatesActions {
  /** Update funding rate for a specific token and exchange */
  updateRate: (token: string, exchange: string, rate: number | null) => void;
  /** Batch update all funding rates */
  updateAllRates: (data: TokenFundingRates[]) => void;
  /** Get funding rate for a specific token and exchange */
  getRate: (token: string, exchange: string) => number | null;
  /** Get all rates for a specific token */
  getTokenRates: (token: string) => Record<string, number | null>;
  /** Calculate spread between two exchanges for a token */
  getSpread: (token: string, exchange1: string, exchange2: string) => number | null;
  /** Get market cap rank for a token (lower = higher market cap) */
  getMarketCapRank: (token: string) => number;
  /** Clear all rates (on reset) */
  clearRates: () => void;
  /** Fetch latest funding rates from Loris API */
  fetchLiveFundingRates: () => Promise<void>;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

/**
 * Initial funding rate data - will be replaced with real data from backend
 * These are the mock values from ExplorePage
 */
const INITIAL_FUNDING_DATA: TokenFundingRates[] = [
  { token: 'ZETA', rates: { Binance: -33.101, Bybit: 10.95, OKX: -41.716, Hyperliquid: -4.337, Bitget: 10.95 }, lastUpdated: Date.now() },
  { token: 'RAVE', rates: { Binance: 40.983, Bybit: 10.95, OKX: 41.02, Bitget: 100.331 }, lastUpdated: Date.now() },
  { token: 'TAI', rates: { Bybit: 10.95 }, lastUpdated: Date.now() },
  { token: 'AT', rates: { Binance: 10.95, Bybit: 10.95, OKX: 10.95, Bitget: 10.95 }, lastUpdated: Date.now() },
  { token: 'ASTER', rates: { Binance: 10.95, Bybit: 10.95, OKX: 10.95, Hyperliquid: 10.95, Bitget: 10.95, Paradex: -1.34 }, lastUpdated: Date.now() },
  { token: 'FARTCOIN', rates: { Binance: -3.832, Bybit: 10.95, OKX: 10.95, Hyperliquid: 10.95, Bitget: 10.95, Paradex: -15.702 }, lastUpdated: Date.now() },
  { token: 'SONIC', rates: { Bybit: 10.95, OKX: 0, Bitget: -17.12 }, lastUpdated: Date.now() },
  { token: 'ORDER', rates: { Binance: 10.95, Bybit: 10.95, OKX: 10.95, Bitget: 10.95 }, lastUpdated: Date.now() },
  { token: 'ARIA', rates: { Binance: 97.576, Bybit: 10.95, Bitget: 175.431 }, lastUpdated: Date.now() },
  { token: 'BLUR1', rates: { Binance: 10.95, Bybit: 10.95, OKX: 22.293, Bitget: 10.95 }, lastUpdated: Date.now() },
  { token: 'ETH', rates: { Binance: 5.234, Bybit: 5.12, OKX: 5.456, Hyperliquid: 5.789, Bitget: 5.234, Paradex: 5.234 }, lastUpdated: Date.now() },
  { token: 'BTC', rates: { Binance: 3.456, Bybit: 3.234, OKX: 3.567, Hyperliquid: 3.789, Bitget: 3.456, Paradex: 3.456 }, lastUpdated: Date.now() },
  { token: 'SOL', rates: { Binance: 12.345, Bybit: 11.234, OKX: 13.456, Hyperliquid: 12.567, Bitget: 11.789, Paradex: 12.345 }, lastUpdated: Date.now() },
  { token: 'AVAX', rates: { Binance: 8.234, Bybit: 7.567, OKX: 9.123, Hyperliquid: 8.456, Bitget: 7.789, Paradex: 8.123 }, lastUpdated: Date.now() },
  { token: 'MATIC', rates: { Binance: -2.345, Bybit: -1.234, OKX: -3.456, Hyperliquid: -2.567, Bitget: -1.789, Paradex: -2.345 }, lastUpdated: Date.now() },
  { token: 'LINK', rates: { Binance: 15.234, Bybit: 14.567, OKX: 16.123, Hyperliquid: 15.456, Bitget: 14.789 }, lastUpdated: Date.now() },
  { token: 'UNI', rates: { Binance: 6.789, Bybit: 6.234, OKX: 7.456, Hyperliquid: 6.567, Bitget: 6.123, Paradex: 6.456 }, lastUpdated: Date.now() },
  { token: 'AAVE', rates: { Binance: 9.456, Bybit: 8.789, OKX: 10.234, Hyperliquid: 9.567, Bitget: 8.123, Paradex: 9.234 }, lastUpdated: Date.now() },
  { token: 'CRV', rates: { Binance: -5.678, Bybit: -4.567, OKX: -6.789, Hyperliquid: -5.123, Bitget: -4.234 }, lastUpdated: Date.now() },
  { token: 'SUSHI', rates: { Binance: 4.123, Bybit: 3.456, OKX: 5.234, Hyperliquid: 4.567, Bitget: 3.789, Paradex: 4.234 }, lastUpdated: Date.now() },
  { token: 'COMP', rates: { Binance: 11.567, Bybit: 10.234, OKX: 12.789, Hyperliquid: 11.123, Bitget: 10.456, Paradex: 11.789 }, lastUpdated: Date.now() },
  { token: 'MKR', rates: { Binance: 7.234, Bybit: 6.567, OKX: 8.123, Hyperliquid: 7.456, Bitget: 6.789, Paradex: 7.123 }, lastUpdated: Date.now() },
  { token: 'SNX', rates: { Binance: 13.789, Bybit: 12.456, OKX: 14.234, Hyperliquid: 13.567, Bitget: 12.123 }, lastUpdated: Date.now() },
  { token: 'YFI', rates: { Binance: -8.456, Bybit: -7.234, OKX: -9.567, Hyperliquid: -8.123, Bitget: -7.789, Paradex: -8.567 }, lastUpdated: Date.now() },
  { token: 'DOGE', rates: { Binance: 2.345, Bybit: 1.789, OKX: 3.123, Hyperliquid: 2.567, Bitget: 1.234, Paradex: 2.123 }, lastUpdated: Date.now() },
  { token: 'SHIB', rates: { Binance: 18.234, Bybit: 17.567, OKX: 19.123, Hyperliquid: 18.456, Bitget: 17.789, Paradex: 18.123 }, lastUpdated: Date.now() },
  { token: 'PEPE', rates: { Binance: 25.678, Bybit: 24.234, OKX: 26.789, Hyperliquid: 25.123, Bitget: 24.567, Paradex: 25.456 }, lastUpdated: Date.now() },
  { token: 'ARB', rates: { Binance: 14.567, Bybit: 13.234, OKX: 15.789, Hyperliquid: 14.123, Bitget: 13.456, Paradex: 14.789 }, lastUpdated: Date.now() },
  { token: 'OP', rates: { Binance: 16.234, Bybit: 15.567, OKX: 17.123, Hyperliquid: 16.456, Bitget: 15.789, Paradex: 16.123 }, lastUpdated: Date.now() },
  { token: 'APT', rates: { Binance: -12.345, Bybit: -11.234, OKX: -13.456, Hyperliquid: -12.567, Bitget: -11.789 }, lastUpdated: Date.now() },
  { token: 'SUI', rates: { Binance: 21.234, Bybit: 20.567, OKX: 22.123, Hyperliquid: 21.456, Bitget: 20.789, Paradex: 21.123 }, lastUpdated: Date.now() },
  { token: 'INJ', rates: { Binance: 19.567, Bybit: 18.234, OKX: 20.789, Hyperliquid: 19.123, Bitget: 18.456, Paradex: 19.789 }, lastUpdated: Date.now() },
  { token: 'TIA', rates: { Binance: 8.789, Bybit: 7.456, OKX: 9.234, Hyperliquid: 8.567, Bitget: 7.123, Paradex: 8.234 }, lastUpdated: Date.now() },
  { token: 'SEI', rates: { Binance: 27.456, Bybit: 26.123, OKX: 28.567, Hyperliquid: 27.234, Bitget: 26.789, Paradex: 27.567 }, lastUpdated: Date.now() },
  { token: 'FTM', rates: { Binance: -15.234, Bybit: -14.567, OKX: -16.123, Hyperliquid: -15.456, Bitget: -14.789 }, lastUpdated: Date.now() },
  { token: 'ATOM', rates: { Binance: 10.123, Bybit: 9.456, OKX: 11.234, Hyperliquid: 10.567, Bitget: 9.789, Paradex: 10.234 }, lastUpdated: Date.now() },
  { token: 'DOT', rates: { Binance: 6.456, Bybit: 5.789, OKX: 7.123, Hyperliquid: 6.234, Bitget: 5.456, Paradex: 6.123 }, lastUpdated: Date.now() },
  { token: 'ADA', rates: { Binance: 4.567, Bybit: 3.234, OKX: 5.789, Hyperliquid: 4.123, Bitget: 3.456, Paradex: 4.789 }, lastUpdated: Date.now() },
  { token: 'XRP', rates: { Binance: 1.234, Bybit: 0.567, OKX: 2.123, Hyperliquid: 1.456, Bitget: 0.789, Paradex: 1.123 }, lastUpdated: Date.now() },
  { token: 'LTC', rates: { Binance: 3.789, Bybit: 2.456, OKX: 4.234, Hyperliquid: 3.567, Bitget: 2.123, Paradex: 3.234 }, lastUpdated: Date.now() },
];

const buildInitialRates = () => {
  const rates: Record<string, Record<string, number | null>> = {};
  const lastUpdated: Record<string, number> = {};

  INITIAL_FUNDING_DATA.forEach((tokenData) => {
    rates[tokenData.token] = tokenData.rates;
    lastUpdated[tokenData.token] = tokenData.lastUpdated;
  });

  return { rates, lastUpdated };
};

const { rates: initialRates, lastUpdated: initialLastUpdated } = buildInitialRates();

const initialState: FundingRatesState = {
  rates: initialRates,
  lastUpdated: initialLastUpdated,
  rateHistory: [],
};

// ============================================================================
// STORE
// ============================================================================

/**
 * Funding Rates Store
 * 
 * Manages funding rate data across all exchanges and tokens.
 * Provides rate lookups and spread calculations for arbitrage.
 */
export const useFundingRatesStore = create<FundingRatesState & FundingRatesActions>()(
  devtools(
    (set, get) => ({
      // Initial state
      ...initialState,

      // Actions
      updateRate: (token: string, exchange: string, rate: number | null) =>
        set(
          (state) => {
            const timestamp = Date.now();
            
            return {
              rates: {
                ...state.rates,
                [token]: {
                  ...(state.rates[token] || {}),
                  [exchange]: rate,
                },
              },
              lastUpdated: {
                ...state.lastUpdated,
                [token]: timestamp,
              },
              rateHistory: rate !== null ? [
                ...state.rateHistory.slice(-999),
                { token, exchange, rate, timestamp },
              ] : state.rateHistory,
            };
          },
          false,
          'fundingRates/updateRate'
        ),

      updateAllRates: (data: TokenFundingRates[]) =>
        set(
          (state) => {
            const newRates: Record<string, Record<string, number | null>> = { ...state.rates };
            const newLastUpdated: Record<string, number> = { ...state.lastUpdated };
            const newRateHistory: FundingRate[] = [...state.rateHistory];
            
            data.forEach((tokenData) => {
              newRates[tokenData.token] = tokenData.rates;
              newLastUpdated[tokenData.token] = tokenData.lastUpdated;
              
              // Add to history
              Object.entries(tokenData.rates).forEach(([exchange, rate]) => {
                if (rate !== null) {
                  newRateHistory.push({
                    token: tokenData.token,
                    exchange,
                    rate,
                    timestamp: tokenData.lastUpdated,
                  });
                }
              });
            });
            
            return {
              rates: newRates,
              lastUpdated: newLastUpdated,
              rateHistory: newRateHistory.slice(-1000), // Keep last 1000 points
            };
          },
          false,
          'fundingRates/updateAllRates'
        ),

      getRate: (token: string, exchange: string) => {
        const state = get();
        return state.rates[token]?.[exchange] ?? null;
      },

      getTokenRates: (token: string) => {
        const state = get();
        return state.rates[token] || {};
      },

      getSpread: (token: string, exchange1: string, exchange2: string) => {
        const state = get();
        const rate1 = state.rates[token]?.[exchange1];
        const rate2 = state.rates[token]?.[exchange2];
        
        if (rate1 === null || rate1 === undefined || rate2 === null || rate2 === undefined) {
          return null;
        }
        
        return Math.abs(rate1 - rate2);
      },

      getMarketCapRank: (token: string) => {
        return MARKET_CAP_RANKS[token] || 1000; // Default to a high rank if not found
      },

      clearRates: () =>
        set(
          () => ({
            rates: {},
            lastUpdated: {},
            rateHistory: [],
          }),
          false,
          'fundingRates/clearRates'
        ),

      fetchLiveFundingRates: async () => {
        console.log('🔄 Fetching live funding rates from Tread API...');
        const data = await fetchFundingRatesFromBackend();
        
        if (data.length > 0) {
          console.log(`✓ Received ${data.length} tokens from Tread API, updating store...`);
          // Update rates directly without clearing first to avoid flickering to mock data
          get().updateAllRates(data);
          console.log(`✓ Store updated successfully`);
        } else {
          console.warn('⚠ No funding rate data received from Tread API');
        }
      },
    }),
    { name: 'FundingRatesStore' }
  )
);

export default useFundingRatesStore;
