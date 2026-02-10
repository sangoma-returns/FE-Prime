// ============================================
// OPTIMIZED RWA DATA FETCHING
// Strategy: Load xyz DEX first for instant feedback, 
// then load others in background
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
const CACHE_TTL = 90000; // 90 seconds - RWA data changes slowly

function getCachedData(key: string): CacheEntry | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  console.log(`✅ Cache hit for ${key} (age: ${(age / 1000).toFixed(1)}s)`);
  return entry;
}

function setCachedData(key: string, entry: CacheEntry): void {
  cache.set(key, entry);
}

// Mock data for instant fallback
const MOCK_DATA = {
  commodities: [
    { symbol: 'GOLD:PERP-USDC', volume24h: '$125M', volume24hUsd: 125000000, oi: '$45M', oiUsd: 45000000, change24h: 0.5, price: 5032.0, dataSource: 'mock', dex: 'xyz' },
    { symbol: 'SILVER:PERP-USDC', volume24h: '$85M', volume24hUsd: 85000000, oi: '$32M', oiUsd: 32000000, change24h: 1.2, price: 99.155, dataSource: 'mock', dex: 'xyz' },
    { symbol: 'COPPER:PERP-USDC', volume24h: '$45M', volume24hUsd: 45000000, oi: '$18M', oiUsd: 18000000, change24h: -0.3, price: 6.0203, dataSource: 'mock', dex: 'xyz' },
  ],
  stocks: [
    { symbol: 'AAPL:PERP-USDC', volume24h: '$250M', volume24hUsd: 250000000, oi: '$95M', oiUsd: 95000000, change24h: -0.8, price: 257.55, dataSource: 'mock', dex: 'xyz' },
    { symbol: 'NVDA:PERP-USDC', volume24h: '$310M', volume24hUsd: 310000000, oi: '$120M', oiUsd: 120000000, change24h: 2.1, price: 192.32, dataSource: 'mock', dex: 'xyz' },
    { symbol: 'TSLA:PERP-USDC', volume24h: '$195M', volume24hUsd: 195000000, oi: '$75M', oiUsd: 75000000, change24h: 1.5, price: 429.42, dataSource: 'mock', dex: 'xyz' },
  ],
  indices: [
    { symbol: 'US500:PERP-USDC', volume24h: '$400M', volume24hUsd: 400000000, oi: '$150M', oiUsd: 150000000, change24h: 0.3, price: 6932.7, dataSource: 'mock', dex: 'xyz' },
    { symbol: 'USTECH:PERP-USDC', volume24h: '$280M', volume24hUsd: 280000000, oi: '$105M', oiUsd: 105000000, change24h: 0.6, price: 627.05, dataSource: 'mock', dex: 'xyz' },
  ],
};

