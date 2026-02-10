/**
 * Hyperliquid Market Data Service
 * 
 * Provides comprehensive market data from Hyperliquid Info API for HIP-3 DEX assets.
 * All market metrics are sourced from Hyperliquid endpoints only.
 */

import { projectId, publicAnonKey } from '../utils/supabase/info';

const PROXY_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-9f8d65d6`;
const HYPERLIQUID_API = "https://api.hyperliquid.xyz/info";

// Types based on Hyperliquid API documentation
export interface HyperliquidDex {
  name: string;
  fullName: string;
}

export interface HyperliquidAssetMeta {
  name: string;
  szDecimals: number;
}

export interface HyperliquidAssetCtx {
  dayNtlVlm: string;        // 24h notional volume in USD
  funding: string;           // Current funding rate
  impactPxs: string[];       // Impact prices [buy, sell]
  markPx: string;            // Mark price
  midPx: string;             // Mid price
  openInterest: string;      // Open interest in contracts
  oraclePx: string;          // Oracle price
  prevDayPx: string;         // Previous day price (for 24h change)
  premium: string;           // Premium over oracle
}

export interface HyperliquidCandle {
  t: number;  // Timestamp (Unix ms)
  T: number;  // Close timestamp
  o: string;  // Open
  h: string;  // High
  l: string;  // Low
  c: string;  // Close
  v: string;  // Volume
  n: number;  // Number of trades
}

export interface HyperliquidOrderBookLevel {
  px: string;  // Price
  sz: string;  // Size
  n: number;   // Number of orders
}

export interface HyperliquidL2Book {
  coin: string;
  time: number;
  levels: [HyperliquidOrderBookLevel[], HyperliquidOrderBookLevel[]]; // [bids, asks]
}

export interface MarketMetrics {
  markPrice: number;
  oraclePrice: number;
  openInterest: number;
  openInterestUsd: number;
  fundingRate: number;
  volume24h: number;
  change24h: number;
  prevDayPrice: number;
  premium: number;
  midPrice: number;
  // Computed from candles
  high24h: number;
  low24h: number;
  open24h: number;
  close24h: number;
  // Computed from order book
  bestBid: number;
  bestAsk: number;
  spread: number;
  spreadBps: number;
  dataSource: 'live' | 'mock';
}

/**
 * Fetch list of available perpetual DEXs from Hyperliquid
 */
export async function fetchPerpDexs(): Promise<HyperliquidDex[]> {
  try {
    const response = await fetch(HYPERLIQUID_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "perpDexs" }),
    });

    if (!response.ok) {
      console.warn(`perpDexs returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [data];
  } catch (error) {
    console.warn('Failed to fetch perpDexs:', error);
    return [];
  }
}

/**
 * Fetch meta and asset contexts for a specific DEX
 * This provides all market snapshot data
 */
export async function fetchMetaAndAssetCtxs(dex: string): Promise<{
  meta: { universe: HyperliquidAssetMeta[] };
  assetCtxs: HyperliquidAssetCtx[];
}> {
  try {
    const response = await fetch(HYPERLIQUID_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        type: "metaAndAssetCtxs",
        dex: dex
      }),
    });

    if (!response.ok) {
      throw new Error(`metaAndAssetCtxs returned ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length < 2) {
      throw new Error('Invalid response structure from metaAndAssetCtxs');
    }

    return {
      meta: data[0],
      assetCtxs: data[1] as HyperliquidAssetCtx[],
    };
  } catch (error) {
    console.error('Failed to fetch metaAndAssetCtxs:', error);
    throw error;
  }
}

/**
 * Fetch candle snapshot for a specific coin on a DEX
 */
export async function fetchCandleSnapshot(
  coin: string,
  dex: string,
  interval: string = '15m',
  startTime?: number,
  endTime?: number
): Promise<HyperliquidCandle[]> {
  try {
    const url = new URL(`${PROXY_BASE}/hyperliquid/candles`);
    url.searchParams.set('symbol', coin);
    url.searchParams.set('interval', interval);
    url.searchParams.set('dex', dex);
    
    if (startTime) url.searchParams.set('startTime', startTime.toString());
    if (endTime) url.searchParams.set('endTime', endTime.toString());

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });

    if (!response.ok) {
      console.warn(`Candles endpoint returned ${response.status} for ${coin}`);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn('Failed to fetch candle snapshot:', error);
    return [];
  }
}

/**
 * Fetch L2 order book for a specific coin on a DEX
 */
export async function fetchL2Book(
  coin: string,
  dex: string
): Promise<HyperliquidL2Book | null> {
  try {
    const url = new URL(`${PROXY_BASE}/hyperliquid/orderbook`);
    url.searchParams.set('symbol', coin);
    url.searchParams.set('dex', dex);

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });

    if (!response.ok) {
      console.warn(`L2Book endpoint returned ${response.status} for ${coin}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('Failed to fetch L2 book:', error);
    return null;
  }
}

