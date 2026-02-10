import { useState, useMemo } from 'react';
import { useThemeStore } from '../../stores/themeStore';
import { ArrowLeft, TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, Target, AlertCircle } from 'lucide-react';
import SimpleLineChart from '../SimpleLineChart';
import SimpleAreaChart from '../SimpleAreaChart';
import SimpleComposedChart from '../SimpleComposedChart';

interface StrategyMonitorPageProps {
  strategyId: string;
  strategyName: string;
  onBack: () => void;
}

export default function StrategyMonitorPage({ strategyId, strategyName, onBack }: StrategyMonitorPageProps) {
  const { colors, theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [timeRange, setTimeRange] = useState<'1h' | '4h' | '24h' | '7d'>('4h');
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);

  // Theme-aware chart colors
  const chartColors = {
    grid: isDark ? '#333' : '#e5e7eb',
    axis: isDark ? '#666' : '#9ca3af',
    tick: isDark ? '#999' : '#6b7280',
    tooltipBg: isDark ? '#1a1a1a' : '#ffffff',
    tooltipBorder: isDark ? '#333' : '#d1d5db',
    tooltipText: isDark ? '#e5e7eb' : '#1f2937',
  };

  // Mock position data - defined early so it can be used in generateTimeSeriesData
  const positions = [
    {
      id: '1',
      exchange: 'Hyperliquid',
      pair: 'BTC-PERP',
      side: 'Long' as const,
      size: 0.5,
      notional: 25000,
      entryPrice: 50000,
      currentPrice: 50250,
      pnl: 125,
      pnlPercent: 0.5,
      openTime: '2026-01-21 13:45:23',
      duration: '2h 15m',
    },
    {
      id: '2',
      exchange: 'Paradex',
      pair: 'BTC-PERP',
      side: 'Short' as const,
      size: 0.5,
      notional: 25000,
      entryPrice: 50100,
      currentPrice: 50250,
      pnl: -75,
      pnlPercent: -0.3,
      openTime: '2026-01-21 13:45:28',
      duration: '2h 15m',
    },
  ];

  // Generate comprehensive time series data with REALISTIC CORRELATED VALUES
  const generateTimeSeriesData = () => {
    const data = [];
    const baseTime = new Date('2026-01-21T12:00:00');
    const intervals = timeRange === '1h' ? 60 : timeRange === '4h' ? 48 : timeRange === '24h' ? 96 : 168;
    const minuteStep = timeRange === '1h' ? 1 : timeRange === '4h' ? 5 : timeRange === '24h' ? 15 : 60;
    
    // If viewing a single position, generate data specific to that position
    if (selectedPosition) {
      const position = positions.find(pos => pos.id === selectedPosition);
      if (!position) return [];
      
      const isLong = position.side === 'Long';
      let cumulativePnl = 0;
      let realizedPnl = 0;
      let unrealizedPnl = 0;
      let cumulativeVolume = 0;
      let basePrice = position.entryPrice;
      const currentPrice = position.currentPrice;
      const priceChange = currentPrice - basePrice;
      const positionSize = position.size;
      const positionNotional = position.notional;
      
      for (let i = 0; i < intervals; i++) {
        const time = new Date(baseTime.getTime() + i * minuteStep * 60000);
        const hours = time.getHours();
        const minutes = time.getMinutes();
        const timeStr = `${hours}:${minutes.toString().padStart(2, '0')}`;
        
        // Simulate price movement from entry to current price
        const progress = i / intervals;
        const priceNoise = (Math.random() - 0.5) * 20;
        const simulatedPrice = basePrice + (priceChange * progress) + priceNoise;
        
        // Trading activity
        const activityFactor = 0.5 + 0.5 * Math.sin((i / intervals) * Math.PI * 2);
        const isActive = Math.random() < activityFactor * 0.7;
        
        // Volume increment
        const volumeIncrement = isActive ? Math.random() * 1500 + 500 : 0;
        cumulativeVolume += volumeIncrement;
        
        // Realized PnL from spread capture
        const spreadCapture = isActive ? Math.random() * 3 + 5 : 0;
        const pnlFromSpread = volumeIncrement * (spreadCapture / 10000);
        realizedPnl += pnlFromSpread;
        
        // Unrealized PnL from price movement
        const priceDiff = simulatedPrice - basePrice;
        unrealizedPnl = (isLong ? priceDiff : -priceDiff) * positionSize;
        
        // Net PnL
        cumulativePnl = realizedPnl + unrealizedPnl;
        
        // Position exposure (one-sided for single position)
        const exposure = positionNotional;
        const longExposure = isLong ? exposure : 0;
        const shortExposure = isLong ? 0 : exposure;
        const netPosition = isLong ? exposure : -exposure;
        
        // Order book metrics
        const bidVolume = 40000 + Math.random() * 25000;
        const askVolume = 40000 + Math.random() * 25000;
        const imbalance = ((bidVolume - askVolume) / (bidVolume + askVolume)) * 100;
        
        // Fill rate
        const fillRate = 70 + Math.random() * 20 - Math.abs(imbalance) * 0.3;
        
        data.push({
          time: timeStr,
          timestamp: time.getTime(),
          realizedPnl,
          unrealizedPnl,
          netPnl: cumulativePnl,
          volume: cumulativeVolume,
          volumeIncrement,
          netPosition,
          longExposure,
          shortExposure,
          targetPosition: netPosition,
          bidVolume,
          askVolume,
          imbalance,
          spread: spreadCapture,
          fillRate: Math.max(60, Math.min(95, fillRate)),
          midPrice: simulatedPrice,
          bidPrice: simulatedPrice - spreadCapture * 0.5,
          askPrice: simulatedPrice + spreadCapture * 0.5,
        });
      }
      
      return data;
    }
    
    // Market maker strategy simulation - realistic values for multi-strategy view
    let cumulativePnl = 0;
    let realizedPnl = 0;
    let cumulativeVolume = 0;
    let netPosition = 0;
    let basePrice = 50000; // BTC price
    
    for (let i = 0; i < intervals; i++) {
      const time = new Date(baseTime.getTime() + i * minuteStep * 60000);
      const hours = time.getHours();
      const minutes = time.getMinutes();
      const timeStr = `${hours}:${minutes.toString().padStart(2, '0')}`;
      
      // Price movement simulation (subtle BTC price drift)
      basePrice += (Math.random() - 0.5) * 50;
      
      // Market activity waves (higher during certain hours)
      const activityFactor = 0.6 + 0.4 * Math.sin((i / intervals) * Math.PI * 2);
      const isActive = Math.random() < activityFactor * 0.85;
      
      // Spread capture (market making generates small consistent profits)
      const spreadCaptured = isActive ? Math.random() * 4 + 8 : 8; // 8-12 bps
      
      // Volume per trade
      const volumeIncrement = isActive ? Math.random() * 2500 + 1000 : 0;
      cumulativeVolume += volumeIncrement;
      
      // Realized PnL from spread capture (correlated with volume)
      const pnlFromSpread = volumeIncrement * (spreadCaptured / 10000); // Convert bps to decimal
      realizedPnl += pnlFromSpread;
      
      // Position changes (market maker stays relatively neutral)
      const positionChange = isActive ? (Math.random() - 0.5) * 600 : 0;
      netPosition += positionChange;
      netPosition *= 0.95; // Mean reversion to zero (market makers aim for neutrality)
      
      // Unrealized PnL from position exposure
      const unrealizedPnl = netPosition * 0.015; // Small P&L from position
      
      // Net PnL
      cumulativePnl = realizedPnl + unrealizedPnl;
      
      // Exposure breakdown
      const longExposure = Math.max(0, netPosition);
      const shortExposure = Math.max(0, -netPosition);
      
      // Order book imbalance (affects fill rates)
      const bidVolume = 50000 + Math.random() * 30000;
      const askVolume = 50000 + Math.random() * 30000;
      const imbalance = ((bidVolume - askVolume) / (bidVolume + askVolume)) * 100;
      
      // Fill rate (correlated with imbalance and market activity)
      const fillRate = 75 + Math.random() * 20 - Math.abs(imbalance) * 0.5;
      
      data.push({
        time: timeStr,
        timestamp: time.getTime(),
        realizedPnl,
        unrealizedPnl,
        netPnl: cumulativePnl,
        volume: cumulativeVolume,
        volumeIncrement,
        netPosition,
        longExposure,
        shortExposure,
        targetPosition: 0,
        bidVolume,
        askVolume,
        imbalance,
        spread: spreadCaptured,
        fillRate: Math.max(60, Math.min(95, fillRate)),
        midPrice: basePrice,
        bidPrice: basePrice - spreadCaptured * 0.5,
        askPrice: basePrice + spreadCaptured * 0.5,
      });
    }
    
    return data;
  };

  const chartData = useMemo(() => generateTimeSeriesData(), [timeRange, selectedPosition]);

  // Debug logging
  console.log('StrategyMonitor - Chart Data Points:', chartData.length);
  console.log('StrategyMonitor - Sample Data:', chartData.slice(0, 3));
  console.log('StrategyMonitor - Theme:', theme, 'isDark:', isDark);

  // Calculate summary metrics
  const metrics = useMemo(() => {
    const latest = chartData[chartData.length - 1];
    const earliest = chartData[0];
    
    return {
      totalPnl: latest.netPnl,
      totalVolume: latest.volume,
      currentPosition: latest.netPosition,
      avgSpread: chartData.reduce((sum, d) => sum + d.spread, 0) / chartData.length,
      fillRate: chartData.reduce((sum, d) => sum + d.fillRate, 0) / chartData.length,
      avgImbalance: chartData.reduce((sum, d) => sum + Math.abs(d.imbalance), 0) / chartData.length,
      maxDrawdown: Math.min(...chartData.map(d => d.netPnl - latest.netPnl)),
      sharpeRatio: 2.45,
      roi: ((latest.netPnl / 50000) * 100).toFixed(2),
    };
  }, [chartData]);

  // Get current view data (filtered by selected position if applicable)
  const currentPositions = selectedPosition 
    ? positions.filter(pos => pos.id === selectedPosition)
    : positions;

  // Find selected position details
  const selectedPositionData = selectedPosition 
    ? positions.find(pos => pos.id === selectedPosition)
    : null;

  // Calculate net exposure
  const netExposure = positions.reduce((sum, pos) => {
    return sum + (pos.side === 'Long' ? pos.notional : -pos.notional);
  }, 0);

  const totalNotional = positions.reduce((sum, pos) => sum + Math.abs(pos.notional), 0);

  return (
    <div className="h-[calc(100vh-3rem-1px)] overflow-y-auto">
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {selectedPosition ? (
              <button
                onClick={() => setSelectedPosition(null)}
                className={`flex items-center gap-2 px-3 py-1.5 ${colors.bg.tertiary} border ${colors.border.secondary} ${colors.text.primary} rounded-sm text-label hover:${colors.bg.hover} transition-colors`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Multi-Strategy
              </button>
            ) : (
              <button
                onClick={onBack}
                className={`flex items-center gap-2 px-3 py-1.5 ${colors.bg.tertiary} border ${colors.border.secondary} ${colors.text.primary} rounded-sm text-label hover:${colors.bg.hover} transition-colors`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Portfolio
              </button>
            )}
            <div>
              <h1 className={`text-[15px] font-semibold ${colors.text.primary}`}>Strategy Monitor</h1>
              <p className={`text-[11px] ${colors.text.tertiary}`}>
                {selectedPositionData 
                  ? `${strategyName} > ${selectedPositionData.pair} (${selectedPositionData.exchange})`
                  : strategyName
                }
              </p>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-1">
            {(['1h', '4h', '24h', '7d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-[11px] font-medium rounded-sm transition-colors ${
                  timeRange === range
                    ? `bg-[#C9A36A] text-white`
                    : `${colors.bg.tertiary} ${colors.text.primary} hover:${colors.bg.hover}`
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3 mb-6">
          <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-3`}>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className={`w-3.5 h-3.5 ${colors.text.tertiary}`} />
              <div className={`text-[9px] ${colors.text.tertiary} uppercase tracking-wider`}>Total PnL</div>
            </div>
            <div className={`text-[15px] font-semibold ${metrics.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${metrics.totalPnl.toFixed(2)}
            </div>
            <div className={`text-[9px] ${metrics.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'} mt-0.5`}>
              {metrics.roi}% ROI
            </div>
          </div>

          <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-3`}>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className={`w-3.5 h-3.5 ${colors.text.tertiary}`} />
              <div className={`text-[9px] ${colors.text.tertiary} uppercase tracking-wider`}>Volume</div>
            </div>
            <div className={`text-[15px] font-semibold ${colors.text.primary}`}>
              ${(metrics.totalVolume / 1000).toFixed(1)}k
            </div>
            <div className={`text-[9px] ${colors.text.tertiary} mt-0.5`}>Cumulative</div>
          </div>

          <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-3`}>
            <div className="flex items-center gap-2 mb-2">
              <Target className={`w-3.5 h-3.5 ${colors.text.tertiary}`} />
              <div className={`text-[9px] ${colors.text.tertiary} uppercase tracking-wider`}>Position</div>
            </div>
            <div className={`text-[15px] font-semibold ${metrics.currentPosition >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {metrics.currentPosition.toFixed(0)}
            </div>
            <div className={`text-[9px] ${colors.text.tertiary} mt-0.5`}>Net exposure</div>
          </div>

          <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-3`}>
            <div className="flex items-center gap-2 mb-2">
              <Activity className={`w-3.5 h-3.5 ${colors.text.tertiary}`} />
              <div className={`text-[9px] ${colors.text.tertiary} uppercase tracking-wider`}>Avg Spread</div>
            </div>
            <div className={`text-[15px] font-semibold ${colors.text.primary}`}>
              {metrics.avgSpread.toFixed(1)} bps
            </div>
            <div className={`text-[9px] ${colors.text.tertiary} mt-0.5`}>Captured</div>
          </div>

          <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-3`}>
            <div className="flex items-center gap-2 mb-2">
              <Target className={`w-3.5 h-3.5 ${colors.text.tertiary}`} />
              <div className={`text-[9px] ${colors.text.tertiary} uppercase tracking-wider`}>Fill Rate</div>
            </div>
            <div className={`text-[15px] font-semibold ${colors.text.primary}`}>
              {metrics.fillRate.toFixed(1)}%
            </div>
            <div className={`text-[9px] ${colors.text.tertiary} mt-0.5`}>Efficiency</div>
          </div>

          <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-3`}>
            <div className="flex items-center gap-2 mb-2">
              <Activity className={`w-3.5 h-3.5 ${colors.text.tertiary}`} />
              <div className={`text-[9px] ${colors.text.tertiary} uppercase tracking-wider`}>Imbalance</div>
            </div>
            <div className={`text-[15px] font-semibold ${colors.text.primary}`}>
              {metrics.avgImbalance.toFixed(1)}%
            </div>
            <div className={`text-[9px] ${colors.text.tertiary} mt-0.5`}>Avg B/A</div>
          </div>

          <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-3`}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className={`w-3.5 h-3.5 ${colors.text.tertiary}`} />
              <div className={`text-[9px] ${colors.text.tertiary} uppercase tracking-wider`}>Drawdown</div>
            </div>
            <div className={`text-[15px] font-semibold text-red-500`}>
              {metrics.maxDrawdown.toFixed(2)}
            </div>
            <div className={`text-[9px] ${colors.text.tertiary} mt-0.5`}>Max DD</div>
          </div>

          <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-3`}>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className={`w-3.5 h-3.5 ${colors.text.tertiary}`} />
              <div className={`text-[9px] ${colors.text.tertiary} uppercase tracking-wider`}>Sharpe</div>
            </div>
            <div className={`text-[15px] font-semibold ${colors.text.primary}`}>
              {metrics.sharpeRatio.toFixed(2)}
            </div>
            <div className={`text-[9px] ${colors.text.tertiary} mt-0.5`}>Risk-adj</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-4">
            {/* PnL Over Time */}
            <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-4`}>
              <div className="mb-3">
                <h3 className={`text-[13px] font-semibold ${colors.text.primary} mb-1`}>PnL Over Time</h3>
                <div className="flex gap-4 text-[9px]">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className={colors.text.tertiary}>Realized PnL</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full" />
                    <span className={colors.text.tertiary}>Unrealized PnL</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className={colors.text.tertiary}>Net PnL</span>
                  </div>
                </div>
              </div>
              <SimpleLineChart
                data={chartData}
                lines={[
                  { dataKey: 'realizedPnl', stroke: '#10b981', strokeWidth: 1.5, name: 'Realized PnL' },
                  { dataKey: 'unrealizedPnl', stroke: '#94a3b8', strokeWidth: 1.5, name: 'Unrealized PnL' },
                  { dataKey: 'netPnl', stroke: '#3b82f6', strokeWidth: 2, name: 'Net PnL' },
                ]}
                height={240}
                formatValue={(val) => `$${val.toFixed(0)}`}
              />
            </div>

            {/* Position & Exposure */}
            <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-4`}>
              <div className="mb-3">
                <h3 className={`text-[13px] font-semibold ${colors.text.primary} mb-1`}>Position & Exposure</h3>
                <div className="flex gap-4 text-[9px]">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className={colors.text.tertiary}>Long Exposure</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span className={colors.text.tertiary}>Short Exposure</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full" />
                    <span className={colors.text.tertiary}>Net Position</span>
                  </div>
                </div>
              </div>
              <SimpleComposedChart
                data={chartData}
                areas={[
                  { dataKey: 'longExposure', fill: '#10b981', stroke: '#10b981', name: 'Long Exposure' },
                  { dataKey: 'shortExposure', fill: '#ef4444', stroke: '#ef4444', name: 'Short Exposure' },
                ]}
                lines={[
                  { dataKey: 'netPosition', stroke: '#3b82f6', strokeWidth: 2, name: 'Net Position' },
                ]}
                height={240}
                formatValue={(val) => val.toFixed(0)}
              />
            </div>

            {/* Volume & Activity */}
            <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-4`}>
              <div className="mb-3">
                <h3 className={`text-[13px] font-semibold ${colors.text.primary} mb-1`}>Volume & Trading Activity</h3>
                <div className="flex gap-4 text-[9px]">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full" />
                    <span className={colors.text.tertiary}>Cumulative Volume</span>
                  </div>
                </div>
              </div>
              <SimpleLineChart
                data={chartData}
                lines={[
                  { dataKey: 'volume', stroke: '#60a5fa', strokeWidth: 3, name: 'Cumulative' },
                ]}
                height={200}
              />
            </div>

            {/* Order Book Imbalance */}
            <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-4`}>
              <div className="mb-3">
                <h3 className={`text-[13px] font-semibold ${colors.text.primary} mb-1`}>Order Book Imbalance</h3>
                <div className="flex gap-4 text-[9px]">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    <span className={colors.text.tertiary}>Imbalance %</span>
                  </div>
                </div>
              </div>
              <SimpleLineChart
                data={chartData}
                lines={[
                  { dataKey: 'imbalance', stroke: '#f97316', strokeWidth: 2, name: 'Imbalance %' },
                ]}
                height={200}
              />
            </div>

            {/* Spread Capture */}
            <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-4`}>
              <div className="mb-3">
                <h3 className={`text-[13px] font-semibold ${colors.text.primary} mb-1`}>Spread Capture</h3>
                <div className="flex gap-4 text-[9px]">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full" />
                    <span className={colors.text.tertiary}>Spread (bps)</span>
                  </div>
                </div>
              </div>
              <SimpleAreaChart
                data={chartData}
                areas={[
                  { dataKey: 'spread', fill: '#06b6d4', stroke: '#06b6d4', name: 'Spread (bps)' },
                ]}
                height={200}
              />
            </div>

            {/* Fill Rate */}
            <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-4`}>
              <div className="mb-3">
                <h3 className={`text-[13px] font-semibold ${colors.text.primary} mb-1`}>Fill Rate Performance</h3>
                <div className="flex gap-4 text-[9px]">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    <span className={colors.text.tertiary}>Fill Rate %</span>
                  </div>
                </div>
              </div>
              <SimpleLineChart
                data={chartData}
                lines={[
                  { dataKey: 'fillRate', stroke: '#10b981', strokeWidth: 2, name: 'Fill Rate %' },
                ]}
                height={200}
              />
            </div>
          </div>

          {/* Right Column - Positions & Risk */}
          <div className="space-y-4">
            {/* Current Positions */}
            <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-4`}>
              <div className="mb-4">
                <h3 className={`text-[13px] font-semibold ${colors.text.primary} mb-1`}>Current Positions</h3>
                <div className="flex gap-4 text-[9px]">
                  <div className={colors.text.tertiary}>
                    Net: <span className={`font-medium ${netExposure >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      ${netExposure.toLocaleString()}
                    </span>
                  </div>
                  <div className={colors.text.tertiary}>
                    Gross: <span className={`font-medium ${colors.text.primary}`}>${totalNotional.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {currentPositions.map((pos) => (
                  <div key={pos.id} className={`${colors.bg.tertiary} border ${colors.border.secondary} rounded-sm p-3`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className={`text-[11px] font-semibold ${colors.text.primary}`}>{pos.pair}</div>
                        <div className={`text-[9px] ${colors.text.tertiary}`}>{pos.exchange}</div>
                      </div>
                      <div className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                        pos.side === 'Long' 
                          ? 'bg-green-500/10 text-green-500' 
                          : 'bg-red-500/10 text-red-500'
                      }`}>
                        {pos.side.toUpperCase()}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[9px] mb-2">
                      <div>
                        <div className={colors.text.tertiary}>Size</div>
                        <div className={`font-medium ${colors.text.primary}`}>{pos.size} BTC</div>
                      </div>
                      <div className="text-right">
                        <div className={colors.text.tertiary}>Notional</div>
                        <div className={`font-medium ${colors.text.primary}`}>${pos.notional.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className={colors.text.tertiary}>Entry</div>
                        <div className={`font-medium ${colors.text.primary}`}>${pos.entryPrice.toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className={colors.text.tertiary}>Current</div>
                        <div className={`font-medium ${colors.text.primary}`}>${pos.currentPrice.toLocaleString()}</div>
                      </div>
                    </div>

                    <div className={`pt-2 border-t ${colors.border.secondary}`}>
                      <div className="flex items-center justify-between">
                        <div className={`text-[9px] ${colors.text.tertiary}`}>
                          Opened {pos.duration} ago
                        </div>
                        <div className={`text-[11px] font-semibold ${pos.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(2)} ({pos.pnlPercent >= 0 ? '+' : ''}{pos.pnlPercent.toFixed(2)}%)
                        </div>
                      </div>
                    </div>

                    {strategyName === 'Multi-Strategy Portfolio' && !selectedPosition && (
                      <button 
                        onClick={() => setSelectedPosition(pos.id)}
                        className={`w-full mt-3 h-7 ${colors.button.primaryBg} hover:opacity-90 text-white rounded text-[10px] font-medium transition-opacity`}
                      >
                        Analyse Position
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Metrics */}
            <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-4`}>
              <h3 className={`text-[13px] font-semibold ${colors.text.primary} mb-4`}>Risk Metrics</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`text-[11px] ${colors.text.tertiary}`}>Max Drawdown</div>
                  <div className="text-[11px] font-semibold text-red-500">{metrics.maxDrawdown.toFixed(2)}</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className={`text-[11px] ${colors.text.tertiary}`}>Sharpe Ratio</div>
                  <div className={`text-[11px] font-semibold ${colors.text.primary}`}>{metrics.sharpeRatio}</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className={`text-[11px] ${colors.text.tertiary}`}>Fill Rate</div>
                  <div className={`text-[11px] font-semibold ${colors.text.primary}`}>{metrics.fillRate.toFixed(1)}%</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className={`text-[11px] ${colors.text.tertiary}`}>Avg Spread</div>
                  <div className={`text-[11px] font-semibold ${colors.text.primary}`}>{metrics.avgSpread.toFixed(1)} bps</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className={`text-[11px] ${colors.text.tertiary}`}>Book Imbalance</div>
                  <div className={`text-[11px] font-semibold ${colors.text.primary}`}>{metrics.avgImbalance.toFixed(1)}%</div>
                </div>
              </div>
            </div>

            {/* Strategy Status */}
            <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-4`}>
              <h3 className={`text-[13px] font-semibold ${colors.text.primary} mb-4`}>Strategy Status</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`text-[11px] ${colors.text.tertiary}`}>Status</div>
                  <div className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[9px] font-medium rounded">
                    RUNNING
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className={`text-[11px] ${colors.text.tertiary}`}>Runtime</div>
                  <div className={`text-[11px] font-semibold ${colors.text.primary}`}>2h 34m</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className={`text-[11px] ${colors.text.tertiary}`}>Total Trades</div>
                  <div className={`text-[11px] font-semibold ${colors.text.primary}`}>247</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className={`text-[11px] ${colors.text.tertiary}`}>Win Rate</div>
                  <div className={`text-[11px] font-semibold text-green-500`}>68.4%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}