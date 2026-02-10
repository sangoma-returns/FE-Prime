/**
 * Funding Rate Arbitrage Calculations
 * 
 * Implements the funding rate arbitrage returns algorithm for calculating
 * potential returns over time based on funding rate differentials.
 */

export interface FundingRateSnapshot {
  timestamp: number;
  buyRate: number;  // APR (e.g., 5.5 for 5.5%)
  sellRate: number; // APR (e.g., 10.95 for 10.95%)
}

export interface ArbitrageInputs {
  // Capital allocation
  buyCapital: number;   // C_buy: margin posted for buy leg
  sellCapital: number;  // C_sell: margin posted for sell leg
  
  // Leverage
  buyLeverage: number;  // L_buy: leverage on buy leg
  sellLeverage: number; // L_sell: leverage on sell leg
  
  // Fees (as fraction of notional)
  entryFee?: number;    // f_entry: one-time entry fee
  exitFee?: number;     // f_exit: one-time exit fee
  
  // Historical funding rates
  fundingRates: FundingRateSnapshot[];
}

export interface ReturnDataPoint {
  timestamp: number;
  
  // Rates
  buyRate: number;
  sellRate: number;
  netRate: number;
  
  // Notionals
  buyNotional: number;
  sellNotional: number;
  
  // PnL components
  intervalFundingPnl: number;
  cumulativePnl: number;
  equity: number;
  
  // Returns
  cumulativeReturn: number; // as percentage
  intervalReturn: number;    // as percentage
}

/**
 * Calculate potential returns over time for a funding rate arbitrage position
 * 
 * Algorithm:
 * 1. Buy leg = long position that pays funding (r_buy)
 * 2. Sell leg = short position that receives funding (r_sell)
 * 3. Net funding PnL per interval = (N_sell * r_sell) - (N_buy * r_buy)
 * 4. Cumulative return = cumulative PnL / total capital
 * 
 * @param inputs - Arbitrage position parameters
 * @returns Array of return data points over time
 */
export function calculateFundingReturns(inputs: ArbitrageInputs): ReturnDataPoint[] {
  const {
    buyCapital,
    sellCapital,
    buyLeverage,
    sellLeverage,
    entryFee = 0.0005, // 5 bps default
    exitFee = 0.0005,  // 5 bps default
    fundingRates,
  } = inputs;
  
  // Total capital
  const C0 = buyCapital + sellCapital;
  
  // Base notionals (constant in this implementation - Policy 1)
  const N_buy = buyCapital * buyLeverage;
  const N_sell = sellCapital * sellLeverage;
  
  // Entry cost (one-time, at start)
  const entryCost = (N_buy + N_sell) * entryFee;
  
  // Initialize
  let cumPnL = -entryCost;
  const results: ReturnDataPoint[] = [];
  
  // Funding interval in hours (most exchanges: 8 hours)
  const FUNDING_INTERVAL_HOURS = 8;
  
  // Process each funding rate snapshot
  for (let i = 0; i < fundingRates.length; i++) {
    const snapshot = fundingRates[i];
    
    // Convert APR rates to per-interval rates
    // APR is annualized, need to convert to 8-hour rate
    // rate_per_interval = (APR / 100) / (365 * 24 / 8)
    const intervalsPerYear = (365 * 24) / FUNDING_INTERVAL_HOURS;
    const buyRatePerInterval = (snapshot.buyRate / 100) / intervalsPerYear;
    const sellRatePerInterval = (snapshot.sellRate / 100) / intervalsPerYear;
    
    // Funding PnL for this interval
    // Buy leg pays (negative), sell leg receives (positive)
    const fundingPnL = (N_sell * sellRatePerInterval) - (N_buy * buyRatePerInterval);
    
    // Update cumulative PnL
    cumPnL += fundingPnL;
    
    // Calculate equity
    const equity = C0 + cumPnL;
    
    // Calculate returns (as percentages)
    const cumulativeReturn = (cumPnL / C0) * 100;
    const intervalReturn = (fundingPnL / C0) * 100;
    
    // Net rate on capital
    const netRate = ((N_sell * sellRatePerInterval - N_buy * buyRatePerInterval) / C0) * 100;
    
    results.push({
      timestamp: snapshot.timestamp,
      buyRate: snapshot.buyRate,
      sellRate: snapshot.sellRate,
      netRate,
      buyNotional: N_buy,
      sellNotional: N_sell,
      intervalFundingPnl: fundingPnL,
      cumulativePnl: cumPnL,
      equity,
      cumulativeReturn,
      intervalReturn,
    });
  }
  
  // Note: Exit cost would be applied when position is closed
  // For a "potential returns" chart, we don't apply it to the ongoing curve
  
  return results;
}

/**
 * Generate simulated historical funding rates for demo/testing
 * Creates realistic funding rate data over a time period
 */
export function generateSimulatedFundingRates(
  buyExchange: string,
  sellExchange: string,
  token: string,
  durationHours: number = 24,
  currentBuyRate: number = 5.5,
  currentSellRate: number = 10.95
): FundingRateSnapshot[] {
  const FUNDING_INTERVAL_HOURS = 8;
  const numSnapshots = Math.floor(durationHours / FUNDING_INTERVAL_HOURS);
  const snapshots: FundingRateSnapshot[] = [];
  
  const now = Date.now();
  
  for (let i = 0; i < numSnapshots; i++) {
    // Go backwards in time
    const timestamp = now - (numSnapshots - i - 1) * FUNDING_INTERVAL_HOURS * 60 * 60 * 1000;
    
    // Add some realistic variation to rates (±15%)
    const buyVariation = (Math.random() - 0.5) * 0.3 * currentBuyRate;
    const sellVariation = (Math.random() - 0.5) * 0.3 * currentSellRate;
    
    snapshots.push({
      timestamp,
      buyRate: Math.max(0, currentBuyRate + buyVariation),
      sellRate: Math.max(0, currentSellRate + sellVariation),
    });
  }
  
  return snapshots;
}

/**
 * Format funding rate for display
 */
export function formatFundingRate(rate: number): string {
  return rate >= 0 ? `+${rate.toFixed(4)}%` : `${rate.toFixed(4)}%`;
}

/**
 * Format PnL for display
 */
export function formatPnL(pnl: number): string {
  const sign = pnl >= 0 ? '+' : '';
  return `${sign}$${pnl.toFixed(2)}`;
}

/**
 * Format return percentage for display
 */
export function formatReturn(returnPct: number): string {
  const sign = returnPct >= 0 ? '+' : '';
  return `${sign}${returnPct.toFixed(2)}%`;
}
