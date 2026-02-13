import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import * as fundingHistory from "./fundingRateHistory.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods - handle OPTIONS explicitly
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "apikey", "x-client-info"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

// Explicitly handle OPTIONS requests for all routes
app.options("/*", (c) => {
  return c.text("", 200);
});

// Health check endpoint
app.get("/make-server-9f8d65d6/health", (c) => {
  console.log('✅ Health check called');
  return c.json({ status: "ok", timestamp: Date.now(), message: "Bitfrost backend is running" });
});

// Hyperliquid HIP-3 health check endpoint
app.get("/make-server-9f8d65d6/hyperliquid/health", async (c) => {
  const HYPERLIQUID_API = "https://api.hyperliquid.xyz/info";
  const envDexName = Deno.env.get('HIP3_DEX_NAME');
  const hip3DexName = (!envDexName || envDexName === '' || envDexName === '1' || envDexName.trim() === '') 
    ? null
    : envDexName.trim();
  
  try {
    console.log(`🔍 HIP-3 health check with dex: ${hip3DexName || 'NOT SET'}`);
    
    if (!hip3DexName) {
      return c.json({
        ok: false,
        error: 'HIP3_DEX_NAME environment variable not set',
        dexUsed: null,
        universeCount: 0,
        sampleSymbols: [],
      });
    }
    
    const response = await fetch(HYPERLIQUID_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        type: "metaAndAssetCtxs",
        dex: hip3DexName
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return c.json({
        ok: false,
        dexUsed: hip3DexName,
        status: response.status,
        error: errorText.substring(0, 500),
        universeCount: 0,
        sampleSymbols: [],
      });
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data) || data.length < 1) {
      return c.json({
        ok: false,
        dexUsed: hip3DexName,
        error: 'Invalid response structure',
        universeCount: 0,
        sampleSymbols: [],
      });
    }
    
    const meta = data[0];
    const universe = meta?.universe || [];
    const sampleSymbols = universe.slice(0, 10).map((a: any) => a.name || a);
    
    return c.json({
      ok: true,
      dexUsed: hip3DexName,
      status: 200,
      universeCount: universe.length,
      sampleSymbols,
    });
    
  } catch (error) {
    return c.json({
      ok: false,
      dexUsed: hip3DexName,
      error: error instanceof Error ? error.message : String(error),
      universeCount: 0,
      sampleSymbols: [],
    });
  }
});

