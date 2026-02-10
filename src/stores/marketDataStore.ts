/**
 * Centralized Market Data Store
 * Single source of truth for all exchange and asset information
 */

import { create } from 'zustand';
import { fetch24hTicker } from '../services/priceService';

// Exchange information
export interface Exchange {
  id: string;
  name: string;
  enabled: boolean;
}

// Asset/Token information
export interface Asset {
  symbol: string; // e.g., "BTC"
  name: string;
  perpSymbol: string; // e.g., "BTC:PERP-USD"
  binanceSymbol: string; // e.g., "BTCUSDT"
  marketCap: number; // Market cap in USD
  marketCapRank: number; // Rank by market cap (1 = highest)
  marketData: {
    price: number;
    high24h: number;
    low24h: number;
    volume24h: number;
    priceChange24h: number;
    priceChangePercent24h: number;
    openInterest?: number; // Open Interest in USD (for perpetual futures)
  };
}

interface MarketDataState {
  // Exchanges
  exchanges: Exchange[];
  
  // Assets
  assets: Map<string, Asset>;
  
  // Loading states
  isLoadingAssets: boolean;
  
  // Actions
  setExchanges: (exchanges: Exchange[]) => void;
  updateAsset: (symbol: string, data: Partial<Asset>) => void;
  refreshAssetData: (symbol: string) => Promise<void>;
  refreshAllAssets: () => Promise<void>;
  getAsset: (symbol: string) => Asset | undefined;
  getEnabledExchanges: () => Exchange[];
}

// Default exchanges
const DEFAULT_EXCHANGES: Exchange[] = [
  { id: 'hyperliquid', name: 'Hyperliquid', enabled: false },
  { id: 'paradex', name: 'Paradex', enabled: false },
  { id: 'aster', name: 'Aster', enabled: false },
  { id: 'binance', name: 'Binance', enabled: false },
  { id: 'bybit', name: 'Bybit', enabled: false },
  { id: 'okx', name: 'OKX', enabled: false },
];

// Top 20 perpetual assets
const TOP_ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin', binanceSymbol: 'BTCUSDT' },
  { symbol: 'ETH', name: 'Ethereum', binanceSymbol: 'ETHUSDT' },
  { symbol: 'SOL', name: 'Solana', binanceSymbol: 'SOLUSDT' },
  { symbol: 'XRP', name: 'Ripple', binanceSymbol: 'XRPUSDT' },
  { symbol: 'BNB', name: 'BNB', binanceSymbol: 'BNBUSDT' },
  { symbol: 'ADA', name: 'Cardano', binanceSymbol: 'ADAUSDT' },
  { symbol: 'DOGE', name: 'Dogecoin', binanceSymbol: 'DOGEUSDT' },
  { symbol: 'AVAX', name: 'Avalanche', binanceSymbol: 'AVAXUSDT' },
  { symbol: 'DOT', name: 'Polkadot', binanceSymbol: 'DOTUSDT' },
  { symbol: 'POL', name: 'Polygon', binanceSymbol: 'POLUSDT' }, // Updated from MATIC to POL (Polygon's new token)
  { symbol: 'LINK', name: 'Chainlink', binanceSymbol: 'LINKUSDT' },
  { symbol: 'UNI', name: 'Uniswap', binanceSymbol: 'UNIUSDT' },
  { symbol: 'ATOM', name: 'Cosmos', binanceSymbol: 'ATOMUSDT' },
  { symbol: 'LTC', name: 'Litecoin', binanceSymbol: 'LTCUSDT' },
  { symbol: 'APT', name: 'Aptos', binanceSymbol: 'APTUSDT' },
  { symbol: 'ARB', name: 'Arbitrum', binanceSymbol: 'ARBUSDT' },
  { symbol: 'OP', name: 'Optimism', binanceSymbol: 'OPUSDT' },
  { symbol: 'SUI', name: 'Sui', binanceSymbol: 'SUIUSDT' },
  { symbol: 'TIA', name: 'Celestia', binanceSymbol: 'TIAUSDT' },
  { symbol: 'INJ', name: 'Injective', binanceSymbol: 'INJUSDT' },
];

// Initialize default assets
const createDefaultAsset = (config: typeof TOP_ASSETS[0]): Asset => ({
  symbol: config.symbol,
  name: config.name,
  perpSymbol: `${config.symbol}:PERP-USD`,
  binanceSymbol: config.binanceSymbol,
  marketCap: 0,
  marketCapRank: 0,
  marketData: {
    price: 0,
    high24h: 0,
    low24h: 0,
    volume24h: 0,
    priceChange24h: 0,
    priceChangePercent24h: 0,
  },
});

const initializeAssets = (): Map<string, Asset> => {
  const map = new Map<string, Asset>();
  TOP_ASSETS.forEach(config => {
    map.set(config.symbol, createDefaultAsset(config));
  });
  return map;
};

export const useMarketDataStore = create<MarketDataState>((set, get) => ({
  exchanges: DEFAULT_EXCHANGES,
  assets: initializeAssets(),
  isLoadingAssets: false,
  
  setExchanges: (exchanges) => set({ exchanges }),
  
  updateAsset: (symbol, data) => {
    const assets = new Map(get().assets);
    const existingAsset = assets.get(symbol);
    if (existingAsset) {
      assets.set(symbol, { ...existingAsset, ...data });
      set({ assets });
    }
  },
  
  refreshAssetData: async (symbol) => {
    const asset = get().assets.get(symbol);
    if (!asset) return;
    
    try {
      const perpSymbol = `${symbol}:PERP-USD`;
      const data = await fetch24hTicker(perpSymbol);
      
      get().updateAsset(symbol, {
        marketData: {
          price: data.price,
          high24h: data.high,
          low24h: data.low,
          volume24h: data.volume,
          priceChange24h: data.priceChange,
          priceChangePercent24h: data.priceChangePercent,
          openInterest: data.openInterest,
        },
      });
    } catch (error) {
      // Silently use fallback data - timeout errors are handled gracefully
      console.debug(`Using fallback data for ${symbol} due to:`, error);
    }
  },
  
  refreshAllAssets: async () => {
    set({ isLoadingAssets: true });
    
    const symbols = Array.from(get().assets.keys());
    
    // Refresh all assets in parallel
    await Promise.all(
      symbols.map(symbol => get().refreshAssetData(symbol))
    );
    
    set({ isLoadingAssets: false });
  },
  
  getAsset: (symbol) => {
    return get().assets.get(symbol);
  },
  
  getEnabledExchanges: () => {
    return get().exchanges.filter(ex => ex.enabled);
  },
}));