/**
 * Get comprehensive market metrics for a specific asset
 * Combines data from metaAndAssetCtxs, candleSnapshot, and l2Book
 */
export async function getMarketMetrics(
  coin: string,
  dex: string,
  interval: string = '15m'
): Promise<MarketMetrics> {
  try {
    console.log(`📊 [Hyperliquid Service] Fetching market metrics for ${coin} on ${dex}`)

    // Fetch meta and asset contexts
    const { meta, assetCtxs } = await fetchMetaAndAssetCtxs(dex);

    // Find the asset index
    // CRITICAL: coin parameter can be in multiple formats:
    // - "flx:SILVER:PERP-USDC" (full format from UI)
    // - "flx:SILVER" (dex:symbol format)
    // - "SILVER" (raw symbol)
    // The universe contains "flx:SILVER" format
    console.log(`🔍 Searching for ${coin} in ${meta.universe.length} assets from ${dex}`);
    
    // Extract the dex:symbol from the coin parameter (strip :PERP-USDC suffix if present)
    let searchCoin = coin;
    if (coin.includes(':PERP-')) {
      // Format: "flx:SILVER:PERP-USDC" -> "flx:SILVER"
      const parts = coin.split(':');
      if (parts.length >= 2) {
        searchCoin = `${parts[0]}:${parts[1]}`;
      }
    }
    
    console.log(`🔍 Normalized search term: ${searchCoin}`);
    
    const assetIndex = meta.universe.findIndex((asset) => {
      const assetName = (asset.name || '').toUpperCase();
      const searchCoinUpper = searchCoin.toUpperCase();
      console.log(`  Comparing: "${assetName}" === "${searchCoinUpper}"`);
      // Match the normalized coin (case-insensitive)
      return assetName === searchCoinUpper;
    });

    if (assetIndex === -1) {
      const availableAssets = meta.universe.map(a => a.name).join(', ');
      console.error(`Asset ${coin} not found in ${dex} universe. Available assets: ${availableAssets.substring(0, 200)}...`);
      throw new Error(`Asset ${coin} not found in ${dex} universe. This might be a crypto asset that should use Binance data instead of HIP-3 DEX data.`);
    }

    const assetCtx = assetCtxs[assetIndex];
    const assetMeta = meta.universe[assetIndex];

    console.log(`✓ Found asset at index ${assetIndex}:`, assetMeta.name);
    console.log('  Asset context:', assetCtx);

    // Parse basic metrics
    const markPrice = parseFloat(assetCtx.markPx || '0');
    const oraclePrice = parseFloat(assetCtx.oraclePx || '0');
    const openInterestContracts = parseFloat(assetCtx.openInterest || '0');
    const openInterestUsd = openInterestContracts * markPrice;
    const fundingRate = parseFloat(assetCtx.funding || '0') * 100; // Convert to percentage
    const volume24h = parseFloat(assetCtx.dayNtlVlm || '0');
    const prevDayPrice = parseFloat(assetCtx.prevDayPx || '0');
    const change24h = prevDayPrice > 0 ? ((markPrice - prevDayPrice) / prevDayPrice) * 100 : 0;
    const premium = parseFloat(assetCtx.premium || '0');
    const midPrice = parseFloat(assetCtx.midPx || markPrice.toString());

    // Fetch 24h candles to compute high/low/open/close
    const endTime = Date.now();
    const startTime = endTime - (24 * 60 * 60 * 1000); // 24 hours ago
    // Use searchCoin (normalized format) for API calls
    const candles = await fetchCandleSnapshot(searchCoin, dex, '1h', startTime, endTime);

    let high24h = markPrice;
    let low24h = markPrice;
    let open24h = markPrice;
    let close24h = markPrice;

    if (candles.length > 0) {
      high24h = Math.max(...candles.map(c => parseFloat(c.h || '0')));
      low24h = Math.min(...candles.map(c => parseFloat(c.l || '0')));
      open24h = parseFloat(candles[0].o || '0');
      close24h = parseFloat(candles[candles.length - 1].c || '0');
      console.log(`✓ Computed 24h OHLC from ${candles.length} candles`);
    } else {
      console.warn(`⚠️ No candles available, using mark price for 24h OHLC`);
    }

    // Fetch L2 order book to compute spread
    // Use searchCoin (normalized format) for API calls
    const orderBook = await fetchL2Book(searchCoin, dex);

    let bestBid = markPrice;
    let bestAsk = markPrice;
    let spread = 0;
    let spreadBps = 0;

    if (orderBook && orderBook.levels) {
      const [bids, asks] = orderBook.levels;
      if (bids.length > 0) {
        bestBid = parseFloat(bids[0].px);
      }
      if (asks.length > 0) {
        bestAsk = parseFloat(asks[0].px);
      }
      spread = bestAsk - bestBid;
      const computedMidPrice = (bestBid + bestAsk) / 2;
      spreadBps = computedMidPrice > 0 ? (spread / computedMidPrice) * 10000 : 0;
      console.log(`✓ Computed spread from order book: ${spread.toFixed(2)} (${spreadBps.toFixed(2)} bps)`);
    } else {
      console.warn(`⚠️ No order book available, spread set to 0`);
    }

    const metrics: MarketMetrics = {
      markPrice,
      oraclePrice,
      openInterest: openInterestContracts,
      openInterestUsd,
      fundingRate,
      volume24h,
      change24h,
      prevDayPrice,
      premium,
      midPrice,
      high24h,
      low24h,
      open24h,
      close24h,
      bestBid,
      bestAsk,
      spread,
      spreadBps,
      dataSource: 'live',
    };

    console.log(`✅ Market metrics ready for ${coin}:`, metrics);

    return metrics;
  } catch (error) {
    console.error('Failed to get market metrics:', error);
    
    // Return mock data as fallback
    return {
      markPrice: 0,
      oraclePrice: 0,
      openInterest: 0,
      openInterestUsd: 0,
      fundingRate: 0,
      volume24h: 0,
      change24h: 0,
      prevDayPrice: 0,
      premium: 0,
      midPrice: 0,
      high24h: 0,
      low24h: 0,
      open24h: 0,
      close24h: 0,
      bestBid: 0,
      bestAsk: 0,
      spread: 0,
      spreadBps: 0,
      dataSource: 'mock',
    };
  }
}

/**
 * Subscribe to live order book updates via polling
 */
export function subscribeToHyperliquidOrderBook(
  coin: string,
  dex: string,
  callback: (orderBook: HyperliquidL2Book) => void,
  pollIntervalMs: number = 500
): () => void {
  let intervalId: any = null;

  // Normalize the coin format (strip :PERP-USDC suffix if present)
  let normalizedCoin = coin;
  if (coin.includes(':PERP-')) {
    const parts = coin.split(':');
    if (parts.length >= 2) {
      normalizedCoin = `${parts[0]}:${parts[1]}`;
    }
  }

  const poll = async () => {
    const orderBook = await fetchL2Book(normalizedCoin, dex);
    if (orderBook) {
      callback(orderBook);
    }
  };

  // Initial fetch
  poll();

  // Set up polling
  intervalId = setInterval(poll, pollIntervalMs);

  // Return cleanup function
  return () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  };
}