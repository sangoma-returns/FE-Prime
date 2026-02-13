import { useState, useEffect } from 'react';
import { useThemeStore } from '../../stores/themeStore';
import { useMarketDataStore } from '../../stores/marketDataStore';
import { Search, X, ChevronDown } from 'lucide-react';
import { fetchAllDexsRWAData } from '../AggregatorPageFetchHelper';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface ExchangePairSelectorProps {
  onSelect: (exchange: string, pair: string) => void;
  onClose: () => void;
  mode: 'exchange' | 'pair';
  currentExchange?: string;
  enabledExchanges?: string[];
}

// Exchanges and trading pairs will come from the centralized market data store

type PairCategory = 'all' | 'favorites' | 'spot' | 'perps' | 'rwas';

export function ExchangePairSelector({ onSelect, onClose, mode, currentExchange, enabledExchanges }: ExchangePairSelectorProps) {
  const { theme, colors } = useThemeStore();
  const { exchanges: marketExchanges, assets } = useMarketDataStore();
  const isDark = theme === 'dark';
  
  // Use exchanges from market data store
  const EXCHANGES = marketExchanges.map((ex, index) => ({
    id: ex.id,
    name: ex.name,
    icon: ['💧', '◈', '✦', '⬡', '⬢', '○'][index] || '○', // Use default icons
  }));
  
  // HIP-3 DEXs (includes RWA and crypto DEXs)
  const RWA_DEXS = [
    { id: 'xyz', name: 'XYZ' },
    { id: 'vntl', name: 'VNTL' },
    { id: 'km', name: 'KM' },
    { id: 'cash', name: 'CASH' },
    { id: 'flx', name: 'FLX' },
    { id: 'hyna', name: 'HYNA' },
  ];
  
  // State declarations - MUST come before useEffect
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExchangeFilter, setSelectedExchangeFilter] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<PairCategory>('perps');
  
  // RWA Data state
  const [rwaData, setRwaData] = useState<{
    commodities: Array<{ symbol: string; volume24h: string; oi: string; change24h: number; price: number; volume24hUsd: number }>;
    stocks: Array<{ symbol: string; volume24h: string; oi: string; change24h: number; price: number; volume24hUsd: number }>;
    indices: Array<{ symbol: string; volume24h: string; oi: string; change24h: number; price: number; volume24hUsd: number }>;
  }>({ commodities: [], stocks: [], indices: [] });
  const [rwaLoading, setRwaLoading] = useState(false);
  
  // Fetch RWA data when RWAs tab is selected
  useEffect(() => {
    if (activeCategory === 'rwas' && rwaData.commodities.length === 0) {
      setRwaLoading(true);
      fetchAllDexsRWAData(projectId, publicAnonKey, () => {}, () => {})
        .then(data => {
          setRwaData(data);
          setRwaLoading(false);
        })
        .catch(() => setRwaLoading(false));
    }
  }, [activeCategory]);
  
  // Use assets from market data store to build trading pairs
  const ASSETS = Array.from(assets.values());
  
  // Generate pairs for each asset with exchange-specific quote currencies
  const allPairs = ASSETS.flatMap(asset => {
    const baseData = {
      symbol: asset.symbol,
      price: asset.price || 0,
      change: asset.change || 0,
      volume: asset.volume || 0,
      unit: 'B',
      icon: asset.symbol.charAt(0),
      position: null,
    };
    
    return [
      // Hyperliquid uses USDC
      { ...baseData, pair: `${asset.symbol}:PERP-USDC`, exchanges: ['hyperliquid'] },
      { ...baseData, pair: `${asset.symbol}/USDC`, exchanges: ['hyperliquid'] },
      // All other exchanges use USDT
      { ...baseData, pair: `${asset.symbol}:PERP-USDT`, exchanges: ['paradex', 'aster', 'binance', 'bybit', 'okx'] },
      { ...baseData, pair: `${asset.symbol}/USDT`, exchanges: ['paradex', 'aster', 'binance', 'bybit', 'okx'] },
    ];
  });
  
  // Normalize enabledExchanges to lowercase for comparison
  const normalizedEnabledExchanges = enabledExchanges?.map(e => e.toLowerCase()) || [];
  
  const handleExchangeSelect = (exchangeId: string) => {
    onSelect(exchangeId, '');
    onClose();
  };
  
  const handlePairSelect = (pair: string, displayPair?: string) => {
    if (currentExchange) {
      // If we have a displayPair (transformed for spot), use that instead of the original
      onSelect(currentExchange, displayPair || pair);
      onClose();
    }
  };
  
  const handleUnifiedPairSelect = (pair: string, displayPair?: string) => {
    // In exchange mode, select both exchange and pair
    // Use the first selected exchange filter, or the first available exchange for this pair
    const pairData = allPairs.find(p => p.pair === pair);
    if (pairData) {
      const selectedExchange = selectedExchangeFilter.length > 0 
        ? selectedExchangeFilter[0] 
        : pairData.exchanges[0];
      // If we have a displayPair (transformed for spot), use that instead of the original
      onSelect(selectedExchange, displayPair || pair);
      onClose();
    }
  };
  
  const handleRWAPairSelect = (pair: string) => {
    // RWA assets always use Hyperliquid, regardless of currentExchange
    onSelect('hyperliquid', pair);
    onClose();
  };
  
  const toggleExchangeFilter = (exchangeId: string) => {
    setSelectedExchangeFilter(prev => 
      prev.includes(exchangeId) 
        ? prev.filter(e => e !== exchangeId)
        : [...prev, exchangeId]
    );
  };
  
  const toggleFavorite = (pair: string) => {
    setFavorites(prev => 
      prev.includes(pair)
        ? prev.filter(p => p !== pair)
        : [...prev, pair]
    );
  };
  
  // Filter pairs based on search, exchange filter, and category
  const filteredPairs = allPairs.filter(pair => {
    const matchesSearch = pair.pair.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pair.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesExchange = selectedExchangeFilter.length === 0 || 
                           selectedExchangeFilter.some(ex => pair.exchanges.includes(ex));
    
    // For spot category, show perp pairs but we'll transform them in the display
    const matchesCategory = activeCategory === 'all' || 
                           (activeCategory === 'favorites' && favorites.includes(pair.pair)) ||
                           (activeCategory === 'spot' && pair.pair.includes('PERP')) ||  // Changed: show perps for spot tab
                           (activeCategory === 'perps' && pair.pair.includes('PERP')) ||
                           (activeCategory === 'exchanges' && selectedExchangeFilter.length > 0);
    return matchesSearch && matchesExchange && matchesCategory;
  });
  
  // For RWAs tab, create pairs from RWA data
  const rwaPairs = activeCategory === 'rwas' ? [
    ...rwaData.commodities,
    ...rwaData.stocks,
    ...rwaData.indices
  ].map(asset => {
    // Extract asset name without DEX prefix (e.g., "xyz:GOLD" -> "GOLD")
    const assetName = asset.symbol.includes(':') ? asset.symbol.split(':')[1] : asset.symbol;
    // Extract DEX prefix (e.g., "xyz:GOLD" -> "xyz")
    const dexPrefix = asset.symbol.includes(':') ? asset.symbol.split(':')[0].toLowerCase() : '';
    
    return {
      symbol: assetName,
      pair: asset.symbol, // Already in format "xyz:GOLD:PERP-USDC"
      price: asset.price,
      change: asset.change24h,
      volume: asset.volume24hUsd / 1000000, // Convert to millions
      unit: 'M',
      icon: '', // No icon for RWA assets
      position: null,
      exchanges: ['hyperliquid'], // RWA assets are on Hyperliquid
      displayPair: asset.symbol, // Already in format "xyz:GOLD:PERP-USDC"
      originalPair: asset.symbol, // Already in format "xyz:GOLD:PERP-USDC"
      dexPrefix // Store the DEX prefix for filtering
    };
  }).filter(asset => {
    const matchesSearch = asset.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    // Filter by selected DEX if any DEX is selected
    const matchesDex = selectedExchangeFilter.length === 0 || 
                      selectedExchangeFilter.some(dex => dex.toLowerCase() === asset.dexPrefix);
    return matchesSearch && matchesDex;
  }) : [];
  
  // Transform pairs for display - convert PERP to Spot format when Spot tab is selected
  const displayPairs = activeCategory === 'rwas' ? rwaPairs : filteredPairs.map(pair => {
    if (activeCategory === 'spot' && pair.pair.includes('PERP')) {
      // Convert "BTC:PERP-USDT" to "BTC-Spot-USDT"
      const transformedPair = pair.pair.replace(':PERP-', '-Spot-').replace('PERP-', 'Spot-');
      return {
        ...pair,
        displayPair: transformedPair,
        originalPair: pair.pair
      };
    }
    return {
      ...pair,
      displayPair: pair.pair,
      originalPair: pair.pair
    };
  });
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div 
        className={`${colors.bg.primary} rounded-lg shadow-2xl w-[820px] max-h-[720px] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Both modes now show the same pair interface */}
        <>
          {/* Search Header */}
          <div className={`border-b ${colors.border.primary} p-4`}>
            <div className={`flex items-center gap-3 ${colors.bg.secondary} border ${colors.border.secondary} rounded-md px-3 py-2`}>
              <Search className={`w-4 h-4 ${colors.text.tertiary}`} />
              <input
                type="text"
                placeholder="Search pair"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`flex-1 bg-transparent ${colors.text.primary} text-body outline-none placeholder:${colors.text.tertiary}`}
                autoFocus
              />
              <button onClick={onClose}>
                <X className={`w-4 h-4 ${colors.text.tertiary}`} />
              </button>
            </div>
          </div>
          
          {/* Category Tabs */}
          <div className={`border-b ${colors.border.primary} px-4`}>
            <div className="flex gap-6">
              {[
                { id: 'all' as PairCategory, label: 'All' },
                { id: 'favorites' as PairCategory, label: 'Favorites' },
                { id: 'spot' as PairCategory, label: 'Spot' },
                { id: 'perps' as PairCategory, label: 'Perps' },
                { id: 'rwas' as PairCategory, label: 'RWAs' },
              ].map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`pb-3 pt-3 text-button transition-colors ${
                    activeCategory === category.id
                      ? 'text-orange-500 border-b-2 border-orange-500'
                      : colors.text.tertiary + ' ' + colors.text.hoverPrimary
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Exchange Filter Chips */}
          <div className={`border-b ${colors.border.primary} px-4 py-3`}>
            <div className="flex flex-wrap gap-2">
              {(activeCategory === 'rwas' ? RWA_DEXS : EXCHANGES).map((exchange) => {
                const isEnabled = activeCategory === 'rwas' || !enabledExchanges || enabledExchanges.length === 0 || normalizedEnabledExchanges.includes(exchange.id.toLowerCase());
                const isSelected = selectedExchangeFilter.includes(exchange.id);
                const isRWADex = activeCategory === 'rwas';
                
                return (
                  <button
                    key={exchange.id}
                    onClick={() => isEnabled && toggleExchangeFilter(exchange.id)}
                    disabled={!isEnabled}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-button transition-colors ${
                      isSelected
                        ? 'bg-orange-500 text-white'
                        : isDark
                          ? 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333333]'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } ${!isEnabled ? 'opacity-30 cursor-not-allowed' : ''}`}
                  >
                    {!isRWADex && <span className="text-sm">{exchange.icon}</span>}
                    <span>{exchange.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Pair List */}
          <div className="flex-1 overflow-y-auto">
                {/* Table Header */}
                <div className={`grid grid-cols-[40px_1fr_100px_120px_140px] gap-4 px-4 py-2 border-b ${colors.border.secondary} sticky top-0 ${colors.bg.primary}`}>
                  <div></div>
                  <div className={`text-label ${colors.text.tertiary}`}>Trading Pair</div>
                  <div className={`text-label ${colors.text.tertiary} text-center`}>Position</div>
                  <div className={`text-label ${colors.text.tertiary} text-right`}>24h Change</div>
                  <div className={`text-label ${colors.text.tertiary} text-right flex items-center justify-end gap-1`}>
                    24h Volume <ChevronDown className="w-3 h-3" />
                  </div>
                </div>
                
                {/* Pair Rows */}
                <div>
                  {displayPairs.map((pair) => {
                    // Check if this pair matches selected exchange filters
                    // For RWA assets, don't apply greying logic since DEX filters are not actual exchanges
                    const matchesSelectedExchanges = activeCategory === 'rwas' || selectedExchangeFilter.length === 0 || 
                                                    selectedExchangeFilter.some(ex => pair.exchanges.includes(ex));
                    const isGreyedOut = activeCategory !== 'rwas' && selectedExchangeFilter.length > 0 && !matchesSelectedExchanges;
                    
                    // Determine the click handler based on category
                    const handleClick = () => {
                      if (activeCategory === 'rwas') {
                        handleRWAPairSelect(pair.pair);
                      } else if (mode === 'exchange') {
                        handleUnifiedPairSelect(pair.pair, pair.displayPair);
                      } else {
                        handlePairSelect(pair.pair, pair.displayPair);
                      }
                    };
                    
                    return (
                      <div
                        key={pair.pair}
                        onClick={handleClick}
                        className={`w-full grid grid-cols-[40px_1fr_100px_120px_140px] gap-4 px-4 py-3 ${colors.bg.hover} transition-colors border-b ${colors.border.secondary} cursor-pointer ${
                          isGreyedOut ? 'opacity-30' : ''
                        }`}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(pair.pair);
                          }}
                          className={`${favorites.includes(pair.pair) ? 'text-yellow-500' : colors.text.tertiary}`}
                        >
                          ★
                        </button>
                        
                        <div className="flex items-center gap-2 text-left">
                          <span className="text-lg">{pair.icon}</span>
                          <span className={`text-body ${colors.text.primary} font-medium`}>{pair.displayPair}</span>
                        </div>
                        
                        <div className={`text-numeric text-center ${colors.text.tertiary}`}>
                          -
                        </div>
                        
                        <div className={`text-numeric text-right ${pair.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {pair.change >= 0 ? '+' : ''}{pair.change.toFixed(2)}%
                        </div>
                        
                        <div className={`text-numeric text-right ${colors.text.primary}`}>
                          ${pair.volume.toFixed(2)}{pair.unit}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {filteredPairs.length === 0 && (
                  <div className={`text-center py-12 ${colors.text.tertiary} text-body`}>
                    {activeCategory === 'rwas' ? 'RWA data loading...' : 'No pairs found'}
                  </div>
                )}
          </div>
        </>
      </div>
    </div>
  );
}