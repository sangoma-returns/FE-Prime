import { useState, useEffect } from 'react';
import { useThemeStore } from '../stores/themeStore';
import { useAppStore } from '../stores/appStore';
import { useTradesStore } from '../stores/tradesStore';
import { ChevronLeft, ChevronRight, MoreHorizontal, X, ArrowLeft } from 'lucide-react';
import TradeDetailView from './TradeDetailView';

// Helper function to format pair names for display
// Converts "xyz GOLD:PERP-USDC:PERP-USD" -> "xyz GOLD:PERP-USDC"
// Converts "cash GOLD:PERP-USDC:PERP-USD" -> "cash GOLD:PERP-USDC"
function formatPairName(pair: string | undefined): string {
  if (!pair) return 'BTC-PERP-USDC';
  
  // Handle complex HIP-3 RWA format: "xyz GOLD:PERP-USDC:PERP-USD" -> "xyz GOLD:PERP-USDC"
  // Just remove the last ":PERP-USD" suffix if it exists
  const lastColonIndex = pair.lastIndexOf(':');
  if (lastColonIndex !== -1 && pair.substring(lastColonIndex).includes('PERP-USD')) {
    return pair.substring(0, lastColonIndex); // Remove ":PERP-USD"
  }
  
  // Return as-is for other formats
  return pair;
}

// Helper function to extract asset name from pair
// "xyz:GOLD:PERP-USDC" -> "Gold"
// "BTC:PERP-USDT" -> "BTC"
// "SOL:PERP-USDC" -> "SOL"
function extractAssetName(pair: string | undefined): string {
  if (!pair) return 'BTC';
  
  // Handle RWA format: "xyz:GOLD:PERP-USDC" -> "Gold"
  if (pair.includes(':')) {
    const parts = pair.split(':');
    if (parts.length >= 3) {
      // RWA format: ["xyz", "GOLD", "PERP-USDC"]
      return parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
    } else if (parts.length === 2) {
      // Standard format: ["BTC", "PERP-USDT"]
      return parts[0];
    }
  }
  
  // Fallback
  return pair.split('-')[0].split(':')[0];
}

interface Trade {
  pair: string;
  side: 'Multi' | 'Single' | 'MM';
  targetQty: string;
  filled: number;
  timeStart: string;
  strategy: string;
  status: 'Finished';
  buyQuantity?: number;
  buyLeverage?: number;
  sellQuantity?: number;
  sellLeverage?: number;
  buyExchange?: string;
  sellExchange?: string;
  buyPair?: string;
  sellPair?: string;
  buyPrice?: number;
  sellPrice?: number;
  duration?: number;
  exchanges?: string[];
}

interface Order {
  id: string;
  buyAccount: string;
  buyPair: string;
  buyQuantity: string;
  sellAccount: string;
  sellPair: string;
  sellQuantity: string;
  duration: string;
  timestamp: number;
}

interface TradeHistoryProps {
  activeOrder?: Order | null;
  onClearActiveOrder?: () => void;
  initialDetailTab?: 'status' | 'execution' | 'rebalancing';
  initialTradeType?: string;
}

