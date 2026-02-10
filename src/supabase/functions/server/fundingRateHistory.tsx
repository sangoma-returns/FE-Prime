/**
 * Funding Rate History Storage Utility
 * Manages rolling 7-day historical funding rate data in KV store
 */

import * as kv from './kv_store.tsx';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const FUNDING_INTERVAL_MS = 8 * 60 * 60 * 1000; // 8 hours

export interface FundingRateSnapshot {
  timestamp: number;
  rate: number;
  token: string;
  exchange: string;
}

/**
 * Store a funding rate snapshot for a token/exchange pair
 * Automatically prunes data older than 7 days
 */
export async function storeFundingRate(
  token: string,
  exchange: string,
  rate: number,
  timestamp: number = Date.now()
): Promise<void> {
  const key = `funding_history:${exchange.toLowerCase()}:${token.toLowerCase()}`;
  
  // Get existing history
  const existingData = await kv.get(key);
  const history: FundingRateSnapshot[] = existingData ? JSON.parse(existingData) : [];
  
  // Add new snapshot
  history.push({
    timestamp,
    rate,
    token,
    exchange,
  });
  
  // Remove data older than 7 days
  const cutoffTime = Date.now() - SEVEN_DAYS_MS;
  const prunedHistory = history.filter(snapshot => snapshot.timestamp >= cutoffTime);
  
  // Sort by timestamp (oldest to newest)
  prunedHistory.sort((a, b) => a.timestamp - b.timestamp);
  
  // Store back to KV
  await kv.set(key, JSON.stringify(prunedHistory));
  
  console.log(`✓ Stored funding rate for ${token} on ${exchange}: ${rate.toFixed(4)}% (${prunedHistory.length} snapshots in history)`);
}

/**
 * Get historical funding rates for a token/exchange pair
 * Returns up to 7 days of data
 */
export async function getFundingHistory(
  token: string,
  exchange: string
): Promise<FundingRateSnapshot[]> {
  const key = `funding_history:${exchange.toLowerCase()}:${token.toLowerCase()}`;
  
  const data = await kv.get(key);
  if (!data) return [];
  
  const history: FundingRateSnapshot[] = JSON.parse(data);
  
  // Double-check that data is within 7 days (in case cleanup didn't run)
  const cutoffTime = Date.now() - SEVEN_DAYS_MS;
  return history.filter(snapshot => snapshot.timestamp >= cutoffTime);
}

/**
 * Get historical funding rates for multiple exchanges at once
 * Returns a map of exchange -> snapshots
 */
export async function getFundingHistoryBulk(
  token: string,
  exchanges: string[]
): Promise<Record<string, FundingRateSnapshot[]>> {
  const results: Record<string, FundingRateSnapshot[]> = {};
  
  for (const exchange of exchanges) {
    results[exchange] = await getFundingHistory(token, exchange);
  }
  
  return results;
}

/**
 * Get the most recent funding rate for a token/exchange pair
 */
export async function getLatestFundingRate(
  token: string,
  exchange: string
): Promise<number | null> {
  const history = await getFundingHistory(token, exchange);
  if (history.length === 0) return null;
  
  // Return the most recent rate
  return history[history.length - 1].rate;
}

/**
 * Prune all funding rate history older than 7 days
 * Should be called periodically to cleanup old data
 */
export async function pruneOldFundingRates(): Promise<void> {
  console.log('Starting funding rate history cleanup...');
  
  // Get all funding history keys
  const allKeys = await kv.getByPrefix('funding_history:');
  const cutoffTime = Date.now() - SEVEN_DAYS_MS;
  
  let prunedCount = 0;
  
  for (const item of allKeys) {
    const history: FundingRateSnapshot[] = JSON.parse(item.value);
    const originalLength = history.length;
    
    // Filter out old data
    const prunedHistory = history.filter(snapshot => snapshot.timestamp >= cutoffTime);
    
    if (prunedHistory.length < originalLength) {
      // Update the key with pruned data
      await kv.set(item.key, JSON.stringify(prunedHistory));
      prunedCount += (originalLength - prunedHistory.length);
    }
  }
  
  console.log(`✓ Cleanup complete: Pruned ${prunedCount} old snapshots`);
}

/**
 * Get all stored tokens and exchanges (for debugging)
 */
export async function getStoredPairs(): Promise<Array<{ token: string; exchange: string; count: number }>> {
  const allKeys = await kv.getByPrefix('funding_history:');
  
  return allKeys.map(item => {
    // Parse key format: funding_history:{exchange}:{token}
    const parts = item.key.split(':');
    const exchange = parts[1];
    const token = parts[2];
    
    const history: FundingRateSnapshot[] = JSON.parse(item.value);
    
    return {
      token: token.toUpperCase(),
      exchange: exchange.charAt(0).toUpperCase() + exchange.slice(1),
      count: history.length,
    };
  });
}
