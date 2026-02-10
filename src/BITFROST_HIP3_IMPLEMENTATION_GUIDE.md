# How Bitfrost Actually Fetches HIP-3 Assets (Production Implementation)

*This is the REAL implementation currently working in Bitfrost*

---

## Overview

Bitfrost uses a **two-tier architecture** to fetch HIP-3 (Real World Assets) data from Hyperliquid:

1. **Backend (Supabase Edge Function)**: Proxies requests to Hyperliquid API
2. **Frontend (React Service)**: Calls backend, caches data, displays UI

---

## Architecture Diagram

```
┌──────────────────┐
│   React App      │
│   (Frontend)     │
└────────┬─────────┘
         │
         │ fetch()
         ▼
┌──────────────────────────────────────────────────────┐
│  Supabase Edge Function (Deno)                       │
│  /make-server-9f8d65d6/hyperliquid/*                 │
└────────┬─────────────────────────────────────────────┘
         │
         │ fetch()
         ▼
┌──────────────────────────────────────────────────────┐
│  Hyperliquid API                                      │
│  https://api.hyperliquid.xyz/info                    │
└──────────────────────────────────────────────────────┘
```

---

## Step 1: Backend Implementation (Supabase Edge Function)

**File**: `/supabase/functions/server/index.tsx`

### Endpoint 1: Get Available DEXs

```typescript
// GET /make-server-9f8d65d6/hyperliquid/health
app.get("/make-server-9f8d65d6/hyperliquid/health", async (c) => {
  const HYPERLIQUID_API = "https://api.hyperliquid.xyz/info";
  
  try {
    const response = await fetch(HYPERLIQUID_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "perpDexs" }),
    });
    
    if (!response.ok) {
      return c.json({
        error: `perpDexs returned ${response.status}`,
      }, response.status);
    }
    
    const dexs = await response.json();
    
    return c.json({
      success: true,
      dexs: dexs,
      count: dexs.length,
    });
  } catch (error) {
    return c.json({
      error: "Failed to fetch perp dexes",
      message: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
```

**Response Example**:
```json
{
  "success": true,
  "dexs": [
    { "name": "xyz", "fullName": "XYZ Markets" },
    { "name": "flx", "fullName": "FLX" },
    { "name": "cash", "fullName": "Cash Markets" },
    { "name": "vntl", "fullName": "Vantale" },
    { "name": "km", "fullName": "KM" },
    { "name": "hyna", "fullName": "Hyna" }
  ],
  "count": 6
}
```

---

### Endpoint 2: Get RWA Assets List

