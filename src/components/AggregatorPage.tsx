/**
 * Professional Trading Terminal - Light Institutional Theme
 */

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, TrendingUp, SlidersHorizontal, Network, Leaf, Type, Smile, Ruler, ZoomIn, Magnet, Edit, Briefcase, HelpCircle } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';
import { useAppStore } from '../stores/appStore';
import { useTradesStore } from '../stores/tradesStore';
import { usePricesStore } from '../stores/pricesStore';
import { useMarketDataStore } from '../stores/marketDataStore';
import type { CreateOrderRequest } from '../types';
import { TradingChart } from './TradingChart';
import TradeHistory from './TradeHistory';
import { OrdersSection } from './AggregatorPageOrders';
import { Tooltip } from './Tooltip';
import { fetchCurrentPrice, subscribeToPrice, subscribeToOrderBook, fetch24hTicker, type OrderBook } from '../services/priceService';
import { usePositionsStore } from '../stores/positionsStore';
import { useFundingRatesStore } from '../stores/fundingRatesStore';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { fetchAllDexsRWAData, fetchSingleDexRWAData } from './AggregatorPageFetchHelper';
import { fetchSingleDexRWADataFast } from './AggregatorPageFetchHelperOptimized';
import { 
  fetchPerpDexs, 
  getMarketMetrics, 
  subscribeToHyperliquidOrderBook,
  type MarketMetrics,
  type HyperliquidL2Book
} from '../services/hyperliquidMarketService';

interface AggregatorPageProps {
  enabledExchanges: string[];
  onCreateOrder: (orderRequest: CreateOrderRequest) => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenTransfer: () => void;
  onNavigate?: (page: string) => void;
}

// Fallback orderbook generator
const generateFallbackOrderBook = (basePrice: number) => {
  const bestBid = basePrice - 0.01;
  const bestAsk = basePrice + 0.01;
  
  const asks = Array.from({ length: 15 }, (_, i) => {
    const offset = (15 - i) * 0.1;
    return {
      price: (basePrice + offset).toFixed(2),
      size: (Math.random() * 10 + 0.5).toFixed(4),
      total: ((Math.random() * 900 + 100) / 1000).toFixed(2) + 'k'
    };
  });
  const bids = Array.from({ length: 15 }, (_, i) => {
    const offset = i * 0.1;
    return {
      price: (basePrice - offset).toFixed(2),
      size: (Math.random() * 10 + 0.5).toFixed(4),
      total: ((Math.random() * 900 + 100) / 1000).toFixed(2) + 'k'
    };
  });
  
  return { asks, bids, lastUpdateId: 0, bestBid, bestAsk };
};

