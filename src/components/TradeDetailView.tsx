import { useState } from 'react';
import { useThemeStore } from '../stores/themeStore';
import { useAppStore } from '../stores/appStore';
import { usePositionsStore } from '../stores/positionsStore';
import { usePricesStore } from '../stores/pricesStore';
import { useFundingRatesStore } from '../stores/fundingRatesStore';
import { X, ArrowLeft, MoreHorizontal } from 'lucide-react';
import ExchangeExecutionChart from './ExchangeExecutionChart';

// Helper function to format pair names for display
// Converts "xyz GOLD:PERP-USDC:PERP-USD" -> "xyz GOLD:PERP-USDC"
// Converts "cash GOLD:PERP-USDC:PERP-USD" -> "cash GOLD:PERP-USDC"
// For aggregator RWA trades: "xyz:SILVER:PERP-USD" -> "SILVER:PERP-USD" (strip DEX prefix)
function formatPairName(pair: string | undefined, source?: string): string {
  if (!pair) return 'BTC PERP-USDT';
  
  console.log('🔍 formatPairName - Input:', { pair, source });
  
  // AGGREGATOR RWA TRADES: Strip DEX prefix for RWA assets
  // "xyz:SILVER:PERP-USD" -> "SILVER PERP-USD"
  // "flx:GOLD:PERP-USDC" -> "GOLD PERP-USD"
  if (source === 'aggregator') {
    const dexPrefixes = ['xyz', 'vntl', 'km', 'cash', 'flx', 'hyna'];
    const parts = pair.split(':');
    
    console.log('🔍 formatPairName - Aggregator mode:', { parts, hasDexPrefix: dexPrefixes.includes(parts[0].toLowerCase()) });
    
    if (parts.length >= 2 && dexPrefixes.includes(parts[0].toLowerCase())) {
      // Has DEX prefix - remove it
      const withoutPrefix = parts.slice(1).join(':'); // "SILVER:PERP-USD"
      
      // Format for display: "SILVER PERP-USD"
      const formatted = withoutPrefix.replace(':', ' ').replace('-PERP', ' PERP').replace('-USDC', '-USD');
      console.log('🔍 formatPairName - Output:', formatted);
      return formatted;
    }
    
    // No DEX prefix or crypto asset - format normally
    const formatted = pair.replace(':', ' ').replace('-PERP', ' PERP');
    console.log('🔍 formatPairName - Output (no DEX prefix):', formatted);
    return formatted;
  }
  
  // Handle complex HIP-3 RWA format: "xyz GOLD:PERP-USDC:PERP-USD" -> "xyz GOLD:PERP-USDC"
  // Just remove the last ":PERP-USD" suffix if it exists
  const lastColonIndex = pair.lastIndexOf(':');
  if (lastColonIndex !== -1 && pair.substring(lastColonIndex).includes('PERP-USD')) {
    return pair.substring(0, lastColonIndex); // Remove ":PERP-USD"
  }
  
  // Handle simple HIP-3 RWA format: "xyz:GOLD" -> "xyz PERP-GOLD"
  if (pair.includes(':') && !pair.includes('PERP')) {
    const [dex, asset] = pair.split(':');
    return `${dex} PERP-${asset}`;
  }
  
  // Handle standard format: "BTC:PERP-USDT" -> "BTC PERP-USDT"
  return pair.replace(':', ' ').replace('-PERP', ' PERP');
}

interface Trade {
  pair: string;
  side: 'Multi' | 'Single';
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
  buyPair?: string; // e.g., "xyz:PERP-USDC"
  sellPair?: string; // e.g., "BTC:PERP-USDT"
  buyPrice?: number; // Entry price for buy leg
  sellPrice?: number; // Entry price for sell leg
  duration?: number;
  source?: string; // 'aggregator' | 'trade' | etc.
  exchanges?: string[]; // Selected exchanges for aggregator trades
  exchanges?: string[];
}

interface TradeDetailViewProps {
  trade: Trade;
  onBack: () => void;
  initialTab?: 'status' | 'execution' | 'rebalancing';
}

// Helper function to format target notional display
// buyQuantity/sellQuantity are stored in USD terms, not token amounts
function formatTargetNotional(leverage: number, quantity: number): string {
  return `${leverage}x $${quantity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`;
}