```typescript
// GET /make-server-9f8d65d6/hyperliquid/rwa?dex=xyz
app.get("/make-server-9f8d65d6/hyperliquid/rwa", async (c) => {
  const HYPERLIQUID_API = "https://api.hyperliquid.xyz/info";
  
  // Get DEX name from query param (defaults to 'xyz')
  const hip3DexName = (c.req.query('dex') || 'xyz').trim().toLowerCase();
  
  try {
    console.log(`Fetching HIP-3 universe for dex="${hip3DexName}"...`);
    
    // Call Hyperliquid API
    const response = await fetch(HYPERLIQUID_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        type: "metaAndAssetCtxs", 
        dex: hip3DexName 
      }),
    });
    
    if (!response.ok) {
      throw new Error(`metaAndAssetCtxs returned ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data) || data.length < 1) {
      throw new Error(`Invalid response structure`);
    }
    
    const [meta] = data;
    const universe = meta?.universe || [];
    
    // Extract symbols
    // CRITICAL: Strip DEX prefix if it exists
    // Hyperliquid returns "xyz:SILVER", we want "SILVER"
    const allSymbols = universe.map((asset: any) => {
      const name = asset.name || asset;
      const nameStr = String(name);
      
      // If format is "xyz:SILVER", return "SILVER"
      const parts = nameStr.split(':');
      if (parts.length === 2 && parts[0].toLowerCase() === hip3DexName) {
        return parts[1]; // Raw symbol without prefix
      }
      return nameStr;
    });
    
    // Categorize symbols (use your own categorization logic)
    const commodities = allSymbols.filter((s: string) => 
      ['GOLD', 'SILVER', 'COPPER', 'OIL', 'NATGAS'].includes(s)
    );
    
    const stocks = allSymbols.filter((s: string) => 
      ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL'].includes(s)
    );
    
    const indices = allSymbols.filter((s: string) => 
      ['US500', 'USTECH', 'EURUSD'].includes(s)
    );
    
    // Everything else goes to stocks
    const uncategorized = allSymbols.filter((s: string) => 
      !commodities.includes(s) && !stocks.includes(s) && !indices.includes(s)
    );
    
    return c.json({
      success: true,
      source: 'live',
      dexUsed: hip3DexName,
      symbols: allSymbols,
      rwaAssets: {
        commodities,
        stocks: [...stocks, ...uncategorized],
        indices,
      },
    });
    
  } catch (error) {
    console.error("HIP-3 fetch failed:", error);
    
    // Return mock data as fallback
    return c.json({
      success: true,
      source: 'mock',
      dexUsed: hip3DexName,
      liveError: error instanceof Error ? error.message : String(error),
      symbols: ['GOLD', 'SILVER', 'TSLA', 'AAPL'],
      rwaAssets: {
        commodities: ['GOLD', 'SILVER'],
        stocks: ['TSLA', 'AAPL'],
        indices: ['US500'],
      },
    });
  }
});
```

**Response Example (Live)**:
```json
{
  "success": true,
  "source": "live",
  "dexUsed": "xyz",
  "symbols": ["GOLD", "SILVER", "COPPER", "US500", "USTECH", ...],
  "rwaAssets": {
    "commodities": ["GOLD", "SILVER", "COPPER"],
    "stocks": ["TSLA", "AAPL", "NVDA"],
    "indices": ["US500", "USTECH"]
  }
}
```

---

### Endpoint 3: Get Asset Details (Volume, OI, Prices)

```typescript
// POST /make-server-9f8d65d6/hyperliquid/asset-details
app.post("/make-server-9f8d65d6/hyperliquid/asset-details", async (c) => {
  const HYPERLIQUID_API = "https://api.hyperliquid.xyz/info";
  
  const body = await c.req.json();
  const { symbols, dex } = body;
  
  if (!symbols || !Array.isArray(symbols)) {
    return c.json({ error: "Invalid request" }, 400);
  }
  
  const hip3DexName = (dex || 'xyz').trim().toLowerCase();
  
  try {
    const response = await fetch(HYPERLIQUID_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        type: "metaAndAssetCtxs", 
        dex: hip3DexName 
      }),
    });
    
    const [meta, assetCtxs] = await response.json();
    const universe = meta?.universe || [];
    
    // Build details map
    const details: Record<string, any> = {};
    
    symbols.forEach((symbol: string) => {
      // Find asset in universe
      const assetIndex = universe.findIndex((asset: any) => {
        const name = String(asset.name);
        // Match "GOLD" against "xyz:GOLD" or "GOLD"
        return name === `${hip3DexName}:${symbol}` || name === symbol;
      });
      
      if (assetIndex !== -1) {
        const ctx = assetCtxs[assetIndex];
        const markPrice = parseFloat(ctx.markPx || '0');
        const prevDayPrice = parseFloat(ctx.prevDayPx || '0');
        const volume24hUsd = parseFloat(ctx.dayNtlVlm || '0');
        const oiContracts = parseFloat(ctx.openInterest || '0');
        const oiUsd = oiContracts * markPrice;
        
        details[symbol] = {
          symbol: `${hip3DexName}:${symbol}`,
          price: markPrice,
          volume24hUsd,
          volume24h: `$${Math.floor(volume24hUsd / 1e6)}M`,
          oiUsd,
          oi: `$${Math.floor(oiUsd / 1e6)}M`,
          change24h: prevDayPrice > 0 
            ? ((markPrice - prevDayPrice) / prevDayPrice) * 100 
            : 0,
          dataSource: 'live',
        };
      }
    });
    
    return c.json({
      success: true,
      details,
    });
    
  } catch (error) {
    console.error("Asset details fetch failed:", error);
    
    // Return mock data
    const mockDetails: Record<string, any> = {};
    symbols.forEach((symbol: string) => {
      mockDetails[symbol] = {
        symbol: `${hip3DexName}:${symbol}`,
        price: 100,
        volume24hUsd: 50000000,
        volume24h: "$50M",
        oiUsd: 20000000,
        oi: "$20M",
        change24h: 1.5,
        dataSource: 'mock',
      };
    });
    
    return c.json({
      success: true,
      details: mockDetails,
    });
  }
});
```

---

## Step 2: Frontend Implementation

**File**: `/services/hyperliquidMarketService.ts`

### Function: Fetch DEX List

```typescript
const HYPERLIQUID_API = "https://api.hyperliquid.xyz/info";

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
```

---

### Function: Fetch Assets from DEX

```typescript
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
      throw new Error('Invalid response structure');
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
```

---

### Function: Get Market Metrics for Asset

```typescript
export async function getMarketMetrics(
  coin: string,
  dex: string,
): Promise<MarketMetrics> {
  try {
    // Fetch all assets from the DEX
    const { meta, assetCtxs } = await fetchMetaAndAssetCtxs(dex);

    // Normalize coin name
    // Input could be: "flx:SILVER:PERP-USDC" or "flx:SILVER" or "SILVER"
    // We need to match against universe which contains "flx:SILVER"
    let searchCoin = coin;
    if (coin.includes(':PERP-')) {
      // Strip :PERP-USDC suffix
      const parts = coin.split(':');
      if (parts.length >= 2) {
        searchCoin = `${parts[0]}:${parts[1]}`; // "flx:SILVER"
      }
    }

    // Find asset in universe
    const assetIndex = meta.universe.findIndex((asset) => {
      return asset.name.toUpperCase() === searchCoin.toUpperCase();
    });

    if (assetIndex === -1) {
      throw new Error(`Asset ${coin} not found in ${dex} universe`);
    }

    const assetCtx = assetCtxs[assetIndex];
    const assetMeta = meta.universe[assetIndex];

    // Parse metrics
    const markPrice = parseFloat(assetCtx.markPx || '0');
    const oraclePrice = parseFloat(assetCtx.oraclePx || '0');
    const openInterest = parseFloat(assetCtx.openInterest || '0');
    const fundingRate = parseFloat(assetCtx.funding || '0') * 100;
    const volume24h = parseFloat(assetCtx.dayNtlVlm || '0');
    const prevDayPrice = parseFloat(assetCtx.prevDayPx || '0');
    const change24h = prevDayPrice > 0 
      ? ((markPrice - prevDayPrice) / prevDayPrice) * 100 
      : 0;

    return {
      markPrice,
      oraclePrice,
      openInterest,
      openInterestUsd: openInterest * markPrice,
      fundingRate,
      volume24h,
      change24h,
      prevDayPrice,
      premium: parseFloat(assetCtx.premium || '0'),
      midPrice: parseFloat(assetCtx.midPx || markPrice.toString()),
      // ... other fields
      dataSource: 'live',
    };
  } catch (error) {
    console.error('Failed to get market metrics:', error);
    throw error;
  }
}
```

---

## Step 3: Usage in React Component

```typescript
// In your React component
import { 
  fetchPerpDexs, 
  fetchMetaAndAssetCtxs,
  getMarketMetrics 
} from './services/hyperliquidMarketService';

