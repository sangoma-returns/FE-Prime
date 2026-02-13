import { useState, useMemo } from 'react';
import { useThemeStore } from '../stores/themeStore';
import { useTradesStore } from '../stores/tradesStore';
import { useAppStore } from '../stores/appStore';
import { usePricesStore } from '../stores/pricesStore';
import { useLivePositions } from '../hooks/useLivePositions';
import { theme } from '../utils/cn';

interface PortfolioOverviewProps {
  depositAmount?: number;
  backendSummary?: {
    totalEquity?: number;
    lockedMargin?: number;
    totalVolume?: number;
    cashUsd?: number;
    unrealizedPnL?: number;
  } | null;
}

export default function PortfolioOverview({ depositAmount = 0, backendSummary = null }: PortfolioOverviewProps) {
  const { theme: currentTheme, colors } = useThemeStore();
  const { positions, history } = useTradesStore();
  const { exchangeAllocations, selectedExchanges, activeMarketMakerStrategies } = useAppStore();
  const { prices, getPrice } = usePricesStore();
  const isDark = currentTheme === 'dark';
  const [positionsTab, setPositionsTab] = useState<'positions' | 'openOrders' | 'twap' | 'tradeHistory' | 'fundingHistory' | 'orderHistory' | 'interest' | 'withdrawsDeposits'>('positions');
  
  // Get live positions with real-time PNL
  const { positions: livePositions, totalPnl, totalPnlPercent } = useLivePositions();
  
  // Get only open positions from old store (for backwards compatibility)
  const openPositions = positions.filter(p => p.status === 'open');

  // Calculate equity distribution
  const equityStats = useMemo(() => {
    // 1. Unlocked vault equity (depositAmount in vault)
    const unlockedVaultEquity = depositAmount;
    
    // 2. Exchange equity (total funds allocated to exchanges)
    const exchangeEquity = Object.values(exchangeAllocations).reduce((sum, amount) => {
      const safeAmount = Number.isFinite(amount) ? amount : 0;
      return sum + safeAmount;
    }, 0);
    
    // 3. Locked margin equity (funds locked in open positions + market maker strategies)
    const positionsMargin = openPositions.reduce((sum, position) => {
      const positionValue = position.size * position.entryPrice;
      const leverage = position.leverage || 1;
      // Margin = Position Value / Leverage
      const margin = positionValue / leverage;
      return sum + margin;
    }, 0);
    
    const marketMakerMargin = activeMarketMakerStrategies.reduce((sum, strategy) => {
      return sum + strategy.margin;
    }, 0);
    
    const computedLockedMargin = positionsMargin + marketMakerMargin;
    const lockedMarginEquity =
      computedLockedMargin > 0
        ? computedLockedMargin
        : (backendSummary?.lockedMargin ?? 0);
    
    // 4. Unlocked margin equity (amount in exchanges that is not currently in a position)
    const unlockedMarginEquity = Math.max(0, exchangeEquity - lockedMarginEquity);
    
    // 5. Total equity (vault + exchanges + PnL from old + live positions)
    const oldPnL = openPositions.reduce((sum, position) => sum + (position.pnl || 0), 0);
    const livePnL = totalPnl; // From useLivePositions hook
    const safeOldPnL = Number.isFinite(oldPnL) ? oldPnL : 0;
    const safeLivePnL = Number.isFinite(livePnL) ? livePnL : 0;
    const combinedPnL = safeOldPnL + safeLivePnL;
    const computedTotalEquity = unlockedVaultEquity + exchangeEquity + combinedPnL;
    const safeComputedTotalEquity = Number.isFinite(computedTotalEquity) ? computedTotalEquity : 0;
    const totalEquity =
      safeComputedTotalEquity > 0
        ? safeComputedTotalEquity
        : (backendSummary?.totalEquity ?? 0);
    
    // 6. Calculate total volume from trade history (using volume field which accounts for leverage)
    const computedVolume = history
      .filter(entry => entry.type === 'trade')
      .reduce((sum, entry) => sum + (entry.volume || 0), 0);
    const baseEquity = unlockedVaultEquity + exchangeEquity;
    const totalVolume =
      computedVolume > 0
        ? computedVolume
        : (backendSummary?.totalVolume ?? baseEquity);
    
    return {
      totalEquity,
      unlockedVaultEquity,
      exchangeEquity,
      lockedMarginEquity,
      unlockedMarginEquity,
      totalVolume,
      totalPnL: Math.abs(combinedPnL) > 0 ? combinedPnL : (backendSummary?.unrealizedPnL ?? 0),
    };
  }, [depositAmount, exchangeAllocations, openPositions, activeMarketMakerStrategies, history, totalPnl, backendSummary]);

  // Calculate exchange distribution for selected exchanges only
  const exchangeDistribution = useMemo(() => {
    const colors = ['#ff6b35', '#a855f7', '#06b6d4', '#22c55e', '#eab308', '#f97316'];
    
    // Filter to only show selected exchanges that have allocations
    const selectedExchangesWithFunds = selectedExchanges
      .map(exchange => ({
        name: exchange,
        amount: exchangeAllocations[exchange] || 0,
      }))
      .filter(item => item.amount > 0);
    
    const total = selectedExchangesWithFunds.reduce((sum, item) => sum + item.amount, 0);
    
    // Calculate percentages and assign colors
    const distribution = selectedExchangesWithFunds.map((item, index) => ({
      ...item,
      percentage: total > 0 ? (item.amount / total) * 100 : 0,
      color: colors[index % colors.length],
    }));
    
    return { distribution, total };
  }, [selectedExchanges, exchangeAllocations]);

  return (
    <div className="space-y-3">
      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-3">
        {/* Left Sidebar */}
        <div className="col-span-3 space-y-3">
          {/* Volume */}
          <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-3`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className={`text-label ${colors.text.tertiary}`}>Volume</div>
              <select className={`${colors.bg.tertiary} border ${colors.border.secondary} ${colors.text.primary} rounded-sm px-2 py-1 text-label focus:outline-none`}>
                <option>24H</option>
                <option>1 Week</option>
                <option>1 Month</option>
                <option>All Time</option>
              </select>
            </div>
            <div className={`text-[16px] font-medium ${colors.text.primary} mb-1.5`}>
              {equityStats.totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className={`text-label ${colors.text.tertiary}`}>USD</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-label text-green-400">+100%</span>
            </div>
          </div>

          {/* Exchange Distribution */}
          <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-3`}>
            <div className={`text-label ${colors.text.tertiary} mb-3`}>Exchange Distribution</div>
            {exchangeDistribution.distribution.length > 0 ? (
              <>
                <div className="flex items-center justify-center mb-3 overflow-visible">
                  <svg width="100" height="100" viewBox="0 0 100 100" className="overflow-visible">
                    {/* Dynamically generate pie chart segments */}
                    {(() => {
                      const circumference = 2 * Math.PI * 40;
                      let offset = 0;
                      
                      return exchangeDistribution.distribution.map((item, index) => {
                        const dashLength = (item.percentage / 100) * circumference;
                        const segment = (
                          <circle
                            key={index}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke={item.color}
                            strokeWidth="24"
                            strokeDasharray={`${dashLength} ${circumference}`}
                            strokeDashoffset={-offset}
                            transform="rotate(-90 50 50)"
                          />
                        );
                        offset += dashLength;
                        return segment;
                      });
                    })()}
                  </svg>
                </div>
                <div className="space-y-1.5">
                  {exchangeDistribution.distribution.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-label">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }}></div>
                      <span className={colors.text.secondary}>{item.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className={`text-label ${colors.text.tertiary} text-center py-8`}>
                No exchange allocations
              </div>
            )}
          </div>
        </div>

        {/* Middle Section */}
        <div className={`col-span-5 ${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-3`}>
          <div className="mb-3">
            <div className={`text-label ${colors.text.tertiary}`}>EQUITY DISTRIBUTION</div>
          </div>
          <div className="space-y-0">
            <div className={`flex justify-between py-2 border-b ${colors.border.secondary}`}>
              <span className={`${colors.text.tertiary} text-label`}>total equity</span>
              <span className={`text-label ${colors.text.primary}`}>${equityStats.totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className={`flex justify-between py-2 border-b ${colors.border.secondary}`}>
              <span className={`${colors.text.tertiary} text-label`}>unlocked vault equity</span>
              <span className={`text-label ${colors.text.primary}`}>${equityStats.unlockedVaultEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className={`flex justify-between py-2 border-b ${colors.border.secondary}`}>
              <span className={`${colors.text.tertiary} text-label`}>exchange equity</span>
              <span className={`text-label ${colors.text.primary}`}>${equityStats.exchangeEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className={`flex justify-between py-2 border-b ${colors.border.secondary}`}>
              <span className={`${colors.text.tertiary} text-label`}>locked margin equity</span>
              <span className={`text-label ${colors.text.primary}`}>${equityStats.lockedMarginEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className={`${colors.text.tertiary} text-label`}>unlocked margin equity</span>
              <span className={`text-label ${colors.text.primary}`}>${equityStats.unlockedMarginEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Right Chart Section */}
        <div className={`col-span-4 ${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-3`}>
          <div className="flex gap-1.5 mb-3 justify-between items-center">
            <button className="px-2.5 py-1 bg-orange-600 text-white text-label rounded-sm">PNL</button>
            <div className="relative">
              <select className={`${colors.bg.tertiary} border ${colors.border.secondary} ${colors.text.primary} rounded-sm px-2.5 py-1.5 text-label focus:outline-none`}>
                <option>24H</option>
                <option>1 Week</option>
                <option>1 Month</option>
                <option>1 Year</option>
                <option>All Time</option>
              </select>
            </div>
          </div>
          <div className="relative h-40">
            {/* Y-axis */}
            <div className={`absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[9px] ${colors.text.tertiary}`}>
              <span>40</span>
              <span>20</span>
              <span>0</span>
              <span>-20</span>
            </div>
            
            {/* Chart */}
            <div className="ml-6 h-full">
              <svg className="w-full h-full" viewBox="0 0 400 180" preserveAspectRatio="none">
                {/* Grid lines */}
                <line x1="0" y1="45" x2="400" y2="45" stroke={isDark ? "#2a2a2a" : "#e5e7eb"} strokeWidth="0.5"/>
                <line x1="0" y1="90" x2="400" y2="90" stroke={isDark ? "#2a2a2a" : "#e5e7eb"} strokeWidth="0.5"/>
                <line x1="0" y1="135" x2="400" y2="135" stroke={isDark ? "#2a2a2a" : "#e5e7eb"} strokeWidth="0.5"/>
                
                {/* Line chart */}
                <polyline
                  points="0,90 50,80 100,80 150,85 200,85 250,85 300,70 350,40 400,30"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Positions Section */}
      <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm`}>
        {/* Tabs */}
        <div className={`flex gap-6 px-3 pt-2 border-b ${colors.border.secondary} overflow-x-auto`}>
          <button 
            onClick={() => setPositionsTab('positions')}
            className={`pb-1.5 text-label whitespace-nowrap ${
              positionsTab === 'positions' 
                ? 'text-orange-600 border-b-2 border-orange-600' 
                : colors.text.tertiary + ' ' + colors.text.hoverPrimary
            }`}
          >
            Balances
          </button>
          <button 
            onClick={() => setPositionsTab('openOrders')}
            className={`pb-1.5 text-label whitespace-nowrap ${
              positionsTab === 'openOrders' 
                ? 'text-orange-600 border-b-2 border-orange-600' 
                : colors.text.tertiary + ' ' + colors.text.hoverPrimary
            }`}
          >
            Positions
          </button>
          <button 
            onClick={() => setPositionsTab('tradeHistory')}
            className={`pb-1.5 text-label whitespace-nowrap ${
              positionsTab === 'tradeHistory' 
                ? 'text-orange-600 border-b-2 border-orange-600' 
                : colors.text.tertiary + ' ' + colors.text.hoverPrimary
            }`}
          >
            Trade History
          </button>
          <button 
            onClick={() => setPositionsTab('fundingHistory')}
            className={`pb-1.5 text-label whitespace-nowrap ${
              positionsTab === 'fundingHistory' 
                ? 'text-orange-600 border-b-2 border-orange-600' 
                : colors.text.tertiary + ' ' + colors.text.hoverPrimary
            }`}
          >
            Funding History
          </button>
          <button 
            onClick={() => setPositionsTab('interest')}
            className={`pb-1.5 text-label whitespace-nowrap ${
              positionsTab === 'interest' 
                ? 'text-orange-600 border-b-2 border-orange-600' 
                : colors.text.tertiary + ' ' + colors.text.hoverPrimary
            }`}
          >
            Rebalancing
          </button>
          <button 
            onClick={() => setPositionsTab('withdrawsDeposits')}
            className={`pb-1.5 text-label whitespace-nowrap ${
              positionsTab === 'withdrawsDeposits' 
                ? 'text-orange-600 border-b-2 border-orange-600' 
                : colors.text.tertiary + ' ' + colors.text.hoverPrimary
            }`}
          >
            Deposits & Withdrawals
          </button>
        </div>

        {/* Tab Content */}
        <div className="overflow-x-auto">
          {positionsTab === 'withdrawsDeposits' && (
            <table className="w-full">
              <thead>
                <tr className={`border-b ${colors.border.secondary}`}>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal`}>Time</th>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal`}>Status</th>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal`}>Action</th>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal`}>Source</th>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal`}>Destination</th>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal`}>Account Value Change</th>
                  <th className={`text-right px-3 py-1.5 text-label ${colors.text.tertiary} font-normal`}>Fee</th>
                </tr>
              </thead>
              <tbody>
                <tr className={`border-b ${colors.border.secondary} hover:${colors.bg.subtle} transition-colors`}>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>2025-01-13 14:32</td>
                  <td className={`px-3 py-1.5 text-label text-green-400 whitespace-nowrap`}>Completed</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.primary} whitespace-nowrap`}>Deposit</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>HyperEVM</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>Hyperliquid</td>
                  <td className={`px-3 py-1.5 text-left text-label text-green-400 whitespace-nowrap`}>+5,000.00 USDC</td>
                  <td className={`px-3 py-1.5 text-right text-label ${colors.text.secondary} whitespace-nowrap`}>0.00 USDC</td>
                </tr>
                <tr className={`border-b ${colors.border.secondary} hover:${colors.bg.subtle} transition-colors`}>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>2025-01-13 14:30</td>
                  <td className={`px-3 py-1.5 text-label text-green-400 whitespace-nowrap`}>Completed</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.primary} whitespace-nowrap`}>Transfer</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>Bitfrost Vault</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>Paradex</td>
                  <td className={`px-3 py-1.5 text-left text-label text-green-400 whitespace-nowrap`}>+5,000.00 USDC</td>
                  <td className={`px-3 py-1.5 text-right text-label ${colors.text.secondary} whitespace-nowrap`}>0.00 USDC</td>
                </tr>
                <tr className={`border-b ${colors.border.secondary} hover:${colors.bg.subtle} transition-colors`}>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>2025-01-12 09:15</td>
                  <td className={`px-3 py-1.5 text-label text-yellow-400 whitespace-nowrap`}>Pending</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.primary} whitespace-nowrap`}>Withdrawal</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>Hyperliquid</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>HyperEVM</td>
                  <td className={`px-3 py-1.5 text-left text-label text-red-400 whitespace-nowrap`}>-1,000.00 USDC</td>
                  <td className={`px-3 py-1.5 text-right text-label ${colors.text.secondary} whitespace-nowrap`}>0.50 USDC</td>
                </tr>
                <tr className={`border-b ${colors.border.secondary} hover:${colors.bg.subtle} transition-colors`}>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>2025-01-11 16:45</td>
                  <td className={`px-3 py-1.5 text-label text-green-400 whitespace-nowrap`}>Completed</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.primary} whitespace-nowrap`}>Deposit</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>HyperEVM</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>Paradex</td>
                  <td className={`px-3 py-1.5 text-left text-label text-green-400 whitespace-nowrap`}>+2,500.00 USDC</td>
                  <td className={`px-3 py-1.5 text-right text-label ${colors.text.secondary} whitespace-nowrap`}>0.00 USDC</td>
                </tr>
                <tr className={`hover:${colors.bg.subtle} transition-colors`}>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>2025-01-10 11:20</td>
                  <td className={`px-3 py-1.5 text-label text-green-400 whitespace-nowrap`}>Completed</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.primary} whitespace-nowrap`}>Deposit</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>HyperEVM</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>Hyperliquid</td>
                  <td className={`px-3 py-1.5 text-left text-label text-green-400 whitespace-nowrap`}>+3,000.00 USDC</td>
                  <td className={`px-3 py-1.5 text-right text-label ${colors.text.secondary} whitespace-nowrap`}>0.00 USDC</td>
                </tr>
              </tbody>
            </table>
          )}
          {positionsTab === 'positions' && (
            <table className="w-full">
              <thead>
                <tr className={`border-b ${colors.border.secondary}`}>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal`}>Coin</th>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal`}>Exchange</th>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal`}>Total Balance</th>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal`}>Available Balance</th>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal`}>USDC Value</th>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal`}>PNL (ROE %)</th>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal`}>Exchange</th>
                </tr>
              </thead>
              <tbody>
                <tr className={`border-b ${colors.border.secondary} hover:${colors.bg.subtle} transition-colors`}>
                  <td className={`px-3 py-1.5 text-label ${colors.text.primary} whitespace-nowrap`}>USDC</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>Hyperliquid</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>61.63 USDC</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>61.63 USDC</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>$61.63</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>-</td>
                  <td className={`px-3 py-1.5 text-label whitespace-nowrap`}>
                    <button className="text-cyan-400 hover:text-cyan-300">Paradex</button>
                  </td>
                </tr>
                <tr className={`border-b ${colors.border.secondary} hover:${colors.bg.subtle} transition-colors`}>
                  <td className={`px-3 py-1.5 text-label ${colors.text.primary} whitespace-nowrap`}>BZEC</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>Paradex</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>0.13964481 BZEC</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>0.13964481 BZEC</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>$56.43</td>
                  <td className={`px-3 py-1.5 text-label text-red-400 whitespace-nowrap`}>-$14.90 (-20.9%)</td>
                  <td className={`px-3 py-1.5 text-label whitespace-nowrap`}>
                    <button className="text-cyan-400 hover:text-cyan-300">Hyperliquid</button>
                  </td>
                </tr>
                <tr className={`hover:${colors.bg.subtle} transition-colors`}>
                  <td className={`px-3 py-1.5 text-label ${colors.text.primary} whitespace-nowrap`}>HYPE</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>Hyperliquid</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>0.30924518 HYPE</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>0.30924518 HYPE</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>$7.49</td>
                  <td className={`px-3 py-1.5 text-label text-red-400 whitespace-nowrap`}>-$0.96 (-11.4%)</td>
                  <td className={`px-3 py-1.5 text-label whitespace-nowrap`}>
                    <button className="text-cyan-400 hover:text-cyan-300">Paradex</button>
                  </td>
                </tr>
              </tbody>
            </table>
          )}
          {positionsTab === 'openOrders' && (
            <table className="w-full">
              <thead>
                <tr className={`border-b ${colors.border.secondary}`}>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Exchange</th>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Token</th>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Type</th>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Size</th>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Entry Price</th>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Current Price</th>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>PnL</th>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Source</th>
                </tr>
              </thead>
              <tbody>
                {/* Show positions from new positionsStore with live PNL */}
                {livePositions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className={`px-3 py-6 text-center text-label ${colors.text.tertiary}`}>
                      No open positions
                    </td>
                  </tr>
                ) : (
                  livePositions.map(({ position, pnl }) => {
                    const currentPrice = getPrice(position.token);
                    const isProfit = pnl ? pnl.totalPnl >= 0 : false;
                    
                    // Display position info (if multi-leg arbitrage, show both legs)
                    return position.legs.map((leg, legIndex) => {
                      // Calculate leg-specific metrics
                      const legNotional = leg.quantity * leg.entryPrice;
                      const legCurrentValue = leg.quantity * (currentPrice || leg.entryPrice);
                      
                      // Calculate PNL for this specific leg
                      let legPnl = 0;
                      if (currentPrice) {
                        if (leg.side === 'long') {
                          legPnl = (currentPrice - leg.entryPrice) * leg.quantity;
                        } else {
                          legPnl = (leg.entryPrice - currentPrice) * leg.quantity;
                        }
                      }
                      const legPnlPercent = legNotional > 0 ? (legPnl / legNotional) * 100 : 0;
                      const legIsProfit = legPnl >= 0;
                      
                      return (
                        <tr key={`${position.id}-${leg.id}`} className={`border-b ${colors.border.secondary} hover:${colors.bg.subtle} transition-colors`}>
                          <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>{leg.exchange}</td>
                          <td className={`px-3 py-1.5 text-label ${colors.text.primary} whitespace-nowrap`}>{position.token}-PERP</td>
                          <td className={`px-3 py-1.5 text-label whitespace-nowrap`}>
                            <span className={leg.side === 'long' ? 'text-green-400' : 'text-red-400'}>
                              {leg.side.toUpperCase()}
                            </span>
                          </td>
                          <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>
                            ${legNotional.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>
                            ${leg.entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>
                            ${(currentPrice || leg.entryPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className={`px-3 py-1.5 text-label whitespace-nowrap`}>
                            <span className={legIsProfit ? 'text-green-400' : 'text-red-400'}>
                              {legIsProfit ? '+' : ''}${legPnl.toFixed(2)} ({legIsProfit ? '+' : ''}{legPnlPercent.toFixed(2)}%)
                            </span>
                          </td>
                          <td className={`px-3 py-1.5 text-label ${colors.text.tertiary} whitespace-nowrap capitalize`}>
                            {legIndex === 0 && position.legs.length > 1 ? 'Arbitrage' : 'Aggregator'}
                          </td>
                        </tr>
                      );
                    });
                  }).flat()
                )}
                
                {/* Also show old positions from tradesStore for backwards compatibility */}
                {openPositions.map((position) => {
                  const pnl = position.pnl || 0;
                  const pnlPercent = position.pnlPercent || 0;
                  const isProfit = pnl >= 0;
                  
                  return (
                    <tr key={position.id} className={`border-b ${colors.border.secondary} hover:${colors.bg.subtle} transition-colors`}>
                      <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>{position.exchange}</td>
                      <td className={`px-3 py-1.5 text-label ${colors.text.primary} whitespace-nowrap`}>{position.token}-PERP</td>
                      <td className={`px-3 py-1.5 text-label whitespace-nowrap`}>
                        <span className={position.type === 'long' ? 'text-green-400' : 'text-red-400'}>
                          {position.type.toUpperCase()}
                        </span>
                      </td>
                      <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>
                        ${(position.size * position.entryPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>
                        ${position.entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>
                        ${(position.currentPrice || position.entryPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className={`px-3 py-1.5 text-label whitespace-nowrap`}>
                        <span className={isProfit ? 'text-green-400' : 'text-red-400'}>
                          {isProfit ? '+' : ''}${pnl.toFixed(2)} ({isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%)
                        </span>
                      </td>
                      <td className={`px-3 py-1.5 text-label ${colors.text.tertiary} whitespace-nowrap capitalize`}>
                        {position.source}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {positionsTab === 'tradeHistory' && (
            <table className="w-full">
              <thead>
                <tr className={`border-b ${colors.border.secondary}`}>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Time</th>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Action</th>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Exchange</th>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Token</th>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Amount</th>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Status</th>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>PnL</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={`px-3 py-6 text-center text-label ${colors.text.tertiary}`}>
                      No trade history
                    </td>
                  </tr>
                ) : (
                  history.map((entry) => (
                    <tr key={entry.id} className={`border-b ${colors.border.secondary} hover:${colors.bg.subtle} transition-colors`}>
                      <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>
                        {new Date(entry.timestamp).toLocaleString('en-US', { 
                          month: '2-digit', 
                          day: '2-digit', 
                          year: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false 
                        })}
                      </td>
                      <td className={`px-3 py-1.5 text-label ${colors.text.primary} whitespace-nowrap`}>{entry.action}</td>
                      <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>{entry.exchange || '-'}</td>
                      <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>{entry.token || '-'}</td>
                      <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>
                        {entry.amount ? `${entry.amount.toFixed(4)}` : '-'}
                      </td>
                      <td className={`px-3 py-1.5 text-label whitespace-nowrap`}>
                        <span className={
                          entry.status === 'completed' ? 'text-green-400' :
                          entry.status === 'pending' ? 'text-yellow-400' :
                          'text-red-400'
                        }>
                          {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                        </span>
                      </td>
                      <td className={`px-3 py-1.5 text-label whitespace-nowrap`}>
                        {entry.pnl !== undefined ? (
                          <span className={entry.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {entry.pnl >= 0 ? '+' : ''}${entry.pnl.toFixed(2)}
                          </span>
                        ) : (
                          <span className={colors.text.tertiary}>-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
          {positionsTab === 'fundingHistory' && (
            <table className="w-full">
              <thead>
                <tr className={`border-b ${colors.border.secondary}`}>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Time ↓</th>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Coin</th>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Size</th>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Position Side</th>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Payment</th>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr className={`border-b ${colors.border.secondary} hover:${colors.bg.subtle} transition-colors`}>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>04/01/2026 - 22:00:00</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.primary} whitespace-nowrap`}>BTC</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>0.01751 BTC</td>
                  <td className={`px-3 py-1.5 text-label text-green-400 whitespace-nowrap`}>Long</td>
                  <td className={`px-3 py-1.5 text-label text-red-400 whitespace-nowrap`}>-$0.0129</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>0.0008%</td>
                </tr>
                <tr className={`border-b ${colors.border.secondary} hover:${colors.bg.subtle} transition-colors`}>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>04/01/2026 - 21:00:00</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.primary} whitespace-nowrap`}>BTC</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>0.00317 BTC</td>
                  <td className={`px-3 py-1.5 text-label text-green-400 whitespace-nowrap`}>Long</td>
                  <td className={`px-3 py-1.5 text-label text-red-400 whitespace-nowrap`}>-$0.0030</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>0.001%</td>
                </tr>
                <tr className={`border-b ${colors.border.secondary} hover:${colors.bg.subtle} transition-colors`}>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>04/01/2026 - 20:00:00</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.primary} whitespace-nowrap`}>BTC</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>0.01459 BTC</td>
                  <td className={`px-3 py-1.5 text-label text-green-400 whitespace-nowrap`}>Long</td>
                  <td className={`px-3 py-1.5 text-label text-red-400 whitespace-nowrap`}>-$0.0118</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>0.0009%</td>
                </tr>
                <tr className={`border-b ${colors.border.secondary} hover:${colors.bg.subtle} transition-colors`}>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>04/01/2026 - 18:00:00</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.primary} whitespace-nowrap`}>BTC</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>0.01459 BTC</td>
                  <td className={`px-3 py-1.5 text-label text-green-400 whitespace-nowrap`}>Long</td>
                  <td className={`px-3 py-1.5 text-label text-red-400 whitespace-nowrap`}>-$0.0133</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>0.001%</td>
                </tr>
                <tr className={`border-b ${colors.border.secondary} hover:${colors.bg.subtle} transition-colors`}>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>04/01/2026 - 16:00:00</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.primary} whitespace-nowrap`}>BTC</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>0.01520 BTC</td>
                  <td className={`px-3 py-1.5 text-label text-red-400 whitespace-nowrap`}>Short</td>
                  <td className={`px-3 py-1.5 text-label text-green-400 whitespace-nowrap`}>$0.0120</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>0.0009%</td>
                </tr>
                <tr className={`hover:${colors.bg.subtle} transition-colors`}>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>04/01/2026 - 17:00:00</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.primary} whitespace-nowrap`}>BTC</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>0.01520 BTC</td>
                  <td className={`px-3 py-1.5 text-label text-red-400 whitespace-nowrap`}>Short</td>
                  <td className={`px-3 py-1.5 text-label text-green-400 whitespace-nowrap`}>$0.0095</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>0.0007%</td>
                </tr>
              </tbody>
            </table>
          )}
          {positionsTab === 'interest' && (
            <table className="w-full">
              <thead>
                <tr className={`border-b ${colors.border.secondary}`}>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>time</th>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>From</th>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>To</th>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>amount</th>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Order</th>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Previous Margin</th>
                  <th className={`text-left px-3 py-1.5 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Corrected Margin</th>
                </tr>
              </thead>
              <tbody>
                <tr className={`border-b ${colors.border.secondary} hover:${colors.bg.subtle} transition-colors`}>
                  <td className={`px-3 py-1.5 text-label ${colors.text.tertiary} whitespace-nowrap`}>14:32:15</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>Paradex</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>Hyperliquid</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>$3.42</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.primary} whitespace-nowrap`}>BTC-PERP-USDC</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>0.0823</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>0.0715</td>
                </tr>
                <tr className={`border-b ${colors.border.secondary} hover:${colors.bg.subtle} transition-colors`}>
                  <td className={`px-3 py-1.5 text-label ${colors.text.tertiary} whitespace-nowrap`}>13:47:08</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>Paradex</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>Hyperliquid</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>$4.87</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.primary} whitespace-nowrap`}>BTC-PERP-USDC</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>0.0698</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>0.0742</td>
                </tr>
                <tr className={`hover:${colors.bg.subtle} transition-colors`}>
                  <td className={`px-3 py-1.5 text-label ${colors.text.tertiary} whitespace-nowrap`}>11:23:42</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>Paradex</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>Hyperliquid</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>$2.15</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.primary} whitespace-nowrap`}>BTC-PERP-USDC</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>0.0756</td>
                  <td className={`px-3 py-1.5 text-label ${colors.text.secondary} whitespace-nowrap`}>0.0681</td>
                </tr>
              </tbody>
            </table>
          )}
          {positionsTab !== 'positions' && positionsTab !== 'withdrawsDeposits' && positionsTab !== 'openOrders' && positionsTab !== 'fundingHistory' && positionsTab !== 'interest' && positionsTab !== 'tradeHistory' && (
            <div className={`p-6 text-center ${colors.text.tertiary} text-label`}>
              No data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