// ============================================
// FAST SINGLE DEX FETCH - Optimized for speed
// ============================================
export async function fetchSingleDexRWADataFast(
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
  
  console.log(`⚡ Fast-fetching RWA data from ${dex}...`);
  const startTime = Date.now();
  
  try {
    // Fetch symbols list
    const controller1 = new AbortController();
    const timeout1 = setTimeout(() => controller1.abort(), 8000); // 8s timeout
    
    const rwaResponse = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-9f8d65d6/hyperliquid/rwa?dex=${dex}`,
      {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        signal: controller1.signal,
      }
    );
    
    clearTimeout(timeout1);
    
    if (!rwaResponse.ok) {
      throw new Error(`RWA list failed: ${rwaResponse.status}`);
    }
    
    const rwaList = await rwaResponse.json();
    
    // If we got mock data from the backend, return it immediately
    if (rwaList.source === 'mock') {
      console.log(`⚠️ ${dex} returned mock data`);
      setRwaDataSource('mock');
      setRwaError(rwaList.liveError || 'Using mock data');
      
      // Use backend mock data if available, otherwise use local mock
      const mockResult = rwaList.rwaAssets ? {
        commodities: (rwaList.rwaAssets.commodities || []).map((symbol: string) => ({
          symbol: `${symbol}:PERP-USDC`,
          volume24h: '$100M',
          volume24hUsd: 100000000,
          oi: '$40M',
          oiUsd: 40000000,
          change24h: Math.random() * 2 - 1,
          price: 100,
          dataSource: 'mock',
          dex,
        })),
        stocks: (rwaList.rwaAssets.stocks || []).map((symbol: string) => ({
          symbol: `${symbol}:PERP-USDC`,
          volume24h: '$100M',
          volume24hUsd: 100000000,
          oi: '$40M',
          oiUsd: 40000000,
          change24h: Math.random() * 2 - 1,
          price: 100,
          dataSource: 'mock',
          dex,
        })),
        indices: (rwaList.rwaAssets.indices || []).map((symbol: string) => ({
          symbol: `${symbol}:PERP-USDC`,
          volume24h: '$100M',
          volume24hUsd: 100000000,
          oi: '$40M',
          oiUsd: 40000000,
          change24h: Math.random() * 2 - 1,
          price: 100,
          dataSource: 'mock',
          dex,
        })),
      } : MOCK_DATA;
      
      setCachedData(cacheKey, {
        data: mockResult,
        timestamp: Date.now(),
        source: 'mock',
        error: rwaList.liveError || null,
      });
      
      return mockResult;
    }
    
    const hip3Symbols = rwaList.symbols || [];
    console.log(`✓ Got ${hip3Symbols.length} symbols from ${dex}`);
    
    // Fetch asset details
    const controller2 = new AbortController();
    const timeout2 = setTimeout(() => controller2.abort(), 10000); // 10s timeout
    
    const detailsResp = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-9f8d65d6/hyperliquid/asset-details?dex=${dex}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ symbols: hip3Symbols, dex }),
        signal: controller2.signal,
      }
    );
    
    clearTimeout(timeout2);
    
    if (!detailsResp.ok) {
      throw new Error(`Asset details failed: ${detailsResp.status}`);
    }
    
    const detailsData = await detailsResp.json();
    
    // Process data
    const commoditiesData = (rwaList.rwaAssets?.commodities || [])
      .map((symbol: string) => {
        const detail = detailsData.details?.[symbol];
        return detail ? {
          symbol: `${detail.symbol}:PERP-USDC`,
          volume24h: detail.volume24h,
          volume24hUsd: detail.volume24hUsd || 0,
          oi: detail.oi,
          oiUsd: detail.oiUsd || 0,
          change24h: detail.change24h || 0,
          price: detail.price || 0,
          dataSource: detail.dataSource || 'live',
          dex,
        } : null;
      })
      .filter((asset: any) => asset);
    
    const stocksData = (rwaList.rwaAssets?.stocks || [])
      .map((symbol: string) => {
        const detail = detailsData.details?.[symbol];
        return detail ? {
          symbol: `${detail.symbol}:PERP-USDC`,
          volume24h: detail.volume24h,
          volume24hUsd: detail.volume24hUsd || 0,
          oi: detail.oi,
          oiUsd: detail.oiUsd || 0,
          change24h: detail.change24h || 0,
          price: detail.price || 0,
          dataSource: detail.dataSource || 'live',
          dex,
        } : null;
      })
      .filter((asset: any) => asset);
    
    const indicesData = (rwaList.rwaAssets?.indices || [])
      .map((symbol: string) => {
        const detail = detailsData.details?.[symbol];
        return detail ? {
          symbol: `${detail.symbol}:PERP-USDC`,
          volume24h: detail.volume24h,
          volume24hUsd: detail.volume24hUsd || 0,
          oi: detail.oi,
          oiUsd: detail.oiUsd || 0,
          change24h: detail.change24h || 0,
          price: detail.price || 0,
          dataSource: detail.dataSource || 'live',
          dex,
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
    console.log(`✅ Loaded ${totalAssets} assets from ${dex} in ${(elapsed / 1000).toFixed(2)}s`);
    
    setRwaDataSource('live');
    setRwaError(null);
    
    // Cache result
    setCachedData(cacheKey, {
      data: result,
      timestamp: Date.now(),
      source: 'live',
      error: null,
    });
    
    return result;
    
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.warn(`⚠️ ${dex} failed after ${(elapsed / 1000).toFixed(1)}s:`, error);
    
    setRwaDataSource('mock');
    setRwaError(error instanceof Error ? error.message : 'Failed to load data');
    
    // Return mock data on error
    setCachedData(cacheKey, {
      data: MOCK_DATA,
      timestamp: Date.now(),
      source: 'mock',
      error: error instanceof Error ? error.message : null,
    });
    
    return MOCK_DATA;
  }
}

// ============================================
// PROGRESSIVE LOAD - Load primary DEX first, others after
// ============================================
export async function fetchAllDexsRWADataProgressive(
  projectId: string,
  publicAnonKey: string,
  setRwaDataSource: (source: 'live' | 'mock' | null) => void,
  setRwaError: (error: string | null) => void,
  onPartialData?: (data: any) => void // Callback for progressive updates
) {
  const cacheKey = 'all-dexs-progressive';
  
  // Check cache first
  const cached = getCachedData(cacheKey);
  if (cached) {
    setRwaDataSource(cached.source);
    setRwaError(cached.error);
    return cached.data;
  }
  
  console.log('⚡ Progressive RWA fetch: Loading xyz first...');
  
  // Load primary DEX (xyz) first for instant feedback
  const primaryData = await fetchSingleDexRWADataFast(
    projectId,
    publicAnonKey,
    'xyz',
    setRwaDataSource,
    setRwaError
  );
  
  // Return primary data immediately
  if (onPartialData) {
    onPartialData(primaryData);
  }
  
  // Load remaining DEXs in background (don't await)
  const otherDexs = ['vntl', 'km', 'cash', 'flx', 'hyna'];
  
  // Fetch all other DEXs in parallel, but don't block
  Promise.all(
    otherDexs.map(dex => 
      fetchSingleDexRWADataFast(projectId, publicAnonKey, dex, () => {}, () => {})
        .catch(() => null)
    )
  ).then(results => {
    // Combine all data
    const allData = [primaryData, ...results.filter(r => r)];
    
    const combined = {
      commodities: allData.flatMap(d => d.commodities),
      stocks: allData.flatMap(d => d.stocks),
      indices: allData.flatMap(d => d.indices),
    };
    
    console.log(`✅ Progressive load complete: ${combined.commodities.length + combined.stocks.length + combined.indices.length} total assets`);
    
    // Cache combined result
    setCachedData(cacheKey, {
      data: combined,
      timestamp: Date.now(),
      source: 'live',
      error: null,
    });
    
    // Notify with final data
    if (onPartialData) {
      onPartialData(combined);
    }
  });
  
  // Return primary data immediately - don't wait for others
  return primaryData;
}