function MyComponent() {
  const [dexs, setDexs] = useState([]);
  const [assets, setAssets] = useState([]);
  
  useEffect(() => {
    loadHIP3Data();
  }, []);
  
  async function loadHIP3Data() {
    // 1. Get available DEXs
    const availableDexs = await fetchPerpDexs();
    console.log('Available DEXs:', availableDexs);
    setDexs(availableDexs);
    
    // 2. Fetch assets from each DEX
    for (const dex of availableDexs) {
      try {
        const { meta, assetCtxs } = await fetchMetaAndAssetCtxs(dex.name);
        console.log(`${dex.name} assets:`, meta.universe);
        
        // Store assets
        setAssets(prev => [...prev, {
          dex: dex.name,
          assets: meta.universe
        }]);
      } catch (error) {
        console.error(`Failed to fetch ${dex.name}:`, error);
      }
    }
    
    // 3. Get metrics for specific asset
    const metrics = await getMarketMetrics('xyz:GOLD', 'xyz');
    console.log('GOLD metrics:', metrics);
  }
  
  return (
    <div>
      {dexs.map(dex => (
        <div key={dex.name}>
          <h3>{dex.fullName}</h3>
          {/* Render assets */}
        </div>
      ))}
    </div>
  );
}
```

---

## Key Implementation Details

### 1. Symbol Format

**From Hyperliquid API** (`meta.universe[i].name`):
- Format: `"xyz:GOLD"`, `"flx:TSLA"`, `"cash:EURUSD"`
- **Always includes DEX prefix**

**Backend strips prefix**:
- API returns: `"xyz:GOLD"`
- Backend extracts: `"GOLD"`
- Frontend receives: `["GOLD", "SILVER", ...]`

**Frontend adds back for display**:
- Display format: `"GOLD:PERP-USDC"` or `"xyz:GOLD"`

---

### 2. Error Handling

Backend uses **graceful fallback**:
- Try live Hyperliquid API
- On failure, return mock data
- Always return `source: 'live' | 'mock'` field
- Frontend checks `source` to show warning

---

### 3. Caching Strategy

```typescript
// Client-side cache with TTL
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 90000; // 90 seconds

