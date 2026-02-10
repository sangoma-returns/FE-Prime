import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  Maximize2, Settings, CandlestickChart as CandleIcon
} from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';
import { fetchKlineData, subscribeToPrice, type OHLCData } from '../services/priceService';

// Generate mock price data with OHLC
const generatePriceData = () => {
  const data = [];
  let basePrice = 89100;
  const now = Date.now();
  
  for (let i = 0; i < 100; i++) {
    const open = basePrice;
    const high = open + Math.random() * 50;
    const low = open - Math.random() * 50;
    const close = low + Math.random() * (high - low);
    basePrice = close;
    
    data.push({
      time: new Date(now - (100 - i) * 15 * 60 * 1000).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      price: parseFloat(close.toFixed(2)),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.random() * 1000000
    });
  }
  return data;
};

// Simple candlestick visualization using SVG
const CandlestickChart = ({ data }: { data: any[] }) => {
  const { colors, theme } = useThemeStore();
  
  // Calculate domain with dynamic padding based on price range
  const allPrices = data.flatMap(d => [d.high, d.low]);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = maxPrice - minPrice;
  
  // Use 5% padding instead of fixed $50
  const padding = priceRange * 0.05;
  const domainMin = minPrice - padding;
  const domainMax = maxPrice + padding;
  const domainRange = domainMax - domainMin;

  // Define margins
  const marginTop = 10;
  const marginRight = 50;
  const marginBottom = 30;
  const marginLeft = 0;

  // Get color values for SVG based on theme
  const gridColor = theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';
  const textColor = theme === 'light' ? '#6B6B6B' : '#9A9A9A';

  // Format price with appropriate decimal places
  const formatPrice = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    } else if (value >= 1) {
      return `$${value.toFixed(2)}`;
    } else if (value >= 0.01) {
      return `$${value.toFixed(4)}`;
    } else {
      return `$${value.toFixed(6)}`;
    }
  };
  
  return (
    <div className="relative w-full h-full">
      <svg width="100%" height="100%" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet">
        <defs>
          <clipPath id="chartArea">
            <rect x={marginLeft} y={marginTop} width={800 - marginLeft - marginRight} height={400 - marginTop - marginBottom} />
          </clipPath>
        </defs>

        {/* Grid lines */}
        <g clipPath="url(#chartArea)">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = marginTop + ratio * (400 - marginTop - marginBottom);
            return (
              <line
                key={i}
                x1={marginLeft}
                y1={y}
                x2={800 - marginRight}
                y2={y}
                stroke={gridColor}
                strokeDasharray="3 3"
              />
            );
          })}
        </g>

        {/* Candlesticks */}
        <g clipPath="url(#chartArea)">
          {data.map((item, index) => {
            const chartWidth = 800 - marginLeft - marginRight;
            const chartHeight = 400 - marginTop - marginBottom;
            
            const x = marginLeft + (index / data.length) * chartWidth;
            const candleWidth = (chartWidth / data.length) * 0.6;
            const isPositive = item.close >= item.open;
            const color = isPositive ? '#1FBF75' : '#E24A4A';

            // Calculate Y positions (inverted because SVG y-axis goes down)
            const highY = marginTop + ((domainMax - item.high) / domainRange) * chartHeight;
            const lowY = marginTop + ((domainMax - item.low) / domainRange) * chartHeight;
            const openY = marginTop + ((domainMax - item.open) / domainRange) * chartHeight;
            const closeY = marginTop + ((domainMax - item.close) / domainRange) * chartHeight;

            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.abs(closeY - openY) || 1;
            const wickX = x + candleWidth / 2;

            return (
              <g key={index}>
                {/* Wick */}
                <line
                  x1={wickX}
                  y1={highY}
                  x2={wickX}
                  y2={lowY}
                  stroke={color}
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
                {/* Body */}
                <rect
                  x={x}
                  y={bodyTop}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={color}
                  stroke={color}
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}
        </g>

        {/* Price labels on right */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const price = domainMax - (domainRange * ratio);
          const y = marginTop + ratio * (400 - marginTop - marginBottom);
          return (
            <text
              key={i}
              x={800 - marginRight + 35}
              y={y}
              fill={textColor}
              fontSize="10"
              textAnchor="end"
              dominantBaseline="middle"
            >
              {formatPrice(price)}
            </text>
          );
        })}

        {/* Time labels at bottom */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const chartWidth = 800 - marginLeft - marginRight;
          const x = marginLeft + ratio * chartWidth;
          const dataIndex = Math.floor(ratio * (data.length - 1));
          return (
            <text
              key={i}
              x={x}
              y={400 - marginBottom + 15}
              fill={textColor}
              fontSize="10"
              textAnchor="middle"
            >
              {data[dataIndex]?.time || ''}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

export function TradingChart({ selectedAsset }: { selectedAsset?: string }) {
  const { colors, theme } = useThemeStore();
  const [timeframe, setTimeframe] = useState('15m');
  const [chartType, setChartType] = useState<'line' | 'candle'>('candle');
  const [isLoading, setIsLoading] = useState(true);
  
  // Store chart data in state - fetch live data on mount and timeframe/asset change
  const [priceData, setPriceData] = useState<OHLCData[]>([]);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const lastUpdateRef = useRef(Date.now());

  // Memoize chart data to prevent unnecessary re-renders
  const chartData = useMemo(() => priceData, [priceData]);

  // Fetch historical data when asset or timeframe changes
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      setIsLoading(true);
      
      // Fetch live data from Binance (crypto) or Hyperliquid (RWA)
      const data = await fetchKlineData(selectedAsset || 'BTC:PERP-USD', timeframe, 100);
      
      if (isMounted) {
        setPriceData(data);
        setIsLoading(false);
      }
    };
    
    loadData();
    
    // Refresh data every 30 seconds for line chart only
    let interval: NodeJS.Timeout | undefined;
    if (chartType === 'line') {
      interval = setInterval(loadData, 30000);
    }
    
    return () => {
      isMounted = false;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [selectedAsset, timeframe, chartType]);

  // Subscribe to real-time price updates via WebSocket
  useEffect(() => {
    const unsubscribe = subscribeToPrice(
      selectedAsset || 'BTC:PERP-USD',
      (price) => {
        setLivePrice(price);
        
        // Only update priceData for candlestick chart, not line chart
        // Line chart uses the 30-second interval refresh to avoid flicker
        if (chartType !== 'candle') {
          return;
        }
        
        // Throttle updates to prevent excessive re-renders
        const now = Date.now();
        if (now - lastUpdateRef.current < 1000) {
          return; // Skip update if less than 1 second since last update
        }
        lastUpdateRef.current = now;
        
        // Update the last data point with live price
        setPriceData(prev => {
          if (prev.length === 0) return prev;
          const newData = [...prev];
          newData[newData.length - 1] = {
            ...newData[newData.length - 1],
            price: price,
            close: price,
          };
          return newData;
        });
      }
    );
    
    return unsubscribe;
  }, [selectedAsset, chartType]);

  const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];

  const currentPrice = priceData[priceData.length - 1]?.price || 89128.65;
  const firstPrice = priceData[0]?.price || 89000;
  const priceChange = currentPrice - firstPrice;
  const priceChangePercent = ((priceChange / firstPrice) * 100).toFixed(2);
  const isPositive = priceChange >= 0;
  
  // Parse selectedAsset to get display name (e.g., "BTC:PERP-USD" -> "BTC/USD")
  const displayPair = selectedAsset 
    ? `${selectedAsset.split(':')[0]}/USD`
    : 'BTC/USD';

  // Theme-based colors for chart
  const gridStroke = theme === 'light' ? '#E5E7EB' : 'rgba(255,255,255,0.06)';
  const axisStroke = theme === 'light' ? '#9CA3AF' : '#6B6B6B';
  const tickFill = theme === 'light' ? '#6B6B6B' : '#9A9A9A';
  const tooltipBg = theme === 'light' ? 'white' : '#1C1C1C';
  const tooltipBorder = theme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
  const tooltipText = theme === 'light' ? '#1C1C1C' : 'white';
  const labelColor = theme === 'light' ? '#6B6B6B' : '#9A9A9A';

  // Calculate dynamic Y-axis domain with 5% padding
  const yAxisDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 100];
    
    const prices = chartData.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice;
    const padding = range * 0.05; // 5% padding
    
    return [minPrice - padding, maxPrice + padding];
  }, [chartData]);

  // Format price with appropriate decimal places based on magnitude
  const formatPrice = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    } else if (value >= 1) {
      return `$${value.toFixed(2)}`;
    } else if (value >= 0.01) {
      return `$${value.toFixed(4)}`;
    } else {
      return `$${value.toFixed(6)}`;
    }
  };

  return (
    <div className={`flex flex-col ${colors.bg.primary}`} style={{ width: '100%', height: '100%' }}>
      {/* Top Controls */}
      <div className={`flex items-center justify-between px-4 py-2 border-b ${colors.border.primary}`}>
        <div className="flex items-center gap-4">
          {/* Timeframe Buttons */}
          <div className="flex items-center gap-1">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  timeframe === tf
                    ? 'bg-[#C9A36A] text-white'
                    : `${colors.text.tertiary} hover:${colors.bg.subtle}`
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
          
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setChartType(chartType === 'line' ? 'candle' : 'line')}
            className={`p-1.5 rounded transition-colors ${
              chartType === 'candle'
                ? 'bg-[#C9A36A]/10 text-[#C9A36A]'
                : `${colors.text.tertiary} hover:${colors.bg.subtle}`
            }`}
            title="Toggle Candlestick Chart"
          >
            <CandleIcon className="w-4 h-4" />
          </button>
          <button className={`p-1.5 rounded hover:${colors.bg.subtle} ${colors.text.tertiary}`}>
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart Header Info */}
      <div className={`px-4 py-2 border-b ${colors.border.primary} flex items-center gap-6 ${colors.bg.primary}`}>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${colors.text.primary}`}>{displayPair}</span>
          <span className={`text-xs ${colors.text.quaternary}`}>• {timeframe}</span>
          {livePrice && (
            <span className="flex items-center gap-1 text-[10px] text-[#1FBF75]">
              <span className="w-1.5 h-1.5 bg-[#1FBF75] rounded-full animate-pulse"></span>
              Live
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-[10px]">
          <div>
            <span className={colors.text.quaternary}>O </span>
            <span className={colors.text.primary}>{firstPrice.toFixed(2)}</span>
          </div>
          <div>
            <span className={colors.text.quaternary}>H </span>
            <span className={colors.text.primary}>{Math.max(...priceData.map(d => d.high || d.price)).toFixed(2)}</span>
          </div>
          <div>
            <span className={colors.text.quaternary}>L </span>
            <span className={colors.text.primary}>{Math.min(...priceData.map(d => d.low || d.price)).toFixed(2)}</span>
          </div>
          <div>
            <span className={colors.text.quaternary}>C </span>
            <span className={colors.text.primary}>{currentPrice.toFixed(2)}</span>
          </div>
          <div className={isPositive ? 'text-[#1FBF75]' : 'text-[#E24A4A]'}>
            {isPositive ? '+' : ''}{priceChangePercent}%
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div 
        className={`flex-1 relative ${colors.bg.primary}`} 
        style={{ minHeight: '500px', height: '100%' }}
      >
          {isLoading && chartData.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-[#C9A36A] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <div className={`text-xs ${colors.text.tertiary}`}>Loading live data...</div>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`text-sm ${colors.text.tertiary}`}>No data available</div>
            </div>
          ) : (
            <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          {chartType === 'line' ? (
            <ResponsiveContainer width="100%" height="100%" key={`line-${chartData.length}`}>
            <AreaChart 
              data={chartData} 
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C9A36A" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#C9A36A" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={gridStroke} 
                vertical={false}
              />
              <XAxis 
                dataKey="time" 
                stroke={axisStroke}
                tick={{ fill: tickFill, fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: gridStroke }}
                interval="preserveStartEnd"
                minTickGap={50}
              />
              <YAxis 
                stroke={axisStroke}
                tick={{ fill: tickFill, fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: gridStroke }}
                domain={yAxisDomain}
                orientation="right"
                tickCount={5}
                tickFormatter={(value) => formatPrice(value)}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: tooltipBg,
                  border: `1px solid ${tooltipBorder}`,
                  borderRadius: '4px',
                  fontSize: '11px',
                  padding: '8px',
                  color: tooltipText
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                labelStyle={{ color: labelColor, marginBottom: '4px' }}
              />
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke="#C9A36A" 
                strokeWidth={2}
                fill="url(#priceGradient)" 
                animationDuration={500}
                isAnimationActive={false}
              />
            </AreaChart>
            </ResponsiveContainer>
          ) : (
            <CandlestickChart data={chartData} />
          )}
            </div>
          )}
      </div>
    </div>
  );
}