const MOCK_TRADES: Trade[] = [
  { pair: 'BTC-PERP-USDC', side: 'Multi', targetQty: '15047.970000 + 0.164169', filled: 100, timeStart: '2026-01-10 09:18:22', strategy: 'TWAP', status: 'Finished' },
  { pair: 'BTC-PERP-USD', side: 'Single', targetQty: '0.250000', filled: 100, timeStart: '2026-01-10 08:45:33', strategy: 'TWAP', status: 'Finished' },
  { pair: 'BTC-PERP-USDC', side: 'Multi', targetQty: '15300.010000 + 0.166109', filled: 100, timeStart: '2026-01-09 20:02:06', strategy: 'TWAP', status: 'Finished' },
  { pair: 'BTC-PERP-USDC', side: 'Multi', targetQty: '0.164864 + 0.087170', filled: 100, timeStart: '2026-01-09 07:39:48', strategy: 'TWAP', status: 'Finished' },
  { pair: 'BTC-PERP-USDC', side: 'Multi', targetQty: '15734.250000 + 0.165824', filled: 100, timeStart: '2026-01-08 16:42:11', strategy: 'TWAP', status: 'Finished' },
  { pair: 'BTC-PERP-USDC', side: 'Multi', targetQty: '0.314506 + 14508.470000', filled: 100, timeStart: '2026-01-08 20:32:54', strategy: 'TWAP', status: 'Finished' },
  { pair: 'BTC-PERP-USDC', side: 'Multi', targetQty: '0.174598 + 14972.520000', filled: 100, timeStart: '2026-01-08 19:15:40', strategy: 'TWAP', status: 'Finished' },
  { pair: 'BTC-PERP-USDC', side: 'Multi', targetQty: '0.164640 + 14862.120000', filled: 100, timeStart: '2026-01-08 06:01:24', strategy: 'TWAP', status: 'Finished' },
  { pair: 'BTC-PERP-USDC', side: 'Multi', targetQty: '14614.720000 + 0.164934', filled: 100, timeStart: '2026-01-07 23:04:52', strategy: 'TWAP', status: 'Finished' },
  { pair: 'BTC-PERP-USDC', side: 'Multi', targetQty: '15020.300000 + 0.164934', filled: 100, timeStart: '2026-01-07 21:01:06', strategy: 'TWAP', status: 'Finished' },
  { pair: 'BTC-PERP-USDC', side: 'Multi', targetQty: '24946.410000 + 0.272946', filled: 100, timeStart: '2026-01-07 16:26:12', strategy: 'TWAP', status: 'Finished' },
  { pair: 'BTC-PERP-USDC', side: 'Multi', targetQty: '0.273688 + 25034.110000', filled: 100, timeStart: '2026-01-07 16:07:56', strategy: 'TWAP', status: 'Finished' },
  { pair: 'BTC-PERP-USDC', side: 'Multi', targetQty: '13891.000000 + 0.164475', filled: 100, timeStart: '2026-01-07 15:07:42', strategy: 'TWAP', status: 'Finished' },
  { pair: 'BTC-PERP-USDC', side: 'Multi', targetQty: '8154.773000 + 15635.010000', filled: 100, timeStart: '2026-01-07 15:33:32', strategy: 'TWAP', status: 'Finished' },
  { pair: 'BTC-PERP-USDC', side: 'Multi', targetQty: '0.164864 + 34777.400000', filled: 100, timeStart: '2026-01-07 14:59:16', strategy: 'TWAP', status: 'Finished' },
  { pair: 'BTC-PERP-USDC', side: 'Multi', targetQty: '0.301320 + 34777.400000', filled: 100, timeStart: '2026-01-07 14:59:16', strategy: 'TWAP', status: 'Finished' },
];

const FILTER_TABS = [
  'Active',
  'Canceled',
  'Finished',
  'Scheduled',
  'Paused',
  'Conditional',
  'Single',
  'Multi',
  'Chained',
  'Batch'
];

