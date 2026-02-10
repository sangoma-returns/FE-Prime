import { useState, useEffect, useMemo } from 'react';
import PortfolioOverview from '../PortfolioOverview';
import PortfolioExchanges from '../PortfolioExchanges';
import TradeHistory from '../TradeHistory';
import MarketMakerPage from '../MarketMakerPage';
import StrategyMonitorPage from '../StrategyMonitorPage';
import { Wallet, TrendingUp, BarChart3, Scale } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import { useAppStore } from '../../stores/appStore';
import { useTradesStore } from '../../stores/tradesStore';
import { useLivePositions } from '../../hooks/useLivePositions';

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

interface PortfolioPageProps {
  hasAccount: boolean;
  depositAmount: number;
  selectedExchanges: string[];
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenTransfer: () => void;
  onConfigureAccounts?: () => void;
  activeOrder?: Order | null;
  onClearActiveOrder?: () => void;
  initialStrategyId?: string;
}

export function PortfolioPage({ hasAccount, depositAmount, selectedExchanges, onOpenDeposit, onOpenWithdraw, onOpenTransfer, onConfigureAccounts, activeOrder, onClearActiveOrder, initialStrategyId }: PortfolioPageProps) {
  const { theme: currentTheme, colors } = useThemeStore();
  const activeMarketMakerStrategies = useAppStore((s) => s.activeMarketMakerStrategies);
  const appStoreExchangeAllocations = useAppStore((s) => s.exchangeAllocations);
  const { positions, history, getTotalPnL } = useTradesStore();
  const { totalPnl: unrealizedPnl, totalPnlPercent } = useLivePositions();
  
  const isDark = currentTheme === 'dark';
  const [activeTab, setActiveTab] = useState<'overview' | 'exchanges' | 'history' | 'marketMaker'>('overview');
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);
  const [breakdownTab, setBreakdownTab] = useState<'venue' | 'asset' | 'strategyType'>('venue');
  const [selectedStrategy, setSelectedStrategy] = useState<{ id: string; name: string } | null>(null);

  // Read URL parameters once on mount
  const [urlDetailTab, setUrlDetailTab] = useState<'status' | 'execution' | 'rebalancing' | null>(null);
  const [urlTradeParam, setUrlTradeParam] = useState<string | null>(null);
  
  // Calculate equity metrics
  const equityMetrics = useMemo(() => {
    // Calculate total exchange equity from allocations
    const exchangeEquity = Object.values(appStoreExchangeAllocations).reduce((sum, amount) => sum + amount, 0);
    
    // Get realized PNL (from closed positions in history)
    const realizedPnl = (history || [])
      .filter(entry => entry.type === 'trade' && entry.pnl !== undefined)
      .reduce((sum, entry) => sum + (entry.pnl || 0), 0);
    
    // Total equity = Deposit + Exchange Allocations + Realized PNL + Unrealized PNL
    const totalEquity = depositAmount + exchangeEquity + realizedPnl + unrealizedPnl;
    
    return {
      totalEquity,
      exchangeEquity,
      realizedPnl,
      unrealizedPnl,
    };
  }, [depositAmount, appStoreExchangeAllocations, history, unrealizedPnl]);

  // Auto-switch to history tab when activeOrder is set
  useEffect(() => {
    if (activeOrder) {
      setActiveTab('history');
    }
  }, [activeOrder]);

  // Auto-switch tab if tab parameter is in URL - runs once on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    const detailTab = urlParams.get('detailTab') as 'status' | 'execution' | 'rebalancing' | null;
    const tradeParam = urlParams.get('trade');
    
    if (tabParam === 'history' || tabParam === 'overview' || tabParam === 'exchanges' || tabParam === 'marketMaker') {
      setActiveTab(tabParam);
    } else if (!tabParam) {
      // If no tab parameter, always reset to overview
      setActiveTab('overview');
    }
    
    if (detailTab) {
      setUrlDetailTab(detailTab);
    }
    
    if (tradeParam) {
      setUrlTradeParam(tradeParam);
      // Clear activeOrder when navigating with URL trade parameter
      // This ensures we show the correct trade type from URL, not a stale activeOrder
      onClearActiveOrder?.();
    }
  }, [onClearActiveOrder]);

  // Auto-open strategy monitor if initialStrategyId is provided
  useEffect(() => {
    if (initialStrategyId && activeMarketMakerStrategies.length > 0) {
      const strategy = activeMarketMakerStrategies.find(s => s.id === initialStrategyId);
      if (strategy) {
        setSelectedStrategy({ id: strategy.id, name: strategy.name });
      }
    }
  }, [initialStrategyId, activeMarketMakerStrategies]);

  // If a strategy is selected, show the monitor page
  if (selectedStrategy) {
    return (
      <StrategyMonitorPage
        strategyId={selectedStrategy.id}
        strategyName={selectedStrategy.name}
        onBack={() => setSelectedStrategy(null)}
      />
    );
  }

  const stats = [
    { 
      label: 'Total Equity', 
      value: hasAccount ? `$${equityMetrics.totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00',
      change: hasAccount ? '+2.4%' : '0%',
      isPositive: true,
      icon: Wallet
    },
    { 
      label: 'PnL', 
      value: hasAccount ? `${equityMetrics.realizedPnl >= 0 ? '+' : ''}$${Math.abs(equityMetrics.realizedPnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00',
      change: '24h',
      isPositive: hasAccount ? (equityMetrics.realizedPnl >= 0 ? true : false) : null,
      icon: TrendingUp
    },
    { 
      label: 'Unrealized PNL', 
      value: hasAccount ? `${equityMetrics.unrealizedPnl >= 0 ? '+' : ''}$${Math.abs(equityMetrics.unrealizedPnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00',
      change: '24h',
      isPositive: hasAccount ? (equityMetrics.unrealizedPnl >= 0 ? true : false) : null,
      icon: BarChart3
    },
    { 
      label: 'Directional Bias', 
      value: '0%',
      change: 'Neutral',
      isPositive: null,
      icon: Scale
    },
  ];

  const totalEquity = 15328;
  
  const exchangeAllocations = selectedExchanges.map((exchange, index) => {
    // Assign specific equity values for each exchange (different amounts)
    let allocation = 0;
    if (exchange === 'Hyperliquid') {
      allocation = 9125.75;
    } else if (exchange === 'Paradex') {
      allocation = 6202.25;
    } else if (exchange === 'Aster') {
      allocation = 4800;
    } else if (exchange === 'Binance') {
      allocation = 5100;
    } else {
      allocation = selectedExchanges.length > 0 ? totalEquity / selectedExchanges.length : 0;
    }

    console.log(`Exchange: ${exchange}, Allocation: ${allocation}`);

    return {
      name: exchange,
      allocation: allocation,
      pnl: index === 0 ? 165 : index === 1 ? -126 : 60,
      pnlPercent: index === 0 ? 4.7 : index === 1 ? -3.8 : 1.9,
      volume: 0,
      positions: 0,
      status: index === 1 ? 'Long' : 'Active',
      updatedAgo: `${3 + index} minutes ago`
    };
  });

  return (
    <div className="h-[calc(100vh-3rem-1px)] overflow-y-auto">
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {!hasAccount ? (
          <>
            <div className="mb-6">
              <h1 className={`text-[15px] font-semibold mb-1 tracking-tight ${colors.text.primary}`}>Portfolio</h1>
              <p className={`${colors.text.tertiary} text-label`}>Manage your Bitfrost account</p>
            </div>

            {/* Stats Grid - Empty State */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div 
                    key={stat.label}
                    className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-3 relative overflow-hidden`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className={`${colors.text.tertiary} text-label`}>{stat.label}</div>
                      <Icon className={`w-3.5 h-3.5 ${colors.text.quaternary}`} />
                    </div>
                    <div className="flex items-end justify-between">
                      <div className={`text-[18px] font-medium ${colors.text.primary}`}>{stat.value}</div>
                      <div className={`text-[9px] ${colors.text.quaternary}`}>
                        {stat.change}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center h-[50vh]">
              <div className="text-center">
                <h2 className={`text-[15px] font-semibold mb-1.5 ${colors.text.secondary}`}>Welcome to Bitfrost</h2>
                <p className={`${colors.text.tertiary} text-label mb-4`}>
                  Connect your wallet and deposit funds to get started
                </p>
                <button
                  onClick={onOpenDeposit}
                  className={`h-8 px-4 ${colors.button.primaryBg} hover:opacity-90 ${colors.button.primaryText} rounded-sm text-label transition-all`}
                >
                  Deposit
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className={`text-[15px] font-semibold mb-1 tracking-tight ${colors.text.primary}`}>Portfolio</h1>
                <p className={`${colors.text.tertiary} text-label`}>Manage your Bitfrost account</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={onOpenDeposit}
                  className={`px-3 py-1.5 bg-[#C9A36A] border border-[#C9A36A] text-white rounded-sm text-label hover:bg-[#B8926A] transition-colors`}
                >
                  Deposit
                </button>
                <button 
                  onClick={onOpenWithdraw}
                  className={`px-3 py-1.5 ${colors.bg.tertiary} border ${colors.border.secondary} ${colors.text.primary} rounded-sm text-label hover:${colors.bg.hover} transition-colors`}
                >
                  Withdraw
                </button>
                <button 
                  onClick={onOpenTransfer}
                  className={`px-3 py-1.5 ${colors.bg.tertiary} border ${colors.border.secondary} ${colors.text.primary} rounded-sm text-label hover:${colors.bg.hover} transition-colors`}
                >
                  Transfer
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div 
                    key={stat.label}
                    className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-3 ${colors.state.hover} transition-all cursor-pointer group relative overflow-hidden`}
                  >
                    {/* Subtle gradient background on hover */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity ${isDark ? 'bg-gradient-to-br from-blue-500 to-purple-500' : 'bg-gradient-to-br from-blue-400 to-cyan-400'}`}></div>
                    
                    <div className="relative">
                      <div className="flex items-start justify-between mb-2">
                        <div className={`${colors.text.tertiary} text-label`}>{stat.label}</div>
                        <Icon className={`w-3.5 h-3.5 ${colors.text.quaternary} group-hover:text-blue-500 transition-colors`} />
                      </div>
                      <div className="flex items-end justify-between">
                        <div className={`text-[18px] font-semibold ${colors.text.primary}`}>{stat.value}</div>
                        <div className={`text-[9px] font-medium ${
                          stat.isPositive === true ? 'text-green-500' :
                          stat.isPositive === false ? 'text-red-500' :
                          colors.text.quaternary
                        }`}>
                          {stat.change}
                        </div>
                      </div>
                      
                      {/* Mini sparkline for visual interest */}
                      {hasAccount && (
                        <div className="mt-2 h-6 flex items-end gap-[2px]">
                          {[3, 5, 4, 6, 5, 7, 6, 8, 7, 9, 8, 10, 9, 11, 10].map((height, i) => (
                            <div 
                              key={i}
                              className={`flex-1 rounded-t-[1px] transition-all ${
                                stat.isPositive === true ? 'bg-green-500/30 group-hover:bg-green-500/50' :
                                stat.isPositive === false ? 'bg-red-500/30 group-hover:bg-red-500/50' :
                                `${isDark ? 'bg-gray-600/30 group-hover:bg-blue-500/30' : 'bg-gray-300/50 group-hover:bg-blue-400/40'}`
                              }`}
                              style={{ height: `${height * 2}px` }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tabs */}
            <div className={`border-b ${colors.border.divider} mb-4 flex items-center justify-between`}>
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`h-8 px-3 border-b-2 transition-colors text-label uppercase font-semibold ${ 
                    activeTab === 'overview'
                      ? `border-[#1FBF75] ${colors.text.primary}`
                      : `border-transparent ${colors.text.primary} ${colors.state.hover}`
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('exchanges')}
                  className={`h-8 px-3 border-b-2 transition-colors text-label uppercase font-semibold ${ 
                    activeTab === 'exchanges'
                      ? `border-[#1FBF75] ${colors.text.primary}`
                      : `border-transparent ${colors.text.primary} ${colors.state.hover}`
                  }`}
                >
                  Exchanges
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`h-8 px-3 border-b-2 transition-colors text-label uppercase font-semibold ${ 
                    activeTab === 'history'
                      ? `border-[#1FBF75] ${colors.text.primary}`
                      : `border-transparent ${colors.text.primary} ${colors.state.hover}`
                  }`}
                >
                  History
                </button>
                <button
                  onClick={() => setActiveTab('marketMaker')}
                  className={`h-8 px-3 border-b-2 transition-colors text-label uppercase font-semibold ${ 
                    activeTab === 'marketMaker'
                      ? `border-[#1FBF75] ${colors.text.primary}`
                      : `border-transparent ${colors.text.primary} ${colors.state.hover}`
                  }`}
                >
                  Market Maker
                </button>
              </div>
            </div>

            {/* Content */}
            {activeTab === 'overview' && <PortfolioOverview depositAmount={depositAmount} />}
            {activeTab === 'exchanges' && <PortfolioExchanges exchangeAllocations={exchangeAllocations} depositAmount={equityMetrics.exchangeEquity} onConfigureAccounts={onConfigureAccounts} />}
            {activeTab === 'history' && <TradeHistory activeOrder={activeOrder} onClearActiveOrder={onClearActiveOrder} initialDetailTab={urlDetailTab || undefined} initialTradeType={urlTradeParam || undefined} />}
            {activeTab === 'marketMaker' && (
              <div className="space-y-4">
                {/* Market Maker Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-3`}>
                    <div className={`${colors.text.tertiary} text-label mb-2`}>Total Volume (24h)</div>
                    <div className={`text-[18px] font-semibold ${colors.text.primary}`}>$284,350.00</div>
                    <div className="text-[9px] text-green-500 mt-1">+12.3% vs avg</div>
                  </div>
                  <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-3`}>
                    <div className={`${colors.text.tertiary} text-label mb-2`}>Total PNL (24h)</div>
                    <div className={`text-[18px] font-semibold text-green-500`}>+$1,847.23</div>
                    <div className="text-[9px] text-green-500 mt-1">+0.65% ROI</div>
                  </div>
                  <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-3`}>
                    <div className={`${colors.text.tertiary} text-label mb-2`}>Total Exposure</div>
                    <div className={`text-[18px] font-semibold ${colors.text.primary}`}>$85,200.00</div>
                    <div className="text-[9px] ${colors.text.quaternary} mt-1">Across 6 venues</div>
                  </div>
                  <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-3`}>
                    <div className={`${colors.text.tertiary} text-label mb-2`}>Active Strategies</div>
                    <div className={`text-[18px] font-semibold ${colors.text.primary}`}>{activeMarketMakerStrategies.length}</div>
                    <div className="text-[9px] text-green-500 mt-1">{activeMarketMakerStrategies.filter(s => s.status === 'running').length} running</div>
                  </div>
                </div>

                {/* Active Strategies */}
                <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm overflow-hidden`}>
                  <div className="px-4 py-3 border-b ${colors.border.divider}">
                    <h3 className={`text-[13px] font-semibold ${colors.text.primary}`}>Active Strategies</h3>
                  </div>
                  
                  <div className="divide-y ${colors.border.divider}">
                    {/* Deployed Market Maker Strategies from Store */}
                    {activeMarketMakerStrategies.map((strategy) => {
                      const timeElapsed = Math.floor((Date.now() - strategy.startTime) / 1000 / 60); // minutes
                      const hours = Math.floor(timeElapsed / 60);
                      const minutes = timeElapsed % 60;
                      const timeString = hours > 0 ? `${hours}h ${minutes}m ago` : `${minutes}m ago`;
                      
                      return (
                        <div 
                          key={strategy.id}
                          className="p-4 hover:${colors.bg.hover} transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <div 
                                    className={`text-[13px] font-semibold ${colors.text.primary} hover:text-[#C9A36A] cursor-pointer transition-colors`}
                                    onClick={() => setSelectedStrategy({ id: strategy.id, name: strategy.name })}
                                  >
                                    {strategy.name}
                                  </div>
                                  <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-500 text-[9px] font-medium rounded">MULTI-STRATEGY</span>
                                  <span className={`px-1.5 py-0.5 ${
                                    strategy.status === 'running' ? 'bg-green-500/10 text-green-500' :
                                    strategy.status === 'paused' ? 'bg-yellow-500/10 text-yellow-500' :
                                    strategy.status === 'stopped' ? 'bg-red-500/10 text-red-500' :
                                    'bg-gray-500/10 text-gray-500'
                                  } text-[9px] font-medium rounded uppercase`}>{strategy.status}</span>
                                </div>
                                <div className={`text-[11px] ${colors.text.tertiary}`}>{strategy.exchange} • Started {timeString}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <div className={`text-[13px] font-semibold ${strategy.currentPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {strategy.currentPnl >= 0 ? '+' : ''}${strategy.currentPnl.toFixed(2)}
                                </div>
                                <div className={`text-[9px] ${colors.text.tertiary}`}>
                                  {strategy.currentRoi >= 0 ? '+' : ''}{strategy.currentRoi.toFixed(2)}% ROI
                                </div>
                              </div>
                              <svg 
                                className={`w-4 h-4 ${colors.text.tertiary} transition-transform cursor-pointer ${expandedStrategy === strategy.id ? 'rotate-180' : ''}`}
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedStrategy(expandedStrategy === strategy.id ? null : strategy.id);
                                }}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                          
                          {expandedStrategy === strategy.id && (
                            <div className="mt-4 pt-4 border-t ${colors.border.divider}">
                              <div className="grid grid-cols-4 gap-3 mb-3">
                                <div>
                                  <div className={`text-[9px] ${colors.text.tertiary} mb-0.5`}>Volume</div>
                                  <div className={`text-[11px] font-medium ${colors.text.primary}`}>${strategy.volume.toLocaleString()}</div>
                                </div>
                                <div>
                                  <div className={`text-[9px] ${colors.text.tertiary} mb-0.5`}>Exposure</div>
                                  <div className={`text-[11px] font-medium ${colors.text.primary}`}>${strategy.exposure.toLocaleString()}</div>
                                </div>
                                <div>
                                  <div className={`text-[9px] ${colors.text.tertiary} mb-0.5`}>Spread</div>
                                  <div className={`text-[11px] font-medium ${colors.text.primary}`}>{strategy.spreadBps} bps</div>
                                </div>
                                <div>
                                  <div className={`text-[9px] ${colors.text.tertiary} mb-0.5`}>Margin</div>
                                  <div className={`text-[11px] font-medium ${colors.text.primary}`}>${strategy.margin.toLocaleString()} @ {strategy.leverage}x</div>
                                </div>
                              </div>
                              <div className="grid grid-cols-4 gap-3">
                                <div>
                                  <div className={`text-[9px] ${colors.text.tertiary} mb-0.5`}>Order Levels</div>
                                  <div className={`text-[11px] font-medium ${colors.text.primary}`}>{strategy.orderLevels}</div>
                                </div>
                                <div>
                                  <div className={`text-[9px] ${colors.text.tertiary} mb-0.5`}>Order Amount</div>
                                  <div className={`text-[11px] font-medium ${colors.text.primary}`}>${strategy.orderAmount.toLocaleString()}</div>
                                </div>
                                <div>
                                  <div className={`text-[9px] ${colors.text.tertiary} mb-0.5`}>Refresh Time</div>
                                  <div className={`text-[11px] font-medium ${colors.text.primary}`}>{strategy.refreshTime}s</div>
                                </div>
                                <div>
                                  <div className={`text-[9px] ${colors.text.tertiary} mb-0.5`}>Auto-repeat</div>
                                  <div className={`text-[11px] font-medium ${colors.text.primary}`}>{strategy.enableAutoRepeat ? `${strategy.runsCompleted || 0}/${strategy.maxRuns} runs` : 'Disabled'}</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    {/* Advanced Bot Strategy */}
                    <div 
                      className="p-4 hover:${colors.bg.hover} transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div 
                                className={`text-[13px] font-semibold ${colors.text.primary} hover:text-[#C9A36A] cursor-pointer transition-colors`}
                                onClick={() => setSelectedStrategy({ id: 'advanced-btc', name: 'Advanced Bot - BTC/USDC' })}
                              >
                                Advanced Bot - BTC/USDC
                              </div>
                              <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-500 text-[9px] font-medium rounded">ADVANCED</span>
                              <span className="px-1.5 py-0.5 bg-green-500/10 text-green-500 text-[9px] font-medium rounded">RUNNING</span>
                            </div>
                            <div className={`text-[11px] ${colors.text.tertiary}`}>Hyperliquid • Started 2h 34m ago</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-[13px] font-semibold text-green-500">+$524.67</div>
                            <div className={`text-[9px] ${colors.text.tertiary}`}>+1.05% ROI</div>
                          </div>
                          <svg 
                            className={`w-4 h-4 ${colors.text.tertiary} transition-transform cursor-pointer ${expandedStrategy === 'advanced' ? 'rotate-180' : ''}`}
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedStrategy(expandedStrategy === 'advanced' ? null : 'advanced');
                            }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      
                      {expandedStrategy === 'advanced' && (
                        <div className="mt-4 pt-4 border-t ${colors.border.divider}">
                          <div className="grid grid-cols-4 gap-3 mb-3">
                            <div>
                              <div className={`text-[9px] ${colors.text.tertiary} mb-0.5`}>Volume</div>
                              <div className={`text-[11px] font-medium ${colors.text.primary}`}>$52,340</div>
                            </div>
                            <div>
                              <div className={`text-[9px] ${colors.text.tertiary} mb-0.5`}>Exposure</div>
                              <div className={`text-[11px] font-medium ${colors.text.primary}`}>$15,000</div>
                            </div>
                            <div>
                              <div className={`text-[9px] ${colors.text.tertiary} mb-0.5`}>Spread</div>
                              <div className={`text-[11px] font-medium ${colors.text.primary}`}>10 bps</div>
                            </div>
                            <div>
                              <div className={`text-[9px] ${colors.text.tertiary} mb-0.5`}>Margin</div>
                              <div className={`text-[11px] font-medium ${colors.text.primary}`}>$500 @ 30x</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-3">
                            <div>
                              <div className={`text-[9px] ${colors.text.tertiary} mb-0.5`}>Order Levels</div>
                              <div className={`text-[11px] font-medium ${colors.text.primary}`}>5</div>
                            </div>
                            <div>
                              <div className={`text-[9px] ${colors.text.tertiary} mb-0.5`}>Order Amount</div>
                              <div className={`text-[11px] font-medium ${colors.text.primary}`}>$100</div>
                            </div>
                            <div>
                              <div className={`text-[9px] ${colors.text.tertiary} mb-0.5`}>Refresh Time</div>
                              <div className={`text-[11px] font-medium ${colors.text.primary}`}>5s</div>
                            </div>
                            <div>
                              <div className={`text-[9px] ${colors.text.tertiary} mb-0.5`}>Auto-repeat</div>
                              <div className={`text-[11px] font-medium ${colors.text.primary}`}>3/5 runs</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Vault Strategy */}
                    <div 
                      className="p-4 hover:${colors.bg.hover} transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div 
                                className={`text-[13px] font-semibold ${colors.text.primary} hover:text-[#C9A36A] cursor-pointer transition-colors`}
                                onClick={() => setSelectedStrategy({ id: 'velar-vault', name: 'Velar Vault' })}
                              >
                                Velar Vault
                              </div>
                              <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-500 text-[9px] font-medium rounded">VAULT</span>
                              <span className="px-1.5 py-0.5 bg-green-500/10 text-green-500 text-[9px] font-medium rounded">ACTIVE</span>
                            </div>
                            <div className={`text-[11px] ${colors.text.tertiary}`}>Multi-venue • Started 1d 4h ago</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-[13px] font-semibold text-green-500">+$1,142.50</div>
                            <div className={`text-[9px] ${colors.text.tertiary}`}>+4.57% ROI</div>
                          </div>
                          <svg 
                            className={`w-4 h-4 ${colors.text.tertiary} transition-transform cursor-pointer ${expandedStrategy === 'vault' ? 'rotate-180' : ''}`}
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedStrategy(expandedStrategy === 'vault' ? null : 'vault');
                            }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      
                      {expandedStrategy === 'vault' && (
                        <div className="mt-4 pt-4 border-t ${colors.border.divider}">
                          <div className="grid grid-cols-4 gap-3">
                            <div>
                              <div className={`text-[9px] ${colors.text.tertiary} mb-0.5`}>Volume</div>
                              <div className={`text-[11px] font-medium ${colors.text.primary}`}>$125,450</div>
                            </div>
                            <div>
                              <div className={`text-[9px] ${colors.text.tertiary} mb-0.5`}>Exposure</div>
                              <div className={`text-[11px] font-medium ${colors.text.primary}`}>$25,000</div>
                            </div>
                            <div>
                              <div className={`text-[9px] ${colors.text.tertiary} mb-0.5`}>APY</div>
                              <div className={`text-[11px] font-medium text-green-500`}>18.2%</div>
                            </div>
                            <div>
                              <div className={`text-[9px] ${colors.text.tertiary} mb-0.5`}>Leverage</div>
                              <div className={`text-[11px] font-medium ${colors.text.primary}`}>1x</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Multi-Strategy Group */}
                    <div 
                      className="p-4 hover:${colors.bg.hover} transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div 
                                className={`text-[13px] font-semibold ${colors.text.primary} hover:text-[#C9A36A] cursor-pointer transition-colors`}
                                onClick={() => setSelectedStrategy({ id: 'multi-strategy', name: 'Multi-Strategy Portfolio' })}
                              >
                                Multi-Strategy Portfolio
                              </div>
                              <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 text-[9px] font-medium rounded">MULTI</span>
                              <span className="px-1.5 py-0.5 bg-green-500/10 text-green-500 text-[9px] font-medium rounded">5 ACTIVE</span>
                            </div>
                            <div className={`text-[11px] ${colors.text.tertiary}`}>Started 3h 12m ago • Deployed across 4 venues</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-[13px] font-semibold text-green-500">+$180.06</div>
                            <div className={`text-[9px] ${colors.text.tertiary}`}>+0.42% ROI</div>
                          </div>
                          <svg 
                            className={`w-4 h-4 ${colors.text.tertiary} transition-transform cursor-pointer ${expandedStrategy === 'multi' ? 'rotate-180' : ''}`}
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedStrategy(expandedStrategy === 'multi' ? null : 'multi');
                            }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      
                      {expandedStrategy === 'multi' && (
                        <div className="mt-4 pt-4 border-t ${colors.border.divider}">
                          {/* Sub-strategies */}
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between p-2 ${colors.bg.tertiary} rounded-sm">
                              <div className="flex-1">
                                <div className={`text-[11px] font-medium ${colors.text.primary}`}>Strategy 1: ETH/USDC</div>
                                <div className={`text-[9px] ${colors.text.tertiary}`}>Paradex • Vol: $18,240 • Exp: $8,000</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-[11px] font-semibold text-green-500">+$42.15</div>
                                <button className={`px-2 py-1 text-[9px] font-medium ${colors.button.primaryBg} text-white rounded hover:opacity-90 transition-opacity`}>
                                  Open
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-2 ${colors.bg.tertiary} rounded-sm">
                              <div className="flex-1">
                                <div className={`text-[11px] font-medium ${colors.text.primary}`}>Strategy 2: SOL/USDC</div>
                                <div className={`text-[9px] ${colors.text.tertiary}`}>Hyperliquid • Vol: $22,100 • Exp: $10,000</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-[11px] font-semibold text-green-500">+$58.20</div>
                                <button className={`px-2 py-1 text-[9px] font-medium ${colors.button.primaryBg} text-white rounded hover:opacity-90 transition-opacity`}>
                                  Open
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-2 ${colors.bg.tertiary} rounded-sm">
                              <div className="flex-1">
                                <div className={`text-[11px] font-medium ${colors.text.primary}`}>Strategy 3: AVAX/USDC</div>
                                <div className={`text-[9px] ${colors.text.tertiary}`}>Aster • Vol: $15,890 • Exp: $7,200</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-[11px] font-semibold text-green-500">+$34.88</div>
                                <button className={`px-2 py-1 text-[9px] font-medium ${colors.button.primaryBg} text-white rounded hover:opacity-90 transition-opacity`}>
                                  Open
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-2 ${colors.bg.tertiary} rounded-sm">
                              <div className="flex-1">
                                <div className={`text-[11px] font-medium ${colors.text.primary}`}>Strategy 4: ARB/USDC</div>
                                <div className={`text-[9px] ${colors.text.tertiary}`}>Binance • Vol: $12,450 • Exp: $6,000</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-[11px] font-semibold text-green-500">+$28.43</div>
                                <button className={`px-2 py-1 text-[9px] font-medium ${colors.button.primaryBg} text-white rounded hover:opacity-90 transition-opacity`}>
                                  Open
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-2 ${colors.bg.tertiary} rounded-sm">
                              <div className="flex-1">
                                <div className={`text-[11px] font-medium ${colors.text.primary}`}>Strategy 5: MATIC/USDC</div>
                                <div className={`text-[9px] ${colors.text.tertiary}`}>Bybit • Vol: $9,880 • Exp: $5,000</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-[11px] font-semibold text-green-500">+$16.40</div>
                                <button className={`px-2 py-1 text-[9px] font-medium ${colors.button.primaryBg} text-white rounded hover:opacity-90 transition-opacity`}>
                                  Open
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-3">
                            <div>
                              <div className={`text-[9px] ${colors.text.tertiary} mb-0.5`}>Total Volume</div>
                              <div className={`text-[11px] font-medium ${colors.text.primary}`}>$78,560</div>
                            </div>
                            <div>
                              <div className={`text-[9px] ${colors.text.tertiary} mb-0.5`}>Total Exposure</div>
                              <div className={`text-[11px] font-medium ${colors.text.primary}`}>$36,200</div>
                            </div>
                            <div>
                              <div className={`text-[9px] ${colors.text.tertiary} mb-0.5`}>Avg Spread</div>
                              <div className={`text-[11px] font-medium ${colors.text.primary}`}>8-12 bps</div>
                            </div>
                            <div>
                              <div className={`text-[9px] ${colors.text.tertiary} mb-0.5`}>Correlation</div>
                              <div className={`text-[11px] font-medium ${colors.text.primary}`}>0.45</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Breakdown */}
                <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm overflow-hidden`}>
                  <div className="px-4 py-3 border-b ${colors.border.divider}">
                    <h3 className={`text-[13px] font-semibold ${colors.text.primary} mb-3`}>Breakdown</h3>
                    
                    {/* Sub-tabs */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => setBreakdownTab('venue')}
                        className={`px-2 py-1 text-[11px] font-medium rounded-sm transition-colors ${
                          breakdownTab === 'venue'
                            ? `${colors.bg.tertiary} ${colors.text.primary}`
                            : `${colors.text.tertiary} hover:${colors.bg.hover}`
                        }`}
                      >
                        by venue
                      </button>
                      <button
                        onClick={() => setBreakdownTab('asset')}
                        className={`px-2 py-1 text-[11px] font-medium rounded-sm transition-colors ${
                          breakdownTab === 'asset'
                            ? `${colors.bg.tertiary} ${colors.text.primary}`
                            : `${colors.text.tertiary} hover:${colors.bg.hover}`
                        }`}
                      >
                        by asset
                      </button>
                      <button
                        onClick={() => setBreakdownTab('strategyType')}
                        className={`px-2 py-1 text-[11px] font-medium rounded-sm transition-colors ${
                          breakdownTab === 'strategyType'
                            ? `${colors.bg.tertiary} ${colors.text.primary}`
                            : `${colors.text.tertiary} hover:${colors.bg.hover}`
                        }`}
                      >
                        by strategy type
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    {breakdownTab === 'venue' && (
                      <div className="space-y-3">
                        {[
                          { name: 'Hyperliquid', volume: '$92,680', exposure: '$25,000', pnl: '+$582.82', pnlPercent: '+2.33%', strategies: 2 },
                          { name: 'Paradex', volume: '$48,240', exposure: '$18,000', pnl: '+$342.15', pnlPercent: '+1.90%', strategies: 2 },
                          { name: 'Aster', volume: '$35,890', exposure: '$12,200', pnl: '+$234.88', pnlPercent: '+1.93%', strategies: 2 },
                          { name: 'Binance', volume: '$52,450', exposure: '$16,000', pnl: '+$428.43', pnlPercent: '+2.68%', strategies: 1 },
                          { name: 'Bybit', volume: '$29,880', exposure: '$9,000', pnl: '+$166.40', pnlPercent: '+1.85%', strategies: 1 },
                          { name: 'OKX', volume: '$25,210', exposure: '$5,000', pnl: '+$92.55', pnlPercent: '+1.85%', strategies: 1 },
                        ].map((venue, idx) => (
                          <div key={idx} className={`flex items-center justify-between p-3 ${colors.bg.tertiary} rounded-sm`}>
                            <div className="flex items-center gap-4 flex-1">
                              <div className="w-24">
                                <div className={`text-[11px] font-medium ${colors.text.primary}`}>{venue.name}</div>
                                <div className={`text-[9px] ${colors.text.tertiary}`}>{venue.strategies} {venue.strategies === 1 ? 'strategy' : 'strategies'}</div>
                              </div>
                              <div className="flex-1 grid grid-cols-4 gap-4">
                                <div>
                                  <div className={`text-[9px] ${colors.text.tertiary}`}>Volume</div>
                                  <div className={`text-[11px] font-medium ${colors.text.primary}`}>{venue.volume}</div>
                                </div>
                                <div>
                                  <div className={`text-[9px] ${colors.text.tertiary}`}>Exposure</div>
                                  <div className={`text-[11px] font-medium ${colors.text.primary}`}>{venue.exposure}</div>
                                </div>
                                <div>
                                  <div className={`text-[9px] ${colors.text.tertiary}`}>PNL</div>
                                  <div className={`text-[11px] font-semibold text-green-500`}>{venue.pnl}</div>
                                </div>
                                <div>
                                  <div className={`text-[9px] ${colors.text.tertiary}`}>ROI</div>
                                  <div className={`text-[11px] font-semibold text-green-500`}>{venue.pnlPercent}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {breakdownTab === 'asset' && (
                      <div className="space-y-3">
                        {[
                          { name: 'BTC/USDC', volume: '$125,680', exposure: '$42,000', pnl: '+$892.45', pnlPercent: '+2.12%', venues: 3 },
                          { name: 'ETH/USDC', volume: '$78,240', exposure: '$28,000', pnl: '+$542.67', pnlPercent: '+1.94%', venues: 2 },
                          { name: 'SOL/USDC', volume: '$52,890', exposure: '$15,200', pnl: '+$278.33', pnlPercent: '+1.83%', venues: 2 },
                          { name: 'AVAX/USDC', volume: '$27,540', exposure: '$10,000', pnl: '+$133.78', pnlPercent: '+1.34%', venues: 1 },
                        ].map((asset, idx) => (
                          <div key={idx} className={`flex items-center justify-between p-3 ${colors.bg.tertiary} rounded-sm`}>
                            <div className="flex items-center gap-4 flex-1">
                              <div className="w-24">
                                <div className={`text-[11px] font-medium ${colors.text.primary}`}>{asset.name}</div>
                                <div className={`text-[9px] ${colors.text.tertiary}`}>{asset.venues} {asset.venues === 1 ? 'venue' : 'venues'}</div>
                              </div>
                              <div className="flex-1 grid grid-cols-4 gap-4">
                                <div>
                                  <div className={`text-[9px] ${colors.text.tertiary}`}>Volume</div>
                                  <div className={`text-[11px] font-medium ${colors.text.primary}`}>{asset.volume}</div>
                                </div>
                                <div>
                                  <div className={`text-[9px] ${colors.text.tertiary}`}>Exposure</div>
                                  <div className={`text-[11px] font-medium ${colors.text.primary}`}>{asset.exposure}</div>
                                </div>
                                <div>
                                  <div className={`text-[9px] ${colors.text.tertiary}`}>PNL</div>
                                  <div className={`text-[11px] font-semibold text-green-500`}>{asset.pnl}</div>
                                </div>
                                <div>
                                  <div className={`text-[9px] ${colors.text.tertiary}`}>ROI</div>
                                  <div className={`text-[11px] font-semibold text-green-500`}>{asset.pnlPercent}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {breakdownTab === 'strategyType' && (
                      <div className="space-y-3">
                        {[
                          { name: 'Advanced Bot', volume: '$156,340', exposure: '$52,000', pnl: '+$1,124.67', pnlPercent: '+2.16%', count: 2 },
                          { name: 'Vault', volume: '$125,450', exposure: '$25,000', pnl: '+$642.50', pnlPercent: '+2.57%', count: 1 },
                          { name: 'Multi-Strategy', volume: '$78,560', exposure: '$36,200', pnl: '+$280.06', pnlPercent: '+0.77%', count: 5 },
                        ].map((type, idx) => (
                          <div key={idx} className={`flex items-center justify-between p-3 ${colors.bg.tertiary} rounded-sm`}>
                            <div className="flex items-center gap-4 flex-1">
                              <div className="w-32">
                                <div className={`text-[11px] font-medium ${colors.text.primary}`}>{type.name}</div>
                                <div className={`text-[9px] ${colors.text.tertiary}`}>{type.count} {type.count === 1 ? 'strategy' : 'strategies'}</div>
                              </div>
                              <div className="flex-1 grid grid-cols-4 gap-4">
                                <div>
                                  <div className={`text-[9px] ${colors.text.tertiary}`}>Volume</div>
                                  <div className={`text-[11px] font-medium ${colors.text.primary}`}>{type.volume}</div>
                                </div>
                                <div>
                                  <div className={`text-[9px] ${colors.text.tertiary}`}>Exposure</div>
                                  <div className={`text-[11px] font-medium ${colors.text.primary}`}>{type.exposure}</div>
                                </div>
                                <div>
                                  <div className={`text-[9px] ${colors.text.tertiary}`}>PNL</div>
                                  <div className={`text-[11px] font-semibold text-green-500`}>{type.pnl}</div>
                                </div>
                                <div>
                                  <div className={`text-[9px] ${colors.text.tertiary}`}>ROI</div>
                                  <div className={`text-[11px] font-semibold text-green-500`}>{type.pnlPercent}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default PortfolioPage;