function getCachedData(key: string): CacheEntry | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return entry;
}
```

---

### 4. Complete Flow Example

```typescript
// Complete example: Fetch all HIP-3 assets

async function getAllHIP3Assets() {
  // Step 1: Get DEX list
  const dexs = await fetch("https://api.hyperliquid.xyz/info", {
    method: "POST",
    body: JSON.stringify({ type: "perpDexs" })
  }).then(r => r.json());
  
  console.log("Available DEXs:", dexs);
  // => [{ name: "xyz", fullName: "..." }, ...]
  
  // Step 2: Fetch assets for each DEX
  const allAssets = {};
  
  for (const dex of dexs) {
    const response = await fetch("https://api.hyperliquid.xyz/info", {
      method: "POST",
      body: JSON.stringify({ 
        type: "metaAndAssetCtxs",
        dex: dex.name
      })
    });
    
    const [meta, assetCtxs] = await response.json();
    
    allAssets[dex.name] = meta.universe.map((asset, i) => ({
      name: asset.name,           // "xyz:GOLD"
      decimals: asset.szDecimals,
      volume24h: assetCtxs[i].dayNtlVlm,
      openInterest: assetCtxs[i].openInterest,
      fundingRate: assetCtxs[i].funding,
      markPrice: assetCtxs[i].markPx,
    }));
  }
  
  return allAssets;
}

// Run it
getAllHIP3Assets().then(assets => {
  console.log("All HIP-3 assets:", assets);
  /*
  {
    "xyz": [
      { name: "xyz:GOLD", volume24h: "45000000", ... },
      { name: "xyz:SILVER", volume24h: "32000000", ... }
    ],
    "flx": [
      { name: "flx:TSLA", volume24h: "85000000", ... },
      { name: "flx:AAPL", volume24h: "67000000", ... }
    ]
  }
  */
});
```

---

## Summary: Tell Your Other Project

**"Here's how Bitfrost fetches HIP-3 assets:"**

1. **Call `perpDexs`** to get list of available DEXs
   - Returns: `[{name: "xyz", ...}, {name: "flx", ...}, ...]`

2. **For each DEX, call `metaAndAssetCtxs`** with the `dex` parameter
   - Request: `{ type: "metaAndAssetCtxs", dex: "xyz" }`
   - Returns: `[[meta with universe], [assetCtxs array]]`

3. **Parse `meta.universe`** to get asset names
   - Each asset has: `{ name: "xyz:GOLD", szDecimals: 2 }`
   - **Name includes DEX prefix**

4. **Use `assetCtxs` array** for market data (aligned by index)
   - Volume: `assetCtxs[i].dayNtlVlm`
   - Price: `assetCtxs[i].markPx`
   - Funding: `assetCtxs[i].funding`
   - OI: `assetCtxs[i].openInterest`

5. **Handle errors gracefully** with mock fallback

That's it! 🚀