export default function TradeHistory({ activeOrder, onClearActiveOrder, initialDetailTab, initialTradeType }: TradeHistoryProps) {
  const { colors, theme } = useThemeStore();
  const { tradeHistory: storeTradeHistory } = useAppStore();
  const { history: globalHistory } = useTradesStore();
  const isDark = theme === 'dark';
  const [activeFilter, setActiveFilter] = useState('Multi');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Convert global history entries to Trade format
  const globalHistoryTrades: Trade[] = globalHistory.map(entry => {
    const timestamp = new Date(entry.timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(',', '');
    
    // Determine side based on source field
    let side: 'Multi' | 'Single' | 'MM';
    if (entry.source === 'market-maker') {
      side = 'MM';
    } else if (entry.source === 'carry') {
      side = 'Multi';
    } else {
      // Legacy detection for entries without source field
      const isMulti = entry.action.startsWith('Multi:') || (entry.action.includes('Long') && entry.action.includes('Short'));
      side = isMulti ? 'Multi' : 'Single';
    }
    
    // Use buyPair if available (for RWA trades), otherwise construct from token
    const displayPair = entry.buyPair || (entry.token ? `${entry.token}-PERP-USDC` : 'BTC-PERP-USDC');
    
    // Format targetQty based on side type
    let targetQty: string;
    if (side === 'Multi' && entry.buyQuantity !== undefined && entry.sellQuantity !== undefined) {
      // For Multi trades, show both quantities separated by +
      targetQty = `${entry.buyQuantity.toFixed(6)} + ${entry.sellQuantity.toFixed(6)}`;
    } else {
      // For Single and MM trades, show just the numerical value
      targetQty = `${entry.amount.toFixed(6)}`;
    }
    
    const trade = {
      pair: displayPair,
      side: side,
      targetQty: targetQty,
      filled: entry.status === 'completed' ? 100 : (entry.status === 'pending' ? 50 : 0),
      timeStart: timestamp,
      strategy: 'TWAP',
      status: 'Finished' as const,
      buyQuantity: entry.buyQuantity,
      buyLeverage: entry.buyLeverage,
      sellQuantity: entry.sellQuantity,
      sellLeverage: entry.sellLeverage,
      buyExchange: entry.buyExchange,
      sellExchange: entry.sellExchange,
      buyPair: entry.buyPair, // Pass through buy pair
      sellPair: entry.sellPair, // Pass through sell pair
      buyPrice: entry.buyPrice, // Pass through buy price
      sellPrice: entry.sellPrice, // Pass through sell price
      duration: entry.duration,
      exchanges: entry.exchanges, // Include exchanges array from history entry
    };
    
    console.log('🟢 TradeHistory - Converting entry to trade:', {
      entryExchanges: entry.exchanges,
      tradeExchanges: trade.exchanges
    });
    
    return trade;
  });
  
  // Combine store history with global history and mock trades
  const allTrades = [...globalHistoryTrades, ...storeTradeHistory, ...MOCK_TRADES];
  
  // Set initial selected trade based on parameters to avoid flickering
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(() => {
    if (activeOrder) {
      // Convert Order to Trade format
      return {
        pair: activeOrder.buyPair,
        side: 'Single',
        targetQty: `${activeOrder.buyQuantity} USDC ${activeOrder.sellQuantity} USDC`,
        filled: 100,
        timeStart: new Date(activeOrder.timestamp).toLocaleString(),
        strategy: 'TWAP',
        status: 'Finished'
      };
    } else if (initialTradeType === 'single') {
      // Find the second row which is the Single trade (BTC-PERP-USD)
      const singleTrade = MOCK_TRADES.find(t => t.side === 'Single');
      return singleTrade || null;
    } else if (initialTradeType === 'multi') {
      // Don't auto-select here - use useEffect to wait for fresh data
      return null;
    }
    return null;
  });
  
  // Auto-select trade based on initialTradeType when data is ready
  useEffect(() => {
    if (initialTradeType === 'multi' && !selectedTrade && globalHistoryTrades.length > 0) {
      // Find the FIRST (latest) Multi trade in globalHistoryTrades (not mock trades)
      const multiTrade = globalHistoryTrades[0]; // Latest trade is always first
      if (multiTrade && multiTrade.side === 'Multi') {
        console.log('🟡 TradeHistory - Auto-selecting Multi trade:', {
          tradeExchanges: multiTrade.exchanges,
          multiTrade
        });
        setSelectedTrade(multiTrade);
      }
    }
  }, [initialTradeType, globalHistoryTrades, selectedTrade]);
  
  const totalPages = 49;

  // If a trade is selected, show the detail view
  if (selectedTrade) {
    return <TradeDetailView trade={selectedTrade} onBack={() => {
      setSelectedTrade(null);
      onClearActiveOrder?.();
    }} initialTab={initialDetailTab} />;
  }

  return (
    <div className={`${colors.bg.surface} border ${colors.border.default} rounded`}>
      {/* Filter Tabs */}
      <div className={`flex items-center justify-between px-4 py-2.5 border-b ${colors.border.divider}`}>
        <div className="flex items-center gap-1 flex-wrap">
          {FILTER_TABS.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`h-6 px-2.5 text-[10px] font-medium rounded transition-colors ${
                activeFilter === filter
                  ? `${colors.button.primaryBg} text-white`
                  : `${colors.bg.subtle} ${colors.text.secondary} ${colors.state.hover} border ${colors.border.default}`
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        <button className={`text-[10px] font-medium ${colors.accent.negative} ${colors.state.hover} px-2 py-1`}>
          Cancel All
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={`${colors.bg.subtle} border-b ${colors.border.divider}`}>
              <th className={`text-left px-4 py-2 text-[10px] font-medium ${colors.text.tertiary}`}></th>
              <th className={`text-left px-4 py-2 text-[10px] font-medium ${colors.text.tertiary}`}>Pair</th>
              <th className={`text-left px-4 py-2 text-[10px] font-medium ${colors.text.tertiary}`}>Side</th>
              <th className={`text-left px-4 py-2 text-[10px] font-medium ${colors.text.tertiary}`}>Target Qty</th>
              <th className={`text-left px-4 py-2 text-[10px] font-medium ${colors.text.tertiary}`}>Filled</th>
              <th className={`text-left px-4 py-2 text-[10px] font-medium ${colors.text.tertiary}`}>Time Start</th>
              <th className={`text-left px-4 py-2 text-[10px] font-medium ${colors.text.tertiary}`}>Strategy</th>
              <th className={`text-left px-4 py-2 text-[10px] font-medium ${colors.text.tertiary}`}>Status</th>
              <th className={`text-left px-4 py-2 text-[10px] font-medium ${colors.text.tertiary}`}></th>
            </tr>
          </thead>
          <tbody>
            {allTrades.map((trade, index) => (
              <tr 
                key={index}
                onClick={() => {
                  console.log('🟡 TradeHistory - Row clicked:', {
                    index,
                    tradeExchanges: trade.exchanges,
                    trade
                  });
                  setSelectedTrade(trade);
                }}
                className={`border-b ${colors.border.divider} ${colors.state.hover} transition-colors cursor-pointer`}
              >
                <td className="px-4 py-2.5">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                  </div>
                </td>
                <td className={`px-4 py-2.5 text-[11px] font-medium ${colors.text.primary}`}>
                  {trade.side === 'Multi' && trade.buyPair && trade.sellPair 
                    ? `${extractAssetName(trade.buyPair)} + ${extractAssetName(trade.sellPair)}`
                    : formatPairName(trade.pair)}
                </td>
                <td className={`px-4 py-2.5 text-[11px] ${colors.text.secondary}`}>
                  {trade.side}
                </td>
                <td className={`px-4 py-2.5 text-[11px] ${colors.text.secondary} max-w-[200px]`}>
                  <div className="truncate">{trade.targetQty}</div>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full" 
                        style={{ width: `${trade.filled}%` }}
                      ></div>
                    </div>
                    <span className={`text-[10px] ${colors.text.tertiary}`}>{trade.filled}%</span>
                  </div>
                </td>
                <td className={`px-4 py-2.5 text-[11px] ${colors.text.secondary}`}>
                  {trade.timeStart}
                </td>
                <td className={`px-4 py-2.5 text-[11px] ${colors.text.secondary}`}>
                  {trade.strategy}
                </td>
                <td className={`px-4 py-2.5 text-[11px] ${colors.accent.positive}`}>
                  {trade.status}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1">
                    <button className={`w-5 h-5 rounded ${colors.state.hover} flex items-center justify-center`}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={colors.text.tertiary}>
                        <path d="M3 3L9 9M3 9L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                    <button className={`w-5 h-5 rounded ${colors.state.hover} flex items-center justify-center`}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={colors.text.tertiary}>
                        <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button className={`w-5 h-5 rounded ${colors.state.hover} flex items-center justify-center`}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={colors.text.tertiary}>
                        <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        <path d="M6 4V6L7.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                    <button className={`w-5 h-5 rounded ${colors.state.hover} flex items-center justify-center`}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={colors.text.tertiary}>
                        <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        <path d="M6 3.5V6M6 8.5H6.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                    <button className={`w-5 h-5 rounded ${colors.state.hover} flex items-center justify-center`}>
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className={`flex items-center justify-between px-4 py-2.5 border-t ${colors.border.divider}`}>
        <div className={`text-[10px] ${colors.text.tertiary}`}>
          1-15 of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`w-6 h-6 rounded flex items-center justify-center ${colors.state.hover} disabled:opacity-40 disabled:cursor-not-allowed transition-colors`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`w-6 h-6 rounded flex items-center justify-center ${colors.state.hover} disabled:opacity-40 disabled:cursor-not-allowed transition-colors`}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}