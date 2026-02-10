import { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import { theme } from '../../utils/cn';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface Exchange {
  name: string;
  allocation: number;
  pnl: number;
  pnlPercent: number;
  volume: number;
  positions: number;
  status: string;
  updatedAgo: string;
}

interface PortfolioExchangesProps {
  exchangeAllocations: Exchange[];
  depositAmount?: number;
  onConfigureAccounts?: () => void;
}

export default function PortfolioExchanges({ exchangeAllocations, depositAmount = 0, onConfigureAccounts }: PortfolioExchangesProps) {
  const { theme: currentTheme, colors } = useThemeStore();
  const isDark = currentTheme === 'dark';
  const [selectedExchange, setSelectedExchange] = useState<string | null>(
    exchangeAllocations.length > 0 ? exchangeAllocations[0].name : null
  );
  const [analyticsTab, setAnalyticsTab] = useState<'portfolio' | 'funding'>('portfolio');
  const [timePeriod, setTimePeriod] = useState<'1d' | '7d' | '30d' | '1y'>('7d');

  const currentExchange = exchangeAllocations.find(e => e.name === selectedExchange);

  // Mock chart data
  const equityChartData = [
    { date: 'Jan 12', gmv: 0, equity: 0 },
    { date: 'Jan 13', gmv: 0, equity: 120 },
    { date: 'Jan 14', gmv: 0, equity: 120 },
    { date: 'Jan 15', gmv: 175, equity: 120 },
    { date: 'Jan 16', gmv: 175, equity: 100 },
    { date: 'Jan 17', gmv: 175, equity: 15 },
    { date: 'Jan 18', gmv: 175, equity: 15 },
  ];

  const notionalExposureData = [
    { date: 'Jan 12', value: 0 },
    { date: 'Jan 13', value: 0 },
    { date: 'Jan 14', value: 0 },
    { date: 'Jan 15', value: 0 },
    { date: 'Jan 16', value: 175 },
    { date: 'Jan 17', value: 215 },
    { date: 'Jan 18', value: 215 },
  ];

  const unrealizedPnLData = [
    { date: 'Jan 12', value: 0 },
    { date: 'Jan 13', value: 0 },
    { date: 'Jan 14', value: 0 },
    { date: 'Jan 15', value: 1.2 },
    { date: 'Jan 16', value: 3.8 },
    { date: 'Jan 17', value: 5.5 },
    { date: 'Jan 18', value: 5.92 },
  ];

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-28rem)]">
      <div className="flex gap-3 flex-1">
        {/* Left Sidebar */}
        <div className="w-80 flex flex-col">
          {/* Accounts List */}
          <div className={`flex-1 ${colors.bg.secondary} border ${colors.border.secondary} rounded-sm overflow-y-auto`}>
            <div className={`p-3 border-b ${colors.border.secondary}`}>
              <h3 className={`text-label ${colors.text.secondary}`}>Accounts</h3>
            </div>
            <div className="p-2">
              {exchangeAllocations.map((exchange) => {
                const isSelected = selectedExchange === exchange.name;
                const isPositive = exchange.pnl >= 0;
                // Calculate 50/50 split of total deposit for each exchange
                const exchangeEquity = depositAmount / 2;
                return (
                  <button
                    key={exchange.name}
                    onClick={() => setSelectedExchange(exchange.name)}
                    className={`w-full p-2.5 mb-2 rounded-sm transition-colors text-left ${
                      isSelected 
                        ? 'bg-orange-900/30 border border-orange-600/50' 
                        : `${colors.bg.primary} border ${colors.border.secondary} ${colors.border.hoverTertiary}`
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-orange-600 rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                          {exchange.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className={`text-data ${colors.text.primary}`}>{exchange.name}</span>
                        {exchange.status === 'Long' && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded-sm">
                            LONG
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`text-data ${colors.text.primary}`}>
                          ${exchangeEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-1 text-[9px] ${colors.text.quaternary}`}>
                        <span>Updated {exchange.updatedAgo}</span>
                        <span className="text-orange-600">⟳</span>
                      </div>
                      <div className={`text-[9px] ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPositive ? '+' : ''}{exchange.pnlPercent}% {exchange.pnl > 0 ? '7d' : '1d'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Settings */}
          <div className={`mt-3 ${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-3 space-y-3`}>
            <div>
              <h3 className={`text-label ${colors.text.secondary} mb-2`}>Accounts Opened</h3>
              <div className="space-y-1.5">
                {exchangeAllocations.map((exchange) => (
                  <div key={exchange.name} className="flex items-center justify-between">
                    <span className={`text-label ${colors.text.secondary}`}>{exchange.name}</span>
                    <label className="relative inline-block w-7 h-3.5">
                      <input type="checkbox" className="peer sr-only" defaultChecked />
                      <div className={`w-7 h-3.5 ${isDark ? 'bg-gray-700' : 'bg-gray-300'} peer-checked:bg-orange-600 rounded-full transition-colors`}></div>
                      <div className="absolute left-0.5 top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-transform peer-checked:translate-x-3.5"></div>
                    </label>
                  </div>
                ))}
              </div>
              <button className={`w-full mt-2 px-3 py-1.5 ${colors.bg.primary} border ${colors.border.secondary} ${colors.text.primary} rounded-sm text-label hover:${colors.bg.hover} transition-colors`} onClick={onConfigureAccounts}>
                Configure Accounts
              </button>
            </div>

            <div className={`pt-3 border-t ${colors.border.secondary}`}>
              <h3 className={`text-label ${colors.text.secondary} mb-2`}>Funding Distribution</h3>
              <div className="space-y-1.5 mb-2">
                <div className="flex items-center justify-between">
                  <span className={`text-label ${colors.text.secondary}`}>Default Distribution</span>
                  <label className="relative inline-block w-7 h-3.5">
                    <input type="checkbox" className="peer sr-only" defaultChecked />
                    <div className={`w-7 h-3.5 ${isDark ? 'bg-gray-700' : 'bg-gray-300'} peer-checked:bg-orange-600 rounded-full transition-colors`}></div>
                    <div className="absolute left-0.5 top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-transform peer-checked:translate-x-3.5"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-label ${colors.text.secondary}`}>Custom Distribution</span>
                  <label className="relative inline-block w-7 h-3.5">
                    <input type="checkbox" className="peer sr-only" />
                    <div className={`w-7 h-3.5 ${isDark ? 'bg-gray-700' : 'bg-gray-300'} peer-checked:bg-orange-600 rounded-full transition-colors`}></div>
                    <div className="absolute left-0.5 top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-transform peer-checked:translate-x-3.5"></div>
                  </label>
                </div>
              </div>
              <div className="space-y-1.5">
                {exchangeAllocations.slice(0, 3).map((exchange, idx) => (
                  <div key={exchange.name} className="flex items-center gap-2">
                    <span className={`text-label ${colors.text.secondary} flex-1`}>{exchange.name}</span>
                    <input 
                      type="text" 
                      defaultValue={idx === 0 ? '24' : idx === 1 ? '62' : '14'}
                      className={`w-10 ${colors.bg.primary} border ${colors.border.secondary} ${colors.text.primary} rounded-sm px-1.5 py-1 text-label text-right`}
                    />
                    <span className={`text-label ${colors.text.secondary}`}>%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Main Content - Analytics */}
        <div className={`flex-1 ${colors.bg.secondary} border ${colors.border.secondary} rounded-sm`}>
          {currentExchange && (
            <>
              {/* Exchange Header */}
              <div className={`p-3 border-b ${colors.border.secondary}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-[13px] font-bold text-white">
                      {currentExchange.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className={`text-[15px] font-medium ${colors.text.primary}`}>{currentExchange.name}</h2>
                        <span className={`text-label ${colors.text.tertiary}`}>✓</span>
                      </div>
                      <span className={`text-label ${colors.text.tertiary}`}>{currentExchange.name}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className={`text-[9px] ${colors.text.tertiary}`}>
                        <span>Trader ID</span>
                        <span className={`${colors.text.primary} ml-2`}>{currentExchange.name === 'Hyperliquid' ? '0x5dbd0924B11f00...1f9f1Ebab20F9e7e32' : '0x9d10f1eeae0236d51d...170-731909S9492216'}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-label rounded-sm transition-colors">
                        Deposit
                      </button>
                      <button className="px-3 py-1.5 bg-transparent border border-orange-600 hover:bg-orange-600/10 text-orange-600 text-label rounded-sm transition-colors">
                        Withdraw
                      </button>
                      <button className={`px-3 py-1.5 bg-transparent border ${colors.border.secondary} hover:border-orange-600/50 ${colors.text.secondary} hover:text-orange-600 text-label rounded-sm transition-colors`}>
                        Transfer
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className={`flex gap-6 border-b ${colors.border.secondary}`}>
                  <button
                    onClick={() => setAnalyticsTab('portfolio')}
                    className={`pb-1.5 text-label ${
                      analyticsTab === 'portfolio'
                        ? 'text-orange-600 border-b-2 border-orange-600'
                        : colors.text.tertiary + ' ' + colors.text.hoverPrimary
                    }`}
                  >
                    Portfolio
                  </button>
                  <button
                    onClick={() => setAnalyticsTab('funding')}
                    className={`pb-1.5 text-label ${
                      analyticsTab === 'funding'
                        ? 'text-orange-600 border-b-2 border-orange-600'
                        : colors.text.tertiary + ' ' + colors.text.hoverPrimary
                    }`}
                  >
                    Funding
                  </button>
                </div>
              </div>

              {/* Analytics Content */}
              <div className="p-3">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className={`${colors.bg.primary} border ${colors.border.secondary} rounded-sm p-3`}>
                    <div className={`text-label ${colors.text.tertiary} mb-1.5`}>Total Equity</div>
                    <div className={`text-[16px] font-medium mb-1.5 ${colors.text.primary}`}>
                      {currentExchange.name === 'Hyperliquid' ? '9,125.75' : currentExchange.name === 'Paradex' ? '6,202.25' : currentExchange.allocation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className={`text-label ${colors.text.tertiary}`}>USD</span>
                    </div>
                    <div className="flex items-center gap-2 text-label">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-green-400" />
                        <span className="text-green-400">0.00% 1D</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingDown className="w-3 h-3 text-red-400" />
                        <span className="text-red-400">-7.46% 7D</span>
                      </div>
                    </div>
                  </div>
                  <div className={`${colors.bg.primary} border ${colors.border.secondary} rounded-sm p-3`}>
                    <div className={`text-label ${colors.text.tertiary} mb-1.5`}>Directional Bias</div>
                    <div className={`text-[16px] font-medium text-green-400 mb-1.5`}>+79.79 <span className={`text-label ${colors.text.tertiary}`}>USDT</span></div>
                    <div className={`text-label ${colors.text.tertiary}`}>Long Bias 100% Adjusted L/S</div>
                  </div>
                  <div className={`${colors.bg.primary} border ${colors.border.secondary} rounded-sm p-3`}>
                    <div className={`text-label ${colors.text.tertiary} mb-1.5`}>Unrealized PnL</div>
                    <div className={`text-[16px] font-medium text-green-400 mb-1.5`}>+4.85 <span className={`text-label ${colors.text.tertiary}`}>USDT</span></div>
                    <div className="flex items-center gap-2">
                      <span className="text-label text-green-400">+3.6%</span>
                    </div>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="space-y-3">
                  {/* Top Chart - Total Equity / GMV */}
                  <div className={`${colors.bg.primary} border ${colors.border.secondary} rounded-sm p-3`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`text-label ${colors.text.primary}`}>Total Equity</span>
                        <span className={`text-label text-orange-600`}>Gross Market Value (GMV)</span>
                      </div>
                      <div className="flex gap-1">
                        {(['1d', '7d', '30d', '1y'] as const).map((period) => (
                          <button
                            key={period}
                            onClick={() => setTimePeriod(period)}
                            className={`px-2 py-1 text-[9px] rounded-sm transition-colors ${
                              timePeriod === period
                                ? 'bg-orange-600 text-white'
                                : `${colors.bg.secondary} ${colors.text.secondary} hover:bg-orange-600/20`
                            }`}
                          >
                            {period.toUpperCase()}
                          </button>
                        ))}
                        <button className={`px-2 py-1 text-[9px] ${colors.bg.secondary} ${colors.text.secondary} hover:bg-orange-600/20 rounded-sm`}>
                          CSV
                        </button>
                      </div>
                    </div>
                    <div className={`text-label ${colors.text.tertiary} mb-2`}>$214.99</div>
                    <div style={{ width: '100%', height: '180px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={equityChartData}>
                          <XAxis 
                            dataKey="date" 
                            stroke={isDark ? '#666' : '#ccc'}
                            tick={{ fill: isDark ? '#666' : '#999', fontSize: 10 }}
                          />
                          <YAxis 
                            stroke={isDark ? '#666' : '#ccc'}
                            tick={{ fill: isDark ? '#666' : '#999', fontSize: 10 }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDark ? '#1a1a1a' : '#fff',
                              border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                              borderRadius: '4px'
                            }}
                          />
                          <Line type="stepAfter" dataKey="gmv" stroke="#ea580c" strokeWidth={2} dot={false} />
                          <Line type="stepAfter" dataKey="equity" stroke={isDark ? '#fff' : '#000'} strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Bottom 3 Charts */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Notional Exposure */}
                    <div className={`${colors.bg.primary} border ${colors.border.secondary} rounded-sm p-3`}>
                      <div className={`text-[10px] ${colors.text.tertiary} mb-2 uppercase tracking-wide`}>Notional Exposure</div>
                      <div className={`text-[15px] font-medium ${colors.text.primary} mb-3`}>$214.99</div>
                      <div style={{ width: '100%', height: '180px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={notionalExposureData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <XAxis 
                              dataKey="date" 
                              stroke={isDark ? '#333' : '#e5e5e5'}
                              tick={{ fill: isDark ? '#666' : '#999', fontSize: 9 }}
                              axisLine={false}
                            />
                            <YAxis 
                              stroke={isDark ? '#333' : '#e5e5e5'}
                              tick={{ fill: isDark ? '#666' : '#999', fontSize: 9 }}
                              axisLine={false}
                              width={40}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: isDark ? '#1a1a1a' : '#fff',
                                border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                                borderRadius: '4px',
                                fontSize: '10px'
                              }}
                            />
                            <Line type="stepAfter" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Unrealized PnL */}
                    <div className={`${colors.bg.primary} border ${colors.border.secondary} rounded-sm p-3`}>
                      <div className={`text-[10px] ${colors.text.tertiary} mb-2 uppercase tracking-wide`}>Unrealized PnL</div>
                      <div className={`text-[15px] font-medium ${colors.text.primary} mb-3`}>$5.92</div>
                      <div style={{ width: '100%', height: '180px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={unrealizedPnLData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <XAxis 
                              dataKey="date" 
                              stroke={isDark ? '#333' : '#e5e5e5'}
                              tick={{ fill: isDark ? '#666' : '#999', fontSize: 9 }}
                              axisLine={false}
                            />
                            <YAxis 
                              stroke={isDark ? '#333' : '#e5e5e5'}
                              tick={{ fill: isDark ? '#666' : '#999', fontSize: 9 }}
                              axisLine={false}
                              width={40}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: isDark ? '#1a1a1a' : '#fff',
                                border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                                borderRadius: '4px',
                                fontSize: '10px'
                              }}
                            />
                            <Line type="stepAfter" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}