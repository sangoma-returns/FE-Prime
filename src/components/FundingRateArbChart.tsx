import { useMemo, useEffect, useState } from 'react';
import { useFundingRatesStore } from '../stores/fundingRatesStore';
import { useFundingRateHistory } from '../hooks/useFundingRateHistory';
import { getMarketMetrics } from '../services/hyperliquidMarketService';

interface FundingRateArbChartProps {
  colors: any;
  theme: string;
  buyAccount: string;
  buyPair: string;
  sellAccount: string;
  sellPair: string;
  buyQuantity: string;
  buyLeverage: string;
  sellQuantity: string;
  sellLeverage: string;
  timeRange: 'Day' | 'Week' | 'Month' | 'Year';
}

export function FundingRateArbChart({
  colors,
  theme,
  buyAccount,
  buyPair,
  sellAccount,
  sellPair,
  buyQuantity,
  buyLeverage,
  sellQuantity,
  sellLeverage,
  timeRange,
}: FundingRateArbChartProps) {
  const isDark = theme === 'dark';
  const { getRate: getFundingRate } = useFundingRatesStore();
  
  // State for live funding rates from Hyperliquid
  const [liveBuyFunding, setLiveBuyFunding] = useState<number | null>(null);
  const [liveSellFunding, setLiveSellFunding] = useState<number | null>(null);
  const [isLoadingFunding, setIsLoadingFunding] = useState(false);

  // Format exchange names (capitalize first letter)
  const formatExchange = (exchange: string) => {
    if (!exchange) return '';
    return exchange.charAt(0).toUpperCase() + exchange.slice(1);
  };

  // Get pair symbol (btc -> BTC, eth -> ETH)
  const getPairSymbol = (pair: string) => {
    if (!pair) return '';
    return pair.toUpperCase();
  };

  // Extract token from pair (handle BTC:USDT-PERP format)
  const getToken = (pair: string) => {
    if (!pair) return '';
    return pair.split(':')[0].split('-')[0].toUpperCase();
  };
  
  // Check if a pair is a HIP-3 pair (has dex prefix like xyz:, flx:, etc.)
  const isHip3Pair = (pair: string) => {
    if (!pair) return false;
    const hip3Dexes = ['xyz:', 'vntl:', 'km:', 'cash:', 'flx:', 'hyna:'];
    return hip3Dexes.some(dex => pair.toLowerCase().startsWith(dex));
  };

  // Extract DEX name from HIP-3 pair (e.g., "xyz:SILVER:PERP-USDC" -> "xyz")
  const extractDex = (pair: string) => {
    if (!pair || !pair.includes(':')) return '';
    return pair.split(':')[0].toLowerCase();
  };

  // Fetch funding rates for HIP-3 pairs
  useEffect(() => {
    const fetchHip3FundingRates = async () => {
      const buyIsHip3 = isHip3Pair(buyPair);
      const sellIsHip3 = isHip3Pair(sellPair);
      
      if (!buyIsHip3 && !sellIsHip3) {
        // Neither is HIP-3, clear live funding
        setLiveBuyFunding(null);
        setLiveSellFunding(null);
        return;
      }
      
      setIsLoadingFunding(true);
      
      try {
        // Fetch buy funding if it's a HIP-3 pair
        if (buyIsHip3 && buyPair) {
          const dex = extractDex(buyPair);
          console.log(`[FundingRateArbChart] Fetching buy funding for ${buyPair} on ${dex}`);
          const metrics = await getMarketMetrics(buyPair, dex);
          setLiveBuyFunding(metrics.fundingRate);
          console.log(`[FundingRateArbChart] Buy funding rate: ${metrics.fundingRate}%`);
        } else {
          setLiveBuyFunding(null);
        }
        
        // Fetch sell funding if it's a HIP-3 pair
        if (sellIsHip3 && sellPair) {
          const dex = extractDex(sellPair);
          console.log(`[FundingRateArbChart] Fetching sell funding for ${sellPair} on ${dex}`);
          const metrics = await getMarketMetrics(sellPair, dex);
          setLiveSellFunding(metrics.fundingRate);
          console.log(`[FundingRateArbChart] Sell funding rate: ${metrics.fundingRate}%`);
        } else {
          setLiveSellFunding(null);
        }
      } catch (error) {
        console.error('[FundingRateArbChart] Error fetching HIP-3 funding rates:', error);
        // Keep previous values on error
      } finally {
        setIsLoadingFunding(false);
      }
    };
    
    if (buyPair && sellPair) {
      fetchHip3FundingRates();
    }
  }, [buyPair, sellPair]);

  const buyToken = getToken(buyPair);
  const sellToken = getToken(sellPair);
  const buyExchangeName = formatExchange(buyAccount);
  const sellExchangeName = formatExchange(sellAccount);
  
  // Get display names for HIP-3 pairs (show DEX name instead of "Hyperliquid")
  const getBuyDisplayName = () => {
    if (isHip3Pair(buyPair)) {
      const dex = extractDex(buyPair);
      return dex.toUpperCase();
    }
    return buyExchangeName;
  };
  
  const getSellDisplayName = () => {
    if (isHip3Pair(sellPair)) {
      const dex = extractDex(sellPair);
      return dex.toUpperCase();
    }
    return sellExchangeName;
  };
  
  const buyDisplayName = getBuyDisplayName();
  const sellDisplayName = getSellDisplayName();

  // Get current funding rates from store (fallback for non-HIP-3 pairs)
  const buyFundingRate = liveBuyFunding !== null 
    ? liveBuyFunding 
    : getFundingRate(buyToken, formatExchange(buyAccount)) || 5.56;
  const sellFundingRate = liveSellFunding !== null 
    ? liveSellFunding 
    : getFundingRate(sellToken, formatExchange(sellAccount)) || 10.95;

  // Parse user inputs
  const buyQty = parseFloat(buyQuantity) || 0;
  const sellQty = parseFloat(sellQuantity) || 0;
  const buyLev = parseFloat(buyLeverage) || 1;
  const sellLev = parseFloat(sellLeverage) || 1;

  // Calculate notional with leverage
  const buyNotional = buyQty * buyLev;
  const sellNotional = sellQty * sellLev;
  const positionNotional = Math.max(buyNotional, sellNotional);

  // Current funding rate metrics
  const currentRateDiff = sellFundingRate - buyFundingRate;
  const annualDollarReturn = positionNotional * (currentRateDiff / 100);
  const dailyDollarReturn = annualDollarReturn / 365;

  // === GENERATE PROJECTED EARNINGS DATA ===
  const projectedEarningsData = useMemo(() => {
    if (positionNotional === 0) return [];

    const annualReturn = positionNotional * (currentRateDiff / 100);

    let numPoints: number;
    let totalDays: number;

    switch (timeRange) {
      case 'Day':
        numPoints = 24;
        totalDays = 1;
        break;
      case 'Week':
        numPoints = 7;
        totalDays = 7;
        break;
      case 'Month':
        numPoints = 30;
        totalDays = 30;
        break;
      case 'Year':
        numPoints = 12;
        totalDays = 365;
        break;
    }

    const projectedData = [];
    const now = Date.now();

    for (let i = 0; i <= numPoints; i++) {
      const progressRatio = i / numPoints;
      const elapsedDays = totalDays * progressRatio;
      const cumulativePnL = (annualReturn / 365) * elapsedDays;
      const timestamp = now + elapsedDays * 24 * 60 * 60 * 1000;

      projectedData.push({
        timestamp,
        elapsedDays,
        progressRatio,
        cumulativePnL,
      });
    }

    return projectedData;
  }, [positionNotional, currentRateDiff, timeRange]);

  // Generate X-axis labels
  const xAxisLabels = useMemo(() => {
    const labels: string[] = [];
    const numLabels = 13;

    switch (timeRange) {
      case 'Day':
        for (let i = 0; i < numLabels; i++) {
          const hour = Math.floor((i * 24) / (numLabels - 1));
          labels.push(`${hour.toString().padStart(2, '0')}:00`);
        }
        break;
      case 'Week':
        for (let i = 0; i < numLabels; i++) {
          const day = Math.floor((i * 7) / (numLabels - 1));
          labels.push(`D${day}`);
        }
        break;
      case 'Month':
        for (let i = 0; i < numLabels; i++) {
          const day = Math.floor((i * 30) / (numLabels - 1));
          labels.push(`D${day}`);
        }
        break;
      case 'Year':
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Dec'];
        for (let i = 0; i < numLabels; i++) {
          const monthIndex = Math.floor((i * 12) / (numLabels - 1));
          labels.push(months[monthIndex]);
        }
        break;
    }

    return labels;
  }, [timeRange]);

  // Calculate Y-axis range and labels
  const { yAxisLabels, yAxisRange } = useMemo(() => {
    if (projectedEarningsData.length === 0) {
      return { yAxisLabels: [], yAxisRange: 0.01 };
    }

    const finalValue = projectedEarningsData[projectedEarningsData.length - 1].cumulativePnL;
    const range = Math.max(Math.abs(finalValue) * 1.2, 0.01);

    const labels = [];
    for (let i = 0; i <= 6; i++) {
      const value = range - (i * (range * 2)) / 6;
      const absValue = Math.abs(value);
      const sign = value >= 0 ? '+' : '-';

      if (absValue >= 1000) {
        labels.push(`${sign}$${(absValue / 1000).toFixed(1)}k`);
      } else if (absValue >= 1) {
        labels.push(`${sign}$${absValue.toFixed(0)}`);
      } else {
        labels.push(`${sign}$${absValue.toFixed(2)}`);
      }
    }

    return { yAxisLabels: labels, yAxisRange: range };
  }, [projectedEarningsData]);

  // Generate SVG path
  const { pathData, fillPathAbove, fillPathBelow } = useMemo(() => {
    if (projectedEarningsData.length === 0) {
      return { pathData: '', fillPathAbove: '', fillPathBelow: '' };
    }

    const width = 1000;
    const height = 300;
    const zeroY = height / 2;

    const points = projectedEarningsData.map((point, index) => {
      const x = (index / (projectedEarningsData.length - 1)) * width;
      const normalizedValue = point.cumulativePnL / yAxisRange;
      const y = zeroY - normalizedValue * (height / 2);
      return { x, y };
    });

    const pathCommands = points
      .map((point, index) => (index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`))
      .join(' ');

    const isPositive = currentRateDiff >= 0;

    let fillAbove = '';
    if (isPositive && points.length > 0) {
      fillAbove = [
        `M ${points[0].x} ${zeroY}`,
        ...points.map((p) => `L ${p.x} ${p.y}`),
        `L ${points[points.length - 1].x} ${zeroY}`,
        'Z',
      ].join(' ');
    }

    let fillBelow = '';
    if (!isPositive && points.length > 0) {
      fillBelow = [
        `M ${points[0].x} ${zeroY}`,
        ...points.map((p) => `L ${p.x} ${p.y}`),
        `L ${points[points.length - 1].x} ${zeroY}`,
        'Z',
      ].join(' ');
    }

    return { pathData: pathCommands, fillPathAbove: fillAbove, fillPathBelow: fillBelow };
  }, [projectedEarningsData, yAxisRange, currentRateDiff]);

  // Calculate timeframe display text
  const timeRangeText = useMemo(() => {
    const finalEarnings = projectedEarningsData.length > 0 
      ? projectedEarningsData[projectedEarningsData.length - 1].cumulativePnL 
      : 0;
    
    return {
      period: timeRange === 'Day' ? '24h' : timeRange === 'Week' ? '7d' : timeRange === 'Month' ? '30d' : '365d',
      earnings: finalEarnings,
    };
  }, [timeRange, projectedEarningsData]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header Info Bar */}
      <div className={`border-b ${colors.border.primary} px-6 py-3 flex items-center gap-6`}>
        {/* Exchange Pair */}
        <div className="flex items-center gap-3">
          <span className={`text-lg font-bold ${colors.text.primary}`}>
            {/* Show actual pair names for HIP-3, otherwise show exchange names */}
            {isHip3Pair(buyPair) || isHip3Pair(sellPair) 
              ? `${buyPair.toUpperCase()} / ${sellPair.toUpperCase()}`
              : `${formatExchange(buyAccount)}/${formatExchange(sellAccount)}`
            }
          </span>
          <span className={`text-xs ${colors.text.tertiary} font-medium`}>PERP</span>
        </div>

        {/* Funding Rate Diff */}
        <div className={`text-lg font-mono ${currentRateDiff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {currentRateDiff >= 0 ? '+' : ''}
          {currentRateDiff.toFixed(2)}%
        </div>

        {/* Projected Earnings for Selected Timeframe */}
        <div className="flex flex-col">
          <span className={`${colors.text.tertiary} text-label`}>Est. {timeRangeText.period} Earnings:</span>
          <span className={`text-numeric font-semibold ${timeRangeText.earnings >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {timeRangeText.earnings >= 0 ? '+' : ''}${Math.abs(timeRangeText.earnings).toFixed(2)}
          </span>
        </div>

        {/* Detailed Metrics */}
        <div className="flex items-center gap-4 ml-auto text-numeric">
          <div className="flex flex-col">
            <span className={`${colors.text.tertiary} text-label`}>Buy Funding:</span>
            <span className={colors.text.primary}>
              {isLoadingFunding ? '...' : `${buyFundingRate.toFixed(4)}%`}
            </span>
          </div>
          <div className="flex flex-col">
            <span className={`${colors.text.tertiary} text-label`}>Sell Funding:</span>
            <span className="text-green-500">
              {isLoadingFunding ? '...' : `+${sellFundingRate.toFixed(4)}%`}
            </span>
          </div>
          <div className="flex flex-col">
            <span className={`${colors.text.tertiary} text-label`}>Spread:</span>
            <span className="text-green-500">+{currentRateDiff.toFixed(4)}%</span>
          </div>
          <div className="flex flex-col">
            <span className={`${colors.text.tertiary} text-label`}>Annual APY:</span>
            <span className={`${currentRateDiff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {currentRateDiff >= 0 ? '+' : ''}${annualDollarReturn.toFixed(0)}
            </span>
          </div>
          
          {/* Exchange Volumes */}
          <div className="flex flex-col">
            <span className={`${colors.text.tertiary} text-label`}>{buyExchangeName} Vol:</span>
            <span className={`text-numeric ${colors.text.primary}`}>$2.4B</span>
          </div>
          <div className="flex flex-col">
            <span className={`${colors.text.tertiary} text-label`}>{sellExchangeName} Vol:</span>
            <span className={`text-numeric ${colors.text.primary}`}>$1.8B</span>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex-1 flex">
        {/* Y-axis labels */}
        <div className="flex flex-col justify-between py-4 pr-3 pl-2">
          {yAxisLabels.map((label, index) => (
            <span key={index} className={`text-label ${colors.text.tertiary}`}>
              {label}
            </span>
          ))}
        </div>

        {/* Chart area */}
        <div className="flex-1 relative">
          <svg width="100%" height="100%" viewBox="0 0 1000 300" preserveAspectRatio="none">
            {/* Horizontal grid lines */}
            <line x1="0" y1="25" x2="1000" y2="25" stroke={isDark ? '#1a1a1a' : '#e5e5e5'} strokeWidth="0.5" />
            <line x1="0" y1="75" x2="1000" y2="75" stroke={isDark ? '#1a1a1a' : '#e5e5e5'} strokeWidth="0.5" />
            <line x1="0" y1="125" x2="1000" y2="125" stroke={isDark ? '#1a1a1a' : '#e5e5e5'} strokeWidth="0.5" />
            <line x1="0" y1="175" x2="1000" y2="175" stroke={isDark ? '#1a1a1a' : '#e5e5e5'} strokeWidth="0.5" />
            <line x1="0" y1="225" x2="1000" y2="225" stroke={isDark ? '#1a1a1a' : '#e5e5e5'} strokeWidth="0.5" />
            <line x1="0" y1="275" x2="1000" y2="275" stroke={isDark ? '#1a1a1a' : '#e5e5e5'} strokeWidth="0.5" />

            {/* Define gradients */}
            <defs>
              <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="redGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#dc2626" stopOpacity="0" />
                <stop offset="100%" stopColor="#dc2626" stopOpacity="0.3" />
              </linearGradient>
            </defs>

            {/* Zero line */}
            <line
              x1="0"
              y1="150"
              x2="1000"
              y2="150"
              stroke={isDark ? '#404040' : '#999999'}
              strokeWidth="1"
              strokeDasharray="4,4"
            />

            {/* Fill above zero */}
            {fillPathAbove && <path d={fillPathAbove} fill="url(#greenGradient)" />}

            {/* Fill below zero */}
            {fillPathBelow && <path d={fillPathBelow} fill="url(#redGradient)" />}

            {/* Main projection line */}
            {pathData && (
              <path
                d={pathData}
                fill="none"
                stroke={currentRateDiff >= 0 ? '#10b981' : '#dc2626'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between px-12 pt-2 pb-1">
        {xAxisLabels.map((label, index) => (
          <span key={index} className={`text-[10px] ${colors.text.tertiary} font-mono`}>
            {label}
          </span>
        ))}
      </div>

      {/* Time axis label */}
      <div className="text-center pb-2">
        <span className={`text-label ${colors.text.tertiary}`}>
          Time ({timeRange === 'Day' ? 'UTC Hours' : timeRange === 'Year' ? 'Months' : 'Days'})
        </span>
      </div>
    </div>
  );
}