export function AggregatorPage({
  enabledExchanges,
  onCreateOrder,
  onNavigate,
}: AggregatorPageProps) {
  const { colors, theme } = useThemeStore();
  const { addTradeToHistory, addOpenOrder } = useAppStore();
  const { addTrade, addOrder, addHistoryEntry, updatePositions } = useTradesStore();
  const { prices, getPrice, updatePrice } = usePricesStore();
  const { exchanges, assets, refreshAssetData, getAsset } = useMarketDataStore();
  const { addPosition } = usePositionsStore();
  const { rates: fundingRates, getRate: getFundingRate } = useFundingRatesStore();
  const openOrders = useTradesStore((state) => state.openOrders);
  const [activeTab, setActiveTab] = useState('openOrders');
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
  const [exitConditionsOpen, setExitConditionsOpen] = useState(false);
  const [takeProfitUrgency, setTakeProfitUrgency] = useState('High');
  const [stopLossUrgency, setStopLossUrgency] = useState('High');
  const [scaleOrdersOpen, setScaleOrdersOpen] = useState(false);
  const [priceUnit, setPriceUnit] = useState('%');
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [exchangesDropdownOpen, setExchangesDropdownOpen] = useState(false);
  const [selectedExchanges, setSelectedExchanges] = useState<string[]>([]);
  const [exchangeType, setExchangeType] = useState<'crypto' | 'rwa'>('crypto'); // Toggle between crypto exchanges and RWA DEXs
  const [strategiesDropdownOpen, setStrategiesDropdownOpen] = useState(false);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>(['Impact Minimization']);
  const [assetDropdownOpen, setAssetDropdownOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState('BTC:PERP-USD');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [assetType, setAssetType] = useState<'crypto' | 'rwa'>('crypto');
  const [rwaCategory, setRwaCategory] = useState<'all' | 'commodities' | 'stocks' | 'indices'>('all');
  const [selectedDex, setSelectedDex] = useState<'all' | 'xyz' | 'vntl' | 'km' | 'cash' | 'flx' | 'hyna'>('all'); // HIP-3 DEX selector (includes RWA and crypto DEXs)
  const [availableDexs, setAvailableDexs] = useState<Array<{ name: string; fullName: string }>>([]); // Available DEXs from Hyperliquid
  const [marketMetrics, setMarketMetrics] = useState<MarketMetrics | null>(null); // Comprehensive market data from Hyperliquid
  const [rwaData, setRwaData] = useState<{
    commodities: Array<{ symbol: string; volume24h: string; oi: string; change24h: number }>;
    stocks: Array<{ symbol: string; volume24h: string; oi: string; change24h: number }>;
    indices: Array<{ symbol: string; volume24h: string; oi: string; change24h: number }>;
  }>({ commodities: [], stocks: [], indices: [] });
  const [rwaLoading, setRwaLoading] = useState(false);
  const [rwaDataSource, setRwaDataSource] = useState<'live' | 'mock' | null>(null); // Track if data is live or mock
  const [rwaError, setRwaError] = useState<string | null>(null); // Track API errors
  const scrollableRef = useRef<HTMLDivElement>(null);
  const exchangesDropdownRef = useRef<HTMLDivElement>(null);
  const assetDropdownRef = useRef<HTMLDivElement>(null);
  const strategiesDropdownRef = useRef<HTMLDivElement>(null);
  
  // Solver data state
  const [solverData, setSolverData] = useState<{
    openInterest: string;
    funding: string;
    premium: string;
    oraclePx: string;
    markPx: string;
    midPx: string;
  } | null>(null);
  
  // Form input states
  const [btcAmount, setBtcAmount] = useState('');
  const [usdtAmount, setUsdtAmount] = useState('');
  const isBtcAmountLocked = usdtAmount.trim().length > 0;
  const isUsdtAmountLocked = btcAmount.trim().length > 0;
  const sanitizeNumberInput = (value: string) => {
    const normalized = value.replace(/,/g, '.');
    const cleaned = normalized.replace(/[^0-9.]/g, '');
    const firstDot = cleaned.indexOf('.');
    if (firstDot === -1) return cleaned;
    return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
  };
  const [limitPrice, setLimitPrice] = useState('');
  const [limitPriceMode, setLimitPriceMode] = useState('Dynamic');
  const [duration, setDuration] = useState('5');
  const [timezone, setTimezone] = useState('Europe/London UTC+00:00');
  const [timeStart, setTimeStart] = useState('01/23/2026 20:00');
  const [timeEnd, setTimeEnd] = useState('01/23/2026 20:05');
  const [trajectory, setTrajectory] = useState('VWAP');
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [ioc, setIoc] = useState(false);
  const [pause, setPause] = useState(false);
  const [grid, setGrid] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<any[]>([]);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [showLoadTemplateModal, setShowLoadTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  
  // ====== CANONICAL MARKET IDENTIFIER ======
  // This is the single source of truth for the selected market
  // For HIP-3 assets like "xyz:SILVER", hlCoin = "xyz:SILVER" and dex = "xyz"
  // For crypto assets like "BTC:PERP-USD", hlCoin = "BTC" and dex = null
  const parseSelectedMarket = (asset: string): { hlCoin: string; dex: string | null; isCrypto: boolean; isHIP3: boolean } => {
    const parts = asset.split(':');
    if (parts.length < 2) {
      return { hlCoin: asset, dex: null, isCrypto: true, isHIP3: false };
    }
    
    const firstPart = parts[0].toLowerCase();
    const secondPart = parts[1]?.toLowerCase() || '';
    
    // Known crypto assets
    const cryptoAssets = ['btc', 'eth', 'sol', 'avax', 'matic', 'arb', 'op', 'link', 'uni', 'aave', 'atom', 'dot', 'ada', 'xrp', 'doge', 'shib', 'bnb', 'ltc', 'etc'];
    
    // Check if this is a HIP-3 DEX prefix (includes RWA and crypto DEXs)
    const dexNames = ['xyz', 'vntl', 'km', 'cash', 'flx', 'hyna'];
    
    if (dexNames.includes(firstPart)) {
      // Format: "xyz:SILVER" - this is HIP-3
      // The hlCoin is the FULL string including the prefix
      return {
        hlCoin: asset, // CRITICAL: Do not strip the prefix!
        dex: firstPart,
        isCrypto: false,
        isHIP3: true
      };
    }
    
    if (cryptoAssets.includes(firstPart) || secondPart.includes('perp')) {
      // Format: "BTC:PERP-USD" - this is crypto
      return {
        hlCoin: firstPart.toUpperCase(),
        dex: null,
        isCrypto: true,
        isHIP3: false
      };
    }
    
    // Format: "SILVER:PERP-USD" - RWA on default DEX
    const defaultDex = selectedDex === 'all' ? 'xyz' : selectedDex;
    return {
      hlCoin: `${defaultDex}:${firstPart.toUpperCase()}`,
      dex: defaultDex,
      isCrypto: false,
      isHIP3: true
    };
  };
  
  const selectedMarket = parseSelectedMarket(selectedAsset);
  
  // Get exchanges from centralized store
  const allExchanges = exchanges.map(ex => ex.name);
  
  // RWA DEXs supported
  const RWA_DEXS = [
    { id: 'xyz', name: 'XYZ' },
    { id: 'vntl', name: 'VNTL' },
    { id: 'km', name: 'KM' },
    { id: 'cash', name: 'CASH' },
    { id: 'flx', name: 'FLX' },
    { id: 'hyna', name: 'HYNA' },
  ];
  
  // Parse selectedAsset to get base and quote tokens
  const baseToken = selectedAsset.split(':')[0]; // e.g., "BTC", "SILVER", "AAPL"
  const assetSymbol = selectedAsset.split(':')[1] || baseToken; // e.g., "SILVER", "AAPL"
  const isBtcAmountLocked = usdtAmount.trim().length > 0;
  const isUsdtAmountLocked = btcAmount.trim().length > 0;
  const quoteToken = 'USD'; // We use USD for trading pairs
  
  // Get current price and data for selected asset
  // Check if it's an RWA asset first
  const selectedRwaAsset = assetType === 'rwa' ? (() => {
    const allRwaAssets = [
      ...rwaData.commodities,
      ...rwaData.stocks,
      ...rwaData.indices,
    ];
    return allRwaAssets.find(asset => {
      const assetSymbol = asset.symbol.split(':')[0];
      return assetSymbol === baseToken;
    });
  })() : null;
  
  // Use RWA price if available, otherwise fall back to prices store
  const currentPrice = selectedRwaAsset 
    ? selectedRwaAsset.price 
    : getPrice(baseToken, 89128);
  
  // Live orderbook state
  const [orderBook, setOrderBook] = useState<OrderBook>(generateFallbackOrderBook(currentPrice));
  
  // 24h ticker data state
  const [ticker24h, setTicker24h] = useState({
    high: 0,
    low: 0,
    volume: 0,
  });
  
  // Calculate mid price and spread from live orderbook
  const bestBid = orderBook.bestBid || (orderBook.bids.length > 0 ? parseFloat(orderBook.bids[0].price) : currentPrice);
  const bestAsk = orderBook.bestAsk || (orderBook.asks.length > 0 ? parseFloat(orderBook.asks[orderBook.asks.length - 1].price) : currentPrice);
  const midPrice = (bestBid + bestAsk) / 2;
  const spread = bestAsk - bestBid;
  const spreadBps = (spread / midPrice) * 10000; // Convert to basis points
  
  // Get assets from centralized store - convert to array with market data
  const topAssets = Array.from(assets.values()).map(asset => {
    // Format Open Interest for display
    const formatOI = (oi: number | undefined) => {
      if (!oi || oi === 0) return '--';
      // Convert to billions and format
      const billions = oi / 1000000000;
      if (billions >= 1) {
        return '$' + billions.toFixed(1) + 'B';
      }
      // Convert to millions and format
      const millions = oi / 1000000;
      return '$' + millions.toFixed(0) + 'M';
    };
    
    return {
      symbol: asset.perpSymbol,
      volume24h: asset.marketData.volume24h > 0 
        ? '$' + (asset.marketData.volume24h / 1000000000).toFixed(1) + 'B' 
        : '--',
      oi: formatOI(asset.marketData.openInterest),
      change24h: asset.marketData.priceChangePercent24h,
    };
  });
  
  // Filter assets based on selected type and category
  // For RWAs, use live data from Hyperliquid HIP3
  const displayAssets = assetType === 'crypto' 
    ? topAssets 
    : (() => {
        const parseVolume = (vol: string): number => {
          // Parse "$10M" or "$1.5B" to numeric value
          const num = parseFloat(vol.replace(/[$,]/g, ''));
          if (vol.includes('B')) return num * 1000; // Convert billions to millions
          return num;
        };
        
        const assets = rwaCategory === 'all'
          ? [...rwaData.commodities, ...rwaData.stocks, ...rwaData.indices]
          : rwaData[rwaCategory];
        
        // Filter by selected DEX if not "all"
        const filteredAssets = selectedDex === 'all' 
          ? assets
          : assets.filter(asset => {
              // Check if the asset symbol starts with the selected DEX prefix
              // Format is "xyz:SILVER:PERP-USDC", so check if it starts with "xyz:"
              const symbolLower = asset.symbol.toLowerCase();
              return symbolLower.startsWith(`${selectedDex}:`);
            });
        
        // Deduplicate by removing DEX prefix and keeping only unique assets (Aggregator page only)
        // E.g., xyz:SILVER:PERP-USDC and vntl:SILVER:PERP-USDC should show as one entry
        const seenAssets = new Map<string, typeof filteredAssets[0]>();
        filteredAssets.forEach(asset => {
          // Remove DEX prefix to get the base symbol
          const baseSymbol = asset.symbol.replace(/^(xyz|vntl|km|cash|flx|hyna):/i, '');
          
          // Keep the first occurrence (or the one with highest volume if you prefer)
          if (!seenAssets.has(baseSymbol)) {
            seenAssets.set(baseSymbol, asset);
          } else {
            // Optional: Keep the one with higher volume
            const existing = seenAssets.get(baseSymbol)!;
            if (parseVolume(asset.volume24h) > parseVolume(existing.volume24h)) {
              seenAssets.set(baseSymbol, asset);
            }
          }
        });
        
        const uniqueAssets = Array.from(seenAssets.values());
        
        // Sort by volume (highest to lowest)
        return uniqueAssets.sort((a, b) => parseVolume(b.volume24h) - parseVolume(a.volume24h));
      })();
  
  const allStrategies = [
    'Impact Minimization',
    'Time Constant (TWAP)',
    'Target Participation Rate',
    'Market Maker',
    'Aggressive Maker',
    'Aggressive Taker',
    'Target Time',
    'Custom'
  ];

  const toggleExchange = (exchange: string) => {
    setSelectedExchanges(prev => 
      prev.includes(exchange) 
        ? prev.filter(e => e !== exchange)
        : [...prev, exchange]
    );
  };
  
  const toggleStrategy = (strategy: string) => {
    // Only allow one strategy to be selected at a time
    setSelectedStrategies([strategy]);
  };

  // Load templates from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('aggregatorTemplates');
    if (saved) {
      setSavedTemplates(JSON.parse(saved));
    }
  }, []);

  // Fetch available DEXs from Hyperliquid on mount
  useEffect(() => {
    const loadDexs = async () => {
      try {
        const dexs = await fetchPerpDexs();
        console.log('✓ Loaded available DEXs:', dexs);
        setAvailableDexs(dexs);
      } catch (error) {
        console.warn('Failed to load DEXs:', error);
      }
    };
    loadDexs();
  }, []);

  // Auto-detect and sync assetType based on selectedAsset
  useEffect(() => {
    const assetParts = selectedAsset.split(':');
    const firstPart = assetParts[0].toLowerCase();
    const secondPart = assetParts[1] || '';
    
    // List of known crypto assets that use PERP format
    const cryptoAssets = ['btc', 'eth', 'sol', 'avax', 'matic', 'arb', 'op', 'link', 'uni', 'aave', 'atom', 'dot', 'ada', 'xrp', 'doge', 'shib', 'bnb', 'ltc', 'etc'];
    
    // Determine if this is a crypto or RWA asset
    // Crypto assets typically have format "BTC:PERP-USD" or just "BTC:PERP"
    // RWA assets have format "GOLD:PERP-USD", "xyz:SILVER", "TSLA:PERP-USD", etc.
    const isCrypto = cryptoAssets.includes(firstPart) || 
                     (secondPart.includes('PERP') && cryptoAssets.includes(firstPart));
    
    const detectedType = isCrypto ? 'crypto' : 'rwa';
    
    if (detectedType !== assetType) {
      console.log(`🔄 Auto-detected asset type change: ${assetType} → ${detectedType} for ${selectedAsset}`);
      setAssetType(detectedType);
    }
  }, [selectedAsset]);

  // Auto-sync exchangeType with assetType (Aggregator page only)
  // When user selects an RWA asset, only show RWA exchanges
  // When user selects a crypto asset, only show crypto exchanges
  useEffect(() => {
    if (assetType !== exchangeType) {
      console.log(`🔄 Auto-syncing exchange type: ${exchangeType} → ${assetType}`);
      setExchangeType(assetType);
      // Clear selected exchanges when switching types to avoid confusion
      setSelectedExchanges([]);
    }
  }, [assetType]);

  // Fetch comprehensive market metrics for HIP-3 assets from Hyperliquid
  useEffect(() => {
    console.log(`🔍 Market metrics effect - Selected Market:`, selectedMarket);
    
    // CRITICAL: Reset marketMetrics immediately to prevent showing stale data
    setMarketMetrics(null);
    
    // CRITICAL: Use selectedMarket as single source of truth
    // Only fetch for HIP-3 assets, NEVER for crypto
    if (!selectedMarket.isHIP3) {
      console.log(`⏭️ Skipping Hyperliquid market metrics for non-HIP-3 asset`);
      return;
    }
    
    // CRITICAL: For HIP-3 assets, also reset ticker24h to prevent showing stale crypto data
    setTicker24h({ high: 0, low: 0, volume: 0 });

    // CRITICAL: selectedMarket.hlCoin is the full identifier (e.g., "xyz:SILVER")
    // Pass it unchanged to Hyperliquid
    console.log(`📊 Fetching Hyperliquid market metrics for HIP-3: ${selectedMarket.hlCoin} on ${selectedMarket.dex}`);

    const fetchMetrics = async () => {
      try {
        const metrics = await getMarketMetrics(selectedMarket.hlCoin, selectedMarket.dex!);
        console.log('✓ Market metrics loaded:', metrics);
        setMarketMetrics(metrics);
        
        // Update pricesStore with RWA price for use in trading
        // For RWA format "xyz:SILVER", extract "SILVER" as the token
        const token = selectedMarket.hlCoin.includes(':') && selectedMarket.hlCoin.split(':').length > 1
          ? selectedMarket.hlCoin.split(':')[1] // "xyz:SILVER" -> "SILVER"
          : selectedMarket.hlCoin; // Fallback for non-RWA format
        updatePrice(token, metrics.markPrice);
      } catch (error) {
        console.error('Failed to fetch market metrics:', error);
        // Set metrics to null on error so UI can handle gracefully
        setMarketMetrics(null);
      }
    };

    fetchMetrics();

    // Refresh every 10 seconds
    const interval = setInterval(fetchMetrics, 10000);

    return () => clearInterval(interval);
  }, [selectedMarket.hlCoin, selectedMarket.dex, selectedMarket.isHIP3]);

  // Fetch and subscribe to live price updates for selected asset
  // CRITICAL: Only use Binance for crypto assets, never for HIP-3
  useEffect(() => {
    const token = selectedAsset.split(':')[0];
    
    // Skip Binance API calls for HIP-3 assets
    if (selectedMarket.isHIP3) {
      console.log(`⏭️ Skipping Binance price subscription for HIP-3 asset: ${selectedMarket.hlCoin}`);
      return () => {};
    }
    
    // Fetch initial price for crypto assets only
    console.log(`💰 Subscribing to Binance price for crypto: ${selectedAsset}`);
    fetchCurrentPrice(selectedAsset).then(price => {
      updatePrice(token, price);
    });
    
    // Subscribe to real-time price updates
    const unsubscribePrice = subscribeToPrice(selectedAsset, (price) => {
      updatePrice(token, price);
    });
    
    return unsubscribePrice;
  }, [selectedAsset, selectedMarket.isHIP3, updatePrice]);

  // Subscribe to live orderbook updates
  useEffect(() => {
    // CRITICAL: Use selectedMarket as single source of truth
    // For HIP-3 assets, hlCoin contains the full identifier (e.g., "xyz:SILVER")
    // Never fall back to BTC or Binance for HIP-3 assets
    
    console.log('📖 ORDERBOOK SUBSCRIPTION - Selected Market:', selectedMarket.hlCoin);

    if (selectedMarket.isHIP3) {
      // HIP-3 Asset - use Hyperliquid ONLY
      // CRITICAL: Pass the full hlCoin to Hyperliquid (e.g., "xyz:SILVER")
      console.log(`📖 Subscribing to Hyperliquid order book: ${selectedMarket.hlCoin} on ${selectedMarket.dex}`);

      // Subscribe to Hyperliquid order book
      const unsubscribe = subscribeToHyperliquidOrderBook(selectedMarket.hlCoin, selectedMarket.dex!, (hyperliquidBook) => {
        // Transform Hyperliquid format to our format
        const [bids, asks] = hyperliquidBook.levels || [[], []];
        
        let cumulativeBidTotal = 0;
        const transformedBids = bids.map((bid) => {
          const price = parseFloat(bid.px);
          const size = parseFloat(bid.sz);
          cumulativeBidTotal += size;
          return {
            price: price.toFixed(2),
            size: size.toFixed(4),
            total: (cumulativeBidTotal / 1000).toFixed(2) + 'k',
          };
        }).slice(0, 15);

        let cumulativeAskTotal = 0;
        const transformedAsks = asks.map((ask) => {
          const price = parseFloat(ask.px);
          const size = parseFloat(ask.sz);
          cumulativeAskTotal += size;
          return {
            price: price.toFixed(2),
            size: size.toFixed(4),
            total: (cumulativeAskTotal / 1000).toFixed(2) + 'k',
          };
        }).reverse().slice(0, 15);

        setOrderBook({
          bids: transformedBids,
          asks: transformedAsks,
          lastUpdateId: Date.now(),
          bestBid: bids.length > 0 ? parseFloat(bids[0].px) : 0,
          bestAsk: asks.length > 0 ? parseFloat(asks[0].px) : 0,
        });
      });

      return unsubscribe;
    } else if (selectedMarket.isCrypto) {
      // Crypto Asset - use Binance order book
      console.log(`📖 Subscribing to Binance order book for crypto: ${selectedAsset}`);
      const unsubscribeOrderBook = subscribeToOrderBook(selectedAsset, (newOrderBook) => {
        setOrderBook(newOrderBook);
      });
      
      return unsubscribeOrderBook;
    } else {
      // Safety: Should never reach here
      console.error('❌ Unknown asset type - cannot subscribe to order book:', selectedAsset);
      return () => {};
    }
  }, [selectedAsset, selectedMarket.hlCoin, selectedMarket.dex, selectedMarket.isHIP3, selectedMarket.isCrypto]);

  // Fetch 24h ticker data and update market data store
  useEffect(() => {
    const token = selectedAsset.split(':')[0];
    
    const fetchTickerData = async () => {
      try {
        // CRITICAL: For HIP-3 assets, use market metrics (never call fetch24hTicker)
        if (selectedMarket.isHIP3) {
          if (marketMetrics) {
            setTicker24h({
              high: marketMetrics.high24h,
              low: marketMetrics.low24h,
              volume: marketMetrics.volume24h,
            });
          } else if (selectedRwaAsset) {
            const price = selectedRwaAsset.price;
            const change = selectedRwaAsset.change24h || 0;
            const changeAmount = (price * Math.abs(change)) / 100;
            
            setTicker24h({
              high: price + changeAmount,
              low: price - changeAmount,
              volume: selectedRwaAsset.volume24hUsd || 0,
            });
          }
          return;
        }
        
        // For RWA assets, use the loaded RWA data
        if (assetType === 'rwa' && selectedRwaAsset) {
          // Calculate mock 24h high/low based on current price and change
          const price = selectedRwaAsset.price;
          const change = selectedRwaAsset.change24h || 0;
          const changeAmount = (price * Math.abs(change)) / 100;
          
          setTicker24h({
            high: price + changeAmount,
            low: price - changeAmount,
            volume: selectedRwaAsset.volume24hUsd || 0,
          });
        } else {
          // For crypto assets, fetch from Binance
          const data = await fetch24hTicker(selectedAsset);
          setTicker24h({
            high: data.high,
            low: data.low,
            volume: data.volume,
          });
          
          // Also update the centralized market data store
          await refreshAssetData(token);
        }
      } catch (error) {
        console.warn('Error fetching ticker data:', error);
        // Set fallback data to prevent UI issues
        setTicker24h({
          high: currentPrice * 1.02,
          low: currentPrice * 0.98,
          volume: 0,
        });
      }
    };
    
    fetchTickerData();
    
    // Refresh every 10 seconds
    const interval = setInterval(() => {
      fetchTickerData();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [selectedAsset, refreshAssetData, assetType, selectedRwaAsset, currentPrice, selectedMarket.isHIP3]);

  // Fetch Solver data from Hyperliquid for RWA assets
  useEffect(() => {
    // Only fetch solver data for RWA assets
    if (assetType !== 'rwa') {
      setSolverData(null);
      return;
    }
    
    const fetchSolverData = async () => {
      try {
        const symbol = baseToken; // e.g., "SILVER", "GOLD", etc.
        // When "all" is selected, use "xyz" since it's the only DEX with live data
        const dexToFetch = selectedDex === 'all' ? 'xyz' : selectedDex;
        const url = `https://${projectId}.supabase.co/functions/v1/make-server-9f8d65d6/hyperliquid/solver?symbol=${symbol}&dex=${dexToFetch}`;
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        });
        
        if (!response.ok) {
          console.warn('Failed to fetch Solver data:', response.status);
          return;
        }
        
        const data = await response.json();
        console.log('✓ Solver data received:', data);
        setSolverData(data);
      } catch (error) {
        console.warn('Error fetching Solver data:', error);
      }
    };
    
    fetchSolverData();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchSolverData, 10000);
    
    return () => clearInterval(interval);
  }, [selectedAsset, assetType, baseToken, selectedDex]); // Added selectedDex to dependencies

  // Save current settings as a template
  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    
    const template = {
      id: Date.now(),
      name: templateName,
      settings: {
        selectedExchanges,
        selectedStrategies,
        selectedAsset,
        btcAmount,
        usdtAmount,
        limitPrice,
        limitPriceMode,
        duration,
        timezone,
        timeStart,
        timeEnd,
        trajectory,
        takeProfit,
        stopLoss,
        ioc,
        pause,
        grid,
        orderType
      }
    };
    
    const updatedTemplates = [...savedTemplates, template];
    setSavedTemplates(updatedTemplates);
    localStorage.setItem('aggregatorTemplates', JSON.stringify(updatedTemplates));
    setTemplateName('');
    setShowSaveTemplateModal(false);
  };

  // Load a template
  const handleLoadTemplate = (template: any) => {
    const { settings } = template;
    setSelectedExchanges(settings.selectedExchanges);
    setSelectedStrategies(settings.selectedStrategies);
    setSelectedAsset(settings.selectedAsset);
    setBtcAmount(settings.btcAmount);
    setUsdtAmount(settings.usdtAmount);
    setLimitPrice(settings.limitPrice);
    setLimitPriceMode(settings.limitPriceMode);
    setDuration(settings.duration);
    setTimezone(settings.timezone);
    setTimeStart(settings.timeStart);
    setTimeEnd(settings.timeEnd);
    setTrajectory(settings.trajectory);
    setTakeProfit(settings.takeProfit);
    setStopLoss(settings.stopLoss);
    setIoc(settings.ioc);
    setPause(settings.pause);
    setGrid(settings.grid);
    setOrderType(settings.orderType);
    setShowLoadTemplateModal(false);
  };

  // Delete a template
  const handleDeleteTemplate = (id: number) => {
    const updatedTemplates = savedTemplates.filter(t => t.id !== id);
    setSavedTemplates(updatedTemplates);
    localStorage.setItem('aggregatorTemplates', JSON.stringify(updatedTemplates));
  };

  // Set initial scroll position to show Exit Conditions at bottom
  useEffect(() => {
    if (scrollableRef.current) {
      scrollableRef.current.scrollTop = 280;
    }
  }, []);

  // Close exchanges dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exchangesDropdownRef.current && !exchangesDropdownRef.current.contains(event.target as Node)) {
        setExchangesDropdownOpen(false);
      }
    };

    if (exchangesDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [exchangesDropdownOpen]);

  // Close asset dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (assetDropdownRef.current && !assetDropdownRef.current.contains(event.target as Node)) {
        setAssetDropdownOpen(false);
      }
    };

    if (assetDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [assetDropdownOpen]);

  // Close strategies dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (strategiesDropdownRef.current && !strategiesDropdownRef.current.contains(event.target as Node)) {
        setStrategiesDropdownOpen(false);
      }
    };

    if (strategiesDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [strategiesDropdownOpen]);

  // Fetch RWA data from Hyperliquid HIP3 when RWA tab is opened or DEX changes
  useEffect(() => {
    const fetchRWAData = async () => {
      if (assetType !== 'rwa') return;
      
      setRwaLoading(true);
      setRwaError(null);
      try {
        if (selectedDex === 'all') {
          // For "all" mode, just load xyz (primary DEX) for speed
          // Users can select specific DEXs to see data from other sources
          console.log('⚡ Loading primary DEX (xyz) for "All" view');
          const data = await fetchSingleDexRWADataFast(projectId, publicAnonKey, 'xyz', setRwaDataSource, setRwaError);
          setRwaData(data);
        } else {
          // Fetch from single DEX using fast optimized helper
          const data = await fetchSingleDexRWADataFast(projectId, publicAnonKey, selectedDex, setRwaDataSource, setRwaError);
          setRwaData(data);
        
          const totalAssets = data.commodities.length + data.stocks.length + data.indices.length;
          console.log(`✓ RWA data loaded: ${totalAssets} assets (${data.commodities.length} commodities, ${data.stocks.length} stocks, ${data.indices.length} indices)`);
        }
        
      } catch (error) {
        console.error('Error fetching RWA data:', error);
        // Set error state so user knows what went wrong
        setRwaError(error instanceof Error ? error.message : 'Failed to fetch RWA data');
        setRwaDataSource('mock');
      } finally {
        setRwaLoading(false);
      }
    };
    
    fetchRWAData();
  }, [assetType, selectedDex]); // Fetch when switching to RWA tab or changing DEX

  // Update positions with current prices for PNL calculation
  useEffect(() => {
    const interval = setInterval(() => {
      const priceMap = new Map<string, number>();
      
      // Build price map from current prices
      // prices is a Record<string, number>, not a Map
      for (const [symbol, price] of Object.entries(prices)) {
        priceMap.set(symbol, price);
      }
      
      // Update positions with current market prices
      updatePositions(priceMap);
    }, 2000); // Update every 2 seconds
    
    return () => clearInterval(interval);
  }, [prices]); // Removed updatePositions from dependencies - it's a stable Zustand action

  return (
    <div className={`h-[calc(100vh-3rem-1px)] flex flex-col ${colors.bg.subtle}`} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Top Header Bar - 56px */}
      <div className={`h-14 border-b ${colors.border.primary} ${colors.bg.primary} flex items-center px-4`}>
        <div className="flex items-center gap-4">
          {/* Pair Selector */}
          <div className="relative" ref={assetDropdownRef}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#F3B955] flex items-center justify-center text-button font-bold text-black">
                ₿
              </div>
              <span className={`text-body ${colors.text.primary} font-medium`}>
                {/* Format: Remove DEX prefix and change USDC to USD for display only (Aggregator page) */}
                {assetType === 'rwa' 
                  ? selectedAsset
                      .replace(/^(xyz|vntl|km|cash|flx|hyna):/i, '') // Remove DEX prefix
                      .replace(/-USDC$/i, '-USD') // Change USDC to USD
                  : selectedAsset
                }
              </span>
              <button
                onClick={() => setAssetDropdownOpen(!assetDropdownOpen)}
                className={`p-0.5 hover:${colors.bg.subtle} rounded transition-colors`}
              >
                <ChevronDown className={`w-4 h-4 ${colors.text.tertiary} transition-transform ${assetDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
            
            {assetDropdownOpen && (
              <div className={`absolute top-full left-0 mt-2 ${colors.bg.primary} border ${colors.border.secondary} rounded-lg shadow-xl z-50 w-[520px] max-h-[520px] overflow-hidden flex flex-col`}>
                {/* Main Tabs: Crypto Currencies / RWAs */}
                <div className={`flex border-b ${colors.border.primary} ${colors.bg.subtle}`}>
                  <button
                    onClick={() => setAssetType('crypto')}
                    className={`flex-1 px-4 py-3 text-body font-medium transition-colors relative ${
                      assetType === 'crypto' ? colors.text.primary : colors.text.tertiary
                    }`}
                  >
                    Crypto Currencies
                    {assetType === 'crypto' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A36A]" />
                    )}
                  </button>
                  <button
                    onClick={() => setAssetType('rwa')}
                    className={`flex-1 px-4 py-3 text-body font-medium transition-colors relative ${
                      assetType === 'rwa' ? colors.text.primary : colors.text.tertiary
                    }`}
                  >
                    RWAs
                    {assetType === 'rwa' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A36A]" />
                    )}
                  </button>
                </div>
                
                {/* RWA Sub-tabs: Commodities / Stocks / Indices */}
                {assetType === 'rwa' && (
                  <div className={`flex border-b ${colors.border.primary} ${colors.bg.primary}`}>
                    <button
                      onClick={() => setRwaCategory('all')}
                      className={`flex-1 px-4 py-2.5 text-label font-medium transition-colors relative ${
                        rwaCategory === 'all' ? colors.text.primary : colors.text.tertiary
                      }`}
                    >
                      All
                      {rwaCategory === 'all' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A36A]" />
                      )}
                    </button>
                    <button
                      onClick={() => setRwaCategory('commodities')}
                      className={`flex-1 px-4 py-2.5 text-label font-medium transition-colors relative ${
                        rwaCategory === 'commodities' ? colors.text.primary : colors.text.tertiary
                      }`}
                    >
                      Commodities
                      {rwaCategory === 'commodities' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A36A]" />
                      )}
                    </button>
                    <button
                      onClick={() => setRwaCategory('stocks')}
                      className={`flex-1 px-4 py-2.5 text-label font-medium transition-colors relative ${
                        rwaCategory === 'stocks' ? colors.text.primary : colors.text.tertiary
                      }`}
                    >
                      Stocks
                      {rwaCategory === 'stocks' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A36A]" />
                      )}
                    </button>
                    <button
                      onClick={() => setRwaCategory('indices')}
                      className={`flex-1 px-4 py-2.5 text-label font-medium transition-colors relative ${
                        rwaCategory === 'indices' ? colors.text.primary : colors.text.tertiary
                      }`}
                    >
                      Indices
                      {rwaCategory === 'indices' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A36A]" />
                      )}
                    </button>
                  </div>
                )}
                
                {/* DEX filter removed per user request - Aggregator page only */}
                
                {/* Mock Data Warning - show when RWA data is mock (but not for "all" since it uses xyz) */}
                {assetType === 'rwa' && rwaDataSource === 'mock' && selectedDex !== 'all' && (
                  <div className={`px-3 py-2 border-b ${colors.border.primary} bg-yellow-50 dark:bg-yellow-900/10`}>
                    <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div className="text-[11px] font-medium">
                        Mock data shown - DEX "{selectedDex}" may not be available. Try "ALL" or "xyz" for live data.
                        {rwaError && <span className="ml-1 text-[10px] opacity-75">({rwaError.substring(0, 80)})</span>}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Header */}
                <div className={`flex items-center gap-4 px-4 py-2 border-b ${colors.border.primary} ${colors.bg.subtle} text-label ${colors.text.tertiary}`}>
                  <div className="w-40">Asset</div>
                  <div className="w-24 text-right" style={{ fontFeatureSettings: '"tnum" on' }}>24h Vol</div>
                  <div className="w-20 text-right" style={{ fontFeatureSettings: '"tnum" on' }}>OI</div>
                  <div className="w-20 text-right" style={{ fontFeatureSettings: '"tnum" on' }}>24h Δ</div>
                </div>
                
                {/* Scrollable list */}
                <div className="overflow-y-auto">
                  {assetType === 'rwa' && rwaLoading ? (
                    <div className={`flex items-center justify-center py-12 ${colors.text.tertiary}`}>
                      <div className="text-label">Loading RWA data from Hyperliquid...</div>
                    </div>
                  ) : displayAssets.length === 0 && assetType === 'rwa' ? (
                    <div className={`flex items-center justify-center py-12 ${colors.text.tertiary}`}>
                      <div className="text-label">No RWA assets available</div>
                    </div>
                  ) : (
                    displayAssets.map((asset) => {
                      const isSelected = selectedAsset === asset.symbol;
                      return (
                        <button
                          key={asset.symbol}
                          onClick={() => {
                            setSelectedAsset(asset.symbol);
                            setAssetDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-4 px-4 py-2.5 text-left hover:${colors.bg.subtle} transition-colors ${
                            isSelected ? colors.bg.subtle : ''
                          }`}
                        >
                          <div className={`w-40 text-body font-medium whitespace-nowrap ${isSelected ? 'text-[#C9A36A]' : colors.text.primary}`}>
                            {/* Format: Remove DEX prefix and change USDC to USD for display only (Aggregator page) */}
                            {assetType === 'rwa' 
                              ? asset.symbol
                                  .replace(/^(xyz|vntl|km|cash|flx|hyna):/i, '') // Remove DEX prefix
                                  .replace(/-USDC$/i, '-USD') // Change USDC to USD
                              : asset.symbol
                            }
                          </div>
                          <div className={`w-24 text-right text-label ${colors.text.tertiary}`} style={{ fontFeatureSettings: '"tnum" on' }}>
                            {asset.volume24h}
                          </div>
                          <div className={`w-20 text-right text-label ${colors.text.tertiary}`} style={{ fontFeatureSettings: '"tnum" on' }}>
                            {asset.oi}
                          </div>
                          <div className={`w-20 text-right text-label font-medium ${
                            asset.change24h >= 0 ? 'text-[#1FBF75]' : 'text-[#E24A4A]'
                          }`} style={{ fontFeatureSettings: '"tnum" on' }}>
                            {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center gap-3">
            <div className="text-numeric-large text-[#1FBF75]" style={{ fontFeatureSettings: '"tnum" on' }}>
              {marketMetrics ? marketMetrics.markPrice.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : currentPrice.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </div>
            {(marketMetrics || solverData) && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#C9A36A]/10 border border-[#C9A36A]/20">
                <div className="w-1.5 h-1.5 bg-[#C9A36A] rounded-full"></div>
                <span className="text-[10px] font-medium text-[#C9A36A]">{marketMetrics ? 'Live' : 'Solver'}</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-8">
            <div>
              <div className={`text-label ${colors.text.quaternary}`}>24H High</div>
              <div className={`text-numeric ${colors.text.primary}`} style={{ fontFeatureSettings: '"tnum" on' }}>
                {(() => {
                  // For HIP-3 assets (RWA), use marketMetrics
                  if (marketMetrics) {
                    return marketMetrics.high24h >= 1000 ? (marketMetrics.high24h / 1000).toFixed(2) + 'K' : marketMetrics.high24h.toFixed(2);
                  }
                  
                  // For crypto assets, try to get from market data store
                  if (assetType === 'crypto' && selectedAsset) {
                    const cryptoToken = selectedAsset.split(':')[0].toUpperCase();
                    const asset = assets.get(cryptoToken);
                    
                    if (asset && asset.marketData.high24h > 0) {
                      return asset.marketData.high24h >= 1000 ? (asset.marketData.high24h / 1000).toFixed(2) + 'K' : asset.marketData.high24h.toFixed(2);
                    }
                  }
                  
                  // Fallback
                  return '--';
                })()}
              </div>
            </div>
            <div>
              <div className={`text-label ${colors.text.quaternary}`}>24H Low</div>
              <div className={`text-numeric ${colors.text.primary}`} style={{ fontFeatureSettings: '"tnum" on' }}>
                {(() => {
                  // For HIP-3 assets (RWA), use marketMetrics
                  if (marketMetrics) {
                    return marketMetrics.low24h >= 1000 ? (marketMetrics.low24h / 1000).toFixed(2) + 'K' : marketMetrics.low24h.toFixed(2);
                  }
                  
                  // For crypto assets, try to get from market data store
                  if (assetType === 'crypto' && selectedAsset) {
                    const cryptoToken = selectedAsset.split(':')[0].toUpperCase();
                    const asset = assets.get(cryptoToken);
                    
                    if (asset && asset.marketData.low24h > 0) {
                      return asset.marketData.low24h >= 1000 ? (asset.marketData.low24h / 1000).toFixed(2) + 'K' : asset.marketData.low24h.toFixed(2);
                    }
                  }
                  
                  // Fallback
                  return '--';
                })()}
              </div>
            </div>
            <div>
              <div className={`text-label ${colors.text.quaternary}`}>Funding Rate</div>
              <div className={`text-numeric ${colors.text.primary}`} style={{ fontFeatureSettings: '"tnum" on' }}>
                {(() => {
                  // For HIP-3 assets (RWA), use marketMetrics
                  if (marketMetrics) {
                    return `${marketMetrics.fundingRate >= 0 ? '+' : ''}${marketMetrics.fundingRate.toFixed(2)}%`;
                  }
                  
                  // For crypto assets, try to get from funding rates store
                  if (assetType === 'crypto' && selectedAsset) {
                    const cryptoToken = selectedAsset.split(':')[0].toUpperCase(); // Extract BTC from BTC:PERP-USD
                    const tokenRates = fundingRates[cryptoToken];
                    
                    if (tokenRates) {
                      // Calculate average funding rate across all exchanges
                      const exchangeRates = Object.values(tokenRates).filter(rate => rate !== null) as number[];
                      if (exchangeRates.length > 0) {
                        const avgRate = exchangeRates.reduce((a, b) => a + b, 0) / exchangeRates.length;
                        return `${avgRate >= 0 ? '+' : ''}${avgRate.toFixed(2)}%`;
                      }
                    }
                  }
                  
                  // Fallback to solverData or selectedRwaAsset
                  if (solverData) {
                    return `${parseFloat(solverData.funding) >= 0 ? '+' : ''}${(parseFloat(solverData.funding) * 100).toFixed(2)}%`;
                  }
                  
                  if (selectedRwaAsset) {
                    return `${selectedRwaAsset.change24h >= 0 ? '+' : ''}${selectedRwaAsset.change24h.toFixed(2)}%`;
                  }
                  
                  return '--';
                })()}
              </div>
            </div>
            <div>
              <div className={`text-label ${colors.text.quaternary}`}>Open Interest</div>
              <div className={`text-numeric ${colors.text.primary}`} style={{ fontFeatureSettings: '"tnum" on' }}>
                {(() => {
                  // For HIP-3 assets (RWA), use marketMetrics
                  if (marketMetrics) {
                    if (marketMetrics.openInterestUsd > 1e9) {
                      return '$' + (marketMetrics.openInterestUsd / 1e9).toFixed(1) + 'B';
                    } else if (marketMetrics.openInterestUsd > 1e6) {
                      return '$' + (marketMetrics.openInterestUsd / 1e6).toFixed(1) + 'M';
                    } else {
                      return '$' + marketMetrics.openInterestUsd.toFixed(0);
                    }
                  }
                  
                  // For crypto assets, try to get from market data store
                  if (assetType === 'crypto' && selectedAsset) {
                    const cryptoToken = selectedAsset.split(':')[0].toUpperCase();
                    const asset = assets.get(cryptoToken);
                    
                    if (asset && asset.marketData.openInterest && asset.marketData.openInterest > 0) {
                      const oi = asset.marketData.openInterest;
                      if (oi > 1e9) {
                        return '$' + (oi / 1e9).toFixed(1) + 'B';
                      } else if (oi > 1e6) {
                        return '$' + (oi / 1e6).toFixed(1) + 'M';
                      } else {
                        return '$' + oi.toFixed(0);
                      }
                    }
                  }
                  
                  // Fallback to solverData or selectedRwaAsset
                  if (solverData) {
                    const oi = parseFloat(solverData.openInterest);
                    if (oi > 1000000) {
                      return '$' + (oi / 1000000).toFixed(1) + 'M';
                    } else {
                      return '$' + oi.toFixed(0);
                    }
                  }
                  
                  if (selectedRwaAsset) {
                    return selectedRwaAsset.oi;
                  }
                  
                  return '--';
                })()}
              </div>
            </div>
            <div>
              <div className={`text-label ${colors.text.quaternary}`}>Oracle Price</div>
              <div className={`text-numeric ${colors.text.primary}`} style={{ fontFeatureSettings: '"tnum" on' }}>
                {marketMetrics ? marketMetrics.oraclePrice.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : (solverData ? parseFloat(solverData.oraclePx).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : midPrice.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }))}
              </div>
            </div>
            <div>
              <div className={`text-label ${colors.text.quaternary}`}>24H Volume</div>
              <div className={`text-numeric ${colors.text.primary}`} style={{ fontFeatureSettings: '"tnum" on' }}>
                {(() => {
                  // For HIP-3 assets (RWA), use marketMetrics
                  if (marketMetrics) {
                    return marketMetrics.volume24h > 1e9 ? '$' + (marketMetrics.volume24h / 1e9).toFixed(1) + 'B' : '$' + (marketMetrics.volume24h / 1e6).toFixed(0) + 'M';
                  }
                  
                  // For crypto assets, try to get from market data store
                  if (assetType === 'crypto' && selectedAsset) {
                    const cryptoToken = selectedAsset.split(':')[0].toUpperCase();
                    const asset = assets.get(cryptoToken);
                    
                    if (asset && asset.marketData.volume24h > 0) {
                      return asset.marketData.volume24h > 1e9 ? '$' + (asset.marketData.volume24h / 1e9).toFixed(1) + 'B' : '$' + (asset.marketData.volume24h / 1e6).toFixed(0) + 'M';
                    }
                  }
                  
                  // Fallback
                  return '--';
                })()}
              </div>
            </div>
            <div>
              <div className={`text-label ${colors.text.quaternary}`}>Spread</div>
              <div className={`text-numeric ${colors.text.primary}`} style={{ fontFeatureSettings: '"tnum" on' }}>
                {marketMetrics ? `${marketMetrics.spreadBps.toFixed(1)}bps` : (selectedRwaAsset ? '0.0bps' : `${spreadBps.toFixed(1)}bps`)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar - 40px */}
        <div className={`w-10 ${colors.bg.primary} border-r ${colors.border.primary} flex flex-col items-center py-3 gap-3`}>
          <button className={`w-6 h-6 flex items-center justify-center ${colors.text.tertiary} ${colors.text.hoverPrimary}`}>
            <Plus className="w-4 h-4" />
          </button>
          <button className={`w-6 h-6 flex items-center justify-center ${colors.text.tertiary} ${colors.text.hoverPrimary}`}>
            <TrendingUp className="w-4 h-4" />
          </button>
          <button className={`w-6 h-6 flex items-center justify-center ${colors.text.tertiary} ${colors.text.hoverPrimary}`}>
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <button className={`w-6 h-6 flex items-center justify-center ${colors.text.tertiary} ${colors.text.hoverPrimary}`}>
            <Network className="w-4 h-4" />
          </button>
          <button className={`w-6 h-6 flex items-center justify-center ${colors.text.tertiary} ${colors.text.hoverPrimary}`}>
            <Leaf className="w-4 h-4" />
          </button>
          <button className={`w-6 h-6 flex items-center justify-center ${colors.text.tertiary} ${colors.text.hoverPrimary}`}>
            <Type className="w-4 h-4" />
          </button>
          <button className={`w-6 h-6 flex items-center justify-center ${colors.text.tertiary} ${colors.text.hoverPrimary}`}>
            <Smile className="w-4 h-4" />
          </button>
          <button className={`w-6 h-6 flex items-center justify-center ${colors.text.tertiary} ${colors.text.hoverPrimary}`}>
            <Ruler className="w-4 h-4" />
          </button>
          <button className={`w-6 h-6 flex items-center justify-center ${colors.text.tertiary} ${colors.text.hoverPrimary}`}>
            <ZoomIn className="w-4 h-4" />
          </button>
          <button className={`w-6 h-6 flex items-center justify-center ${colors.text.tertiary} ${colors.text.hoverPrimary}`}>
            <Magnet className="w-4 h-4" />
          </button>
          <button className={`w-6 h-6 flex items-center justify-center ${colors.text.tertiary} ${colors.text.hoverPrimary}`}>
            <Edit className="w-4 h-4" />
          </button>
          <button className={`w-6 h-6 flex items-center justify-center ${colors.text.tertiary} ${colors.text.hoverPrimary}`}>
            <Briefcase className="w-4 h-4" />
          </button>
        </div>

        {/* Main Chart + Order Book + Trading Form */}
        <div className="flex-1 flex min-h-0">
          {/* Left: Chart + Order Book with Orders at Bottom */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Top: Chart + Order Book */}
            <div className="flex-1 flex min-h-0 overflow-hidden">
              {/* Chart Area */}
              <div className={`flex-1 flex flex-col min-h-0 ${colors.bg.primary}`}>
                <TradingChart selectedAsset={selectedAsset} />
              </div>

              {/* Order Book - 180px */}
              <div className={`w-[180px] ${colors.bg.primary} border-l ${colors.border.primary} flex flex-col`}>
                <div className={`pl-1.5 pr-3 py-2 border-b ${colors.border.primary}`}>
                  <div className={`text-label ${colors.text.tertiary}`}>ORDER BOOK</div>
                </div>
                
                <div className="flex-1 overflow-y-auto text-[10px]" style={{ fontFeatureSettings: '"tnum" on' }}>
                  {/* Asks */}
                  {orderBook.asks.map((ask, idx) => {
                    const maxSize = Math.max(...orderBook.asks.map(a => parseFloat(a.size)), ...orderBook.bids.map(b => parseFloat(b.size)));
                    const sizePercent = (parseFloat(ask.size) / maxSize) * 100;
                    return (
                      <div key={`ask-${idx}`} className={`relative flex items-center justify-between pl-1.5 pr-3 py-0.5 hover:${colors.bg.subtle}`}>
                        <div 
                          className="absolute right-0 top-0 bottom-0 bg-[#E24A4A]/[0.08]" 
                          style={{ width: `${sizePercent}%` }}
                        />
                        <span className="text-[#E24A4A] relative z-10">${ask.price}</span>
                        <span className={`${colors.text.tertiary} relative z-10`}>{ask.size}</span>
                        <span className={`${colors.text.quaternary} relative z-10`}>{ask.total}</span>
                      </div>
                    );
                  })}
                  
                  {/* Spread */}
                  <div className={`pl-1.5 pr-3 py-1.5 ${colors.bg.secondary} border-y ${colors.border.primary}`}>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[#1FBF75] font-semibold">${midPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span className={`text-[10px] ${colors.text.quaternary}`}>{spreadBps.toFixed(2)}bps</span>
                    </div>
                  </div>

                  {/* Bids */}
                  {orderBook.bids.map((bid, idx) => {
                    const maxSize = Math.max(...orderBook.asks.map(a => parseFloat(a.size)), ...orderBook.bids.map(b => parseFloat(b.size)));
                    const sizePercent = (parseFloat(bid.size) / maxSize) * 100;
                    return (
                      <div key={`bid-${idx}`} className={`relative flex items-center justify-between pl-1.5 pr-3 py-0.5 hover:${colors.bg.subtle}`}>
                        <div 
                          className="absolute right-0 top-0 bottom-0 bg-[#1FBF75]/[0.08]" 
                          style={{ width: `${sizePercent}%` }}
                        />
                        <span className="text-[#1FBF75] relative z-10">${bid.price}</span>
                        <span className={`${colors.text.tertiary} relative z-10`}>{bid.size}</span>
                        <span className={`${colors.text.quaternary} relative z-10`}>{bid.total}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom: Orders Section - 180px */}
            <div className={`h-[180px] border-t ${colors.border.primary} ${colors.bg.primary} flex-shrink-0 flex flex-col`}>
              <OrdersSection activeTab={activeTab} onTabChange={setActiveTab} orders={openOrders} />
            </div>
          </div>

          {/* Trading Form - 280px */}
          <div className={`w-[280px] ${colors.bg.primary} border-l ${colors.border.primary} flex flex-col relative z-10`}>
            {/* Scrollable Form Section */}
            <div ref={scrollableRef} className="flex-1 overflow-y-auto p-3 space-y-3">
              {/* Exchanges */}
              <div className="relative" ref={exchangesDropdownRef}>
                <div className="flex items-center gap-1 mb-1">
                  <label className={`block text-label ${colors.text.tertiary}`}>
                    Exchanges:
                  </label>
                  <div className="relative group">
                    <HelpCircle className={`w-4 h-4 ${colors.text.tertiary} cursor-help`} />
                    <div className={`absolute left-0 top-full mt-2 hidden group-hover:block w-48 ${colors.bg.primary} border ${colors.border.secondary} rounded px-3 py-2 text-[12px] leading-relaxed ${colors.text.primary} shadow-lg z-[10000] pointer-events-none`}>
                      Select multiple exchanges to enable a smart order routing engine that evaluates price, available liquidity, fees, and latency, and dynamically splits execution across venues. This reduces market impact and improves average fill quality compared to executing on a single exchange.
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setExchangesDropdownOpen(!exchangesDropdownOpen)}
                  className={`w-full ${colors.bg.secondary} border ${colors.border.secondary} rounded px-2 py-1.5 text-xs ${colors.text.primary} flex items-center justify-between`}
                >
                  <span>
                    {selectedExchanges.length === 0 
                      ? 'Select exchanges' 
                      : selectedExchanges.length === allExchanges.length
                      ? 'All exchanges'
                      : `${selectedExchanges.length} selected`}
                  </span>
                  <ChevronDown className={`w-3 h-3 ${colors.text.tertiary} transition-transform ${exchangesDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {exchangesDropdownOpen && (
                  <div className={`absolute top-full left-0 right-0 mt-1 ${colors.bg.primary} border ${colors.border.secondary} rounded shadow-lg z-50`}>
                    {/* Auto-synced exchange type header (no tabs - syncs with selected asset) */}
                    <div className={`px-3 py-2 border-b ${colors.border.secondary} text-[11px] font-medium ${colors.text.tertiary}`}>
                      {assetType === 'crypto' ? 'Crypto Exchanges' : 'RWA DEXs'}
                    </div>
                    
                    {/* Exchange/DEX List */}
                    <div className="max-h-48 overflow-y-auto">
                      {exchangeType === 'crypto' ? (
                        // Crypto Exchanges
                        allExchanges.map((exchange) => {
                          const isSelected = selectedExchanges.includes(exchange);
                          return (
                            <label
                              key={exchange}
                              className={`flex items-center gap-2 px-3 py-2 text-xs hover:${colors.bg.subtle} cursor-pointer`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleExchange(exchange)}
                                className="w-3 h-3"
                              />
                              <span className={colors.text.primary}>
                                {exchange}
                              </span>
                            </label>
                          );
                        })
                      ) : (
                        // RWA DEXs
                        RWA_DEXS.map((dex) => {
                          const isSelected = selectedExchanges.includes(dex.name);
                          return (
                            <label
                              key={dex.id}
                              className={`flex items-center gap-2 px-3 py-2 text-xs hover:${colors.bg.subtle} cursor-pointer`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleExchange(dex.name)}
                                className="w-3 h-3"
                              />
                              <span className={colors.text.primary}>
                                {dex.name}
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Buy/Sell */}
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setOrderSide('buy')}
                  className={orderSide === 'buy' 
                    ? "bg-[#1FBF75] text-white py-2 rounded text-xs font-medium hover:bg-[#1AAD69]"
                    : `${colors.bg.secondary} ${colors.text.tertiary} py-2 rounded text-xs font-medium hover:${colors.bg.tertiary}`
                  }
                >
                  Buy
                </button>
                <button 
                  onClick={() => setOrderSide('sell')}
                  className={orderSide === 'sell'
                    ? "bg-[#E24A4A] text-white py-2 rounded text-xs font-medium hover:bg-[#D04444]"
                    : `${colors.bg.secondary} ${colors.text.tertiary} py-2 rounded text-xs font-medium hover:${colors.bg.tertiary}`
                  }
                >
                  Sell
                </button>
              </div>

              {/* BTC/USDT Inputs */}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder={baseToken}
                  value={btcAmount}
                  onChange={(e) => {
                    const value = sanitizeNumberInput(e.target.value);
                    setBtcAmount(value);
                    if (value.trim().length > 0) {
                      setUsdtAmount('');
                    }
                  }}
                  disabled={isBtcAmountLocked}
                  inputMode="decimal"
                  className={`${colors.bg.secondary} border ${colors.border.secondary} rounded px-2 py-1.5 text-xs ${colors.text.primary} placeholder-${colors.text.quaternary} ${isBtcAmountLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                <input
                  type="text"
                  placeholder={quoteToken}
                  value={usdtAmount}
                  onChange={(e) => {
                    const value = sanitizeNumberInput(e.target.value);
                    setUsdtAmount(value);
                    if (value.trim().length > 0) {
                      setBtcAmount('');
                    }
                  }}
                  disabled={isUsdtAmountLocked}
                  inputMode="decimal"
                  className={`${colors.bg.secondary} border ${colors.border.secondary} rounded px-2 py-1.5 text-xs ${colors.text.primary} placeholder-${colors.text.quaternary} ${isUsdtAmountLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>

              {/* Sliders */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input type="range" className="flex-1 h-1" />
                  <span className={`text-[10px] ${colors.text.tertiary}`}>0.00 BTC</span>
                </div>
              </div>

              {/* Leverage */}
              <div className="space-y-2 mt-4">
                <label className={`block text-label ${colors.text.tertiary}`}>Leverage</label>
                <div className="flex items-center gap-2">
                  <input type="range" className="flex-1 h-1" />
                  <span className={`text-[10px] ${colors.text.tertiary}`}>0.00 USDT</span>
                </div>
              </div>

              {/* Strategy */}
              <div className="relative" ref={strategiesDropdownRef}>
                <label className={`block text-label ${colors.text.tertiary} mb-1`}>Strategy</label>
                <button
                  onClick={() => setStrategiesDropdownOpen(!strategiesDropdownOpen)}
                  className={`w-full ${colors.bg.secondary} border ${colors.border.secondary} rounded px-2 py-1.5 text-xs ${colors.text.primary} flex items-center justify-between`}
                >
                  <span>
                    {selectedStrategies.length === 0 
                      ? 'Select strategy' 
                      : selectedStrategies[0]}
                  </span>
                  <ChevronDown className={`w-3 h-3 ${colors.text.tertiary} transition-transform ${strategiesDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {strategiesDropdownOpen && (
                  <div className={`absolute top-full left-0 right-0 mt-1 ${colors.bg.primary} border ${colors.border.secondary} rounded shadow-lg z-50 max-h-48 overflow-y-auto`}>
                    {allStrategies.map((strategy) => {
                      const isSelected = selectedStrategies.includes(strategy);
                      return (
                        <label
                          key={strategy}
                          className={`flex items-center gap-2 px-3 py-2 text-xs hover:${colors.bg.subtle} cursor-pointer`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleStrategy(strategy)}
                            className="w-3 h-3"
                          />
                          <span className={colors.text.primary}>
                            {strategy}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Limit Price */}
              <div className={`border ${colors.border.secondary} rounded px-2 py-1.5`}>
                <div className={`text-label ${colors.text.tertiary} mb-1`}>Limit Price</div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    placeholder={limitPriceMode === 'Dynamic' ? 'Dynamic' : 'Enter price'}
                    disabled={limitPriceMode === 'Dynamic'}
                    className={`flex-1 bg-transparent text-xs ${colors.text.primary}`}
                    style={{ fontFeatureSettings: '"tnum" on' }}
                  />
                  <button 
                    onClick={() => setLimitPriceMode(limitPriceMode === 'Dynamic' ? 'Manual' : 'Dynamic')}
                    className={`flex items-center gap-1 text-[10px] ${colors.text.tertiary} ${colors.bg.secondary} px-2 py-1 rounded hover:${colors.bg.tertiary}`}
                  >
                    <span>⇅</span>
                    <span>{limitPriceMode}</span>
                  </button>
                </div>
              </div>

              {/* Checkboxes */}
              <div className={`flex gap-3 text-label ${colors.text.tertiary}`}>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-3 h-3" 
                    checked={ioc}
                    onChange={(e) => setIoc(e.target.checked)}
                  />
                  <span>IOC</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-3 h-3" 
                    checked={pause}
                    onChange={(e) => setPause(e.target.checked)}
                  />
                  <span>Pause</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-3 h-3" 
                    checked={grid}
                    onChange={(e) => setGrid(e.target.checked)}
                  />
                  <span>Grid</span>
                </label>
              </div>

              {/* Duration */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`block text-label ${colors.text.tertiary} mb-1`}>Duration (min)</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className={`w-full ${colors.bg.secondary} border ${colors.border.secondary} rounded px-2 py-1 text-body ${colors.text.primary}`}
                  />
                </div>
                <div>
                  <label className={`block text-label ${colors.text.tertiary} mb-1`}>Timezone</label>
                  <select 
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className={`w-full ${colors.bg.secondary} border ${colors.border.secondary} rounded px-2 py-1 text-body ${colors.text.primary}`}
                  >
                    <option>Europe/London UTC+00:00</option>
                  </select>
                </div>
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`block text-label ${colors.text.tertiary} mb-1`}>Time Start (Europe/London)</label>
                  <input
                    type="text"
                    value={timeStart}
                    onChange={(e) => setTimeStart(e.target.value)}
                    className={`w-full ${colors.bg.secondary} border ${colors.border.secondary} rounded px-2 py-1 text-body ${colors.text.primary}`}
                  />
                </div>
                <div>
                  <label className={`block text-label ${colors.text.tertiary} mb-1`}>Time End (Europe/London)</label>
                  <input
                    type="text"
                    value={timeEnd}
                    onChange={(e) => setTimeEnd(e.target.value)}
                    className={`w-full ${colors.bg.secondary} border ${colors.border.secondary} rounded px-2 py-1 text-body ${colors.text.primary}`}
                  />
                </div>
              </div>

              {/* Exit Conditions */}
              <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded`}>
                <button 
                  onClick={() => setExitConditionsOpen(!exitConditionsOpen)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 text-xs ${colors.text.tertiary} hover:${colors.bg.tertiary} rounded`}
                >
                  <span>Exit Conditions</span>
                  <Plus className={`w-3 h-3 transition-transform ${exitConditionsOpen ? 'rotate-45' : ''}`} />
                </button>

                {exitConditionsOpen && (
                  <div className="px-2 pb-2 space-y-2">
                    {/* Take Profit */}
                    <div className="space-y-2">
                      <div className={`text-xs ${colors.text.primary} font-medium`}>Take Profit</div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                          <input
                            type="number"
                            placeholder="Take Profit %"
                            min="0"
                            step="0.01"
                            className={`w-full ${colors.bg.primary} border ${colors.border.tertiary} rounded px-2 py-2 text-xs ${colors.text.primary} placeholder-${colors.text.quaternary}`}
                          />
                        </div>
                        <div className="relative">
                          <span className={`absolute left-2.5 top-1/2 -translate-y-1/2 text-xs ${colors.text.quaternary}`}>$</span>
                          <input
                            type="text"
                            placeholder="Take Profit P"
                            value={takeProfit}
                            onChange={(e) => setTakeProfit(e.target.value)}
                            className={`w-full ${colors.bg.primary} border ${colors.border.tertiary} rounded pl-6 pr-2 py-2 text-xs ${colors.text.primary} placeholder-${colors.text.quaternary}`}
                          />
                        </div>
                      </div>

                      <div className={`grid grid-cols-2 gap-2 text-[10px] ${colors.text.tertiary}`}>
                        <span>N/A Max Profit</span>
                        <span>N/A Chance of 24h Fill</span>
                      </div>

                      <div>
                        <div className={`text-[10px] ${colors.text.tertiary} mb-1.5`}>Urgency</div>
                        <div className="grid grid-cols-5 gap-1.5">
                          {['Very Low', 'Low', 'Medium', 'High', 'Very High'].map((level) => (
                            <button
                              key={level}
                              onClick={() => setTakeProfitUrgency(level)}
                              className={`h-10 px-1 text-[10px] leading-tight rounded-md border transition-colors flex items-center justify-center ${
                                takeProfitUrgency === level
                                  ? 'bg-[#C9A36A] text-white border-[#C9A36A]'
                                  : `${colors.bg.secondary} ${colors.text.tertiary} ${colors.border.tertiary} hover:${colors.bg.tertiary}`
                              }`}
                            >
                              <span className="whitespace-pre-line text-center">
                                {level === 'Very Low' ? 'Very\nLow' : level === 'Very High' ? 'Very\nHigh' : level}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Stop Loss */}
                    <div className="space-y-2 pt-2">
                      <div className={`text-xs ${colors.text.primary} font-medium`}>Stop Loss</div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                          <input
                            type="number"
                            placeholder="Stop Loss %"
                            min="0"
                            step="0.01"
                            className={`w-full ${colors.bg.primary} border ${colors.border.tertiary} rounded px-2 py-2 text-xs ${colors.text.primary} placeholder-${colors.text.quaternary}`}
                          />
                        </div>
                        <div className="relative">
                          <span className={`absolute left-2.5 top-1/2 -translate-y-1/2 text-xs ${colors.text.quaternary}`}>$</span>
                          <input
                            type="text"
                            placeholder="Stop Loss Pr"
                            value={stopLoss}
                            onChange={(e) => setStopLoss(e.target.value)}
                            className={`w-full ${colors.bg.primary} border ${colors.border.tertiary} rounded pl-6 pr-2 py-2 text-xs ${colors.text.primary} placeholder-${colors.text.quaternary}`}
                          />
                        </div>
                      </div>

                      <div className={`grid grid-cols-2 gap-2 text-[10px] ${colors.text.tertiary}`}>
                        <span>N/A Max Loss</span>
                        <span>N/A Chance of 24h Fill</span>
                      </div>

                      <div>
                        <div className={`text-[10px] ${colors.text.tertiary} mb-1.5`}>Urgency</div>
                        <div className="grid grid-cols-5 gap-1.5">
                          {['Very Low', 'Low', 'Medium', 'High', 'Very High'].map((level) => (
                            <button
                              key={level}
                              onClick={() => setStopLossUrgency(level)}
                              className={`h-10 px-1 text-[10px] leading-tight rounded-md border transition-colors flex items-center justify-center ${
                                stopLossUrgency === level
                                  ? 'bg-[#C9A36A] text-white border-[#C9A36A]'
                                  : `${colors.bg.secondary} ${colors.text.tertiary} ${colors.border.tertiary} hover:${colors.bg.tertiary}`
                              }`}
                            >
                              <span className="whitespace-pre-line text-center">
                                {level === 'Very Low' ? 'Very\nLow' : level === 'Very High' ? 'Very\nHigh' : level}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Scale Orders */}
              <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded`}>
                <button
                  onClick={() => setScaleOrdersOpen(!scaleOrdersOpen)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 text-xs ${colors.text.tertiary} hover:${colors.bg.tertiary} rounded`}
                >
                  <span>Scale Orders</span>
                  <Plus className={`w-3 h-3 transition-transform ${scaleOrdersOpen ? 'rotate-45' : ''}`} />
                </button>

                {scaleOrdersOpen && (
                  <div className="px-2 pb-2 space-y-3">
                    {/* Parameters */}
                    <div className="space-y-2">
                      <div className={`text-body font-medium ${colors.text.primary}`}>Parameters</div>
                      
                      <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                        <div>
                          <label className={`block text-label ${colors.text.tertiary} mb-1`}>From Price</label>
                          <input
                            type="text"
                            placeholder="-"
                            className={`w-full ${colors.bg.primary} border ${colors.border.tertiary} rounded px-2 py-1.5 text-xs ${colors.text.primary} placeholder-${colors.text.quaternary}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-label ${colors.text.tertiary} mb-1`}>To Price</label>
                          <input
                            type="text"
                            placeholder="-"
                            className={`w-full ${colors.bg.primary} border ${colors.border.tertiary} rounded px-2 py-1.5 text-xs ${colors.text.primary} placeholder-${colors.text.quaternary}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-label ${colors.text.tertiary} mb-1`}>&nbsp;</label>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setPriceUnit('%')}
                              className={`w-7 h-7 flex items-center justify-center text-xs rounded border transition-colors ${
                                priceUnit === '%'
                                  ? 'bg-[#C9A36A] text-white border-[#C9A36A]'
                                  : `${colors.bg.primary} ${colors.text.tertiary} ${colors.border.tertiary} hover:${colors.bg.secondary}`
                              }`}
                            >
                              %
                            </button>
                            <button
                              onClick={() => setPriceUnit('$')}
                              className={`w-7 h-7 flex items-center justify-center text-xs rounded border transition-colors ${
                                priceUnit === '$'
                                  ? 'bg-[#C9A36A] text-white border-[#C9A36A]'
                                  : `${colors.bg.primary} ${colors.text.tertiary} ${colors.border.tertiary} hover:${colors.bg.secondary}`
                              }`}
                            >
                              $
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Price Skew */}
                    <div>
                      <div className={`text-label ${colors.text.tertiary} mb-1.5`}>Price Skew</div>
                      <input
                        type="range"
                        className="w-full h-1"
                        min="0"
                        max="100"
                        defaultValue="50"
                      />
                    </div>

                    {/* Size Skew */}
                    <div>
                      <div className={`text-label ${colors.text.tertiary} mb-1.5`}>Size Skew</div>
                      <input
                        type="range"
                        className="w-full h-1"
                        min="0"
                        max="100"
                        defaultValue="50"
                      />
                    </div>

                    {/* # of Orders */}
                    <div>
                      <div className={`text-label ${colors.text.tertiary} mb-1.5`}># of Orders</div>
                      <input
                        type="range"
                        className="w-full h-1"
                        min="1"
                        max="40"
                        defaultValue="1"
                      />
                      <div className={`flex justify-between text-[10px] ${colors.text.quaternary} mt-1`}>
                        <span>1</span>
                        <span>5</span>
                        <span>10</span>
                        <span>20</span>
                        <span>30</span>
                        <span>40</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced Settings */}
              <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded`}>
                <button
                  onClick={() => setAdvancedSettingsOpen(!advancedSettingsOpen)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 text-xs ${colors.text.tertiary} hover:${colors.bg.tertiary} rounded`}
                >
                  <span>Advanced Settings</span>
                  <Plus className={`w-3 h-3 transition-transform ${advancedSettingsOpen ? 'rotate-45' : ''}`} />
                </button>

                {advancedSettingsOpen && (
                  <div className="px-2 pb-2 space-y-3">
                    {/* Trajectory */}
                    <div>
                      <label className={`block text-[10px] ${colors.text.tertiary} mb-1`}>Trajectory</label>
                      <div className="relative">
                        <select 
                          value={trajectory}
                          onChange={(e) => setTrajectory(e.target.value)}
                          className={`w-full ${colors.bg.primary} border ${colors.border.tertiary} rounded px-2 py-1.5 text-xs ${colors.text.primary} pr-6 appearance-none`}
                        >
                          <option>VWAP</option>
                          <option>TWAP</option>
                          <option>POV</option>
                        </select>
                        <ChevronDown className={`w-3 h-3 ${colors.text.tertiary} absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none`} />
                      </div>
                    </div>

                    {/* Participation Rate Target */}
                    <div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Participation Rate Target"
                          className={`w-full ${colors.bg.primary} border ${colors.border.tertiary} rounded pl-2 pr-6 py-1.5 text-xs ${colors.text.primary} placeholder-${colors.text.quaternary}`}
                        />
                        <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs ${colors.text.quaternary}`}>%</span>
                      </div>
                    </div>

                    {/* Participation Rate Limit */}
                    <div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Participation Rate Limit"
                          className={`w-full ${colors.bg.primary} border ${colors.border.tertiary} rounded pl-2 pr-6 py-1.5 text-xs ${colors.text.primary} placeholder-${colors.text.quaternary}`}
                        />
                        <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs ${colors.text.quaternary}`}>%</span>
                      </div>
                    </div>

                    {/* Strategy Parameters */}
                    <div className={`border ${colors.border.secondary} rounded p-2 space-y-2.5`}>
                      <div className={`text-xs ${colors.text.primary} font-medium`}>Strategy Parameters</div>
                      
                      {/* Passiveness */}
                      <div>
                        <div className={`text-[10px] ${colors.text.tertiary} mb-1.5`}>Passiveness</div>
                        <input
                          type="range"
                          className="w-full h-1"
                          min="0"
                          max="100"
                          defaultValue="30"
                        />
                      </div>

                      {/* Discretion */}
                      <div>
                        <div className={`text-[10px] ${colors.text.tertiary} mb-1.5`}>Discretion</div>
                        <input
                          type="range"
                          className="w-full h-1"
                          min="0"
                          max="100"
                          defaultValue="20"
                        />
                      </div>

                      {/* Alpha Tilt */}
                      <div>
                        <div className={`text-[10px] ${colors.text.tertiary} mb-1.5`}>Alpha Tilt</div>
                        <input
                          type="range"
                          className="w-full h-1"
                          min="0"
                          max="100"
                          defaultValue="60"
                        />
                      </div>

                      {/* Max OIC Percentage */}
                      <div>
                        <div className={`text-[10px] ${colors.text.tertiary} mb-1.5`}>Max OIC Percentage</div>
                        <input
                          type="range"
                          className="w-full h-1"
                          min="0"
                          max="100"
                          defaultValue="15"
                        />
                      </div>

                      {/* Max Clip Size */}
                      <div>
                        <label className={`block text-[10px] ${colors.text.tertiary} mb-1`}>Max Clip Size</label>
                        <div className="relative">
                          <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-xs ${colors.text.quaternary}`}>$</span>
                          <input
                            type="text"
                            placeholder="Adapts to book if not set"
                            className={`w-full ${colors.bg.primary} border ${colors.border.tertiary} rounded pl-5 pr-2 py-1.5 text-xs ${colors.text.primary} placeholder-${colors.text.quaternary}`}
                          />
                        </div>
                      </div>

                      {/* Checkboxes */}
                      <div className="space-y-1.5 pt-1">
                        <label className={`flex items-center gap-2 text-[10px] ${colors.text.primary}`}>
                          <input type="checkbox" className="w-3 h-3" />
                          <span>Passive Only</span>
                        </label>
                        <label className={`flex items-center gap-2 text-[10px] ${colors.text.primary}`}>
                          <input type="checkbox" className="w-3 h-3" />
                          <span>Active Limit</span>
                        </label>
                        <label className={`flex items-center gap-2 text-[10px] ${colors.text.primary}`}>
                          <input type="checkbox" className="w-3 h-3" />
                          <span>Reduce Only</span>
                        </label>
                        <label className={`flex items-center gap-2 text-[10px] ${colors.text.primary}`}>
                          <input type="checkbox" className="w-3 h-3" />
                          <span>Strict Duration</span>
                        </label>
                      </div>

                      {/* Reset Default */}
                      <div className="pt-1">
                        <button className="text-[10px] text-[#C9A36A] hover:text-[#B8935D]">
                          Reset Default
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Fixed Bottom Section */}
            <div className={`border-t ${colors.border.primary} p-3 space-y-3 ${colors.bg.primary}`}>
              {/* Pre-Trade Analytics */}
              <div className={`border ${colors.border.secondary} rounded p-2`}>
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-xs">📊</span>
                  <span className={`text-[10px] ${colors.text.tertiary}`}>Pre-Trade Analytics</span>
                </div>
                <div className="space-y-1 text-[10px]">
                  <div className={`flex justify-between ${colors.text.tertiary}`}>
                    <span>Participation Rate</span>
                    <span>-</span>
                  </div>
                  <div className={`flex justify-between ${colors.text.tertiary}`}>
                    <span>Order Volatility</span>
                    <span>-</span>
                  </div>
                  <div className={`flex justify-between ${colors.text.tertiary}`}>
                    <span>Market Volume</span>
                    <span>-</span>
                  </div>
                </div>
              </div>

              {/* Template Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setShowSaveTemplateModal(true)}
                  className="py-1.5 border border-[#C9A36A] text-[#C9A36A] rounded text-xs hover:bg-[#C9A36A]/10"
                >
                  Save Templates
                </button>
                <button 
                  onClick={() => setShowLoadTemplateModal(true)}
                  className="py-1.5 border border-[#C9A36A] text-[#C9A36A] rounded text-xs hover:bg-[#C9A36A]/10"
                >
                  Load Templates
                </button>
              </div>

              {/* Submit */}
              <button className={`w-full py-2 ${colors.bg.secondary} ${colors.text.tertiary} rounded text-xs font-medium`}>
                Submit Buy Order
              </button>

              {/* Confirmation */}
              <button 
                onClick={() => setShowConfirmationModal(true)}
                className="w-full py-2 border border-[#1FBF75] text-[#1FBF75] rounded text-xs font-medium hover:bg-[#1FBF75]/10"
              >
                Confirmation
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${colors.bg.primary} border ${colors.border.primary} rounded-lg shadow-2xl w-[600px] max-h-[80vh] flex flex-col`}>
            {/* Header */}
            <div className={`px-6 py-4 border-b ${colors.border.primary} flex items-center justify-between`}>
              <div>
                <h2 className={`text-header font-semibold ${colors.text.primary}`}>Order Confirmation</h2>
                <p className={`text-label ${colors.text.tertiary} mt-0.5`}>Review your order details before execution</p>
              </div>
              <button
                onClick={() => setShowConfirmationModal(false)}
                className={`p-1 hover:${colors.bg.subtle} rounded transition-colors`}
              >
                <Plus className={`w-5 h-5 ${colors.text.tertiary} rotate-45`} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4 overflow-y-auto space-y-4">
              {/* Asset & Side */}
              <div className={`${colors.bg.secondary} rounded-lg p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`text-label ${colors.text.tertiary}`}>Asset</div>
                  <div className={`text-body font-semibold ${colors.text.primary}`}>{selectedAsset}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className={`text-label ${colors.text.tertiary}`}>Side</div>
                  <div className={`px-3 py-1 rounded text-xs font-medium ${
                    orderSide === 'buy' 
                      ? 'bg-[#1FBF75]/10 text-[#1FBF75]' 
                      : 'bg-[#E24A4A]/10 text-[#E24A4A]'
                  }`}>
                    {orderSide.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Position Details */}
              <div>
                <div className={`text-body font-semibold ${colors.text.primary} mb-3`}>Position Details</div>
                <div className={`${colors.bg.secondary} rounded-lg p-4 space-y-2.5`}>
                  <div className="flex items-center justify-between">
                    <div className={`text-label ${colors.text.tertiary}`}>BTC Amount</div>
                    <div className={`text-body ${colors.text.primary}`} style={{ fontFeatureSettings: '"tnum" on' }}>
                      {btcAmount || '0.00'} BTC
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className={`text-label ${colors.text.tertiary}`}>USDT Amount</div>
                    <div className={`text-body ${colors.text.primary}`} style={{ fontFeatureSettings: '"tnum" on' }}>
                      {usdtAmount || '0.00'} USDT
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className={`text-label ${colors.text.tertiary}`}>Limit Price</div>
                    <div className={`text-body ${colors.text.primary}`} style={{ fontFeatureSettings: '"tnum" on' }}>
                      {limitPriceMode === 'Dynamic' ? 'Dynamic' : limitPrice || 'Not set'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className={`text-label ${colors.text.tertiary}`}>Order Type</div>
                    <div className={`text-body ${colors.text.primary}`}>{orderType === 'limit' ? 'Limit' : 'Market'}</div>
                  </div>
                </div>
              </div>

              {/* Exchanges */}
              <div>
                <div className={`text-body font-semibold ${colors.text.primary} mb-3`}>Exchanges</div>
                <div className={`${colors.bg.secondary} rounded-lg p-4`}>
                  <div className="flex flex-wrap gap-2">
                    {selectedExchanges.length === 0 ? (
                      <span className={`text-label ${colors.text.quaternary}`}>No exchanges selected</span>
                    ) : (
                      selectedExchanges.map((exchange) => (
                        <div
                          key={exchange}
                          className={`px-3 py-1.5 ${colors.bg.primary} border ${colors.border.secondary} rounded text-label ${colors.text.primary}`}
                        >
                          {exchange}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Strategy */}
              <div>
                <div className={`text-body font-semibold ${colors.text.primary} mb-3`}>Strategy</div>
                <div className={`${colors.bg.secondary} rounded-lg p-4`}>
                  <div className="flex flex-wrap gap-2">
                    {selectedStrategies.length === 0 ? (
                      <span className={`text-label ${colors.text.quaternary}`}>No strategies selected</span>
                    ) : (
                      selectedStrategies.map((strategy) => (
                        <div
                          key={strategy}
                          className={`px-3 py-1.5 ${colors.bg.primary} border ${colors.border.secondary} rounded text-label ${colors.text.primary}`}
                        >
                          {strategy}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Execution Parameters */}
              <div>
                <div className={`text-body font-semibold ${colors.text.primary} mb-3`}>Execution Parameters</div>
                <div className={`${colors.bg.secondary} rounded-lg p-4 space-y-2.5`}>
                  <div className="flex items-center justify-between">
                    <div className={`text-label ${colors.text.tertiary}`}>Duration</div>
                    <div className={`text-body ${colors.text.primary}`}>{duration} min</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className={`text-label ${colors.text.tertiary}`}>Time Start</div>
                    <div className={`text-body ${colors.text.primary}`}>{timeStart} ({timezone.split(' ')[0]})</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className={`text-label ${colors.text.tertiary}`}>Time End</div>
                    <div className={`text-body ${colors.text.primary}`}>{timeEnd} ({timezone.split(' ')[0]})</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className={`text-label ${colors.text.tertiary}`}>Trajectory</div>
                    <div className={`text-body ${colors.text.primary}`}>{trajectory}</div>
                  </div>
                  {ioc && (
                    <div className="flex items-center justify-between">
                      <div className={`text-label ${colors.text.tertiary}`}>IOC</div>
                      <div className={`text-body ${colors.text.primary}`}>Enabled</div>
                    </div>
                  )}
                  {pause && (
                    <div className="flex items-center justify-between">
                      <div className={`text-label ${colors.text.tertiary}`}>Pause</div>
                      <div className={`text-body ${colors.text.primary}`}>Enabled</div>
                    </div>
                  )}
                  {grid && (
                    <div className="flex items-center justify-between">
                      <div className={`text-label ${colors.text.tertiary}`}>Grid</div>
                      <div className={`text-body ${colors.text.primary}`}>Enabled</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Exit Conditions */}
              {exitConditionsOpen && (
                <div>
                  <div className={`text-body font-semibold ${colors.text.primary} mb-3`}>Exit Conditions</div>
                  <div className={`${colors.bg.secondary} rounded-lg p-4 space-y-2.5`}>
                    <div className="flex items-center justify-between">
                      <div className={`text-label ${colors.text.tertiary}`}>Take Profit</div>
                      <div className={`text-body ${colors.text.primary}`}>{takeProfit ? `$${takeProfit}` : 'Not set'}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className={`text-label ${colors.text.tertiary}`}>Take Profit Urgency</div>
                      <div className={`text-body ${colors.text.primary}`}>{takeProfitUrgency}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className={`text-label ${colors.text.tertiary}`}>Stop Loss</div>
                      <div className={`text-body ${colors.text.primary}`}>{stopLoss ? `$${stopLoss}` : 'Not set'}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className={`text-label ${colors.text.tertiary}`}>Stop Loss Urgency</div>
                      <div className={`text-body ${colors.text.primary}`}>{stopLossUrgency}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`px-6 py-4 border-t ${colors.border.primary} flex gap-3`}>
              <button
                onClick={() => setShowConfirmationModal(false)}
                className={`flex-1 py-2.5 ${colors.bg.secondary} ${colors.text.primary} rounded text-body font-medium hover:${colors.bg.tertiary} transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmationModal(false);
                  
                  const now = new Date();
                  const timestamp = now.toISOString().split('T')[0] + ' ' + now.toTimeString().split(' ')[0];
                  
                  // Create new open order entry
                  // For buy orders: show long account/pair, use "-" for short
                  // For sell orders: show short account/pair, use "-" for long
                  const newOpenOrder = {
                    longAccount: orderSide === 'buy' ? (selectedExchanges[0] || 'Paradex') : '-',
                    longPair: orderSide === 'buy' ? selectedAsset.replace(':', '-') : '-',
                    shortAccount: orderSide === 'sell' ? (selectedExchanges[0] || 'Hyperliquid') : '-',
                    shortPair: orderSide === 'sell' ? selectedAsset.replace(':', '-') : '-',
                    notional: `$${(parseFloat(usdtAmount) || 0).toFixed(2)}`,
                    filled: 0,
                    status: 'Pending'
                  };
                  
                  // Add to store
                  addOpenOrder(newOpenOrder);
                  
                  // Add to global trades store
                  const exchange = selectedExchanges[0] || 'Paradex';
                  const token = selectedAsset.split(':')[0];
                  const price = limitPriceMode === 'Dynamic' ? currentPrice : parseFloat(limitPrice) || currentPrice;
                  
                  // Calculate size: if BTC amount is provided, use it; otherwise calculate from USD amount
                  let amount;
                  if (btcAmount && parseFloat(btcAmount) > 0) {
                    amount = parseFloat(btcAmount);
                  } else if (usdtAmount && parseFloat(usdtAmount) > 0) {
                    // User entered USD amount, calculate BTC size from it
                    amount = parseFloat(usdtAmount) / price;
                  } else {
                    // No input, use default
                    amount = 0.25;
                  }
                  
                  // Calculate USDT quantity from amount
                  const usdQuantity = amount * price;
                  
                  // Generate order ID
                  const orderId = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                  
                  // Record trade execution in new trades store
                  addTrade({
                    exchange: exchange,
                    symbol: selectedAsset,
                    side: orderSide,
                    size: amount,
                    executionPrice: price,
                    tradingMode: 'aggregator',
                    orderType: orderType,
                    notes: `Quick ${orderSide} via Aggregator`,
                  });
                  
                  // Add order to compatibility store
                  addOrder({
                    id: orderId,
                    type: orderSide === 'buy' ? 'long' : 'short',
                    exchange: exchange,
                    token: token,
                    size: amount,
                    price: price,
                    filled: 0,
                    status: 'pending',
                    source: 'aggregator',
                  });
                  
                  // Add to history with complete trade details
                  const historyEntry = {
                    type: 'trade' as const,
                    action: `${orderSide === 'buy' ? 'Long' : 'Short'} ${token} on ${exchange}`,
                    amount: amount,
                    token: token,
                    exchange: exchange,
                    status: 'completed' as const,
                    volume: usdQuantity, // USDT value of the trade
                    buyQuantity: orderSide === 'buy' ? usdQuantity : undefined,
                    buyLeverage: orderSide === 'buy' ? 1 : undefined,
                    sellQuantity: orderSide === 'sell' ? usdQuantity : undefined,
                    sellLeverage: orderSide === 'sell' ? 1 : undefined,
                    buyExchange: orderSide === 'buy' ? exchange : undefined,
                    sellExchange: orderSide === 'sell' ? exchange : undefined,
                    buyPair: orderSide === 'buy' ? selectedAsset : undefined,
                    sellPair: orderSide === 'sell' ? selectedAsset : undefined,
                    buyPrice: orderSide === 'buy' ? price : undefined,
                    sellPrice: orderSide === 'sell' ? price : undefined,
                    duration: parseFloat(duration) || 5,
                    exchanges: selectedExchanges.length > 0 ? selectedExchanges : [exchange],
                    source: 'aggregator',
                  };
                  console.log('🔵 AggregatorPage - Creating history entry:', {
                    selectedExchanges,
                    historyEntry
                  });
                  addHistoryEntry(historyEntry);
                  
                  // === CREATE POSITION WITH LIVE DATA ===
                  // Check if this is an arbitrage trade (two exchanges selected)
                  const isArbitrageTrade = selectedExchanges.length >= 2;
                  
                  // Build position legs based on trade type
                  const positionLegs = [];
                  
                  if (isArbitrageTrade) {
                    // ARBITRAGE TRADE: Long on buyExchange, Short on sellExchange
                    const buyExchange = selectedExchanges[0];
                    const sellExchange = selectedExchanges[1];
                    const buyFundingRate = getFundingRate(token, buyExchange) || 0;
                    const sellFundingRate = getFundingRate(token, sellExchange) || 0;
                    
                    // Long leg (buy exchange)
                    positionLegs.push({
                      id: `leg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                      exchange: buyExchange,
                      side: 'long' as const,
                      quantity: amount,
                      leverage: 1, // Default leverage for aggregator
                      entryPrice: price,
                      entryFundingRate: buyFundingRate,
                      timestamp: Date.now(),
                    });
                    
                    // Short leg (sell exchange)
                    positionLegs.push({
                      id: `leg-${Date.now() + 1}-${Math.random().toString(36).substr(2, 9)}`,
                      exchange: sellExchange,
                      side: 'short' as const,
                      quantity: amount,
                      leverage: 1, // Default leverage for aggregator
                      entryPrice: price,
                      entryFundingRate: sellFundingRate,
                      timestamp: Date.now(),
                    });
                    
                    console.log(`✓ Arbitrage position: Long ${token} on ${buyExchange} (${buyFundingRate.toFixed(2)}% APR), Short on ${sellExchange} (${sellFundingRate.toFixed(2)}% APR)`);
                  } else {
                    // SINGLE EXCHANGE TRADE
                    const currentFundingRate = getFundingRate(token, exchange) || 0;
                    
                    positionLegs.push({
                      id: `leg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                      exchange: exchange,
                      side: orderSide === 'buy' ? 'long' : 'short' as const,
                      quantity: amount,
                      leverage: 1, // Default leverage for aggregator
                      entryPrice: price,
                      entryFundingRate: currentFundingRate,
                      timestamp: Date.now(),
                    });
                    
                    console.log(`✓ Single position: ${orderSide} ${token} on ${exchange} at $${price.toFixed(2)}`);
                  }
                  
                  // Create the position with all legs
                  const positionId = addPosition({
                    token: token,
                    legs: positionLegs,
                    notionalValue: usdQuantity * (isArbitrageTrade ? 2 : 1), // 2x notional for arbitrage
                    closedAt: null,
                    notes: isArbitrageTrade 
                      ? `Funding rate arbitrage - ${selectedStrategies.join(', ')}`
                      : `Aggregator ${orderSide} trade - ${selectedStrategies.join(', ')}`,
                  });
                  
                  // Create an order request with all form parameters
                  const orderRequest: any = {
                    type: 'single',
                    side: orderSide,
                    token: selectedAsset,
                    amount: parseFloat(btcAmount) || 0,
                    usdtAmount: parseFloat(usdtAmount) || 0,
                    exchanges: selectedExchanges,
                    buyExchange: selectedExchanges[0] || 'Hyperliquid',
                    buyPair: selectedAsset,
                    buyQuantity: parseFloat(btcAmount) || 0,
                    buyPrice: limitPriceMode === 'Dynamic' ? undefined : parseFloat(limitPrice),
                    sellExchange: selectedExchanges[1] || 'Paradex',
                    sellPair: selectedAsset,
                    sellQuantity: parseFloat(btcAmount) || 0,
                    sellPrice: limitPriceMode === 'Dynamic' ? undefined : parseFloat(limitPrice),
                    duration: `${duration}min`,
                    strategy: selectedStrategies.join(', ') || 'Impact Minimization',
                    // Execution parameters
                    trajectory,
                    timezone,
                    timeStart,
                    timeEnd,
                    // Flags
                    ioc,
                    pause,
                    grid,
                    // Exit conditions
                    takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
                    takeProfitUrgency,
                    stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
                    stopLossUrgency,
                    // Additional metadata
                    limitPriceMode
                  };
                  onCreateOrder(orderRequest);
                }}
                className="flex-1 py-2.5 bg-[#1FBF75] text-white rounded text-body font-medium hover:bg-[#1AAD69] transition-colors"
              >
                Confirm and Execute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${colors.bg.primary} border ${colors.border.primary} rounded-lg shadow-2xl w-[400px]`}>
            {/* Header */}
            <div className={`px-6 py-4 border-b ${colors.border.primary} flex items-center justify-between`}>
              <h2 className={`text-header font-semibold ${colors.text.primary}`}>Save Template</h2>
              <button
                onClick={() => {
                  setShowSaveTemplateModal(false);
                  setTemplateName('');
                }}
                className={`p-1 hover:${colors.bg.subtle} rounded transition-colors`}
              >
                <Plus className={`w-5 h-5 ${colors.text.tertiary} rotate-45`} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              <label className={`block text-label ${colors.text.secondary} mb-2`}>Template Name</label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Enter template name"
                className={`w-full px-3 py-2 ${colors.bg.secondary} border ${colors.border.default} rounded text-body ${colors.text.primary} placeholder:${colors.text.tertiary}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveTemplate();
                  }
                }}
              />
            </div>

            {/* Footer */}
            <div className={`px-6 py-4 border-t ${colors.border.primary} flex gap-3`}>
              <button
                onClick={() => {
                  setShowSaveTemplateModal(false);
                  setTemplateName('');
                }}
                className={`flex-1 py-2.5 ${colors.bg.secondary} ${colors.text.primary} rounded text-body font-medium hover:${colors.bg.tertiary} transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={!templateName.trim()}
                className={`flex-1 py-2.5 ${!templateName.trim() ? 'bg-gray-400' : 'bg-[#C9A36A]'} text-white rounded text-body font-medium hover:opacity-90 transition-opacity disabled:cursor-not-allowed`}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Template Modal */}
      {showLoadTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${colors.bg.primary} border ${colors.border.primary} rounded-lg shadow-2xl w-[500px] max-h-[600px] flex flex-col`}>
            {/* Header */}
            <div className={`px-6 py-4 border-b ${colors.border.primary} flex items-center justify-between`}>
              <h2 className={`text-header font-semibold ${colors.text.primary}`}>Load Template</h2>
              <button
                onClick={() => setShowLoadTemplateModal(false)}
                className={`p-1 hover:${colors.bg.subtle} rounded transition-colors`}
              >
                <Plus className={`w-5 h-5 ${colors.text.tertiary} rotate-45`} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4 overflow-y-auto flex-1">
              {savedTemplates.length === 0 ? (
                <div className={`text-center py-8 ${colors.text.tertiary}`}>
                  <p className="text-body">No saved templates yet</p>
                  <p className="text-label mt-2">Save your current settings to create a template</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`${colors.bg.secondary} border ${colors.border.default} rounded-lg p-4 hover:${colors.bg.tertiary} transition-colors`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`text-body font-medium ${colors.text.primary} mb-2`}>{template.name}</h3>
                          <div className="space-y-1">
                            <p className={`text-label ${colors.text.tertiary}`}>
                              Asset: <span className={colors.text.secondary}>{template.settings.selectedAsset}</span>
                            </p>
                            <p className={`text-label ${colors.text.tertiary}`}>
                              Exchanges: <span className={colors.text.secondary}>{template.settings.selectedExchanges.join(', ')}</span>
                            </p>
                            <p className={`text-label ${colors.text.tertiary}`}>
                              Strategies: <span className={colors.text.secondary}>{template.settings.selectedStrategies.join(', ')}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleLoadTemplate(template)}
                            className="px-3 py-1.5 bg-[#C9A36A] text-white rounded text-xs font-medium hover:opacity-90 transition-opacity"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className={`px-3 py-1.5 ${colors.bg.primary} border ${colors.border.default} ${colors.text.secondary} rounded text-xs font-medium hover:${colors.bg.subtle} transition-colors`}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`px-6 py-4 border-t ${colors.border.primary}`}>
              <button
                onClick={() => setShowLoadTemplateModal(false)}
                className={`w-full py-2.5 ${colors.bg.secondary} ${colors.text.primary} rounded text-body font-medium hover:${colors.bg.tertiary} transition-colors`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AggregatorPage;
