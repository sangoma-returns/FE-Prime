// ============================================
// CACHE SYSTEM - 30 second cache for RWA data
// ============================================

interface CacheEntry {
  data: {
    commodities: any[];
    stocks: any[];
    indices: any[];
  };
  timestamp: number;
  source: 'live' | 'mock';
  error: string | null;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 30000; // 30 seconds

function getCachedData(key: string): CacheEntry | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  console.log(`✅ Using cached data for ${key} (age: ${(age / 1000).toFixed(1)}s)`);
  return entry;
}

function setCachedData(key: string, entry: CacheEntry): void {
  cache.set(key, entry);
}

// ============================================
// PARALLEL FETCH - All DEXs at once
// ============================================
export async function fetchAllDexsRWAData(
  projectId: string,
  publicAnonKey: string,
  setRwaDataSource: (source: 'live' | 'mock' | null) => void,
  setRwaError: (error: string | null) => void
) {
  const cacheKey = 'all-dexs';
  
  // Check cache first
  const cached = getCachedData(cacheKey);
  if (cached) {
    setRwaDataSource(cached.source);
    setRwaError(cached.error);
    return cached.data;
  }
  
  console.log('⚡ Fetching RWA data from ALL DEXs in parallel...');
  const startTime = Date.now();
  
  // Include ALL HIP-3 DEXs: RWA DEXs (xyz, vntl, km, cash) AND crypto DEXs (flx, hyna)
  const allDexs = ['xyz', 'vntl', 'km', 'cash', 'flx', 'hyna'];
  
  // STEP 1: Fetch all symbol lists in PARALLEL
  const symbolListPromises = allDexs.map(async (dex) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9f8d65d6/hyperliquid/rwa?dex=${dex}`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      });
      
      if (!response.ok) {
        // Silently skip - expected during page load
        return null;
      }
      
      const data = await response.json();
      return { dex, data };
    } catch (error) {
      // Silently skip fetch errors - not critical for app functionality
      return null;
    }
  });
  
  const symbolListResults = await Promise.all(symbolListPromises);
  
  // Process results
  const allSymbols: Array<{ symbol: string; dex: string; category: 'commodities' | 'stocks' | 'indices' }> = [];
  let hasLiveData = false;
  let combinedError: string | null = null;
  
  for (const result of symbolListResults) {
    if (!result) continue;
    
    const { dex, data: rwaList } = result;
    
    if (rwaList.source === 'live') {
      hasLiveData = true;
      console.log(`✓ ${dex}: ${rwaList.symbols?.length || 0} symbols (live)`);
    } else {
      console.log(`⚠️ ${dex}: mock data`);
      if (rwaList.liveError && !combinedError) {
        combinedError = rwaList.liveError;
      }
    }
    
    // Add symbols from each DEX
    if (rwaList.rwaAssets) {
      rwaList.rwaAssets.commodities?.forEach((symbol: string) => {
        allSymbols.push({ symbol, dex, category: 'commodities' });
      });
      rwaList.rwaAssets.stocks?.forEach((symbol: string) => {
        allSymbols.push({ symbol, dex, category: 'stocks' });
      });
      rwaList.rwaAssets.indices?.forEach((symbol: string) => {
        allSymbols.push({ symbol, dex, category: 'indices' });
      });
    }
  }
  
  console.log(`✓ Combined ${allSymbols.length} symbols from ${symbolListResults.filter(r => r).length} DEXs`);
  
  // STEP 2: Fetch details for all DEXs in PARALLEL
  const detailsPromises = allDexs.map(async (dex) => {
    const symbolsForDex = allSymbols
      .filter((symbolInfo) => symbolInfo.dex === dex)
      .map((symbolInfo) => symbolInfo.symbol);
    
    if (symbolsForDex.length === 0) return { dex, details: {} };
    
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9f8d65d6/hyperliquid/asset-details?dex=${dex}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ symbols: symbolsForDex, dex }),
      });
      
      if (response.ok) {
        const detailsData = await response.json();
        console.log(`✓ ${dex}: ${symbolsForDex.length} asset details`);
        return { dex, details: detailsData.details || {} };
      }
    } catch (error) {
      console.warn(`Error fetching details from ${dex}:`, error);
    }
    
    return { dex, details: {} };
  });
  
  const detailsResults = await Promise.all(detailsPromises);
  
  // Build details map
  const detailsByDex = new Map<string, any>();
  for (const { dex, details } of detailsResults) {
    detailsByDex.set(dex, details);
  }
  
  // STEP 3: Combine all details by category
  const commoditiesData: any[] = [];
  const stocksData: any[] = [];
  const indicesData: any[] = [];
  
  for (const symbolInfo of allSymbols) {
    const details = detailsByDex.get(symbolInfo.dex)?.[symbolInfo.symbol];
    
    if (details) {
      const assetData = {
        symbol: `${details.symbol}:PERP-USDC`,
        volume24h: details.volume24h,
        volume24hUsd: details.volume24hUsd || 0,
        oi: details.oi,
        oiUsd: details.oiUsd || 0,
        change24h: details.change24h || 0,
        price: details.price || 0,
        dataSource: details.dataSource || 'unknown',
        dex: symbolInfo.dex,
      };
      
      if (symbolInfo.category === 'commodities') {
        commoditiesData.push(assetData);
      } else if (symbolInfo.category === 'stocks') {
        stocksData.push(assetData);
      } else if (symbolInfo.category === 'indices') {
        indicesData.push(assetData);
      }
    }
  }
  
  const totalAssets = commoditiesData.length + stocksData.length + indicesData.length;
  const elapsed = Date.now() - startTime;
  console.log(`⚡ Loaded ${totalAssets} assets in ${(elapsed / 1000).toFixed(2)}s (${commoditiesData.length} commodities, ${stocksData.length} stocks, ${indicesData.length} indices)`);
  
  const result = {
    commodities: commoditiesData,
    stocks: stocksData,
    indices: indicesData,
  };
  
  // Set state
  const source = hasLiveData ? 'live' : 'mock';
  const error = hasLiveData ? null : (combinedError || 'All DEXs returned mock data');
  setRwaDataSource(source);
  setRwaError(error);
  
  // Cache the result
  setCachedData(cacheKey, {
    data: result,
    timestamp: Date.now(),
    source,
    error,
  });
  
  return result;
}

// ============================================
// SINGLE DEX FETCH with caching
// ============================================
export async function fetchSingleDexRWAData(
  projectId: string,
  publicAnonKey: string,
  dex: string,
  setRwaDataSource: (source: 'live' | 'mock' | null) => void,
  setRwaError: (error: string | null) => void
) {
  const cacheKey = `dex-${dex}`;
  
  // Check cache first
  const cached = getCachedData(cacheKey);
  if (cached) {
    setRwaDataSource(cached.source);
    setRwaError(cached.error);
    return cached.data;
  }
  
  console.log(`⚡ Fetching RWA data for ${dex}...`);
  const startTime = Date.now();
  
  try {
    // Fetch symbol list and details in parallel
    const [rwaResponse, detailsResponse] = await Promise.all([
      fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9f8d65d6/hyperliquid/rwa?dex=${dex}`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      }),
      // We'll get symbols first, but prep the details fetch
      null as any, // Placeholder - we'll do two-step for now
    ]);
    
    if (!rwaResponse.ok) {
      throw new Error(`Failed to fetch RWA list: ${rwaResponse.status}`);
    }
    
    const rwaList = await rwaResponse.json();
    const hip3Symbols = rwaList.symbols || [];
    
    // Now fetch details
    const detailsResp = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9f8d65d6/hyperliquid/asset-details?dex=${dex}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ symbols: hip3Symbols, dex }),
    });
    
    if (!detailsResp.ok) {
      throw new Error(`Failed to fetch asset details: ${detailsResp.status}`);
    }
    
    const detailsData = await detailsResp.json();
    
    if (!detailsData.details) {
      throw new Error('No details object in response');
    }
    
    // Process data
    const commoditiesData = (rwaList.rwaAssets?.commodities || [])
      .map((symbol: string) => {
        const detail = detailsData.details[symbol];
        return detail ? {
          symbol: `${detail.symbol}:PERP-USDC`,
          volume24h: detail.volume24h,
          volume24hUsd: detail.volume24hUsd || 0,
          oi: detail.oi,
          oiUsd: detail.oiUsd || 0,
          change24h: detail.change24h || 0,
          price: detail.price || 0,
          dataSource: detail.dataSource || 'unknown',
        } : null;
      })
      .filter((asset: any) => asset);
    
    const stocksData = (rwaList.rwaAssets?.stocks || [])
      .map((symbol: string) => {
        const detail = detailsData.details[symbol];
        return detail ? {
          symbol: `${detail.symbol}:PERP-USDC`,
          volume24h: detail.volume24h,
          volume24hUsd: detail.volume24hUsd || 0,
          oi: detail.oi,
          oiUsd: detail.oiUsd || 0,
          change24h: detail.change24h || 0,
          price: detail.price || 0,
          dataSource: detail.dataSource || 'unknown',
        } : null;
      })
      .filter((asset: any) => asset);
    
    const indicesData = (rwaList.rwaAssets?.indices || [])
      .map((symbol: string) => {
        const detail = detailsData.details[symbol];
        return detail ? {
          symbol: `${detail.symbol}:PERP-USDC`,
          volume24h: detail.volume24h,
          volume24hUsd: detail.volume24hUsd || 0,
          oi: detail.oi,
          oiUsd: detail.oiUsd || 0,
          change24h: detail.change24h || 0,
          price: detail.price || 0,
          dataSource: detail.dataSource || 'unknown',
        } : null;
      })
      .filter((asset: any) => asset);
    
    const result = {
      commodities: commoditiesData,
      stocks: stocksData,
      indices: indicesData,
    };
    
    const elapsed = Date.now() - startTime;
    const totalAssets = commoditiesData.length + stocksData.length + indicesData.length;
    console.log(`⚡ Loaded ${totalAssets} assets from ${dex} in ${(elapsed / 1000).toFixed(2)}s`);
    
    // Set state
    const source = rwaList.source || 'mock';
    const error = rwaList.source === 'live' ? null : (rwaList.liveError || 'Failed to load live data');
    setRwaDataSource(source);
    setRwaError(error);
    
    // Cache result
    setCachedData(cacheKey, {
      data: result,
      timestamp: Date.now(),
      source,
      error,
    });
    
    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to fetch RWA data';
    setRwaError(errorMsg);
    setRwaDataSource('mock');
    throw error;
  }
}