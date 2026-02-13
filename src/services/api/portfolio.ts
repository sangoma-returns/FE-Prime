/**
 * Portfolio API Service
 * 
 * All API calls related to portfolio data, balances, and statistics.
 * 
 * API Endpoints:
 * - GET  /api/v1/portfolio/summary - Portfolio summary stats
 * - GET  /api/v1/portfolio/exchanges - Exchange balances
 * - GET  /api/v1/portfolio/positions - Open positions
 * - GET  /api/v1/portfolio/pnl - Profit & Loss data
 */

import { get, post } from './client';
import type { PortfolioSummary, ExchangeBalance, Position } from '../../types';

// ============================================================================
// PORTFOLIO SUMMARY
// ============================================================================

/**
 * Get portfolio summary including total equity, PnL, and directional bias
 * 
 * @returns Portfolio summary data
 * @throws ApiError if request fails
 * 
 * Example:
 * ```ts
 * const summary = await getPortfolioSummary();
 * console.log(summary.totalEquity); // 126.96
 * ```
 */
export async function getPortfolioSummary(): Promise<PortfolioSummary> {
  return get<PortfolioSummary>('/api/v1/portfolio/summary');
}

export async function depositPortfolio(amountUsd: number): Promise<{ ok: boolean; cashUsd: number }> {
  return post<{ ok: boolean; cashUsd: number }>('/api/v1/portfolio/deposit', { amountUsd });
}

export async function resetPortfolio(): Promise<{ ok: boolean }> {
  return post<{ ok: boolean }>('/api/v1/portfolio/reset');
}

// ============================================================================
// EXCHANGE BALANCES
// ============================================================================

/**
 * Get balances across all connected exchanges
 * 
 * @returns Array of exchange balances
 * @throws ApiError if request fails
 * 
 * Example:
 * ```ts
 * const balances = await getExchangeBalances();
 * balances.forEach(b => console.log(`${b.exchangeName}: $${b.balance}`));
 * ```
 */
export async function getExchangeBalances(): Promise<ExchangeBalance[]> {
  return get<ExchangeBalance[]>('/api/v1/portfolio/exchanges');
}

/**
 * Get balance for a specific exchange
 * 
 * @param exchangeId - Exchange ID (e.g., 'hyperliquid', 'binance')
 * @returns Exchange balance data
 * @throws ApiError if request fails
 */
export async function getExchangeBalance(exchangeId: string): Promise<ExchangeBalance> {
  return get<ExchangeBalance>(`/api/v1/portfolio/exchanges/${exchangeId}`);
}

// ============================================================================
// POSITIONS
// ============================================================================

/**
 * Get all open positions across exchanges
 * 
 * @returns Array of open positions
 * @throws ApiError if request fails
 * 
 * Example:
 * ```ts
 * const positions = await getPositions();
 * positions.forEach(p => {
 *   console.log(`${p.pair} ${p.side}: ${p.unrealizedPnL}`);
 * });
 * ```
 */
export async function getPositions(): Promise<Position[]> {
  return get<Position[]>('/api/v1/portfolio/positions');
}

/**
 * Get positions for a specific exchange
 * 
 * @param exchangeId - Exchange ID
 * @returns Array of positions on that exchange
 * @throws ApiError if request fails
 */
export async function getExchangePositions(exchangeId: string): Promise<Position[]> {
  return get<Position[]>(`/api/v1/portfolio/positions/${exchangeId}`);
}

/**
 * Get a specific position by ID
 * 
 * @param positionId - Position ID
 * @returns Position data
 * @throws ApiError if request fails
 */
export async function getPosition(positionId: string): Promise<Position> {
  return get<Position>(`/api/v1/portfolio/positions/${positionId}`);
}

// ============================================================================
// PROFIT & LOSS
// ============================================================================

export interface PnLData {
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  realizedPnL: number;
  realizedPnLPercent: number;
  totalPnL: number;
  totalPnLPercent: number;
}

/**
 * Get current profit and loss data
 * 
 * @returns PnL data
 * @throws ApiError if request fails
 */
export async function getPnL(): Promise<PnLData> {
  return get<PnLData>('/api/v1/portfolio/pnl');
}

/**
 * Get historical PnL data
 * 
 * @param startDate - Start date (ISO string)
 * @param endDate - End date (ISO string)
 * @returns Historical PnL data points
 * @throws ApiError if request fails
 */
export async function getHistoricalPnL(
  startDate: string,
  endDate: string
): Promise<Array<{ date: string; pnl: number }>> {
  return get(`/api/v1/portfolio/pnl/history`, {
    params: { startDate, endDate },
  });
}

// ============================================================================
// VOLUME & STATISTICS
// ============================================================================

export interface VolumeData {
  period: string;
  volume: number;
  trades: number;
  avgTradeSize: number;
}

/**
 * Get trading volume for specified period
 * 
 * @param period - Time period ('1d', '7d', '14d', '30d')
 * @returns Volume statistics
 * @throws ApiError if request fails
 */
export async function getVolume(period: '1d' | '7d' | '14d' | '30d' = '14d'): Promise<VolumeData> {
  return get<VolumeData>(`/api/v1/portfolio/volume`, {
    params: { period },
  });
}

// ============================================================================
// EXCHANGE DISTRIBUTION
// ============================================================================

export interface ExchangeDistribution {
  exchangeId: string;
  exchangeName: string;
  percentage: number;
  value: number;
}

/**
 * Get portfolio distribution across exchanges
 * 
 * @returns Array of exchange distributions
 * @throws ApiError if request fails
 */
export async function getExchangeDistribution(): Promise<ExchangeDistribution[]> {
  return get<ExchangeDistribution[]>('/api/v1/portfolio/distribution');
}