// Hyperliquid API - Get list of available perpetual DEXs
app.get("/make-server-9f8d65d6/hyperliquid/perp-dexs", async (c) => {
  const HYPERLIQUID_API = "https://api.hyperliquid.xyz/info";
  
  try {
    console.log('🔍 Fetching available perp dexes...');
    
    const response = await fetch(HYPERLIQUID_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "perpDexs" }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return c.json({
        error: `perpDexs returned ${response.status}`,
        details: errorText,
      }, response.status);
    }
    
    const data = await response.json();
    const dexs = Array.isArray(data) ? data : [data];
    
    console.log(`✓ Found ${dexs.length} perp dexes:`, dexs.map((d: any) => d.name).join(', '));
    
    return c.json({
      success: true,
      dexs,
      count: dexs.length,
    });
    
  } catch (error) {
    console.error("Error fetching perpDexs:", error);
    return c.json({
      error: "Failed to fetch perp dexes",
      message: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Simple test endpoint to verify backend is working
app.get("/make-server-9f8d65d6/test", (c) => {
  console.log('🧪 Test endpoint called');
  return c.json({ success: true, message: "Backend is responding!", timestamp: Date.now() });
});

// Loris API Proxy - Funding Rates
app.get("/make-server-9f8d65d6/funding-rates", async (c) => {
  try {
    console.log("=== Fetching funding rates from Loris API ===");
    
    // Correct endpoint from Loris API documentation
    const endpoint = "https://api.loris.tools/funding";
    
    console.log(`Calling: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });
    
    console.log(`Response: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Error body:`, errorBody);
      return c.json({ 
        error: `Loris API returned ${response.status}`,
        status: response.status,
        statusText: response.statusText,
        body: errorBody.substring(0, 500)
      }, response.status);
    }
    
    const data = await response.json();
    console.log(`✓ Success! Received data with keys:`, Object.keys(data).join(', '));
    
    if (data.funding_rates) {
      const exchanges = Object.keys(data.funding_rates);
      console.log(`Funding rates available for exchanges: ${exchanges.join(', ')}`);
    }
    
    return c.json(data);
    
  } catch (error) {
    console.error("=== Error proxying Loris API ===", error);
    return c.json({ 
      error: "Failed to fetch from Loris API",
      message: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Store current funding rates to history
// This should be called periodically (every 8 hours) to build historical data
app.post("/make-server-9f8d65d6/funding-rates/store", async (c) => {
  try {
    console.log("=== Storing funding rates to history ===");
    
    // Fetch current rates from Loris API
    const endpoint = "https://api.loris.tools/funding";
    console.log(`Fetching from: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method: "GET",
      headers: { "Accept": "application/json" },
    });
    
    console.log(`Loris API response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Loris API error body:`, errorBody.substring(0, 500));
      return c.json({
        error: `Loris API returned ${response.status}`,
        details: errorBody.substring(0, 500),
      }, response.status);
    }
    
    const data = await response.json();
    console.log(`Received funding data with ${Object.keys(data.funding_rates || {}).length} exchanges`);
    
    const timestamp = Date.now();
    let storedCount = 0;
    
    // Store rates for each exchange/token pair
    if (data.funding_rates) {
      for (const [exchange, tokens] of Object.entries(data.funding_rates)) {
        for (const [token, rateData] of Object.entries(tokens as Record<string, any>)) {
          const rate = rateData.rate_annual * 100; // Convert to percentage
          await fundingHistory.storeFundingRate(token, exchange, rate, timestamp);
          storedCount++;
        }
      }
    }
    
    console.log(`✓ Stored ${storedCount} funding rate snapshots at ${new Date(timestamp).toISOString()}`);
    
    return c.json({
      success: true,
      timestamp,
      stored: storedCount,
      message: `Stored ${storedCount} funding rate snapshots`,
    });
    
  } catch (error) {
    console.error("=== Error storing funding rates ===", error);
    return c.json({
      error: "Failed to store funding rates",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    }, 500);
  }
});

// Get historical funding rates for a specific token/exchange
app.get("/make-server-9f8d65d6/funding-rates/history/:token/:exchange", async (c) => {
  try {
    const token = c.req.param('token');
    const exchange = c.req.param('exchange');
    
    console.log(`Fetching funding rate history for ${token} on ${exchange}`);
    
    const history = await fundingHistory.getFundingHistory(token, exchange);
    
    return c.json({
      token,
      exchange,
      history,
      count: history.length,
    });
    
  } catch (error) {
    console.error("=== Error fetching funding rate history ===", error);
    return c.json({
      error: "Failed to fetch funding rate history",
      message: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Get historical funding rates for a token across multiple exchanges
app.post("/make-server-9f8d65d6/funding-rates/history/bulk", async (c) => {
  try {
    const body = await c.req.json();
    const { token, exchanges } = body;
    
    if (!token || !exchanges || !Array.isArray(exchanges)) {
      return c.json({
        error: "Invalid request body. Expected { token: string, exchanges: string[] }"
      }, 400);
    }
    
    console.log(`Fetching funding rate history for ${token} across ${exchanges.join(', ')}`);
    
    const history = await fundingHistory.getFundingHistoryBulk(token, exchanges);
    
    return c.json({
      token,
      exchanges,
      history,
    });
    
  } catch (error) {
    console.error("=== Error fetching bulk funding rate history ===", error);
    return c.json({
      error: "Failed to fetch bulk funding rate history",
      message: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Cleanup old funding rate data (should be called periodically)
app.post("/make-server-9f8d65d6/funding-rates/cleanup", async (c) => {
  try {
    console.log("=== Running funding rate cleanup ===");
    
    await fundingHistory.pruneOldFundingRates();
    
    return c.json({
      success: true,
      message: "Cleanup completed successfully",
    });
    
  } catch (error) {
    console.error("=== Error during cleanup ===", error);
    return c.json({
      error: "Failed to cleanup old funding rates",
      message: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Get all stored token/exchange pairs (for debugging)
app.get("/make-server-9f8d65d6/funding-rates/stored-pairs", async (c) => {
  try {
    const pairs = await fundingHistory.getStoredPairs();
    
    return c.json({
      pairs,
      count: pairs.length,
    });
    
  } catch (error) {
    console.error("=== Error fetching stored pairs ===", error);
    return c.json({
      error: "Failed to fetch stored pairs",
      message: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// DEBUG: Manually seed test data for chart testing
app.post("/make-server-9f8d65d6/funding-rates/seed-test-data", async (c) => {
  try {
    console.log("=== Seeding test funding rate data ===");
    
    const now = Date.now();
    const EIGHT_HOURS = 8 * 60 * 60 * 1000;
    let count = 0;
    
    // Seed 3 periods (24 hours) of data for BTC on Hyperliquid and Paradex
    for (let i = 0; i < 3; i++) {
      const timestamp = now - (EIGHT_HOURS * (2 - i)); // Go backwards in time
      
      // Hyperliquid BTC: ~5.5% with slight variance
      await fundingHistory.storeFundingRate('BTC', 'Hyperliquid', 5.5 + (Math.random() * 0.5 - 0.25), timestamp);
      count++;
      
      // Paradex BTC: ~10.9% with slight variance
      await fundingHistory.storeFundingRate('BTC', 'Paradex', 10.9 + (Math.random() * 0.5 - 0.25), timestamp);
      count++;
    }
    
    console.log(`✓ Seeded ${count} test snapshots`);
    
    return c.json({
      success: true,
      seeded: count,
      message: `Seeded ${count} test funding rate snapshots for chart testing`,
    });
    
  } catch (error) {
    console.error("=== Error seeding test data ===", error);
    return c.json({
      error: "Failed to seed test data",
      message: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Binance API Proxy - to avoid CORS issues
app.get("/make-server-9f8d65d6/binance/ticker/24hr", async (c) => {
  try {
    const symbol = c.req.query('symbol') || 'BTCUSDT';
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`;
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return c.json({ error: `Binance API returned ${response.status}` }, response.status);
    }
    
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Binance 24hr ticker request timed out');
      return c.json({ error: 'Request timeout' }, 504);
    }
    console.error('Error fetching Binance 24hr ticker:', error);
    return c.json({ error: 'Failed to fetch ticker data' }, 500);
  }
});

app.get("/make-server-9f8d65d6/binance/ticker/price", async (c) => {
  try {
    const symbol = c.req.query('symbol') || 'BTCUSDT';
    const url = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`;
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return c.json({ error: `Binance API returned ${response.status}` }, response.status);
    }
    
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Binance price request timed out');
      return c.json({ error: 'Request timeout' }, 504);
    }
    console.error("Error proxying Binance price:", error);
    return c.json({
      error: "Failed to fetch from Binance API",
      message: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

app.get("/make-server-9f8d65d6/binance/klines", async (c) => {
  try {
    const symbol = c.req.query('symbol') || 'BTCUSDT';
    const interval = c.req.query('interval') || '15m';
    const limit = c.req.query('limit') || '100';
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for historical data
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return c.json({ error: `Binance API returned ${response.status}` }, response.status);
    }
    
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Binance klines request timed out');
      return c.json({ error: 'Request timeout' }, 504);
    }
    console.error("Error proxying Binance klines:", error);
    return c.json({
      error: "Failed to fetch from Binance API",
      message: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

app.get("/make-server-9f8d65d6/binance/futures/openInterest", async (c) => {
  try {
    const symbol = c.req.query('symbol') || 'BTCUSDT';
    const url = `https://fapi.binance.com/fapi/v1/openInterest?symbol=${symbol}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return c.json({ error: `Binance Futures API returned ${response.status}` }, response.status);
    }
    
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    console.error("Error proxying Binance OI:", error);
    return c.json({
      error: "Failed to fetch from Binance Futures API",
      message: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Hyperliquid HIP3 API - Get RWA (Real World Assets) data
app.get("/make-server-9f8d65d6/hyperliquid/rwa", async (c) => {
  const HYPERLIQUID_API = "https://api.hyperliquid.xyz/info";
  
  // Mock HIP-3 RWA symbols as fallback (for xyz, vntl, km, cash)
  const mockCommodities = ['GOLD', 'SILVER', 'COPPER', 'PLATINUM', 'PALLADIUM', 'URANIUM', 'ALUMINIUM', 'CL', 'OIL', 'NATGAS', 'GAS'];
  const mockStocks = ['AAPL', 'AMD', 'AMZN', 'BABA', 'COIN', 'COST', 'CRCL', 'CRWV', 'GOOGL', 'HOOD', 'INTC', 'LLY', 'META', 'MSTR', 'MSFT', 'MU', 'NFLX', 'NVDA', 'ORCL', 'PLTR', 'RIVN', 'SKHX', 'SMSN', 'SNDK', 'TSM', 'TSLA', 'URNM', 'USAR'];
  const mockIndices = ['BIOTECH', 'DEFENSE', 'ENERGY', 'INFOTECH', 'MAG7', 'NUCLEAR', 'ROBOT', 'SEMIS', 'SMALL2000', 'US500', 'USA500', 'USTECH', 'XYZ100', 'ANTHROPIC', 'OPENAI', 'SPACEX', 'EUR', 'USDJPY', 'USBOND'];
  
  // Mock crypto symbols for FLX and HYNA DEXs
  const mockCryptoSymbols = ['BTC', 'ETH', 'SOL', 'XMR', 'AVAX', 'MATIC', 'ARB', 'OP', 'LINK', 'UNI', 'AAVE', 'ATOM', 'DOT', 'ADA', 'XRP', 'DOGE', 'SHIB', 'BNB', 'LTC', 'ETC'];
  
  const mockSymbols = [...mockCommodities, ...mockStocks, ...mockIndices];
  
  // Read HIP3 dex name from query parameter, fallback to environment variable, with hard default to "xyz"
  const queryDex = c.req.query('dex');
  const envDexName = Deno.env.get('HIP3_DEX_NAME');
  const hip3DexName = (queryDex || envDexName || 'xyz').trim().toLowerCase(); // Force lowercase since Hyperliquid dex names are case-sensitive
  
  let liveError: string | null = null;
  
  try {
    console.log("=== Fetching HIP-3 RWA universe from Hyperliquid ===");
    console.log(`HIP3 dex: ${hip3DexName} (env: ${envDexName || 'NOT SET'})`);
    
    // Discover available perp dexes for debugging
    console.log('🔍 Discovering available perp dexes...');
    let availableDexs: any[] = [];
    try {
      const dexsResponse = await fetch(HYPERLIQUID_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "perpDexs" }),
      });
      
      if (dexsResponse.ok) {
        const dexsData = await dexsResponse.json();
        availableDexs = Array.isArray(dexsData) ? dexsData : [dexsData];
        console.log('✓ Available perp dexes:', JSON.stringify(availableDexs, null, 2));
      } else {
        console.warn(`⚠️ perpDexs returned ${dexsResponse.status}`);
      }
    } catch (e) {
      console.warn('⚠️ Could not fetch perpDexs:', e);
    }
    
    // ONLY query HIP-3 dex - NO mainnet fallback
    // All DEXs (xyz, vntl, km, cash, flx, hyna) are HIP-3 DEXs
    console.log(`🔍 Fetching HIP-3 universe with dex="${hip3DexName}"...`);
    
    const response = await fetch(HYPERLIQUID_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "metaAndAssetCtxs", dex: hip3DexName }),
    });
    
    console.log(`  → Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`metaAndAssetCtxs returned ${response.status}: ${errorText || 'empty body'}. Available dexes: ${JSON.stringify(availableDexs)}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data) || data.length < 1) {
      throw new Error(`Invalid response structure: expected array, got ${typeof data}`);
    }
    
    const [meta] = data;
    const universe = meta?.universe || [];
    
    console.log(`✓ Got ${universe.length} assets from HIP-3 universe`);
    
    // Sanity check: universe must have at least some symbols (>5)
    if (universe.length < 5) {
      throw new Error(`HIP-3 universe too small (${universe.length} symbols), likely wrong dex. Available dexes: ${JSON.stringify(availableDexs)}`);
    }
    
    // Extract all symbols
    const allSymbols = universe.map((asset: any) => {
      const name = asset.name || asset;
      const nameStr = typeof name === 'string' ? name : String(name);
      
      // CRITICAL: Strip DEX prefix if it exists
      // Hyperliquid universes sometimes include the prefix (e.g., "xyz:SILVER")
      // We want raw symbols only (e.g., "SILVER")
      const parts = nameStr.split(':');
      if (parts.length === 2 && parts[0].toLowerCase() === hip3DexName) {
        return parts[1]; // Return raw symbol without prefix
      }
      return nameStr;
    });
    
    console.log('Sample symbols:', allSymbols.slice(0, 10).join(', '), `... (${allSymbols.length} total)`);
    
    // Categorize ALL symbols using heuristic
    const commodities = allSymbols.filter((s: string) => mockCommodities.includes(s));
    const stocks = allSymbols.filter((s: string) => mockStocks.includes(s));
    const indices = allSymbols.filter((s: string) => mockIndices.includes(s));
    const uncategorized = allSymbols.filter((s: string) => 
      !mockCommodities.includes(s) && !mockStocks.includes(s) && !mockIndices.includes(s)
    );
    
    // Add uncategorized to stocks by default (includes any crypto assets like BTC, XMR)
    const finalStocks = [...stocks, ...uncategorized];
    
    console.log(`✅ Categorization: ${commodities.length} commodities, ${finalStocks.length} stocks, ${indices.length} indices`);
    
    return c.json({
      success: true,
      source: 'live',
      dexUsed: hip3DexName,
      symbols: allSymbols,
      rwaAssets: {
        commodities,
        stocks: finalStocks,
        indices,
      },
    });
    
  } catch (error) {
    liveError = error instanceof Error ? error.message : String(error);
    console.error("=== HIP-3 live fetch failed, using mock fallback ===");
    console.error(`Error: ${liveError}`);
    console.error(`⚠️ WARNING: Failed to fetch live data for dex=\"${hip3DexName}\". Returning mock data.`);
    console.error(`   This usually means the dex name is incorrect or not available.`);
    console.error(`   To fix: Check the available perp dexes by calling /make-server-9f8d65d6/hyperliquid/health`);
    
    return c.json({
      success: true,
      source: 'mock',
      dexUsed: hip3DexName,
      liveError,
      symbols: mockSymbols,
      rwaAssets: {
        commodities: mockCommodities,
        stocks: mockStocks,
        indices: mockIndices,
      },
    });
  }
});

// Hyperliquid HIP3 API - Get detailed asset info including volume, OI, 24h change
app.post("/make-server-9f8d65d6/hyperliquid/asset-details", async (c) => {
  const HYPERLIQUID_API = "https://api.hyperliquid.xyz/info";
  
  const body = await c.req.json();
  const { symbols, dex } = body;
  
  if (!symbols || !Array.isArray(symbols)) {
    return c.json({
      error: "Invalid request body. Expected { symbols: string[], dex?: string }"
    }, 400);
  }
  
  console.log(`=== Fetching asset details for ${symbols.length} HIP-3 assets ===`);
  console.log('Requested symbols:', symbols.join(', '));
  
  // Read HIP3 dex name from body, query param, or environment variable
  const queryDex = c.req.query('dex');
  const envDexName = Deno.env.get('HIP3_DEX_NAME');
  const hip3DexName = (dex || queryDex || envDexName || 'xyz').trim().toLowerCase(); // Force lowercase since Hyperliquid dex names are case-sensitive
  
  // Mock price map for fallback
  const mockPriceMap: Record<string, number> = {
    'GOLD': 5032.0, 'SILVER': 99.155, 'COPPER': 6.0203, 'PLATINUM': 2291.1, 'PALLADIUM': 1832.2,
    'URANIUM': 78.974, 'ALUMINIUM': 95.775, 'CL': 65.493, 'OIL': 79.547, 'NATGAS': 4.1166, 'GAS': 4.1166,
    'AAPL': 257.55, 'AMD': 243.00, 'AMZN': 242.66, 'BABA': 172.92, 'COIN': 197.15, 'COST': 725.0,
    'CRCL': 66.001, 'CRWV': 95.775, 'GOOGL': 340.10, 'HOOD': 103.47, 'INTC': 48.797, 'LLY': 850.0,
    'META': 726.76, 'MSTR': 142.22, 'MSFT': 436.88, 'MU': 439.54, 'NFLX': 83.536, 'NVDA': 192.32,
    'ORCL': 166.38, 'PLTR': 148.11, 'RIVN': 15.081, 'SKHX': 617.45, 'SMSN': 78.5, 'SNDK': 617.45,
    'TSM': 178.5, 'TSLA': 429.42, 'URNM': 78.974, 'USAR': 23.698, 'BIOTECH': 154.82, 'DEFENSE': 225.0,
    'ENERGY': 180.0, 'INFOTECH': 146.20, 'MAG7': 66.675, 'NUCLEAR': 154.82, 'ROBOT': 37.638,
    'SEMIS': 412.80, 'SMALL2000': 260.64, 'US500': 6932.7, 'USA500': 6968.4, 'USTECH': 627.05,
    'XYZ100': 25779, 'ANTHROPIC': 516.89, 'OPENAI': 736.49, 'SPACEX': 1248.2,
    'EUR': 1.1895, 'USDJPY': 154.52, 'USBOND': 87.351,
  };
  
  const generateMock = (symbol: string) => ({
    symbol: `${hip3DexName}:${symbol}`, // HIP-3 format: "xyz:SILVER"
    price: mockPriceMap[symbol] || (100 + Math.random() * 400),
    volume24hUsd: (Math.random() * 500 + 10) * 1e6, // Raw USD value
    volume24h: `$${Math.floor(Math.random() * 500 + 10)}M`, // Formatted string
    oiUsd: (Math.random() * 100 + 5) * 1e6, // Raw USD value
    oi: `$${Math.floor(Math.random() * 100 + 5)}M`, // Formatted string
    change24h: (Math.random() - 0.5) * 10,
    dataSource: 'mock',
  });
  
  let liveError: string | null = null;
  
  try {
    console.log(`🔍 Fetching HIP-3 metaAndAssetCtxs with dex="${hip3DexName}"...`);
    
    const response = await fetch(HYPERLIQUID_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        type: "metaAndAssetCtxs",
        dex: hip3DexName
      }),
    });
    
    console.log(`  → Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`metaAndAssetCtxs returned ${response.status}: ${errorText || 'empty body'}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data) || data.length < 2) {
      throw new Error(`Invalid response structure: expected 2-element array, got ${typeof data}`);
    }
    
    const [meta, ctxs] = data;
    const universe = meta?.universe || [];
    
    console.log(`✓ Got HIP-3 universe with ${universe.length} assets`);
    
    // Build symbol-to-index map
    const symbolToIndex = new Map<string, number>();
    universe.forEach((asset: any, index: number) => {
      const name = asset.name || asset;
      const nameStr = typeof name === 'string' ? name : String(name);
      
      // CRITICAL: Strip DEX prefix if it exists for proper lookup
      // Hyperliquid universes sometimes include the prefix (e.g., "xyz:SILVER")
      // We want to map both "SILVER" and "xyz:SILVER" to the same index
      const parts = nameStr.split(':');
      if (parts.length === 2 && parts[0].toLowerCase() === hip3DexName) {
        // Has prefix like "xyz:SILVER" - map both formats
        const rawSymbol = parts[1].toUpperCase();
        const fullSymbol = nameStr.toUpperCase();
        symbolToIndex.set(rawSymbol, index); // Map "SILVER" -> index
        symbolToIndex.set(fullSymbol, index); // Map "xyz:SILVER" -> index
      } else {
        // No prefix - just map the raw symbol
        const normalized = nameStr.toUpperCase();
        symbolToIndex.set(normalized, index);
        // Also map with prefix for lookups
        symbolToIndex.set(`${hip3DexName.toUpperCase()}:${normalized}`, index);
      }
    });
    
    console.log(`✓ Built index map for ${symbolToIndex.size} assets`);
    
    // Build details for each requested symbol
    const details: Record<string, any> = {};
    let liveCount = 0;
    let mockCount = 0;
    
    for (const symbol of symbols) {
      const normalized = symbol.toUpperCase();
      const index = symbolToIndex.get(normalized);
      
      if (index !== undefined && ctxs[index]) {
        const ctx = ctxs[index];
        
        // Log the raw context data for debugging
        console.log(`📊 Raw ctx data for ${symbol}:`, JSON.stringify(ctx, null, 2));
        
        // Extract live data
        const price = ctx.markPx ? parseFloat(ctx.markPx) : mockPriceMap[symbol] || 100;
        
        // Volume: dayNtlVlm is 24h notional volume in USD
        const dayNtlVlm = ctx.dayNtlVlm ? parseFloat(ctx.dayNtlVlm) : 0;
        
        // Open Interest: openInterest is in contracts, multiply by price to get USD
        const openInterestContracts = ctx.openInterest ? parseFloat(ctx.openInterest) : 0;
        const openInterestUsd = openInterestContracts * price;
        
        // Price change
        const prevPrice = ctx.prevDayPx ? parseFloat(ctx.prevDayPx) : price;
        const change24h = prevPrice > 0 ? ((price - prevPrice) / prevPrice) * 100 : 0;
        
        // Format for display
        const volumeUsd = dayNtlVlm;
        const oiUsd = openInterestUsd;
        
        // Handle zero or missing values
        const volumeStr = volumeUsd > 0
          ? (volumeUsd > 1e9 ? `$${(volumeUsd / 1e9).toFixed(1)}B` : `$${Math.floor(volumeUsd / 1e6)}M`)
          : '--';
        const oiStr = oiUsd > 0
          ? (oiUsd > 1e9 ? `$${(oiUsd / 1e9).toFixed(1)}B` : `$${Math.floor(oiUsd / 1e6)}M`)
          : '--';
        
        console.log(`  → ${symbol}: volume=${volumeStr} (${volumeUsd}), oi=${oiStr} (${oiUsd}), change=${change24h.toFixed(2)}%`);
        
        details[symbol] = {
          symbol: `${hip3DexName}:${symbol}`, // HIP-3 format: "xyz:SILVER"
          price,
          volume24hUsd: volumeUsd,
          volume24h: volumeStr,
          oiUsd,
          oi: oiStr,
          change24h,
          dataSource: 'live',
        };
        
        liveCount++;
      } else {
        // Symbol not in HIP-3 universe - use mock
        details[symbol] = generateMock(symbol);
        mockCount++;
      }
    }
    
    console.log(`✅ Generated details: ${liveCount} live, ${mockCount} mock`);
    
    // Enforce: only return requested symbols
    const returnedSymbols = Object.keys(details);
    const extraSymbols = returnedSymbols.filter(s => !symbols.includes(s));
    if (extraSymbols.length > 0) {
      throw new Error(`Server attempted to return non-HIP3 symbols: ${extraSymbols.join(', ')}`);
    }
    
    return c.json({
      success: true,
      source: mockCount > 0 ? 'mixed' : 'live',
      dexUsed: hip3DexName,
      liveError: null,
      details,
      stats: {
        requested: symbols.length,
        live: liveCount,
        mock: mockCount,
      },
    });
    
  } catch (error) {
    liveError = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error fetching live HIP-3 details: ${liveError}`);
    
    // Full mock fallback
    const details: Record<string, any> = {};
    
    for (const symbol of symbols) {
      details[symbol] = generateMock(symbol);
    }
    
    console.log(`✓ Generated mock details for ${Object.keys(details).length} HIP-3 assets`);
    
    return c.json({
      success: true,
      source: 'mock',
      dexUsed: hip3DexName,
      liveError,
      details,
    });
  }
});

// Hyperliquid API - Get orderbook for RWA assets
app.get("/make-server-9f8d65d6/hyperliquid/orderbook", async (c) => {
  const HYPERLIQUID_API = "https://api.hyperliquid.xyz/info";
  
  try {
    const symbol = c.req.query('symbol'); // e.g., "SILVER" or "flx:SILVER" or "flx:SILVER:PERP-USDC"
    const coin = symbol || 'SILVER';
    
    // Read HIP3 dex name from query parameter or environment variable
    const queryDex = c.req.query('dex');
    const envDexName = Deno.env.get('HIP3_DEX_NAME');
    const hip3DexName = (queryDex || envDexName || 'xyz').trim().toLowerCase();
    
    // Normalize coin format:
    // - Input: "flx:SILVER:PERP-USDC" or "flx:SILVER" or "SILVER"
    // - Output: "flx:SILVER" (dex:symbol format that Hyperliquid expects)
    let normalizedCoin = coin;
    
    if (coin.includes(':PERP-')) {
      // Strip :PERP-USDC suffix: "flx:SILVER:PERP-USDC" -> "flx:SILVER"
      const parts = coin.split(':');
      if (parts.length >= 2) {
        normalizedCoin = `${parts[0]}:${parts[1]}`;
      }
    }
    
    console.log(`🔍 Fetching orderbook for ${normalizedCoin} on dex="${hip3DexName}" (original: ${coin})`);
    
    const response = await fetch(HYPERLIQUID_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        type: "l2Book",
        coin: normalizedCoin,
        dex: hip3DexName,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Hyperliquid orderbook error: ${response.status} - ${errorText}`);
      return c.json({ error: `Hyperliquid API returned ${response.status}` }, response.status);
    }
    
    const data = await response.json();
    console.log(`✓ Got orderbook for ${coin}`);
    
    return c.json(data);
  } catch (error) {
    console.error("Error fetching Hyperliquid orderbook:", error);
    return c.json({
      error: "Failed to fetch orderbook from Hyperliquid",
      message: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Hyperliquid API - Get candlestick/kline data for RWA assets
app.get("/make-server-9f8d65d6/hyperliquid/candles", async (c) => {
  const HYPERLIQUID_API = "https://api.hyperliquid.xyz/info";
  
  try {
    const symbol = c.req.query('symbol'); // e.g., "SILVER" or "flx:SILVER" or "flx:SILVER:PERP-USDC"
    const interval = c.req.query('interval') || '15m'; // e.g., "15m", "1h", "1d"
    const startTime = c.req.query('startTime'); // Unix timestamp in ms
    const endTime = c.req.query('endTime'); // Unix timestamp in ms
    
    const coin = symbol || 'SILVER';
    
    // Read HIP3 dex name from query parameter or environment variable
    const queryDex = c.req.query('dex');
    const envDexName = Deno.env.get('HIP3_DEX_NAME');
    const hip3DexName = (queryDex || envDexName || 'xyz').trim().toLowerCase();
    
    // Normalize coin format:
    // - Input: "flx:SILVER:PERP-USDC" or "flx:SILVER" or "SILVER"
    // - Output: "flx:SILVER" (dex:symbol format that Hyperliquid expects)
    let normalizedCoin = coin;
    
    if (coin.includes(':PERP-')) {
      // Strip :PERP-USDC suffix: "flx:SILVER:PERP-USDC" -> "flx:SILVER"
      const parts = coin.split(':');
      if (parts.length >= 2) {
        normalizedCoin = `${parts[0]}:${parts[1]}`;
      }
    }
    
    console.log(`🔍 Fetching candles for ${normalizedCoin} (${interval}) on dex=\"${hip3DexName}\" (original: ${coin})`);
    
    const requestBody: any = {
      type: "candleSnapshot",
      req: {
        coin: normalizedCoin,
        interval: interval,
        dex: hip3DexName,
      }
    };
    
    // Add time range if provided (Hyperliquid expects these as numbers, not strings)
    if (startTime && endTime) {
      const start = parseInt(startTime);
      const end = parseInt(endTime);
      if (!isNaN(start) && !isNaN(end)) {
        requestBody.req.startTime = start;
        requestBody.req.endTime = end;
      }
    }
    
    console.log(`📤 Request body:`, JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(HYPERLIQUID_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      // Silently return empty array - Hyperliquid API errors are expected for some RWA assets
      return c.json([]);
    }
    
    const data = await response.json();
    console.log(`✓ Got ${Array.isArray(data) ? data.length : 0} candles for ${coin}`);
    
    return c.json(data);
  } catch (error) {
    console.error("Error fetching Hyperliquid candles:", error);
    return c.json({
      error: "Failed to fetch candles from Hyperliquid",
      message: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Hyperliquid API - Get Solver/Clearinghouse data
app.get("/make-server-9f8d65d6/hyperliquid/solver", async (c) => {
  const HYPERLIQUID_API = "https://api.hyperliquid.xyz/info";
  
  try {
    const symbol = c.req.query('symbol'); // e.g., "SILVER"
    const coin = symbol || 'SILVER';
    
    // Read HIP3 dex name from query parameter or environment variable
    const queryDex = c.req.query('dex');
    const envDexName = Deno.env.get('HIP3_DEX_NAME');
    const hip3DexName = (queryDex || envDexName || 'xyz').trim().toLowerCase();
    
    console.log(`🔍 Fetching Solver data for ${coin} on dex="${hip3DexName}"`);
    
    // Fetch meta information which includes solver data
    const response = await fetch(HYPERLIQUID_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        type: "metaAndAssetCtxs",
        dex: hip3DexName,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Hyperliquid solver error: ${response.status} - ${errorText}`);
      return c.json({ error: `Hyperliquid API returned ${response.status}` }, response.status);
    }
    
    const data = await response.json();
    
    // Extract solver-specific data for the requested coin
    if (!Array.isArray(data) || data.length < 2) {
      return c.json({ 
        error: "Invalid response structure",
        solverData: null 
      }, 500);
    }
    
    const [meta, assetCtxs] = data;
    
    // Find the asset context for the requested coin
    let assetData = null;
    if (Array.isArray(assetCtxs)) {
      // Find the index of the coin in the universe
      const universe = meta?.universe || [];
      const assetIndex = universe.findIndex((a: any) => {
        const name = a?.name || a;
        return name === coin || name === `${coin}:PERP`;
      });
      
      if (assetIndex >= 0 && assetIndex < assetCtxs.length) {
        assetData = assetCtxs[assetIndex];
      }
    }
    
    // Extract solver-relevant metrics
    const solverInfo = {
      coin: coin,
      dex: hip3DexName,
      openInterest: assetData?.openInterest || '0',
      funding: assetData?.funding || '0',
      premium: assetData?.premium || '0',
      oraclePx: assetData?.oraclePx || '0',
      markPx: assetData?.markPx || '0',
      midPx: assetData?.midPx || '0',
      prevDayPx: assetData?.prevDayPx || '0',
      dayNtlVlm: assetData?.dayNtlVlm || '0',
      // Additional solver-specific fields
      impactPxs: assetData?.impactPxs || [],
    };
    
    console.log(`✓ Got Solver data for ${coin}:`, solverInfo);
    
    return c.json(solverInfo);
  } catch (error) {
    console.error("Error fetching Hyperliquid Solver data:", error);
    return c.json({
      error: "Failed to fetch Solver data from Hyperliquid",
      message: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

console.log('🚀 Bitfrost Edge Function Server Started');
console.log('📡 Loris API Proxy: /funding-rates');

Deno.serve(app.fetch);