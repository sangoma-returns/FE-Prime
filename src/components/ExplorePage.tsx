import { useState, useEffect } from 'react';
import { Search, Star, Wallet, HelpCircle } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';
import { useFundingRatesStore } from '../stores/fundingRatesStore';
import { useMarketDataStore } from '../stores/marketDataStore';
import { Tooltip } from './Tooltip';

// Top 100 tokens by market cap - used for search
const TOP_100_TOKENS = [
  'BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'USDC', 'XRP', 'DOGE', 'ADA', 'TRX',
  'AVAX', 'SHIB', 'TON', 'LINK', 'DOT', 'MATIC', 'DAI', 'LTC', 'BCH', 'UNI',
  'ATOM', 'XLM', 'XMR', 'OKB', 'ICP', 'ETC', 'FIL', 'HBAR', 'APT', 'VET',
  'NEAR', 'ARB', 'OP', 'INJ', 'STX', 'IMX', 'RUNE', 'GRT', 'ALGO', 'MKR',
  'AAVE', 'SNX', 'SAND', 'MANA', 'AXS', 'EGLD', 'XTZ', 'THETA', 'FTM', 'EOS',
  'KAVA', 'FLOW', 'CHZ', 'ZEC', 'DASH', 'NEO', 'IOTA', 'MINA', 'QNT', 'CRV',
  'COMP', 'YFI', 'SUSHI', 'ZIL', 'ENJ', 'BAT', 'LRC', 'ONE', 'CELO', 'QTUM',
  'ZRX', 'RVN', 'WAVES', 'ICX', 'OMG', 'SC', 'ZEN', 'ANKR', 'BNT', 'KLAY',
  'PEPE', 'SEI', 'TIA', 'SUI', 'FET', 'BONK', 'WIF', 'FLOKI', 'GALA', 'ROSE',
  'WLD', 'BLUR', 'RNDR', 'JUP', 'ORDI', 'BEAM', 'PYTH', 'STRK', 'DYM', 'MEME'
];

// Exchanges will come from the centralized market data store

interface SelectedCell {
  token: string;
  exchange: string;
  rate: number;
}

interface ExplorePageProps {
  onTradeSelect?: (buyData: SelectedCell, sellData: SelectedCell) => void;
  enabledExchanges?: string[];
}