// Helper function to calculate total notional (quantity × leverage)
function calculateTotalNotional(quantity: number, leverage: number): string {
  return `$${(quantity * leverage).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function TradeDetailView({ trade, onBack, initialTab = 'execution' }: TradeDetailViewProps) {
  const { colors, theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'status' | 'execution' | 'rebalancing'>(initialTab);
  const selectedExchanges = useAppStore((s) => s.selectedExchanges);
  
  console.log('🟣 TradeDetailView - Received trade:', {
    tradeExchanges: trade.exchanges,
    selectedExchanges,
    fullTrade: trade
  });

  return (
    <div className={`${colors.bg.surface} border ${colors.border.default} rounded flex gap-0`} style={{ height: '700px' }}>
      {/* Left Panel */}
      <div className={`w-[280px] ${colors.bg.surface} border-r ${colors.border.default} flex flex-col`}>
        {/* Header with Back Button */}
        <div className={`px-4 py-1.5 border-b ${colors.border.divider} flex items-center justify-between`}>
          <h2 className={`text-[11px] font-semibold ${colors.text.primary}`}>Pairs</h2>
          <button
            onClick={onBack}
            className={`${colors.text.tertiary} hover:${colors.text.primary} transition-colors`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pairs */}
        <div className="px-3 py-1.5 space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white"></div>
            </div>
            <span className={`text-[10px] font-medium ${colors.text.primary}`}>{formatPairName(trade.buyPair || trade.pair, trade.source)}</span>
          </div>
          {trade.side === 'Multi' && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white"></div>
              </div>
              <span className={`text-[10px] font-medium ${colors.text.primary}`}>{formatPairName(trade.sellPair, trade.source)}</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 overflow-y-auto px-3 py-1.5 space-y-1.5">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            <div>
              <div className={`text-[9px] ${colors.text.tertiary} mb-0.5`}>Executor Notional</div>
              <div className={`text-[10px] font-medium ${colors.text.primary}`}>
                {(() => {
                  // Executor Notional = sum of (quantity × leverage) for all sides
                  const buyNotional = (trade.buyQuantity || 0) * (trade.buyLeverage || 1);
                  const sellNotional = (trade.sellQuantity || 0) * (trade.sellLeverage || 1);
                  const total = buyNotional + sellNotional;
                  return `$${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                })()}
              </div>
            </div>
            <div>
              <div className={`text-[9px] ${colors.text.tertiary} mb-0.5`}>Trajectory</div>
              <div className={`text-[10px] font-medium ${colors.text.primary}`}>TWAP</div>
            </div>
            <div>
              <div className={`text-[9px] ${colors.text.tertiary} mb-0.5`}>Target Notional</div>
              <div className={`text-[10px] font-medium ${colors.text.primary}`}>
                {(() => {
                  // Target Notional = quantity without leverage (buy or sell)
                  const quantity = trade.buyQuantity || trade.sellQuantity || 0;
                  return `$${quantity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                })()}
              </div>
            </div>
            <div>
              <div className={`text-[9px] ${colors.text.tertiary} mb-0.5`}>Duration</div>
              <div className={`text-[10px] font-medium ${colors.text.primary}`}>{trade.duration || 15} min</div>
            </div>
          </div>

          {/* Statistics */}
          <div>
            <h3 className={`text-[10px] font-semibold ${colors.text.primary} mb-1.5`}>Statistics</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {(trade.side === 'Single' ? [
                { label: 'Opened', value: '1' },
                { label: 'Exposure', value: '$215' },
                { label: 'totalFees', value: '$0.12' },
                { label: 'P%L', value: '+$5.92' },
              ] : [
                { label: 'Opened', value: '2' },
                { label: 'Exposure', value: '$215' },
                { label: 'totalFees', value: '$0.12' },
                { label: 'Earning/pm on short', value: '0.08%' },
                { label: 'Earning/pm on long', value: '0.06%' },
                { label: 'Delta on lending rate', value: '0.02%' },
                { label: 'P%L', value: '+$5.92' },
              ]).map((stat) => (
                <div key={stat.label} className={`${colors.bg.secondary} border ${colors.border.default} rounded px-1.5 py-1`}>
                  <div className={`text-[8px] ${colors.text.tertiary} mb-0.5`}>{stat.label}</div>
                  <div className={`text-[10px] font-medium ${colors.text.primary}`}>{stat.value}</div>
                </div>
              ))}
            </div>
          </div>

          <button className={`w-full text-[9px] font-medium ${colors.accent.primary} text-center py-1.5`}>
            Hide Details ▲
          </button>

          <div className={`border-t ${colors.border.divider} pt-2 mt-2`}>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className={`text-[9px] ${colors.text.tertiary} mb-0.5`}>Time Start</div>
                <div className={`text-[10px] font-medium ${colors.text.primary}`}>{trade.timeStart}</div>
              </div>
              <div>
                <div className={`text-[9px] ${colors.text.tertiary} mb-0.5`}>Status</div>
                <div className={`text-[10px] font-medium ${colors.accent.positive}`}>Finished</div>
              </div>
            </div>
          </div>

          {/* Fill Percentage */}
          <div>
            <div className={`text-[9px] ${colors.text.tertiary} mb-1.5`}>Fill Percentage</div>
            <div className="w-full h-2.5 bg-black/10 dark:bg-white/10 rounded-sm overflow-hidden">
              <div className="h-full bg-green-500" style={{ width: '100%' }}></div>
            </div>
            <div className={`text-[9px] ${colors.text.secondary} mt-0.5 text-center`}>100%</div>
          </div>

          {/* Fill Rate */}
          <div>
            <div className={`text-[9px] ${colors.text.tertiary} mb-1.5`}>Fill Rate</div>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 bg-pink-500 rounded-full"></div>
              <span className={`text-[9px] ${colors.text.secondary}`}>97% TWAP</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className={`text-[9px] ${colors.text.secondary}`}>22% WAIT</span>
            </div>
          </div>

          {/* Timestamp(s) */}
          <div>
            <div className={`text-[9px] ${colors.text.tertiary} mb-1.5`}>Timestamp(s)</div>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className={`text-[9px] ${colors.text.secondary}`}>60% Hyperliquid</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-pink-500 rounded-full"></div>
              <span className={`text-[9px] ${colors.text.secondary}`}>40% Aster</span>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className={`px-3 py-2.5 border-t ${colors.border.divider} flex gap-2`}>
          <button className={`flex-1 h-6 rounded flex items-center justify-center gap-1.5 ${colors.bg.subtle} ${colors.state.hover} transition-colors`}>
            <div className="w-2.5 h-2.5 border-2 border-current rounded-full"></div>
            <span className={`text-[9px] font-medium ${colors.text.primary}`}>Pause</span>
          </button>
          <button className={`flex-1 h-6 rounded flex items-center justify-center gap-1.5 ${colors.bg.subtle} ${colors.state.hover} transition-colors`}>
            <X className="w-2.5 h-2.5" />
            <span className={`text-[9px] font-medium ${colors.text.primary}`}>Cancel</span>
          </button>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col">
        {/* Tabs */}
        <div className={`border-b ${colors.border.divider}`}>
          <div className="flex">
            <button
              onClick={() => setActiveTab('status')}
              className={`flex-1 h-9 text-[11px] font-medium border-b-2 transition-colors ${
                activeTab === 'status'
                  ? 'border-orange-500 text-orange-500'
                  : `border-transparent ${colors.text.tertiary} ${colors.state.hover}`
              }`}
            >
              Status
            </button>
            <button
              onClick={() => setActiveTab('execution')}
              className={`flex-1 h-9 text-[11px] font-medium border-b-2 transition-colors ${
                activeTab === 'execution'
                  ? 'border-orange-500 text-orange-500'
                  : `border-transparent ${colors.text.tertiary} ${colors.state.hover}`
              }`}
            >
              execution
            </button>
            {trade.side === 'Multi' && (
              <button
                onClick={() => setActiveTab('rebalancing')}
                className={`flex-1 h-9 text-[11px] font-medium border-b-2 transition-colors ${
                  activeTab === 'rebalancing'
                    ? 'border-orange-500 text-orange-500'
                    : `border-transparent ${colors.text.tertiary} ${colors.state.hover}`
                }`}
              >
                Rebalancing
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3">
          {activeTab === 'status' ? (
            <StatusTab colors={colors} trade={trade} />
          ) : activeTab === 'execution' ? (
            <ExecutionTab colors={colors} trade={trade} selectedExchanges={selectedExchanges} />
          ) : (
            <RebalancingTab colors={colors} />
          )}
        </div>
      </div>
    </div>
  );
}

function StatusTab({ colors, trade }: { colors: any; trade: Trade }) {
  const { getPrice } = usePricesStore();
  
  // Calculate current PNL based on execution prices vs current prices
  const buyToken = trade.buyPair?.includes(':') ? trade.buyPair.split(':')[1].split('-')[0] : (trade.pair || 'BTC');
  const sellToken = trade.sellPair?.includes(':') ? trade.sellPair.split(':')[1].split('-')[0] : (trade.pair || 'BTC');
  
  const currentBuyPrice = getPrice(buyToken) || trade.buyPrice || 0;
  const currentSellPrice = getPrice(sellToken) || trade.sellPrice || 0;
  
  // Calculate PNL for buy side (long position)
  const buyPnl = trade.buyPrice ? (currentBuyPrice - trade.buyPrice) * (trade.buyQuantity || 0) : 0;
  
  // Calculate PNL for sell side (short position) if multi-leg
  const sellPnl = trade.side === 'Multi' && trade.sellPrice 
    ? (trade.sellPrice - currentSellPrice) * (trade.sellQuantity || 0) 
    : 0;
  
  // Total PNL
  const totalPnl = buyPnl + sellPnl;
  const totalNotional = (trade.buyQuantity || 0) + (trade.sellQuantity || 0);
  const pnlPercent = totalNotional > 0 ? (totalPnl / totalNotional) * 100 : 0;
  
  // Generate PNL chart data points (simulate progression from 0 to current PNL)
  const generatePnlPath = () => {
    const points = 30; // Number of data points
    const width = 900;
    const height = 140;
    const stepX = width / (points - 1);
    
    // Simulate PNL progression over time (starting from 0, gradually reaching current PNL)
    let path = '';
    for (let i = 0; i < points; i++) {
      const x = i * stepX;
      // Simulate some volatility: start at 0, gradually trend towards current PNL with noise
      const progress = i / (points - 1);
      const noise = (Math.sin(i * 0.5) * 0.1 + Math.cos(i * 0.3) * 0.05) * totalPnl;
      const value = totalPnl * progress + noise;
      
      // Map PNL to Y coordinate (inverted: high PNL = low Y)
      // Scale: -100 to +300 USD range
      const minPnl = -100;
      const maxPnl = 300;
      const normalizedValue = Math.max(minPnl, Math.min(maxPnl, value));
      const y = height - ((normalizedValue - minPnl) / (maxPnl - minPnl)) * height;
      
      path += `${i === 0 ? 'M' : ' L'} ${x} ${y}`;
    }
    return path;
  };
  
  const pnlPath = generatePnlPath();
  const isProfit = totalPnl >= 0;
  
  return (
    <div className="space-y-3">
      {/* Pairs Table */}
      <div className={`${colors.bg.surface} border ${colors.border.default} rounded overflow-hidden`}>
        <table className="w-full">
          <thead>
            <tr className={`${colors.bg.subtle} border-b ${colors.border.divider}`}>
              <th className={`text-left px-2.5 py-1.5 text-[9px] font-medium ${colors.text.tertiary}`}>Pair</th>
              <th className={`text-left px-2.5 py-1.5 text-[9px] font-medium ${colors.text.tertiary}`}>Accounts</th>
              <th className={`text-left px-2.5 py-1.5 text-[9px] font-medium ${colors.text.tertiary}`}>Side</th>
              <th className={`text-left px-2.5 py-1.5 text-[9px] font-medium ${colors.text.tertiary}`}>Target Notional</th>
              <th className={`text-left px-2.5 py-1.5 text-[9px] font-medium ${colors.text.tertiary}`}>Executed Price</th>
              <th className={`text-left px-2.5 py-1.5 text-[9px] font-medium ${colors.text.tertiary}`}>Target Notional</th>
              <th className={`text-left px-2.5 py-1.5 text-[9px] font-medium ${colors.text.tertiary}`}>Filled</th>
              <th className={`text-left px-2.5 py-1.5 text-[9px] font-medium ${colors.text.tertiary}`}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className={`border-b ${colors.border.divider}`}>
              <td className={`px-2.5 py-2 text-[10px] font-medium ${colors.text.primary}`}>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                  {formatPairName(trade.buyPair || trade.pair, trade.source)}
                </div>
              </td>
              <td className={`px-2.5 py-2 text-[10px] ${colors.text.secondary}`}>
                {trade.source === 'aggregator' && trade.exchanges && trade.exchanges.length > 0 ? (
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    {trade.exchanges.length} {trade.exchanges.length === 1 ? 'exchange' : 'exchanges'}
                  </div>
                ) : trade.side === 'Single' ? (
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    2 exchanges
                  </div>
                ) : (trade.buyExchange || 'M')}
              </td>
              <td className={`px-2.5 py-2 text-[10px] ${colors.accent.positive}`}>Buy</td>
              <td className={`px-2.5 py-2 text-[10px] ${colors.text.secondary}`}>
                <div>{formatTargetNotional(trade.buyLeverage || 1, trade.buyQuantity || 0)}</div>
              </td>
              <td className={`px-2.5 py-2 text-[10px] ${colors.text.secondary}`}>${(trade.buyPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className={`px-2.5 py-2 text-[10px] ${colors.text.secondary}`}>{calculateTotalNotional(trade.buyQuantity || 0, trade.buyLeverage || 1)}</td>
              <td className="px-2.5 py-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-12 h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: '100%' }}></div>
                  </div>
                  <span className={`text-[9px] ${colors.text.tertiary}`}>100%</span>
                </div>
              </td>
              <td className={`px-2.5 py-2 text-[10px] ${colors.accent.positive}`}>Finished</td>
            </tr>
            {trade.side === 'Multi' && (
              <tr className={`border-b ${colors.border.divider}`}>
                <td className={`px-2.5 py-2 text-[10px] font-medium ${colors.text.primary}`}>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                    {formatPairName(trade.sellPair, trade.source)}
                  </div>
                </td>
                <td className={`px-2.5 py-2 text-[10px] ${colors.text.secondary}`}>
                  {trade.sellExchange || 'Aster'}
                </td>
                <td className={`px-2.5 py-2 text-[10px] ${colors.accent.negative}`}>Sell</td>
                <td className={`px-2.5 py-2 text-[10px] ${colors.text.secondary}`}>
                  <div>{formatTargetNotional(trade.sellLeverage || 1, trade.sellQuantity || 0)}</div>
                </td>
                <td className={`px-2.5 py-2 text-[10px] ${colors.text.secondary}`}>${(trade.sellPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className={`px-2.5 py-2 text-[10px] ${colors.text.secondary}`}>{calculateTotalNotional(trade.sellQuantity || 0, trade.sellLeverage || 1)}</td>
                <td className="px-2.5 py-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-12 h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: '99%' }}></div>
                    </div>
                    <span className={`text-[9px] ${colors.text.tertiary}`}>99%</span>
                  </div>
                </td>
                <td className={`px-2.5 py-2 text-[10px] ${colors.accent.positive}`}>Finished</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Strategy Parameters */}
      <div>
        <h3 className={`text-[10px] font-semibold ${colors.text.primary} mb-1.5`}>Strategy Parameters</h3>
        <div className="grid grid-cols-7 gap-1.5">
          <div className={`${colors.bg.surface} border ${colors.border.default} rounded px-1.5 py-1`}>
            <div className={`text-[8px] ${colors.text.tertiary} mb-0.5`}>Avg Spread</div>
            <div className={`text-[10px] font-medium ${colors.accent.negative}`}>$-0.92 ~ -2.2 bps</div>
          </div>
          <div className={`${colors.bg.surface} border ${colors.border.default} rounded px-1.5 py-1`}>
            <div className={`text-[8px] ${colors.text.tertiary} mb-0.5`}>Quote Tilt</div>
            <div className={`text-[10px] font-medium ${colors.text.primary}`}>0.00</div>
          </div>
          <div className={`${colors.bg.surface} border ${colors.border.default} rounded px-1.5 py-1`}>
            <div className={`text-[8px] ${colors.text.tertiary} mb-0.5`}>Directional Bias</div>
            <div className={`text-[10px] font-medium ${colors.text.primary}`}>0.00</div>
          </div>
          <div className={`${colors.bg.surface} border ${colors.border.default} rounded px-1.5 py-1`}>
            <div className={`text-[8px] ${colors.text.tertiary} mb-0.5`}>Passiveness</div>
            <div className={`text-[10px] font-medium ${colors.text.primary}`}>0.00</div>
          </div>
          <div className={`${colors.bg.surface} border ${colors.border.default} rounded px-1.5 py-1`}>
            <div className={`text-[8px] ${colors.text.tertiary} mb-0.5`}>Discretion Level</div>
            <div className={`text-[10px] font-medium ${colors.text.primary}`}>0.03</div>
          </div>
          <div className={`${colors.bg.surface} border ${colors.border.default} rounded px-1.5 py-1`}>
            <div className={`text-[8px] ${colors.text.tertiary} mb-0.5`}>Randomize Tolerance</div>
            <div className={`text-[10px] font-medium ${colors.text.primary}`}>0.10</div>
          </div>
          <div className={`${colors.bg.surface} border ${colors.border.default} rounded px-1.5 py-1`}>
            <div className={`text-[8px] ${colors.text.tertiary} mb-0.5`}>Active Limit</div>
            <div className={`text-[10px] font-medium ${colors.text.primary}`}>Yes</div>
          </div>
        </div>
      </div>

      {/* PnL Chart */}
      <div className={`${colors.bg.surface} border ${colors.border.default} rounded p-3`}>
        <div className="flex items-center justify-between mb-2">
          <div className={`text-[10px] font-medium ${colors.text.primary}`}>PnL</div>
          <div className={`text-[11px] font-semibold ${isProfit ? colors.accent.positive : colors.accent.negative}`}>
            {isProfit ? '+' : ''}${totalPnl.toFixed(2)} ({isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%)
          </div>
        </div>
        <div className="h-40">
          <svg width="100%" height="100%" viewBox="0 0 900 140" preserveAspectRatio="none">
            {/* Grid lines */}
            <line x1="0" y1="28" x2="900" y2="28" stroke="currentColor" strokeWidth="0.5" className={colors.text.tertiary} opacity="0.2" />
            <line x1="0" y1="56" x2="900" y2="56" stroke="currentColor" strokeWidth="0.5" className={colors.text.tertiary} opacity="0.2" />
            <line x1="0" y1="84" x2="900" y2="84" stroke="currentColor" strokeWidth="0.5" className={colors.text.tertiary} opacity="0.2" />
            <line x1="0" y1="112" x2="900" y2="112" stroke="currentColor" strokeWidth="0.5" className={colors.text.tertiary} opacity="0.2" />
            
            {/* Y-axis labels */}
            <text x="10" y="25" fill="currentColor" fontSize="10" className={colors.text.tertiary}>$300.00</text>
            <text x="10" y="53" fill="currentColor" fontSize="10" className={colors.text.tertiary}>$200.00</text>
            <text x="10" y="81" fill="currentColor" fontSize="10" className={colors.text.tertiary}>$100.00</text>
            <text x="10" y="109" fill="currentColor" fontSize="10" className={colors.text.tertiary}>$0.00</text>
            <text x="10" y="137" fill="currentColor" fontSize="10" className={colors.text.tertiary}>-$100.00</text>

            {/* X-axis labels - show relative time */}
            <text x="120" y="135" fill="currentColor" fontSize="9" className={colors.text.tertiary}>+2m</text>
            <text x="300" y="135" fill="currentColor" fontSize="9" className={colors.text.tertiary}>+4m</text>
            <text x="480" y="135" fill="currentColor" fontSize="9" className={colors.text.tertiary}>+6m</text>
            <text x="660" y="135" fill="currentColor" fontSize="9" className={colors.text.tertiary}>+8m</text>
            <text x="840" y="135" fill="currentColor" fontSize="9" className={colors.text.tertiary}>+10m</text>

            {/* Real-time PnL line */}
            <path
              d={pnlPath}
              fill="none"
              stroke={isProfit ? '#10b981' : '#ef4444'}
              strokeWidth="1.5"
            />
          </svg>
        </div>
      </div>

      {/* Positions Chart */}
      <div className={`${colors.bg.surface} border ${colors.border.default} rounded p-3`}>
        <div className="flex items-center justify-between mb-2">
          <div className={`text-[10px] font-medium ${colors.text.primary}`}>Positions</div>
          <div className="flex gap-3">
            <span className="text-[10px] text-red-500">Short</span>
            <span className="text-[10px] text-green-500">Long</span>
          </div>
        </div>
        <div className="h-24">
          <svg width="100%" height="100%" viewBox="0 0 900 90" preserveAspectRatio="none">
            {/* Grid lines */}
            <line x1="0" y1="22.5" x2="900" y2="22.5" stroke="currentColor" strokeWidth="0.5" className={colors.text.tertiary} opacity="0.2" />
            <line x1="0" y1="45" x2="900" y2="45" stroke="currentColor" strokeWidth="0.5" className={colors.text.tertiary} opacity="0.2" />
            <line x1="0" y1="67.5" x2="900" y2="67.5" stroke="currentColor" strokeWidth="0.5" className={colors.text.tertiary} opacity="0.2" />

            {/* X-axis labels */}
            <text x="120" y="85" fill="currentColor" fontSize="9" className={colors.text.tertiary}>21:34</text>
            <text x="300" y="85" fill="currentColor" fontSize="9" className={colors.text.tertiary}>21:36</text>
            <text x="480" y="85" fill="currentColor" fontSize="9" className={colors.text.tertiary}>21:38</text>
            <text x="660" y="85" fill="currentColor" fontSize="9" className={colors.text.tertiary}>21:40</text>
            <text x="840" y="85" fill="currentColor" fontSize="9" className={colors.text.tertiary}>21:42</text>

            {/* Short position line (red) with dots */}
            <path
              d="M 0 52 L 60 53 L 120 51 L 180 52 L 240 50 L 300 52 L 360 48 L 420 50 L 480 47 L 540 49 L 600 48 L 660 50 L 720 49 L 780 51 L 840 50 L 900 52"
              fill="none"
              stroke="#ef4444"
              strokeWidth="1.5"
            />
            {[0,60,120,180,240,300,360,420,480,540,600,660,720,780,840,900].map((x, i) => (
              <circle key={`short-${i}`} cx={x} cy={50 + (i % 3)} r="2" fill="#ef4444" />
            ))}

            {/* Long position line (green) with dots */}
            <path
              d="M 0 45 L 60 44 L 120 46 L 180 44 L 240 47 L 300 40 L 360 35 L 420 33 L 480 36 L 540 35 L 600 34 L 660 36 L 720 34 L 780 36 L 840 35 L 900 34"
              fill="none"
              stroke="#10b981"
              strokeWidth="1.5"
            />
            {[0,60,120,180,240,300,360,420,480,540,600,660,720,780,840,900].map((x, i) => (
              <circle key={`long-${i}`} cx={x} cy={35 + (i % 3)} r="2" fill="#10b981" />
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}

function ExecutionTab({ colors, trade, selectedExchanges }: { colors: any; trade: Trade; selectedExchanges: string[] }) {
  // Generate mock clip data with varying prices to calculate average executed price
  const generateClipData = (basePrice: number, quantity: number, numClips: number = 5) => {
    const clips = [];
    let remainingQuantity = quantity;
    
    for (let i = 0; i < numClips; i++) {
      const isLast = i === numClips - 1;
      const clipQuantity = isLast ? remainingQuantity : quantity / numClips;
      
      // Vary price slightly around base price (+/- 0.5%)
      const priceVariation = (Math.random() - 0.5) * 0.01 * basePrice;
      const clipPrice = basePrice + priceVariation;
      
      clips.push({
        quantity: clipQuantity,
        price: clipPrice,
        notional: clipQuantity * clipPrice
      });
      
      remainingQuantity -= clipQuantity;
    }
    
    return clips;
  };
  
  // Calculate average executed price (weighted by quantity)
  const calculateAvgPrice = (clips: Array<{ quantity: number; price: number; notional: number }>) => {
    const totalNotional = clips.reduce((sum, clip) => sum + clip.notional, 0);
    const totalQuantity = clips.reduce((sum, clip) => sum + clip.quantity, 0);
    return totalQuantity > 0 ? totalNotional / totalQuantity : 0;
  };
  
  // Generate clips for buy and sell sides
  const buyClips = trade.buyPrice && trade.buyQuantity 
    ? generateClipData(trade.buyPrice, trade.buyQuantity, 5)
    : [];
  const sellClips = trade.sellPrice && trade.sellQuantity 
    ? generateClipData(trade.sellPrice, trade.sellQuantity, 5)
    : [];
    
  // Calculate average prices
  const avgBuyPrice = buyClips.length > 0 ? calculateAvgPrice(buyClips) : (trade.buyPrice || 0);
  const avgSellPrice = sellClips.length > 0 ? calculateAvgPrice(sellClips) : (trade.sellPrice || 0);
  
  console.log('📊 ExecutionTab - Average Prices:', { 
    buyClips: buyClips.length, 
    avgBuyPrice, 
    originalBuyPrice: trade.buyPrice,
    sellClips: sellClips.length,
    avgSellPrice,
    originalSellPrice: trade.sellPrice
  });
  
  return (
    <div className="space-y-3">
      {/* Pairs Table */}
      <div className={`${colors.bg.surface} border ${colors.border.default} rounded overflow-hidden`}>
        <table className="w-full">
          <thead>
            <tr className={`${colors.bg.subtle} border-b ${colors.border.divider}`}>
              <th className={`text-left px-2.5 py-1.5 text-[9px] font-medium ${colors.text.tertiary}`}>Pair</th>
              <th className={`text-left px-2.5 py-1.5 text-[9px] font-medium ${colors.text.tertiary}`}>Accounts</th>
              <th className={`text-left px-2.5 py-1.5 text-[9px] font-medium ${colors.text.tertiary}`}>Side</th>
              <th className={`text-left px-2.5 py-1.5 text-[9px] font-medium ${colors.text.tertiary}`}>Target Notional</th>
              <th className={`text-left px-2.5 py-1.5 text-[9px] font-medium ${colors.text.tertiary}`}>Executed Price</th>
              <th className={`text-left px-2.5 py-1.5 text-[9px] font-medium ${colors.text.tertiary}`}>Target Notional</th>
              <th className={`text-left px-2.5 py-1.5 text-[9px] font-medium ${colors.text.tertiary}`}>Filled</th>
              <th className={`text-left px-2.5 py-1.5 text-[9px] font-medium ${colors.text.tertiary}`}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className={`border-b ${colors.border.divider}`}>
              <td className={`px-2.5 py-2 text-[10px] font-medium ${colors.text.primary}`}>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                  {formatPairName(trade.buyPair || trade.pair, trade.source)}
                </div>
              </td>
              <td className={`px-2.5 py-2 text-[10px] ${colors.text.secondary}`}>
                {trade.source === 'aggregator' && trade.exchanges && trade.exchanges.length > 0 ? (
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    {trade.exchanges.length} {trade.exchanges.length === 1 ? 'exchange' : 'exchanges'}
                  </div>
                ) : trade.side === 'Single' ? (
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    2 exchanges
                  </div>
                ) : (trade.buyExchange || 'M')}
              </td>
              <td className={`px-2.5 py-2 text-[10px] ${colors.accent.positive}`}>Buy</td>
              <td className={`px-2.5 py-2 text-[10px] ${colors.text.secondary}`}>
                <div>{formatTargetNotional(trade.buyLeverage || 1, trade.buyQuantity || 0)}</div>
              </td>
              <td className={`px-2.5 py-2 text-[10px] ${colors.text.secondary}`}>${avgBuyPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className={`px-2.5 py-2 text-[10px] ${colors.text.secondary}`}>{calculateTotalNotional(trade.buyQuantity || 0, trade.buyLeverage || 1)}</td>
              <td className="px-2.5 py-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-12 h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: '100%' }}></div>
                  </div>
                  <span className={`text-[9px] ${colors.text.tertiary}`}>100%</span>
                </div>
              </td>
              <td className={`px-2.5 py-2 text-[10px] ${colors.accent.positive}`}>Finished</td>
            </tr>
            {trade.side === 'Multi' && (
              <tr className={`border-b ${colors.border.divider}`}>
                <td className={`px-2.5 py-2 text-[10px] font-medium ${colors.text.primary}`}>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                    {formatPairName(trade.sellPair, trade.source)}
                  </div>
                </td>
                <td className={`px-2.5 py-2 text-[10px] ${colors.text.secondary}`}>
                  {trade.sellExchange || 'Aster'}
                </td>
                <td className={`px-2.5 py-2 text-[10px] ${colors.accent.negative}`}>Sell</td>
                <td className={`px-2.5 py-2 text-[10px] ${colors.text.secondary}`}>
                  <div>{formatTargetNotional(trade.sellLeverage || 1, trade.sellQuantity || 0)}</div>
                </td>
                <td className={`px-2.5 py-2 text-[10px] ${colors.text.secondary}`}>${avgSellPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className={`px-2.5 py-2 text-[10px] ${colors.text.secondary}`}>{calculateTotalNotional(trade.sellQuantity || 0, trade.sellLeverage || 1)}</td>
                <td className="px-2.5 py-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-12 h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: '99%' }}></div>
                    </div>
                    <span className={`text-[9px] ${colors.text.tertiary}`}>99%</span>
                  </div>
                </td>
                <td className={`px-2.5 py-2 text-[10px] ${colors.accent.positive}`}>Finished</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Exchange Execution Chart */}
      <ExchangeExecutionChart colors={colors} exchanges={trade.exchanges || selectedExchanges} />

      {/* Metrics */}
      <div className="grid grid-cols-5 gap-1.5">
        <div className={`${colors.bg.surface} border ${colors.border.default} rounded px-2 py-1.5`}>
          <div className={`text-[8px] ${colors.text.tertiary} mb-0.5`}>Minimal Exposure</div>
          <div className={`text-[11px] font-semibold ${colors.text.primary}`}>$12.57</div>
        </div>
        <div className={`${colors.bg.surface} border ${colors.border.default} rounded px-2 py-1.5`}>
          <div className={`text-[8px] ${colors.text.tertiary} mb-0.5`}>Slippage</div>
          <div className={`text-[11px] font-semibold ${colors.accent.positive}`}>-0.077%</div>
        </div>
        <div className={`${colors.bg.surface} border ${colors.border.default} rounded px-2 py-1.5`}>
          <div className={`text-[8px] ${colors.text.tertiary} mb-0.5`}>Spread</div>
          <div className={`text-[11px] font-semibold ${colors.accent.negative}`}>0.07%</div>
        </div>
        <div className={`${colors.bg.surface} border ${colors.border.default} rounded px-2 py-1.5`}>
          <div className={`text-[8px] ${colors.text.tertiary} mb-0.5`}>Exchange fee</div>
          <div className={`text-[11px] font-semibold ${colors.text.primary}`}>$1.3206 <span className="text-[8px] opacity-60">≈ 472pcs</span></div>
        </div>
        <div className={`${colors.bg.surface} border ${colors.border.default} rounded px-2 py-1.5`}>
          <div className={`text-[8px] ${colors.text.tertiary} mb-0.5`}>Realization Rate</div>
          <div className={`text-[11px] font-semibold ${colors.text.primary}`}>0.098%</div>
        </div>
      </div>

      {/* Exchange Execution Chart (for Single trades) or Net Exposure Chart (for Multi trades) */}
      <div className={`${colors.bg.surface} border ${colors.border.default} rounded p-3`}>
        <div className="flex items-center justify-between mb-3">
          <div className={`text-[11px] font-semibold ${colors.text.primary}`}>
            {trade.side === 'Single' ? 'Exchange Execution Over Time (%)' : 'Net Exposure ($)'}
          </div>
          <div className="flex items-center gap-3 text-[9px]">
            {trade.side === 'Single' ? (
              <>
                {(() => {
                  // Use trade.exchanges if available, otherwise fall back to selectedExchanges prop
                  const exchanges = (trade as any).exchanges?.length > 0 
                    ? (trade as any).exchanges 
                    : (selectedExchanges?.length > 0 ? selectedExchanges : ['Hyperliquid', 'Paradex']);
                  const exchangeColors = ['#10b981', '#ec4899', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316', '#14b8a6'];
                  
                  return exchanges.map((exchange: string, idx: number) => (
                    <div key={exchange} className="flex items-center gap-1">
                      <div className="w-3 h-0.5" style={{ backgroundColor: exchangeColors[idx % exchangeColors.length] }}></div>
                      <span className={colors.text.secondary}>{exchange}</span>
                    </div>
                  ));
                })()}
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-blue-500"></div>
                  <span className={colors.text.secondary}>Total</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-2 bg-red-500 rounded-sm"></div>
                  <span className={colors.text.secondary}>Take</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-2 bg-green-500 rounded-sm"></div>
                  <span className={colors.text.secondary}>Make</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-gray-900 dark:bg-gray-200"></div>
                  <span className={colors.text.secondary}>Net Exposure</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 border-t-2 border-dashed border-gray-400"></div>
                  <span className={colors.text.secondary}>Target Exposure</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 border-t-2 border-dotted border-gray-400"></div>
                  <span className={colors.text.secondary}>Exposure Tolerance Band</span>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="h-56">
          {trade.side === 'Single' ? (
            <ExchangeExecutionChart 
              colors={colors} 
              exchanges={(trade as any).exchanges?.length > 0 ? (trade as any).exchanges : selectedExchanges}
            />
          ) : (
            <svg width="100%" height="100%" viewBox="0 0 900 220" preserveAspectRatio="none">
            {/* Y-axis */}
            <line x1="40" y1="10" x2="40" y2="200" stroke="currentColor" strokeWidth="1" className={colors.text.tertiary} opacity="0.3" />
            
            {/* Grid lines */}
            <line x1="40" y1="45" x2="880" y2="45" stroke="currentColor" strokeWidth="0.5" className={colors.text.tertiary} opacity="0.1" strokeDasharray="2,2" />
            <line x1="40" y1="110" x2="880" y2="110" stroke="currentColor" strokeWidth="1" className={colors.text.tertiary} opacity="0.3" />
            <line x1="40" y1="175" x2="880" y2="175" stroke="currentColor" strokeWidth="0.5" className={colors.text.tertiary} opacity="0.1" strokeDasharray="2,2" />
            
            {/* Y-axis labels */}
            <text x="5" y="15" fill="currentColor" fontSize="9" className={colors.text.tertiary}>150</text>
            <text x="12" y="115" fill="currentColor" fontSize="9" className={colors.text.tertiary}>0</text>
            <text x="5" y="180" fill="currentColor" fontSize="9" className={colors.text.tertiary}>-150</text>
            <text x="5" y="210" fill="currentColor" fontSize="9" className={colors.text.tertiary}>-300</text>
            
            {/* X-axis labels */}
            <text x="150" y="215" fill="currentColor" fontSize="9" className={colors.text.tertiary}>22:48</text>
            <text x="740" y="215" fill="currentColor" fontSize="9" className={colors.text.tertiary}>22:50</text>
            
            {/* Target Exposure line (dashed, at 0) */}
            <line x1="40" y1="110" x2="880" y2="110" stroke="currentColor" strokeWidth="1" className={colors.text.tertiary} opacity="0.5" strokeDasharray="4,4" />
            
            {/* Exposure Tolerance Bands (dotted) */}
            <line x1="40" y1="80" x2="880" y2="80" stroke="currentColor" strokeWidth="1" className={colors.text.tertiary} opacity="0.3" strokeDasharray="1,3" />
            <line x1="40" y1="140" x2="880" y2="140" stroke="currentColor" strokeWidth="1" className={colors.text.tertiary} opacity="0.3" strokeDasharray="1,3" />
            
            {/* Take bars (red) */}
            <rect x="60" y="85" width="12" height="25" fill="#ef4444" opacity="0.8" />
            <rect x="100" y="70" width="12" height="40" fill="#ef4444" opacity="0.8" />
            <rect x="140" y="110" width="12" height="30" fill="#ef4444" opacity="0.8" />
            <rect x="180" y="110" width="12" height="25" fill="#ef4444" opacity="0.8" />
            <rect x="220" y="80" width="12" height="30" fill="#ef4444" opacity="0.8" />
            <rect x="260" y="110" width="12" height="35" fill="#ef4444" opacity="0.8" />
            <rect x="300" y="75" width="12" height="35" fill="#ef4444" opacity="0.8" />
            <rect x="340" y="110" width="12" height="28" fill="#ef4444" opacity="0.8" />
            <rect x="380" y="110" width="12" height="32" fill="#ef4444" opacity="0.8" />
            <rect x="420" y="85" width="12" height="25" fill="#ef4444" opacity="0.8" />
            <rect x="460" y="110" width="12" height="38" fill="#ef4444" opacity="0.8" />
            <rect x="500" y="80" width="12" height="30" fill="#ef4444" opacity="0.8" />
            <rect x="540" y="110" width="12" height="26" fill="#ef4444" opacity="0.8" />
            <rect x="580" y="75" width="12" height="35" fill="#ef4444" opacity="0.8" />
            <rect x="620" y="110" width="12" height="30" fill="#ef4444" opacity="0.8" />
            <rect x="660" y="110" width="12" height="35" fill="#ef4444" opacity="0.8" />
            <rect x="700" y="85" width="12" height="25" fill="#ef4444" opacity="0.8" />
            <rect x="740" y="110" width="12" height="28" fill="#ef4444" opacity="0.8" />
            <rect x="780" y="110" width="12" height="32" fill="#ef4444" opacity="0.8" />
            <rect x="820" y="80" width="12" height="30" fill="#ef4444" opacity="0.8" />
            
            {/* Make bars (green/teal) */}
            <rect x="80" y="110" width="12" height="28" fill="#14b8a6" opacity="0.8" />
            <rect x="120" y="85" width="12" height="25" fill="#14b8a6" opacity="0.8" />
            <rect x="160" y="70" width="12" height="40" fill="#14b8a6" opacity="0.8" />
            <rect x="200" y="110" width="12" height="30" fill="#14b8a6" opacity="0.8" />
            <rect x="240" y="110" width="12" height="25" fill="#14b8a6" opacity="0.8" />
            <rect x="280" y="80" width="12" height="30" fill="#14b8a6" opacity="0.8" />
            <rect x="320" y="110" width="12" height="32" fill="#14b8a6" opacity="0.8" />
            <rect x="360" y="75" width="12" height="35" fill="#14b8a6" opacity="0.8" />
            <rect x="400" y="110" width="12" height="28" fill="#14b8a6" opacity="0.8" />
            <rect x="440" y="110" width="12" height="35" fill="#14b8a6" opacity="0.8" />
            <rect x="480" y="80" width="12" height="30" fill="#14b8a6" opacity="0.8" />
            <rect x="520" y="110" width="12" height="26" fill="#14b8a6" opacity="0.8" />
            <rect x="560" y="110" width="12" height="30" fill="#14b8a6" opacity="0.8" />
            <rect x="600" y="85" width="12" height="25" fill="#14b8a6" opacity="0.8" />
            <rect x="640" y="110" width="12" height="32" fill="#14b8a6" opacity="0.8" />
            <rect x="680" y="75" width="12" height="35" fill="#14b8a6" opacity="0.8" />
            <rect x="720" y="110" width="12" height="28" fill="#14b8a6" opacity="0.8" />
            <rect x="760" y="110" width="12" height="30" fill="#14b8a6" opacity="0.8" />
            <rect x="800" y="110" width="12" height="26" fill="#14b8a6" opacity="0.8" />
            <rect x="840" y="85" width="12" height="25" fill="#14b8a6" opacity="0.8" />
            
            {/* Net Exposure line (black) oscillating around 0 */}
            <path
              d="M 60 105 L 80 115 L 100 108 L 120 112 L 140 107 L 160 113 L 180 109 L 200 114 L 220 106 L 240 111 L 260 108 L 280 113 L 300 107 L 320 112 L 340 109 L 360 114 L 380 108 L 400 113 L 420 107 L 440 112 L 460 109 L 480 114 L 500 106 L 520 111 L 540 108 L 560 113 L 580 107 L 600 112 L 620 109 L 640 114 L 660 108 L 680 113 L 700 107 L 720 112 L 740 109 L 760 114 L 780 108 L 800 113 L 820 107 L 840 112 L 860 109"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={colors.text.primary}
            />
            </svg>
          )}
        </div>
      </div>

      {/* Price BTC-PERP Chart */}
      <div className={`${colors.bg.surface} border ${colors.border.default} rounded p-3`}>
        <div className={`text-[11px] font-semibold ${colors.text.primary} mb-3`}>Price (BTC-PERP)</div>
        <div className="h-32 relative">
          <svg width="100%" height="100%" viewBox="0 0 900 128" preserveAspectRatio="none">
            <line x1="40" y1="10" x2="40" y2="110" stroke="currentColor" strokeWidth="1" className={colors.text.tertiary} opacity="0.3" />
            <line x1="40" y1="110" x2="880" y2="110" stroke="currentColor" strokeWidth="1" className={colors.text.tertiary} opacity="0.3" />
            <line x1="40" y1="35" x2="880" y2="35" stroke="currentColor" strokeWidth="0.5" className={colors.text.tertiary} opacity="0.1" strokeDasharray="2,2" />
            <line x1="40" y1="70" x2="880" y2="70" stroke="currentColor" strokeWidth="0.5" className={colors.text.tertiary} opacity="0.1" strokeDasharray="2,2" />
            <line x1="40" y1="105" x2="880" y2="105" stroke="currentColor" strokeWidth="0.5" className={colors.text.tertiary} opacity="0.1" strokeDasharray="2,2" />
            <text x="5" y="15" fill="currentColor" fontSize="9" className={colors.text.tertiary}>97 600</text>
            <text x="5" y="75" fill="currentColor" fontSize="9" className={colors.text.tertiary}>97 500</text>
            <text x="5" y="115" fill="currentColor" fontSize="9" className={colors.text.tertiary}>97 400</text>
            <text x="150" y="123" fill="currentColor" fontSize="9" className={colors.text.tertiary}>22:48</text>
            <text x="450" y="123" fill="currentColor" fontSize="9" className={colors.text.tertiary}>22:49</text>
            <text x="750" y="123" fill="currentColor" fontSize="9" className={colors.text.tertiary}>22:50</text>
            <path
              d="M 50 72 L 100 70 L 150 73 L 200 68 L 250 71 L 300 69 L 350 72 L 400 70 L 450 68 L 500 71 L 550 69 L 600 72 L 650 70 L 700 73 L 750 71 L 800 69 L 850 72"
              fill="none"
              stroke="#f97316"
              strokeWidth="1.5"
            />
            {[50,100,150,200,250,300,350,400,450,500,550,600,650,700,750,800,850].map((x, i) => (
              <circle key={`orange-${i}`} cx={x} cy={70 + ((i % 5) - 2)} r="2.5" fill="#f97316" />
            ))}
            <path
              d="M 50 75 L 100 73 L 150 76 L 200 71 L 250 74 L 300 72 L 350 75 L 400 73 L 450 71 L 500 74 L 550 72 L 600 75 L 650 73 L 700 76 L 750 74 L 800 72 L 850 75"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="1.5"
            />
            {[50,100,150,200,250,300,350,400,450,500,550,600,650,700,750,800,850].map((x, i) => (
              <circle key={`cyan-${i}`} cx={x} cy={73 + ((i % 5) - 2)} r="2.5" fill="#06b6d4" />
            ))}
          </svg>
        </div>
      </div>

      {/* Spot Edgy Spread Chart */}
      <div className={`${colors.bg.surface} border ${colors.border.default} rounded p-3`}>
        <div className={`text-[11px] font-semibold ${colors.text.primary} mb-3`}>Spread (bps)</div>
        <div className="h-32 relative">
          <svg width="100%" height="100%" viewBox="0 0 900 128" preserveAspectRatio="none">
            <line x1="40" y1="10" x2="40" y2="110" stroke="currentColor" strokeWidth="1" className={colors.text.tertiary} opacity="0.3" />
            <line x1="40" y1="110" x2="880" y2="110" stroke="currentColor" strokeWidth="1" className={colors.text.tertiary} opacity="0.3" />
            <line x1="40" y1="30" x2="880" y2="30" stroke="currentColor" strokeWidth="0.5" className={colors.text.tertiary} opacity="0.1" strokeDasharray="2,2" />
            <line x1="40" y1="50" x2="880" y2="50" stroke="currentColor" strokeWidth="0.5" className={colors.text.tertiary} opacity="0.1" strokeDasharray="2,2" />
            <line x1="40" y1="70" x2="880" y2="70" stroke="currentColor" strokeWidth="0.5" className={colors.text.tertiary} opacity="0.1" strokeDasharray="2,2" />
            <line x1="40" y1="90" x2="880" y2="90" stroke="currentColor" strokeWidth="0.5" className={colors.text.tertiary} opacity="0.1" strokeDasharray="2,2" />
            <text x="8" y="15" fill="currentColor" fontSize="9" className={colors.text.tertiary}>5.00</text>
            <text x="8" y="55" fill="currentColor" fontSize="9" className={colors.text.tertiary}>2.50</text>
            <text x="8" y="115" fill="currentColor" fontSize="9" className={colors.text.tertiary}>0.00</text>
            <text x="150" y="123" fill="currentColor" fontSize="9" className={colors.text.tertiary}>22:48</text>
            <text x="450" y="123" fill="currentColor" fontSize="9" className={colors.text.tertiary}>22:49</text>
            <text x="750" y="123" fill="currentColor" fontSize="9" className={colors.text.tertiary}>22:50</text>
            <path
              d="M 50 85 L 80 80 L 110 75 L 140 65 L 170 55 L 200 50 L 230 52 L 260 50 L 290 54 L 320 50 L 350 52 L 380 50 L 410 54 L 440 50 L 470 52 L 500 50 L 530 54 L 560 50 L 590 52 L 620 50 L 650 52 L 680 50 L 710 54 L 740 50 L 770 52 L 800 50 L 830 52 L 860 50"
              fill="none"
              stroke="#a855f7"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

function RebalancingTab({ colors }: { colors: any }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="mb-3">
        <h2 className={`text-[12px] font-semibold ${colors.text.primary} mb-0.5`}>Auto-Rebalancing Dashboard</h2>
        <p className={`text-[9px] ${colors.text.tertiary}`}>BTC Perpetual Funding Rate Arbitrage</p>
      </div>

      {/* Rebalance Threshold Monitor */}
      <div className={`${colors.bg.surface} border ${colors.border.default} rounded-sm p-3`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className={`text-[10px] font-semibold ${colors.text.primary} mb-0.5`}>Rebalance Threshold Monitor</h3>
            <p className={`text-[8px] ${colors.text.tertiary}`}>Last rebalanced: 2 hours ago</p>
          </div>
          <div className="px-2 py-0.5 bg-[#1FBF75]/10 border border-[#1FBF75]/30 rounded-sm">
            <span className="text-[8px] font-medium text-[#1FBF75]">Auto-Rebalance Active</span>
          </div>
        </div>

        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[8px] font-medium ${colors.text.secondary}`}>Current Imbalance</span>
            <span className={`text-[8px] ${colors.text.tertiary}`}>Safe Zone</span>
          </div>
          <div className="relative w-full h-4 bg-[#1FBF75]/10 rounded-sm overflow-hidden">
            <div className="absolute inset-0 bg-[#1FBF75]" style={{ width: '17%' }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[9px] font-semibold text-white mix-blend-difference">17.0%</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className={`text-[8px] ${colors.text.tertiary}`}>0%</span>
            <span className={`text-[8px] ${colors.text.tertiary}`}>Auto-rebalances at 100%</span>
          </div>
        </div>

        <div className={`px-2 py-1.5 ${colors.bg.tertiary} border ${colors.border.secondary} rounded-sm`}>
          <p className={`text-[8px] ${colors.text.secondary}`}>Positions balanced - within safe threshold</p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className={`${colors.bg.surface} border ${colors.border.default} rounded-sm p-2.5`}>
          <div className={`text-[10px] ${colors.text.tertiary} mb-0.5`}>Net PnL</div>
          <div className="text-[15px] font-semibold text-[#1FBF75]">+0.00 USDC</div>
        </div>

        <div className={`${colors.bg.surface} border ${colors.border.default} rounded-sm p-2.5`}>
          <div className={`text-[10px] ${colors.text.tertiary} mb-0.5`}>Funding Arbitrage</div>
          <div className="text-[15px] font-semibold text-[#1FBF75]">+0.0600%</div>
        </div>

        <div className={`${colors.bg.surface} border ${colors.border.default} rounded-sm p-2.5`}>
          <div className={`text-[10px] ${colors.text.tertiary} mb-0.5`}>Distance to Threshold</div>
          <div className={`text-[15px] font-semibold ${colors.text.primary}`}>$415.00</div>
        </div>
      </div>

      {/* Exchange Cards */}
      <div className="grid grid-cols-2 gap-2">
        {/* Hyperliquid Card */}
        <div className={`${colors.bg.surface} border ${colors.border.default} rounded-sm p-2.5`}>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded bg-[#4A9EFF] flex items-center justify-center">
                <span className="text-white font-semibold text-[9px]">HL</span>
              </div>
              <div>
                <h4 className={`text-[10px] font-semibold ${colors.text.primary}`}>Hyperliquid</h4>
                <p className={`text-[8px] ${colors.text.tertiary}`}>BTC-PERP</p>
              </div>
            </div>
            <div className="px-1.5 py-0.5 bg-[#1FBF75]/10 border border-[#1FBF75]/30 rounded-sm">
              <span className="text-[8px] font-medium text-[#1FBF75]">Long</span>
            </div>
          </div>

          <div className="space-y-1.5 mb-2.5">
            <div className="flex items-center justify-between">
              <span className={`text-[9px] ${colors.text.tertiary}`}>Entry Price</span>
              <span className={`text-[10px] font-medium ${colors.text.primary}`}>$96,250</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-[9px] ${colors.text.tertiary}`}>Current Price</span>
              <span className={`text-[10px] font-medium ${colors.text.primary}`}>$96,335</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-[9px] ${colors.text.tertiary}`}>Size</span>
              <span className={`text-[10px] font-medium ${colors.text.primary}`}>1 BTC</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-[9px] ${colors.text.tertiary}`}>Margin</span>
              <span className={`text-[10px] font-medium ${colors.text.primary}`}>$15,000</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-[9px] ${colors.text.tertiary}`}>Unrealized PnL</span>
              <span className={`text-[10px] font-medium text-[#1FBF75]`}>+85.00 USDC</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-[9px] ${colors.text.tertiary}`}>Funding Rate (8h)</span>
              <span className={`text-[10px] font-medium ${colors.accent.negative}`}>-0.8900%</span>
            </div>
          </div>

          <div className={`px-2 py-1 ${colors.bg.tertiary} border ${colors.border.secondary} rounded-sm mb-1.5`}>
            <div className="flex items-center justify-between">
              <span className={`text-[8px] font-medium ${colors.text.secondary}`}>Netted with Users</span>
              <span className={`text-[8px] font-semibold ${colors.text.primary}`}>$100</span>
            </div>
            <p className={`text-[8px] ${colors.text.tertiary} mt-0.5`}>Matched internally, no exchange execution needed</p>
          </div>

          <div className={`px-2 py-1 bg-[#1FBF75]/10 border border-[#1FBF75]/30 rounded-sm mb-2.5`}>
            <span className={`text-[8px] font-medium text-[#1FBF75]`}>Fully Netted - No Hedge Needed</span>
          </div>

          {/* Liquidation Risk Section */}
          <div className={`border-t ${colors.border.divider} pt-2.5`}>
            <h5 className={`text-[8px] ${colors.text.tertiary} mb-1 border-b border-dotted ${colors.border.default} pb-0.5 inline-block`}>
              Liquidation Risk
            </h5>
            
            <div className="text-[13px] font-semibold text-[#1FBF75] mb-2">
              Safe (99%)
            </div>

            {/* Risk Slider */}
            <div className="flex h-2 rounded-sm overflow-hidden mb-2">
              <div className="bg-red-500" style={{ width: '15%' }}></div>
              <div className="bg-orange-500" style={{ width: '25%' }}></div>
              <div className="bg-[#1FBF75]" style={{ width: '60%' }}></div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className={`text-[9px] ${colors.text.tertiary} mb-0.5 border-b border-dotted ${colors.border.default} pb-0.5 inline-block`}>
                  Liquidation Buffer
                </div>
                <div className={`text-[12px] font-semibold ${colors.text.primary}`}>$116.83</div>
              </div>
              <div>
                <div className={`text-[9px] ${colors.text.tertiary} mb-0.5 border-b border-dotted ${colors.border.default} pb-0.5 inline-block`}>
                  Maintenance Margin
                </div>
                <div className={`text-[12px] font-semibold ${colors.text.primary}`}>$0.48</div>
              </div>
              <div>
                <div className={`text-[9px] ${colors.text.tertiary} mb-0.5 border-b border-dotted ${colors.border.default} pb-0.5 inline-block`}>
                  Margin Ratio
                </div>
                <div className="text-[12px] font-semibold text-[#1FBF75]">0.4%</div>
              </div>
              <div>
                <div className={`text-[9px] ${colors.text.tertiary} mb-0.5 border-b border-dotted ${colors.border.default} pb-0.5 inline-block`}>
                  Average Leverage
                </div>
                <div className={`text-[12px] font-semibold ${colors.text.primary}`}>50x</div>
              </div>
            </div>
          </div>
        </div>

        {/* Paradex Card */}
        <div className={`${colors.bg.surface} border ${colors.border.default} rounded-sm p-2.5`}>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded bg-[#E879F9] flex items-center justify-center">
                <span className="text-white font-semibold text-[9px]">AS</span>
              </div>
              <div>
                <h4 className={`text-[10px] font-semibold ${colors.text.primary}`}>Paradex</h4>
                <p className={`text-[8px] ${colors.text.tertiary}`}>BTC-PERP</p>
              </div>
            </div>
            <div className="px-1.5 py-0.5 bg-red-500/10 border border-red-500/30 rounded-sm">
              <span className="text-[8px] font-medium text-red-500">Short</span>
            </div>
          </div>

          <div className="space-y-1.5 mb-2.5">
            <div className="flex items-center justify-between">
              <span className={`text-[8px] ${colors.text.tertiary}`}>Entry Price</span>
              <span className={`text-[9px] font-medium ${colors.text.primary}`}>$96,250</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-[8px] ${colors.text.tertiary}`}>Current Price</span>
              <span className={`text-[9px] font-medium ${colors.text.primary}`}>$96,335</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-[8px] ${colors.text.tertiary}`}>Size</span>
              <span className={`text-[9px] font-medium ${colors.text.primary}`}>1 BTC</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-[8px] ${colors.text.tertiary}`}>Margin</span>
              <span className={`text-[9px] font-medium ${colors.text.primary}`}>$15,000</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-[8px] ${colors.text.tertiary}`}>Unrealized PnL</span>
              <span className={`text-[9px] font-medium ${colors.accent.negative}`}>-85.00 USDC</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-[8px] ${colors.text.tertiary}`}>Funding Rate (8h)</span>
              <span className={`text-[9px] font-medium text-[#1FBF75]`}>+0.9500%</span>
            </div>
          </div>

          <div className={`px-2 py-1 ${colors.bg.tertiary} border ${colors.border.secondary} rounded-sm mb-1.5`}>
            <div className="flex items-center justify-between">
              <span className={`text-[8px] font-medium ${colors.text.secondary}`}>Netted with Users</span>
              <span className={`text-[8px] font-semibold ${colors.text.primary}`}>$100</span>
            </div>
            <p className={`text-[8px] ${colors.text.tertiary} mt-0.5`}>Matched internally, no exchange execution needed</p>
          </div>

          <div className={`px-2 py-1 bg-[#1FBF75]/10 border border-[#1FBF75]/30 rounded-sm mb-2.5`}>
            <span className={`text-[8px] font-medium text-[#1FBF75]`}>Fully Netted - No Hedge Needed</span>
          </div>

          {/* Liquidation Risk Section */}
          <div className={`border-t ${colors.border.divider} pt-2.5`}>
            <h5 className={`text-[8px] ${colors.text.tertiary} mb-1 border-b border-dotted ${colors.border.default} pb-0.5 inline-block`}>
              Liquidation Risk
            </h5>
            
            <div className="text-[13px] font-semibold text-[#1FBF75] mb-2">
              Safe (99%)
            </div>

            {/* Risk Slider */}
            <div className="flex h-2 rounded-sm overflow-hidden mb-2">
              <div className="bg-red-500" style={{ width: '15%' }}></div>
              <div className="bg-orange-500" style={{ width: '25%' }}></div>
              <div className="bg-[#1FBF75]" style={{ width: '60%' }}></div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className={`text-[8px] ${colors.text.tertiary} mb-0.5 border-b border-dotted ${colors.border.default} pb-0.5 inline-block`}>
                  Liquidation Buffer
                </div>
                <div className={`text-[11px] font-semibold ${colors.text.primary}`}>$116.83</div>
              </div>
              <div>
                <div className={`text-[8px] ${colors.text.tertiary} mb-0.5 border-b border-dotted ${colors.border.default} pb-0.5 inline-block`}>
                  Maintenance Margin
                </div>
                <div className={`text-[11px] font-semibold ${colors.text.primary}`}>$0.48</div>
              </div>
              <div>
                <div className={`text-[8px] ${colors.text.tertiary} mb-0.5 border-b border-dotted ${colors.border.default} pb-0.5 inline-block`}>
                  Margin Ratio
                </div>
                <div className="text-[11px] font-semibold text-[#1FBF75]">0.4%</div>
              </div>
              <div>
                <div className={`text-[8px] ${colors.text.tertiary} mb-0.5 border-b border-dotted ${colors.border.default} pb-0.5 inline-block`}>
                  Average Leverage
                </div>
                <div className={`text-[11px] font-semibold ${colors.text.primary}`}>50x</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className={`${colors.bg.surface} border ${colors.border.default} rounded-sm p-3`}>
        <h3 className={`text-[10px] font-semibold ${colors.text.primary} mb-3`}>Summary</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className={`text-[20px] font-semibold ${colors.text.primary} mb-0.5`}>$200</div>
            <div className={`text-[9px] font-medium ${colors.text.primary} mb-0.5`}>Netted Internally</div>
            <div className={`text-[8px] ${colors.text.tertiary}`}>Matched with other users</div>
          </div>
          <div className="text-center">
            <div className={`text-[20px] font-semibold ${colors.text.primary} mb-0.5`}>$0</div>
            <div className={`text-[9px] font-medium ${colors.text.primary} mb-0.5`}>Hedged on Exchanges</div>
            <div className={`text-[8px] ${colors.text.tertiary}`}>Executed on-chain</div>
          </div>
          <div className="text-center">
            <div className={`text-[20px] font-semibold ${colors.text.primary} mb-0.5`}>100%</div>
            <div className={`text-[9px] font-medium ${colors.text.primary} mb-0.5`}>Netting Efficiency</div>
            <div className={`text-[8px] ${colors.text.tertiary}`}>Gas & fee savings</div>
          </div>
        </div>
      </div>
    </div>
  );
}