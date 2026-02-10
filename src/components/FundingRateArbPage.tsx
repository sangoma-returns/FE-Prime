import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useState, useEffect, useMemo } from 'react';
import { useThemeStore } from '../stores/themeStore';
import { useTradesStore } from '../stores/tradesStore';
import { useAppStore } from '../stores/appStore';
import { usePricesStore } from '../stores/pricesStore';
import { useFundingRatesStore } from '../stores/fundingRatesStore';
import { usePositionsStore } from '../stores/positionsStore';
import { useLivePositions } from '../hooks/useLivePositions';
import { useFundingRateHistory } from '../hooks/useFundingRateHistory';
import ExchangePairSelector from './ExchangePairSelector';
import { MultiOrderConfirmation } from './MultiOrderConfirmation';
import { OrdersSection } from './AggregatorPageOrders';
import type { CreateOrderRequest } from '../types';
import { calculateFundingReturns, generateSimulatedFundingRates, formatReturn } from '../utils/fundingRateCalculations';
import { FundingRateArbChart } from './FundingRateArbChart';

interface FundingRateArbPageProps {
  enabledExchanges?: string[];
  onCreateOrder?: (orderData: CreateOrderRequest) => void;
  preselectedTrade?: {
    buyToken: string;
    buyExchange: string;
    sellToken: string;
    sellExchange: string;
  } | null;
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
  onOpenTransfer?: () => void;
  onNavigate?: (page: 'portfolio' | 'explore' | 'aggregator' | 'funding-arb' | 'market-maker' | 'more') => void;
}

