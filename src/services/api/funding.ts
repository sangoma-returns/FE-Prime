/**
 * Funding Rates API Service
 * 
 * All API calls related to funding rates across exchanges.
 * Funding rates are the periodic payments between long and short positions
 * in perpetual futures contracts.
 * 
 * API Endpoints:
 * - GET  /api/v1/funding/rates - Get current funding rates
 * - GET  /api/v1/funding/history - Get historical funding rates
 * - GET  /api/v1/funding/search - Search tokens by name/symbol
 */

import { get } from './client';
import type { FundingRate, FundingRateHistorical } from '../../types';

// ============================================================================
// CURRENT FUNDING RATES
// ============================================================================

/**
 * Get current funding rates for all tokens across all exchanges
 * 
 * @param timeframe - Time period for annualized calculation ('day', 'week', 'month', 'year')
 * @returns Array of funding rates for all tokens
 * @throws ApiError if request fails
 * 
 * Example:
 * ```ts
 * const rates = await getFundingRates('day');
 * rates.forEach(rate => {
 *   console.log(`${rate.token}: ${rate.exchanges.binance?.rate}%`);
 * });
 * ```
 */
export async function getFundingRates(
  timeframe: 'day' | 'week' | 'month' | 'year' = 'day'
): Promise<FundingRate[]> {
  return get<FundingRate[]>('/api/v1/funding/rates', {
    params: { timeframe },
  });
}

/**
 * Get funding rate for a specific token across all exchanges
 * 
 * @param token - Token symbol (e.g., 'BTC', 'ETH')
 * @param timeframe - Time period for calculation
 * @returns Funding rate data for the token
 * @throws ApiError if request fails
 */
export async function getTokenFundingRate(
  token: string,
  timeframe: 'day' | 'week' | 'month' | 'year' = 'day'
): Promise<FundingRate> {
  return get<FundingRate>(`/api/v1/funding/rates/${token}`, {
    params: { timeframe },
  });
}

/**
 * Get funding rate for a specific token on a specific exchange
 * 
 * @param token - Token symbol
 * @param exchange - Exchange ID (e.g., 'binance', 'hyperliquid')
 * @returns Funding rate data for the specific exchange
 * @throws ApiError if request fails
 */
export async function getExchangeFundingRate(
  token: string,
  exchange: string
): Promise<number> {
  return get<number>(`/api/v1/funding/rates/${token}/${exchange}`);
}

// ============================================================================
// HISTORICAL FUNDING RATES
// ============================================================================

/**
 * Get historical funding rates for a token
 * 
 * @param token - Token symbol
 * @param exchange - Exchange ID (optional, returns all if not specified)
 * @param startDate - Start date (ISO string)
 * @param endDate - End date (ISO string)
 * @returns Array of historical funding rate data points
 * @throws ApiError if request fails
 * 
 * Example:
 * ```ts
 * const history = await getFundingRateHistory(
 *   'BTC',
 *   'binance',
 *   '2026-01-01T00:00:00Z',
 *   '2026-01-10T00:00:00Z'
 * );
 * ```
 */
export async function getFundingRateHistory(
  token: string,
  exchange?: string,
  startDate?: string,
  endDate?: string
): Promise<FundingRateHistorical[]> {
  return get<FundingRateHistorical[]>('/api/v1/funding/history', {
    params: {
      token,
      exchange,
      startDate,
      endDate,
    },
  });
}

// ============================================================================
// SEARCH & FILTER
// ============================================================================

/**
 * Search for tokens by name or symbol
 * 
 * @param query - Search query (token name or symbol)
 * @returns Array of matching funding rates
 * @throws ApiError if request fails
 * 
 * Example:
 * ```ts
 * const results = await searchTokens('BTC');
 * // Returns all Bitcoin-related tokens (BTC, WBTC, etc.)
 * ```
 */
export async function searchTokens(query: string): Promise<FundingRate[]> {
  return get<FundingRate[]>('/api/v1/funding/search', {
    params: { q: query },
  });
}

// ============================================================================
// WATCHLIST
// ============================================================================

/**
 * Get user's watchlist tokens
 * 
 * @returns Array of watchlisted tokens with their funding rates
 * @throws ApiError if request fails
 */
export async function getWatchlist(): Promise<FundingRate[]> {
  return get<FundingRate[]>('/api/v1/user/watchlist');
}

/**
 * Add a token to user's watchlist
 * 
 * @param token - Token symbol to add
 * @returns Updated watchlist
 * @throws ApiError if request fails
 */
export async function addToWatchlist(token: string): Promise<FundingRate[]> {
  return get<FundingRate[]>(`/api/v1/user/watchlist/${token}`, {
    method: 'POST',
  });
}

/**
 * Remove a token from user's watchlist
 * 
 * @param token - Token symbol to remove
 * @returns Updated watchlist
 * @throws ApiError if request fails
 */
export async function removeFromWatchlist(token: string): Promise<void> {
  return get<void>(`/api/v1/user/watchlist/${token}`, {
    method: 'DELETE',
  });
}