export default function ExplorePage({ 
  onTradeSelect, 
  enabledExchanges = []
}: ExplorePageProps) {
  const { theme, colors } = useThemeStore();
  const { rates: fundingRates, getTokenRates, fetchLiveFundingRates, getMarketCapRank } = useFundingRatesStore();
  const { exchanges: marketExchanges, assets } = useMarketDataStore();
  const isDark = theme === 'dark';
  
  // Fetch live funding rates on mount and set up polling
  useEffect(() => {
    console.log('🟢 Fetching funding rates (initial mount)');
    fetchLiveFundingRates();
    
    const interval = setInterval(() => {
      console.log('🟡 Fetching funding rates (60s interval)');
      fetchLiveFundingRates();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []); // Empty dependency array - only run on mount/unmount
  
  // Use exchanges from market data store
  const EXCHANGES = marketExchanges.map(ex => ({ id: ex.id, name: ex.name }));
  const [searchQuery, setSearchQuery] = useState('');
  const [timeframe, setTimeframe] = useState('Day');
  const [watchlistSearch, setWatchlistSearch] = useState('');
  const [sortBy, setSortBy] = useState<'volume' | 'price'>('volume');
  const [selectedCells, setSelectedCells] = useState<SelectedCell[]>([]);
  const [favorites, setFavorites] = useState<string[]>(['BTC', 'ETH']); // Start with some defaults
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedFavorite, setSelectedFavorite] = useState<string | null>(null); // Track which favorite is selected for filtering
  const [capacityWeightedValue, setCapacityWeightedValue] = useState<string>(''); // Capacity weighted funding rate value

  // Check if an exchange is enabled (normalize to lowercase for comparison)
  const isExchangeEnabled = (exchange: string) => {
    if (enabledExchanges.length === 0) return true; // If no exchanges selected, allow all
    return enabledExchanges.some(e => e.toLowerCase() === exchange.toLowerCase());
  };

  // Toggle favorite
  const toggleFavorite = (token: string) => {
    setFavorites(prev => {
      if (prev.includes(token)) {
        // If removing the currently selected favorite, clear the filter
        if (selectedFavorite === token) {
          setSelectedFavorite(null);
        }
        return prev.filter(t => t !== token);
      } else {
        return [...prev, token];
      }
    });
  };

  // Handle favorite click for filtering
  const handleFavoriteClick = (token: string) => {
    if (selectedFavorite === token) {
      // If clicking the same token, deselect it
      setSelectedFavorite(null);
    } else {
      // Select this token for filtering
      setSelectedFavorite(token);
      // Clear the main search query when selecting a favorite
      setSearchQuery('');
    }
  };

  // Generate mock funding data for any token from TOP_100_TOKENS
  const generateMockFundingData = (token: string) => {
    // Get token rates from store
    const tokenRates = getTokenRates(token);
    
    // If token exists in store, return its data
    if (tokenRates && Object.keys(tokenRates).length > 0) {
      return {
        token,
        hyperliquid: tokenRates['Hyperliquid'] ?? null,
        paradex: tokenRates['Paradex'] ?? null,
        aster: tokenRates['Aster'] ?? null,
        binance: tokenRates['Binance'] ?? null,
        bybit: tokenRates['Bybit'] ?? null,
        okx: tokenRates['OKX'] ?? null,
        bitget: tokenRates['Bitget'] ?? null,
        extended: tokenRates['Extended'] ?? null,
        pacifica: tokenRates['Pacifica'] ?? null,
      };
    }
    
    // Generate random funding rates for new tokens not in store
    if (token === 'BTC') {
      console.warn('⚠️ BTC not found in store, generating random data!');
    }
    
    const generateRate = () => {
      const rand = Math.random();
      if (rand < 0.1) return null; // 10% chance of null
      return (Math.random() * 60 - 20); // Random between -20 and 40
    };
    
    return {
      token,
      hyperliquid: generateRate(),
      paradex: generateRate(),
      aster: generateRate(),
      binance: generateRate(),
      bybit: generateRate(),
      okx: generateRate(),
      bitget: generateRate(),
      extended: generateRate(),
      pacifica: generateRate(),
    };
  };

  // Filter search results for dropdown - now includes all TOP_100_TOKENS
  const searchResults = watchlistSearch.trim()
    ? TOP_100_TOKENS.filter(token => 
        token.toLowerCase().includes(watchlistSearch.toLowerCase()) &&
        !favorites.includes(token)
      ).slice(0, 10).map(token => generateMockFundingData(token)) // Limit to 10 results
    : [];

  // Get favorited pairs data
  const favoritePairs = favorites.map(token => generateMockFundingData(token));

  // Get live token data from centralized market data store
  const getTokenData = (token: string) => {
    const asset = assets.get(token);
    
    if (asset && asset.marketData.price > 0) {
      // Use live data from market data store
      return {
        price: asset.marketData.price,
        // volume24h is already USD from the market data store
        volume: asset.marketData.volume24h / 1000000000, // Convert to billions
        change: asset.marketData.priceChangePercent24h
      };
    }
    
    // Fallback to mock data if asset not found or not loaded yet
    const data = generateMockFundingData(token);
    const avgRate = Object.values(data)
      .filter(v => typeof v === 'number')
      .reduce((a: number, b) => a + (b as number), 0) / 8;
    
    return {
      price: 0,
      volume: 0,
      change: avgRate / 10
    };
  };

  // Handle cell click
  const handleCellClick = (token: string, exchange: string, rate: number | null) => {
    if (rate === null) return; // Can't select empty cells
    if (!isExchangeEnabled(exchange)) return; // Can't select disabled exchanges

    const cellKey = `${token}-${exchange}`;
    const existingIndex = selectedCells.findIndex(c => `${c.token}-${c.exchange}` === cellKey);

    // If clicking the same cell, deselect it
    if (existingIndex !== -1) {
      setSelectedCells(selectedCells.filter((_, i) => i !== existingIndex));
      return;
    }

    // If we already have 2 selections, replace the first one
    if (selectedCells.length === 2) {
      setSelectedCells([selectedCells[1], { token, exchange, rate }]);
    } else {
      const newSelections = [...selectedCells, { token, exchange, rate }];
      setSelectedCells(newSelections);

      // If we now have 2 selections, navigate to trade page
      if (newSelections.length === 2 && onTradeSelect) {
        // Higher rate = sell, lower rate = buy (for arbitrage)
        const [cell1, cell2] = newSelections;
        if (cell1.rate > cell2.rate) {
          onTradeSelect(cell2, cell1); // buy cell2, sell cell1
        } else {
          onTradeSelect(cell1, cell2); // buy cell1, sell cell2
        }
      }
    }
  };

  // Check if a cell is selected
  const isCellSelected = (token: string, exchange: string) => {
    return selectedCells.some(c => c.token === token && c.exchange === exchange);
  };

  // Apply capacity weighting to funding rate
  const applyCapacityWeighting = (rate: number | null, exchange: string): number | null => {
    if (rate === null) return null;
    if (!capacityWeightedValue || capacityWeightedValue === '') return rate;
    
    const capacity = parseFloat(capacityWeightedValue);
    if (isNaN(capacity) || capacity <= 0) return rate;
    
    // Mock capacity limits for each exchange (in millions)
    // Smaller exchanges have lower capacity, so rates drop more dramatically
    const exchangeCapacities: { [key: string]: number } = {
      'binance': 50,    // $50M capacity at full rate
      'bybit': 40,      // $40M
      'okx': 45,        // $45M
      'hyperliquid': 20, // $20M
      'bitget': 15,     // $15M
      'extended': 10,   // $10M
      'pacifica': 8,    // $8M
      'paradex': 5,     // $5M
    };
    
    const maxCapacity = exchangeCapacities[exchange] || 10;
    
    // Calculate how many orders of magnitude above the capacity limit
    const ratio = capacity / maxCapacity;
    
    if (ratio <= 1) {
      // Under capacity limit, keep full rate
      return rate;
    }
    
    // Calculate orders of magnitude difference
    // log10(ratio) gives us the order of magnitude
    // Each order of magnitude reduces the rate by 50%
    const orderOfMagnitude = Math.log10(ratio);
    const reductionFactor = Math.pow(0.5, orderOfMagnitude);
    
    // Apply the reduction
    const adjustedRate = rate * reductionFactor;
    
    return adjustedRate;
  };

  const getCellColor = (value: number | null, isSelected: boolean, exchange: string) => {
    // Check if this exchange is enabled for interactivity
    const isEnabled = isExchangeEnabled(exchange);
    const cursorClass = isEnabled ? 'cursor-pointer' : '';

    if (isSelected) {
      return isDark 
        ? `bg-blue-600 text-white ring-2 ring-blue-400 ${cursorClass}` 
        : `bg-blue-500 text-white ring-2 ring-blue-300 ${cursorClass}`;
    }

    if (value === null) {
      return isDark 
        ? 'bg-[#0a0a0a] text-gray-700' 
        : 'bg-gray-50 text-gray-400';
    }
    
    // Green gradient for positive values
    if (value > 100) return isDark ? `bg-green-900/80 text-green-300 ${cursorClass}` : `bg-green-100 text-green-700 ${cursorClass}`;
    if (value > 75) return isDark ? `bg-green-900/70 text-green-300 ${cursorClass}` : `bg-green-100 text-green-700 ${cursorClass}`;
    if (value > 50) return isDark ? `bg-green-900/60 text-green-400 ${cursorClass}` : `bg-green-50 text-green-600 ${cursorClass}`;
    if (value > 30) return isDark ? `bg-green-900/45 text-green-400 ${cursorClass}` : `bg-green-50 text-green-600 ${cursorClass}`;
    if (value > 15) return isDark ? `bg-green-900/30 text-green-400 ${cursorClass}` : `bg-green-50 text-green-600 ${cursorClass}`;
    if (value > 5) return isDark ? `bg-green-900/20 text-green-400 ${cursorClass}` : `bg-green-50 text-green-600 ${cursorClass}`;
    if (value > 0) return isDark ? `bg-green-900/10 text-gray-300 ${cursorClass}` : `bg-green-50/50 text-green-600 ${cursorClass}`;
    
    // Grey for exactly 0
    if (value === 0) {
      return isDark 
        ? `bg-[#1a1a1a] text-gray-400 ${cursorClass}` 
        : `bg-gray-100 text-gray-600 ${cursorClass}`;
    }
    
    // Red gradient for negative values
    if (value < -100) return isDark ? `bg-red-900/80 text-red-300 ${cursorClass}` : `bg-red-100 text-red-700 ${cursorClass}`;
    if (value < -75) return isDark ? `bg-red-900/70 text-red-300 ${cursorClass}` : `bg-red-100 text-red-700 ${cursorClass}`;
    if (value < -50) return isDark ? `bg-red-900/60 text-red-400 ${cursorClass}` : `bg-red-50 text-red-600 ${cursorClass}`;
    if (value < -30) return isDark ? `bg-red-900/45 text-red-400 ${cursorClass}` : `bg-red-50 text-red-600 ${cursorClass}`;
    if (value < -15) return isDark ? `bg-red-900/30 text-red-400 ${cursorClass}` : `bg-red-50 text-red-600 ${cursorClass}`;
    if (value < -5) return isDark ? `bg-red-900/20 text-red-400 ${cursorClass}` : `bg-red-50 text-red-600 ${cursorClass}`;
    return isDark ? `bg-red-900/10 text-gray-300 ${cursorClass}` : `bg-red-50/50 text-red-600 ${cursorClass}`;
  };

  const formatValue = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    
    // Value is stored as daily rate percentage
    // Convert based on selected timeframe
    let displayValue = value;
    switch (timeframe) {
      case 'Day':
        displayValue = value; // Already daily
        break;
      case 'Week':
        displayValue = value * 7;
        break;
      case 'Month':
        displayValue = value * 30; // Using 30 days for simplicity
        break;
      case 'Year':
        displayValue = value * 365;
        break;
    }
    
    return `${displayValue > 0 ? '+' : ''}${displayValue.toFixed(2)}%`;
  };

  // Format normalized rates for tooltip
  const formatNormalizedRates = (token: string, exchange: string) => {
    const tokenRates = getTokenRates(token);
    const rate = tokenRates[exchange];
    
    if (rate === null || rate === undefined) {
      return null;
    }

    // The stored rate is daily rate (as a percentage, e.g., 0.012 for 0.012%)
    // Reverse calculate to get the raw funding interval rates
    // Daily → 8hr → 1hr
    
    const dailyRate = rate; // e.g., 0.012 for 0.012%
    const eightHourRate = dailyRate / 3; // 8hr rate as % (3 periods per day)
    const oneHourRate = eightHourRate / 8; // 1hr rate as %
    const yearlyAPY = dailyRate * 365; // Annualized
    
    // The raw API value can be reverse calculated
    // dailyRate = (apiValue / 10000) * 3 * 100
    // So: apiValue = (dailyRate / 100) * 10000 / 3
    const rawApiValue = (dailyRate / 100) * 10000 / 3;

    return {
      interval: '8hr', // Most exchanges use 8hr
      raw: rawApiValue,
      oneHour: oneHourRate,
      eightHour: eightHourRate,
      daily: dailyRate,
      yearly: yearlyAPY,
    };
  };

  // Create tooltip content for funding rate cell
  const createRateTooltip = (token: string, exchange: string) => {
    const normalized = formatNormalizedRates(token, exchange);
    
    if (!normalized) {
      return 'No data available';
    }

    return (
      <div className="text-xs space-y-1">
        <div className="font-semibold mb-2">{token} on {exchange}</div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Interval:</span>
          <span className="font-medium">{normalized.interval}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Raw:</span>
          <span className="font-medium">{normalized.raw.toFixed(4)} bps</span>
        </div>
        <div className="h-px bg-gray-700 my-1"></div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">1hr:</span>
          <span className="font-medium">{normalized.oneHour.toFixed(4)} bps</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">8hr:</span>
          <span className="font-medium">{normalized.eightHour.toFixed(4)} bps</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Daily:</span>
          <span className="font-medium">{normalized.daily.toFixed(4)} bps</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Yearly:</span>
          <span className="font-medium text-green-400">{normalized.yearly > 0 ? '+' : ''}{normalized.yearly.toFixed(2)}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-3rem-1px)] flex">
      {/* Left Watchlist Panel */}
      <div className={`w-[350px] border-r ${colors.border.primary} ${colors.bg.primary} flex flex-col`}>
        {/* Watchlist Header */}
        <div className={`p-4 border-b ${colors.border.primary}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-header font-medium">Watchlist</h2>
            <div className="flex items-center gap-2 text-label">
              <span className={colors.text.tertiary}>Sort by:</span>
              <button
                onClick={() => setSortBy('volume')}
                className={`${sortBy === 'volume' ? colors.accent.orange : `${colors.text.tertiary} ${theme === 'dark' ? 'hover:text-gray-300' : 'hover:text-gray-700'}`}`}
              >
                Volume
              </button>
              <button
                onClick={() => setSortBy('price')}
                className={`${sortBy === 'price' ? colors.accent.orange : `${colors.text.tertiary} ${theme === 'dark' ? 'hover:text-gray-300' : 'hover:text-gray-700'}`}`}
              >
                Price
              </button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${colors.text.tertiary} z-10`} />
            <input
              type="text"
              placeholder="Search pairs or address"
              value={watchlistSearch}
              onChange={(e) => setWatchlistSearch(e.target.value)}
              onFocus={() => setShowSearchDropdown(true)}
              onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
              className={`w-full ${colors.bg.secondary} border ${colors.border.secondary} rounded-sm pl-9 pr-3 py-2 text-body focus:outline-none ${theme === 'dark' ? 'focus:border-[#3a3a3a]' : 'focus:border-gray-400'}`}
            />
            
            {/* Search Results Dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className={`absolute top-full left-0 right-0 mt-1 ${colors.bg.primary} border ${colors.border.secondary} rounded-sm shadow-lg z-50 max-h-[300px] overflow-y-auto`}>
                {searchResults.map(row => {
                  const { price, volume, change } = getTokenData(row.token);
                  return (
                    <div 
                      key={row.token} 
                      className={`px-3 py-2.5 cursor-pointer ${theme === 'dark' ? 'hover:bg-[#1a1a1a]' : 'hover:bg-gray-50'} border-b ${colors.border.secondary} last:border-b-0`}
                      onClick={() => {
                        toggleFavorite(row.token);
                        setWatchlistSearch('');
                        setShowSearchDropdown(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Star className={`w-3 h-3 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'} flex-shrink-0`} />
                          <div className={`w-4 h-4 ${colors.bg.tertiary} rounded-full flex items-center justify-center flex-shrink-0`}>
                            <span className="text-[8px] font-medium">{row.token.charAt(0)}</span>
                          </div>
                          <div>
                            <div className="text-[13px] font-medium">{row.token}:PERP</div>
                            <div className={`text-[11px] ${colors.text.tertiary}`}>Volume: ${volume.toFixed(2)}B</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[13px]">${price.toLocaleString()}</div>
                          <div className={`text-[11px] ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Column Headers */}
          <div className={`px-0 py-2 mt-4 border-b ${colors.border.primary} flex justify-between text-[13px] ${colors.text.tertiary}`}>
            <span>Pair/Volume</span>
            <span>Price / 24h Change</span>
          </div>
        </div>

        {/* Watchlist Content */}
        <div className="flex-1 overflow-y-auto">
          {favoritePairs.length > 0 ? (
            favoritePairs.map(row => {
              const { price, volume, change } = getTokenData(row.token);
              const isSelected = selectedFavorite === row.token;
              return (
                <div 
                  key={row.token} 
                  className={`px-4 py-3 border-b ${colors.border.secondary} ${
                    isSelected 
                      ? theme === 'dark' ? 'bg-orange-900/20' : 'bg-orange-50'
                      : theme === 'dark' ? 'hover:bg-[#0a0a0a]' : 'hover:bg-gray-50'
                  } cursor-pointer transition-colors`}
                  onClick={() => handleFavoriteClick(row.token)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Star 
                        className={`w-3 h-3 ${favorites.includes(row.token) ? 'fill-yellow-500 text-yellow-500' : `${theme === 'dark' ? 'text-gray-700' : 'text-gray-400'}`} hover:text-yellow-500 cursor-pointer flex-shrink-0`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(row.token);
                        }}
                      />
                      <div className={`w-4 h-4 ${colors.bg.tertiary} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <span className="text-[8px] font-medium">{row.token.charAt(0)}</span>
                      </div>
                      <div>
                        <div className={`text-[13px] font-medium ${isSelected ? colors.accent.orange : ''}`}>{row.token}:PERP</div>
                        <div className={`text-[11px] ${colors.text.tertiary}`}>Volume: ${volume.toFixed(2)}B</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[13px]">${price.toLocaleString()}</div>
                      <div className={`text-[11px] ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center p-8 mt-12">
              <Search className={`w-12 h-12 ${theme === 'dark' ? 'text-gray-700' : 'text-gray-300'} mb-4`} />
              <p className={`text-body ${colors.text.tertiary}`}>No favorite pairs</p>
              <p className={`text-[11px] ${colors.text.tertiary} mt-1`}>Search and click to add</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-2">
              <h1 className="text-[15px] font-semibold tracking-tight">Funding Yield Explorer</h1>
              <Tooltip 
                content="View and compare perpetual funding rates across multiple exchanges to identify arbitrage opportunities"
                position="right"
              >
                <HelpCircle className={`w-4 h-4 ${colors.text.tertiary} cursor-help`} />
              </Tooltip>
            </div>
            <p className={`${colors.text.tertiary} text-label`}>Compare Normalized Funding Rates Across Exchanges</p>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <div className="flex-1 max-w-md relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${colors.text.tertiary}`} />
              <input
                type="text"
                placeholder="Search token..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  // Clear selected favorite when user types in search
                  if (e.target.value) {
                    setSelectedFavorite(null);
                  }
                }}
                className={`w-full ${colors.bg.secondary} border ${colors.border.secondary} rounded-sm pl-9 pr-3 py-2 text-body focus:outline-none ${theme === 'dark' ? 'focus:border-[#3a3a3a]' : 'focus:border-gray-400'}`}
              />
            </div>

            <div className="flex-1 max-w-xs relative">
              <Wallet className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${colors.text.tertiary}`} />
              <input
                type="text"
                placeholder="Capacity Weighted ($)"
                value={capacityWeightedValue}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty, numbers, and decimal points
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setCapacityWeightedValue(value);
                  }
                }}
                className={`w-full ${colors.bg.secondary} border ${colors.border.secondary} rounded-sm pl-9 pr-9 py-2 text-body focus:outline-none ${theme === 'dark' ? 'focus:border-[#3a3a3a]' : 'focus:border-gray-400'}`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Tooltip 
                  content="Capacity Weighting represents the maximum notional that can be deployed at the observed funding rate before it degrades due to liquidity limits, position size constraints, or risk controls."
                  position="bottom"
                >
                  <HelpCircle className={`w-4 h-4 ${colors.text.tertiary} cursor-help`} />
                </Tooltip>
              </div>
            </div>

            <div className={`flex items-center gap-1 ${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-0.5`}>
              {['Day', 'Week', 'Month', 'Year'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 text-label rounded-sm transition-colors ${
                    timeframe === tf
                      ? 'bg-orange-600 text-white'
                      : `${colors.text.tertiary} ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            <div className={`px-3 py-2 ${colors.bg.secondary} border ${colors.border.secondary} rounded-sm`}>
              <select className={`bg-transparent ${colors.accent.orange} focus:outline-none text-label`}>
                <option>APR</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className={`border-b ${colors.border.secondary}`}>
                    <th className={`text-left px-4 py-2.5 sticky left-0 ${colors.bg.secondary} z-10 font-medium ${colors.text.secondary} text-[13px]`}>
                      Token
                    </th>
                    {EXCHANGES.map((exchange) => (
                      <th key={exchange.id} className={`text-center px-3 py-2.5 min-w-[90px] font-medium ${colors.text.secondary} text-[13px]`}>
                        {exchange.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(fundingRates)
                    .filter(token => {
                      // Filter by selected favorite first (takes priority)
                      if (selectedFavorite) {
                        return token === selectedFavorite;
                      }
                      // Otherwise filter by search query
                      return token.toLowerCase().includes(searchQuery.toLowerCase());
                    })
                    .sort((a, b) => {
                      // Sort by market cap rank (lower rank = higher market cap)
                      return getMarketCapRank(a) - getMarketCapRank(b);
                    })
                    .map((token) => {
                      const row = generateMockFundingData(token);
                      
                      // Apply capacity weighting to all rates
                      const adjustedBinance = applyCapacityWeighting(row.binance, 'binance');
                      const adjustedBybit = applyCapacityWeighting(row.bybit, 'bybit');
                      const adjustedOkx = applyCapacityWeighting(row.okx, 'okx');
                      const adjustedHyperliquid = applyCapacityWeighting(row.hyperliquid, 'hyperliquid');
                      const adjustedBitget = applyCapacityWeighting(row.bitget, 'bitget');
                      const adjustedExtended = applyCapacityWeighting(row.extended, 'extended');
                      const adjustedPacifica = applyCapacityWeighting(row.pacifica, 'pacifica');
                      const adjustedParadex = applyCapacityWeighting(row.paradex, 'paradex');
                      
                      return (
                        <tr key={row.token} className={`border-b ${colors.border.secondary} ${colors.bg.hover}`}>
                          <td className={`px-4 py-2 sticky left-0 ${colors.bg.secondary}`}>
                            <div className="flex items-center gap-1.5">
                              <Star 
                                className={`w-3 h-3 ${favorites.includes(row.token) ? 'fill-yellow-500 text-yellow-500' : `${theme === 'dark' ? 'text-gray-700' : 'text-gray-400'}`} hover:text-yellow-500 cursor-pointer flex-shrink-0`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(row.token);
                                }}
                              />
                              <div className={`w-3.5 h-3.5 ${colors.bg.tertiary} rounded-full flex items-center justify-center flex-shrink-0`}>
                                <span className="text-[8px] font-medium">{row.token.charAt(0)}</span>
                              </div>
                              <span className="text-[13px] font-medium">{row.token}</span>
                            </div>
                          </td>
                          {/* Dynamically render cells in same order as headers */}
                          {EXCHANGES.map((exchange) => {
                            const exchangeId = exchange.id.toLowerCase();
                            const rate = applyCapacityWeighting(row[exchangeId], exchangeId);
                            const isSelected = isCellSelected(row.token, exchangeId);
                            const cellColor = getCellColor(rate, isSelected, exchangeId);
                            
                            return (
                              <td 
                                key={exchange.id}
                                className={`px-3 py-2 text-center text-[13px] ${cellColor}`} 
                                onClick={() => handleCellClick(row.token, exchangeId, rate)}
                              >
                                <Tooltip content={createRateTooltip(row.token, exchange.name)} position="bottom">
                                  <div>{formatValue(rate)}</div>
                                </Tooltip>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