export default function FundingRateArbPage({ enabledExchanges = [], onCreateOrder, preselectedTrade, onOpenDeposit, onOpenWithdraw, onOpenTransfer, onNavigate }: FundingRateArbPageProps) {
  const { theme, colors } = useThemeStore();
  const { addTrade, addOrder, addHistoryEntry } = useTradesStore();
  const openOrders = useTradesStore((state) => state.openOrders);
  const positions = useTradesStore((state) => state.positions);
  const { depositAmount, exchangeAllocations, activeMarketMakerStrategies } = useAppStore();
  const { getPrice } = usePricesStore();
  const { addPosition } = usePositionsStore();
  const { getRate: getFundingRate } = useFundingRatesStore();
  const { positions: livePositions, totalPnl } = useLivePositions();
  const isDark = theme === 'dark';
  
  const [activeTabOrders, setActiveTabOrders] = useState('openOrders');
  const [duration, setDuration] = useState('15');
  const [timeframe, setTimeframe] = useState('Europe/London UTC+00');
  const [exposure, setExposure] = useState(50);
  const [passiveness, setPassiveness] = useState(50);
  const [discretion, setDiscretion] = useState(50);
  const [alphaTilt, setAlphaTilt] = useState(70);
  const [directionalBias, setDirectionalBias] = useState(65);
  const [clipSize, setClipSize] = useState('');
  
  const [selectedBuyAccount, setSelectedBuyAccount] = useState('');
  const [selectedBuyPair, setSelectedBuyPair] = useState('');
  const [buyQuantity, setBuyQuantity] = useState('');
  const [buyLeverage, setBuyLeverage] = useState('');
  
  const [selectedSellAccount, setSelectedSellAccount] = useState('');
  const [selectedSellPair, setSelectedSellPair] = useState('');
  const [sellQuantity, setSellQuantity] = useState('');
  const [sellLeverage, setSellLeverage] = useState('');
  
  const [showBuyExchangeSelector, setShowBuyExchangeSelector] = useState(false);
  const [showBuyPairSelector, setShowBuyPairSelector] = useState(false);
  const [showSellExchangeSelector, setShowSellExchangeSelector] = useState(false);
  const [showSellPairSelector, setShowSellPairSelector] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [activeStrategies, setActiveStrategies] = useState({
    passiveOnly: false,
    activeLimit: false,
    hedgeOnly: false,
    colPause: false,
    softPause: false,
    strictDuration: false,
  });

  const [activeTab, setActiveTab] = useState<'openOrders' | 'rebalancing' | 'fundingHistory' | 'depositsWithdrawals'>('openOrders');
  const [tradeMode, setTradeMode] = useState<'advanced' | 'automated'>('advanced');
  const [isLoading, setIsLoading] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [timeRange, setTimeRange] = useState<'Day' | 'Week' | 'Month' | 'Year'>('Day');

  // Check if trade is configured
  const isTradeConfigured = selectedBuyAccount && selectedBuyPair && buyQuantity && 
                            selectedSellAccount && selectedSellPair && sellQuantity;

  // Handle loading when all fields are filled
  useEffect(() => {
    if (isTradeConfigured && !showChart && !isLoading) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setShowChart(true);
      }, 1500);
    } else if (!isTradeConfigured) {
      setShowChart(false);
      setIsLoading(false);
    }
  }, [isTradeConfigured, showChart, isLoading]);

  // Preselect trade if provided
  useEffect(() => {
    if (preselectedTrade) {
      setSelectedBuyAccount(preselectedTrade.buyExchange);
      setSelectedBuyPair(preselectedTrade.buyToken);
      setSelectedSellAccount(preselectedTrade.sellExchange);
      setSelectedSellPair(preselectedTrade.sellToken);
    }
  }, [preselectedTrade]);

  // Calculate account equity metrics from global state
  const equityMetrics = useMemo(() => {
    // Get only open positions (old store) - ensure positions is an array
    const positionsArray = Array.isArray(positions) ? positions : [];
    const openPositions = positionsArray.filter(p => p.status === 'open');
    
    // 1. Unlocked vault equity (depositAmount in vault)
    const unlockedVaultEquity = depositAmount;
    
    // 2. Exchange equity (total funds allocated to exchanges)
    const exchangeEquity = Object.values(exchangeAllocations).reduce((sum, amount) => sum + amount, 0);
    
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
    
    const lockedMarginEquity = positionsMargin + marketMakerMargin;
    
    // 4. Total PnL from old positions + NEW live positions
    const oldPnL = openPositions.reduce((sum, position) => sum + (position.pnl || 0), 0);
    const livePnL = totalPnl; // From useLivePositions hook
    const combinedPnL = oldPnL + livePnL;
    
    // 5. Total equity (vault + exchanges + PnL)
    const totalEquity = unlockedVaultEquity + exchangeEquity + combinedPnL;
    
    return {
      totalEquity,
      unlockedVaultEquity,
      exchangeEquity,
      lockedMarginEquity,
      totalPnL: combinedPnL,
    };
  }, [depositAmount, exchangeAllocations, positions, activeMarketMakerStrategies, totalPnl]);

  return (
    <div className="min-h-[calc(100vh-3rem-1px)] pb-6 flex">
      {/* Left Panel */}
      <div className={`flex-1 flex flex-col border-r ${colors.border.primary}`}>
        {/* Header */}
        <div className={`border-b ${colors.border.primary} px-6 py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <h2 className={`text-header ${colors.text.primary}`}>Funding Rate Arbitrage</h2>
            <button className={`text-xs ${colors.text.tertiary} ${colors.text.hoverPrimary}`}>⚙</button>
          </div>
          <div className="flex gap-1">
            {['Day', 'Week', 'Month', 'Year'].map((tab) => (
              <button
                key={tab}
                onClick={() => setTimeRange(tab as 'Day' | 'Week' | 'Month' | 'Year')}
                className={`px-3 py-1 text-button rounded-sm transition-colors ${
                  timeRange === tab
                    ? 'bg-orange-600 text-white'
                    : 'bg-transparent ' + colors.text.tertiary + ' ' + colors.text.hoverPrimary
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className={`flex-1 flex items-center justify-center ${colors.bg.primary} p-6`}>
          {isTradeConfigured ? (
            showChart ? (
              <FundingRateArbChart 
                colors={colors} 
                theme={theme}
                buyAccount={selectedBuyAccount}
                buyPair={selectedBuyPair}
                sellAccount={selectedSellAccount}
                sellPair={selectedSellPair}
                buyQuantity={buyQuantity}
                buyLeverage={buyLeverage}
                sellQuantity={sellQuantity}
                sellLeverage={sellLeverage}
                timeRange={timeRange}
              />
            ) : (
              isLoading ? (
                <p className={`text-body ${colors.text.tertiary}`}>Loading...</p>
              ) : (
                <p className={`text-body ${colors.text.tertiary}`}>Construct a trade to get started</p>
              )
            )
          ) : (
            <p className={`text-body ${colors.text.tertiary}`}>Construct a trade to get started</p>
          )}
        </div>

        {/* Buy/Sell Section */}
        <div className={`border-t ${colors.border.primary} grid grid-cols-2`}>
          {/* Buy */}
          <div className={`border-r ${colors.border.primary} p-4`}>
            <h3 className="text-green-500 text-label mb-4">Buy</h3>
            
            <div className="space-y-3">
              <div>
                <button 
                  onClick={() => setShowBuyExchangeSelector(true)}
                  className={`w-full ${colors.bg.primary} border ${colors.border.secondary} ${colors.text.primary} rounded-sm px-3 py-1.5 text-body text-left focus:outline-none focus:${colors.border.tertiary}`}
                >
                  {selectedBuyAccount ? selectedBuyAccount.charAt(0).toUpperCase() + selectedBuyAccount.slice(1) : 'Select Exchange'}
                </button>
              </div>

              <div>
                <button 
                  onClick={() => setShowBuyPairSelector(true)}
                  disabled={!selectedBuyAccount}
                  className={`w-full ${colors.bg.primary} border ${colors.border.secondary} ${colors.text.primary} rounded-sm px-3 py-1.5 text-body text-left focus:outline-none focus:${colors.border.tertiary} ${
                    !selectedBuyAccount ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {selectedBuyPair ? selectedBuyPair.toUpperCase() : 'Select Pair'}
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={buyQuantity}
                  onChange={(e) => setBuyQuantity(e.target.value)}
                  placeholder="Quantity"
                  className={`flex-1 ${colors.bg.primary} border ${colors.border.secondary} ${colors.text.primary} rounded-sm px-3 py-1.5 text-body focus:outline-none focus:${colors.border.tertiary}`}
                />
                <input
                  type="text"
                  value={buyLeverage ? `${buyLeverage}x` : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    const numValue = parseInt(value) || 0;
                    setBuyLeverage(numValue > 50 ? '50' : value);
                  }}
                  placeholder="Leverage"
                  className={`w-20 ${colors.bg.primary} border ${colors.border.secondary} ${colors.text.primary} rounded-sm px-3 py-1.5 text-body focus:outline-none focus:${colors.border.tertiary}`}
                />
                <button className={`p-1.5 ${colors.bg.primary} border ${colors.border.secondary} rounded-sm ${colors.bg.hover} text-xs`}>
                  ⇄
                </button>
                <button className={`p-1.5 ${colors.bg.primary} border ${colors.border.secondary} rounded-sm ${colors.bg.hover}`}>
                  <span className="text-xs">✖</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sell */}
          <div className="p-4">
            <h3 className="text-red-500 text-label mb-4">Sell</h3>
            
            <div className="space-y-3">
              <div>
                <button 
                  onClick={() => setShowSellExchangeSelector(true)}
                  className={`w-full ${colors.bg.primary} border ${colors.border.secondary} ${colors.text.primary} rounded-sm px-3 py-1.5 text-body text-left focus:outline-none focus:${colors.border.tertiary}`}
                >
                  {selectedSellAccount ? selectedSellAccount.charAt(0).toUpperCase() + selectedSellAccount.slice(1) : 'Select Exchange'}
                </button>
              </div>

              <div>
                <button 
                  onClick={() => setShowSellPairSelector(true)}
                  disabled={!selectedSellAccount}
                  className={`w-full ${colors.bg.primary} border ${colors.border.secondary} ${colors.text.primary} rounded-sm px-3 py-1.5 text-body text-left focus:outline-none focus:${colors.border.tertiary} ${
                    !selectedSellAccount ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {selectedSellPair ? selectedSellPair.toUpperCase() : 'Select Pair'}
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={sellQuantity}
                  onChange={(e) => setSellQuantity(e.target.value)}
                  placeholder="Quantity"
                  className={`flex-1 ${colors.bg.primary} border ${colors.border.secondary} ${colors.text.primary} rounded-sm px-3 py-1.5 text-body focus:outline-none focus:${colors.border.tertiary}`}
                />
                <input
                  type="text"
                  value={sellLeverage ? `${sellLeverage}x` : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    const numValue = parseInt(value) || 0;
                    setSellLeverage(numValue > 50 ? '50' : value);
                  }}
                  placeholder="Leverage"
                  className={`w-20 ${colors.bg.primary} border ${colors.border.secondary} ${colors.text.primary} rounded-sm px-3 py-1.5 text-body focus:outline-none focus:${colors.border.tertiary}`}
                />
                <button className={`p-1.5 ${colors.bg.primary} border ${colors.border.secondary} rounded-sm ${colors.bg.hover} text-xs`}>
                  ⇄
                </button>
                <button className={`p-1.5 ${colors.bg.primary} border ${colors.border.secondary} rounded-sm ${colors.bg.hover}`}>
                  <span className="text-xs">✖</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Open Orders / Rebalancing Section */}
        <OrdersSection activeTab={activeTabOrders} onTabChange={setActiveTabOrders} orders={openOrders} />
      </div>

      {/* Right Panel - Strategy Parameters */}
      <div className={`w-80 ${colors.bg.primary} overflow-y-auto`}>
        <div className="p-2 space-y-2">
          {/* Mode Tabs */}
          <div className={`border-b ${colors.border.secondary} -mx-2 px-2`}>
            <div className="flex gap-0">
              <button
                onClick={() => setTradeMode('advanced')}
                className={`pb-1.5 px-4 text-button transition-colors ${
                  tradeMode === 'advanced'
                    ? colors.text.primary + ' border-b-2 border-orange-600'
                    : colors.text.tertiary + ' ' + colors.text.hoverPrimary
                }`}
              >
                Advanced
              </button>
              <button
                onClick={() => setTradeMode('automated')}
                className={`pb-1.5 px-4 text-button transition-colors ${
                  tradeMode === 'automated'
                    ? colors.text.primary + ' border-b-2 border-orange-600'
                    : colors.text.tertiary + ' ' + colors.text.hoverPrimary
                }`}
              >
                Automated
              </button>
            </div>
          </div>

          {/* Duration Section */}
          <div className="space-y-1">
            <div>
              <label className={`text-label ${colors.text.tertiary} block mb-0.5`}>Duration (min)</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                disabled={tradeMode === 'automated'}
                className={`w-full ${colors.bg.secondary} border ${colors.border.secondary} ${colors.text.primary} rounded-sm px-3 py-1 text-body focus:outline-none focus:${colors.border.tertiary} ${
                  tradeMode === 'automated' ? 'opacity-30 cursor-not-allowed' : ''
                }`}
              />
            </div>

            <div>
              <label className={`text-label ${colors.text.tertiary} block mb-0.5`}>Timeframe</label>
              <select 
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                disabled={tradeMode === 'automated'}
                className={`w-full ${colors.bg.secondary} border ${colors.border.secondary} ${colors.text.primary} rounded-sm px-3 py-1 text-body focus:outline-none focus:${colors.border.tertiary} ${
                  tradeMode === 'automated' ? 'opacity-30 cursor-not-allowed' : ''
                }`}
              >
                <option>Europe/London UTC+00</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-1 ${
                tradeMode === 'automated' ? 'opacity-30' : ''
              }`}>
                <div className={`text-label ${colors.text.quaternary} mb-0.5`}>Time Start (GMT)</div>
                <div className={`text-numeric ${colors.text.primary}`}>03/10/2026 10:57</div>
              </div>
              <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-1 ${
                tradeMode === 'automated' ? 'opacity-30' : ''
              }`}>
                <div className={`text-label ${colors.text.quaternary} mb-0.5`}>Time End (GMT)</div>
                <div className={`text-numeric ${colors.text.primary}`}>03/10/2026 11:12</div>
              </div>
            </div>
          </div>

          {/* Strategy Parameters */}
          <div>
            <h3 className={`text-header ${colors.text.primary} mb-1`}>Strategy Parameters</h3>
            
            <div className={`space-y-1 ${tradeMode === 'automated' ? 'opacity-30 pointer-events-none' : ''}`}>
              <div>
                <label className={`text-label ${colors.text.tertiary} block mb-0.5`}>
                  Exposure Tolerance
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={exposure}
                  onChange={(e) => setExposure(Number(e.target.value))}
                  disabled={tradeMode === 'automated'}
                  className={`w-full h-1 ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'} rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer`}
                />
              </div>

              <div>
                <label className={`text-label ${colors.text.tertiary} block mb-0.5`}>
                  Passiveness
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={passiveness}
                  onChange={(e) => setPassiveness(Number(e.target.value))}
                  disabled={tradeMode === 'automated'}
                  className={`w-full h-1 ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'} rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer`}
                />
              </div>

              <div>
                <label className={`text-label ${colors.text.tertiary} block mb-0.5`}>
                  Discretion
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={discretion}
                  onChange={(e) => setDiscretion(Number(e.target.value))}
                  disabled={tradeMode === 'automated'}
                  className={`w-full h-1 ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'} rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer`}
                />
              </div>

              <div>
                <label className={`text-label ${colors.text.tertiary} block mb-0.5`}>
                  Alpha Tilt
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={alphaTilt}
                  onChange={(e) => setAlphaTilt(Number(e.target.value))}
                  disabled={tradeMode === 'automated'}
                  className={`w-full h-1 ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'} rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer`}
                />
              </div>

              <div>
                <label className={`text-label ${colors.text.tertiary} block mb-0.5`}>
                  Directional Bias
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={directionalBias}
                  onChange={(e) => setDirectionalBias(Number(e.target.value))}
                  disabled={tradeMode === 'automated'}
                  className={`w-full h-1 bg-gradient-to-r ${isDark ? 'from-[#2a2a2a]' : 'from-gray-200'} via-orange-500/50 ${isDark ? 'to-[#2a2a2a]' : 'to-gray-200'} rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer`}
                />
              </div>

              <div>
                <label className={`text-label ${colors.text.tertiary} block mb-0.5`}>Min Clip Size</label>
                <div className={`text-label ${colors.text.quaternary} mb-0.5`}>$ Amounts to book if not yet</div>
                <input
                  type="text"
                  value={clipSize}
                  onChange={(e) => setClipSize(e.target.value)}
                  disabled={tradeMode === 'automated'}
                  className={`w-full ${colors.bg.secondary} border ${colors.border.secondary} ${colors.text.primary} rounded-sm px-3 py-1 text-body focus:outline-none focus:${colors.border.tertiary}`}
                />
              </div>
            </div>

            {/* Strategy Checkboxes */}
            <div className={`mt-1.5 space-y-0.5 ${tradeMode === 'automated' ? 'opacity-30 pointer-events-none' : ''}`}>
              {Object.entries(activeStrategies).map(([key, value]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setActiveStrategies({ ...activeStrategies, [key]: e.target.checked })}
                    className={`w-3 h-3 rounded-sm border ${colors.border.secondary} ${colors.bg.secondary} checked:bg-orange-600 checked:border-orange-600`}
                  />
                  <span className={`text-label ${colors.text.tertiary} ${colors.text.hoverPrimary}`}>
                    {key === 'passiveOnly' && 'Passive Only'}
                    {key === 'activeLimit' && 'Active Limit'}
                    {key === 'hedgeOnly' && 'Reduce Only'}
                    {key === 'colPause' && 'COL Pause'}
                    {key === 'softPause' && 'Soft Pause'}
                    {key === 'strictDuration' && 'Strict Duration'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Pre-Trade Analytics */}
          <div className={`pt-2 border-t ${colors.border.primary}`}>
            <label className="flex items-center gap-2 mb-2 cursor-pointer">
              <input type="checkbox" className={`w-3 h-3 rounded-sm border ${colors.border.secondary} ${colors.bg.secondary}`} />
              <span className={`text-header ${colors.text.primary}`}>Pre-Trade Analytics</span>
            </label>
            
            <div className="space-y-1 text-numeric">
              <div className="flex justify-between">
                <span className={colors.text.tertiary}>Net Notional</span>
                <span className={colors.text.primary}>
                  ${(() => {
                    const buyQty = parseFloat(buyQuantity) || 0;
                    const sellQty = parseFloat(sellQuantity) || 0;
                    const buyLev = parseFloat(buyLeverage) || 1;
                    const sellLev = parseFloat(sellLeverage) || 1;
                    const netNotional = (buyQty * buyLev) + (sellQty * sellLev);
                    return netNotional.toFixed(2);
                  })()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={colors.text.tertiary}>Participation Rate:</span>
                <span className={colors.text.primary}>0.00000%</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-1.5">
            <button className="w-full bg-green-600 hover:bg-green-700 text-white py-1.5 rounded-sm text-button transition-colors" onClick={() => setShowConfirmation(true)}>
              Submit Multi Order
            </button>
            <button className={`w-full bg-transparent border ${colors.border.secondary} ${colors.bg.hover} ${colors.text.tertiary} py-1.5 rounded-sm text-button transition-colors`}>
              Reset Default
            </button>
          </div>

          {/* Account Section */}
          <div className={`pt-6 border-t ${colors.border.primary} mt-6`}>
            {/* Action Buttons */}
            <div className="flex gap-2 mb-3">
              <button 
                onClick={onOpenDeposit}
                className={`flex-1 px-3 py-1.5 bg-[#C9A36A] border border-[#C9A36A] text-white rounded-sm text-label hover:bg-[#B8926A] transition-colors`}
              >
                Deposit
              </button>
              <button 
                onClick={onOpenWithdraw}
                className={`flex-1 px-3 py-1.5 ${colors.bg.tertiary} border ${colors.border.secondary} ${colors.text.primary} rounded-sm text-label hover:${colors.bg.hover} transition-colors`}
              >
                Withdraw
              </button>
              <button 
                onClick={onOpenTransfer}
                className={`flex-1 px-3 py-1.5 ${colors.bg.tertiary} border ${colors.border.secondary} ${colors.text.primary} rounded-sm text-label hover:${colors.bg.hover} transition-colors`}
              >
                Transfer
              </button>
            </div>

            <h3 className={`text-header ${colors.text.primary} mb-2`}>Account</h3>
            
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className={`text-label ${colors.text.tertiary}`}>total equity</span>
                <span className={`text-label ${colors.text.primary}`}>${equityMetrics.totalEquity.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className={`text-label ${colors.text.tertiary}`}>unlocked vault equity</span>
                <span className={`text-label ${colors.text.primary}`}>${equityMetrics.unlockedVaultEquity.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className={`text-label ${colors.text.tertiary}`}>exchange equity</span>
                <span className={`text-label ${colors.text.primary}`}>${equityMetrics.exchangeEquity.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className={`text-label ${colors.text.tertiary}`}>locked margin equity</span>
                <span className={`text-label ${colors.text.primary}`}>${equityMetrics.lockedMarginEquity.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      {showBuyExchangeSelector && (
        <ExchangePairSelector
          mode="exchange"
          enabledExchanges={enabledExchanges}
          onSelect={(exchange, pair) => {
            setSelectedBuyAccount(exchange);
            if (pair) setSelectedBuyPair(pair);
          }}
          onClose={() => setShowBuyExchangeSelector(false)}
        />
      )}
      
      {showBuyPairSelector && (
        <ExchangePairSelector
          mode="pair"
          currentExchange={selectedBuyAccount}
          enabledExchanges={enabledExchanges}
          onSelect={(exchange, pair) => setSelectedBuyPair(pair)}
          onClose={() => setShowBuyPairSelector(false)}
        />
      )}
      
      {showSellExchangeSelector && (
        <ExchangePairSelector
          mode="exchange"
          enabledExchanges={enabledExchanges}
          onSelect={(exchange, pair) => {
            setSelectedSellAccount(exchange);
            if (pair) setSelectedSellPair(pair);
          }}
          onClose={() => setShowSellExchangeSelector(false)}
        />
      )}
      
      {showSellPairSelector && (
        <ExchangePairSelector
          mode="pair"
          currentExchange={selectedSellAccount}
          enabledExchanges={enabledExchanges}
          onSelect={(exchange, pair) => setSelectedSellPair(pair)}
          onClose={() => setShowSellPairSelector(false)}
        />
      )}
      
      {showConfirmation && (
        <MultiOrderConfirmation
          buyAccount={selectedBuyAccount}
          buyPair={selectedBuyPair}
          buyQuantity={buyQuantity}
          buyLeverage={buyLeverage}
          sellAccount={selectedSellAccount}
          sellPair={selectedSellPair}
          sellQuantity={sellQuantity}
          sellLeverage={sellLeverage}
          duration={duration}
          exposure={exposure}
          passiveness={passiveness}
          discretion={discretion}
          alphaTilt={alphaTilt}
          directionalBias={directionalBias}
          clipSize={clipSize}
          passiveOnly={activeStrategies.passiveOnly}
          activeLimit={activeStrategies.activeLimit}
          reduceOnly={activeStrategies.hedgeOnly}
          strictDuration={activeStrategies.strictDuration}
          onClose={() => setShowConfirmation(false)}
          onConfirm={() => {
            // Handle order submission and close confirmation
            setShowConfirmation(false);
            
            // DON'T call onCreateOrder for carry trades - we handle history manually
            // This prevents activeOrder from interfering with the multi trade navigation
            
            // Add to global trades store
            // Extract token correctly: For RWA format "xyz:GOLD", get "GOLD"; for standard "BTC-PERP", get "BTC"
            const buyToken = selectedBuyPair.includes(':') && selectedBuyPair.split(':').length > 1
              ? selectedBuyPair.split(':')[1] // RWA format: "xyz:GOLD" -> "GOLD"
              : (selectedBuyPair.split(':')[0] || selectedBuyPair.split('-')[0] || 'BTC'); // Standard format
            const sellToken = selectedSellPair.includes(':') && selectedSellPair.split(':').length > 1
              ? selectedSellPair.split(':')[1] // RWA format: "xyz:GOLD" -> "GOLD"
              : (selectedSellPair.split(':')[0] || selectedSellPair.split('-')[0] || 'BTC'); // Standard format
            const buyAmount = parseFloat(buyQuantity) || 0;
            const sellAmount = parseFloat(sellQuantity) || 0;
            const buyLev = parseFloat(buyLeverage) || 1;
            const sellLev = parseFloat(sellLeverage) || 1;
            
            // Get actual prices from pricesStore
            let buyPrice = getPrice(buyToken) || 0;
            let sellPrice = getPrice(sellToken) || 0;
            
            // CRITICAL FIX: If prices are 0, use fallback default prices
            // This ensures trades always have valid prices for PNL calculation
            if (buyPrice === 0 || sellPrice === 0) {
              const DEFAULT_PRICES: Record<string, number> = {
                'BTC': 89128,
                'ETH': 3245,
                'SOL': 142,
                'GOLD': 4900,
                'SILVER': 32,
                'COPPER': 4.5,
                'OIL': 75,
              };
              
              const originalBuyPrice = buyPrice;
              const originalSellPrice = sellPrice;
              
              buyPrice = buyPrice || DEFAULT_PRICES[buyToken] || 0;
              sellPrice = sellPrice || DEFAULT_PRICES[sellToken] || 0;
              
              console.warn('⚠️ Missing price data for trade execution - using fallback:', {
                buyToken,
                originalBuyPrice,
                fallbackBuyPrice: buyPrice,
                sellToken,
                originalSellPrice,
                fallbackSellPrice: sellPrice,
              });
            }
            
            console.log('💰 Captured execution prices:', {
              buyToken,
              buyPrice,
              sellToken,
              sellPrice,
              timestamp: new Date().toISOString()
            });
            
            // Calculate leveraged volume
            const buyVolume = buyAmount * buyLev;
            const sellVolume = sellAmount * sellLev;
            const totalVolume = buyVolume + sellVolume;
            
            // Add volume to global state
            useAppStore.getState().addVolume(totalVolume);
            
            // Record carry trade executions in new trades store
            // Long leg
            addTrade({
              exchange: selectedBuyAccount,
              symbol: selectedBuyPair,
              side: 'buy',
              size: buyAmount,
              executionPrice: buyPrice,
              tradingMode: 'carry',
              orderType: 'market',
              notes: `Carry trade long leg (${buyLev}x leverage)`,
            });
            
            // Short leg
            addTrade({
              exchange: selectedSellAccount,
              symbol: selectedSellPair,
              side: 'sell',
              size: sellAmount,
              executionPrice: sellPrice,
              tradingMode: 'carry',
              orderType: 'market',
              notes: `Carry trade short leg (${sellLev}x leverage)`,
            });
            
            // Add ONE combined carry trade order to global trades store (for compatibility)
            addOrder({
              type: 'carry',
              exchange: `${selectedBuyAccount} / ${selectedSellAccount}`,
              token: buyToken,
              size: buyAmount,
              price: buyPrice,
              status: 'pending',
              source: 'carry',
              carryTrade: {
                longExchange: selectedBuyAccount,
                longToken: buyToken,
                longSize: buyAmount,
                shortExchange: selectedSellAccount,
                shortToken: sellToken,
                shortSize: sellAmount,
              },
            });
            
            // Add a single "Multi" history entry for the carry trade
            addHistoryEntry({
              type: 'trade',
              action: `Multi: Long ${buyToken} on ${selectedBuyAccount} / Short ${sellToken} on ${selectedSellAccount}`,
              amount: buyAmount,
              token: buyToken,
              exchange: `${selectedBuyAccount} / ${selectedSellAccount}`,
              status: 'completed',
              volume: totalVolume,
              buyQuantity: buyAmount,
              buyLeverage: buyLev,
              sellQuantity: sellAmount,
              sellLeverage: sellLev,
              buyExchange: selectedBuyAccount,
              sellExchange: selectedSellAccount,
              buyPair: selectedBuyPair, // Add the actual pair
              sellPair: selectedSellPair, // Add the actual pair
              buyPrice: buyPrice, // Add the buy entry price
              sellPrice: sellPrice, // Add the sell entry price
              duration: parseFloat(duration) || 15,
            });
            
            // === CREATE ARBITRAGE POSITION WITH LIVE DATA ===
            const buyFundingRate = getFundingRate(buyToken, selectedBuyAccount) || 0;
            const sellFundingRate = getFundingRate(sellToken, selectedSellAccount) || 0;
            
            const positionId = addPosition({
              token: buyToken,
              legs: [
                {
                  id: `leg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  exchange: selectedBuyAccount,
                  side: 'long',
                  quantity: buyAmount,
                  leverage: buyLev,
                  entryPrice: buyPrice,
                  entryFundingRate: buyFundingRate,
                  timestamp: Date.now(),
                },
                {
                  id: `leg-${Date.now() + 1}-${Math.random().toString(36).substr(2, 9)}`,
                  exchange: selectedSellAccount,
                  side: 'short',
                  quantity: sellAmount,
                  leverage: sellLev,
                  entryPrice: sellPrice,
                  entryFundingRate: sellFundingRate,
                  timestamp: Date.now(),
                },
              ],
              notionalValue: buyAmount + sellAmount, // Base notional (target notional)
              closedAt: null,
              notes: `Funding rate arbitrage: Long ${buyToken} (${buyFundingRate.toFixed(2)}% APR) / Short ${sellToken} (${sellFundingRate.toFixed(2)}% APR)`,
            });
            
            console.log(`✓ Created arbitrage position ${positionId}: Spread = ${Math.abs(buyFundingRate - sellFundingRate).toFixed(2)}% APR`);
            
            // Navigate to Portfolio History page with trade detail view
            if (onNavigate) {
              // Use a single clean navigation call with query params
              window.history.pushState({}, '', '/portfolio?tab=history&trade=multi&detailTab=execution');
              // Trigger a re-render by dispatching the navigation event
              window.dispatchEvent(new CustomEvent('navigation'));
            }
          }}
        />
      )}
    </div>
  );
}