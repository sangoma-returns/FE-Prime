import { useMemo } from 'react';

interface ExchangeExecutionChartProps {
  colors: any;
  exchanges: string[];
}

// Color palette for exchange lines
const EXCHANGE_COLORS = [
  '#10b981', // green
  '#ec4899', // pink
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#14b8a6', // teal
];

export default function ExchangeExecutionChart({ colors, exchanges }: ExchangeExecutionChartProps) {
  // Handle empty or undefined exchanges
  const validExchanges = exchanges && exchanges.length > 0 ? exchanges : ['Hyperliquid', 'Paradex'];
  
  // Generate random execution percentages that add up to 100%
  const { exchangeDataSets, totalData } = useMemo(() => {
    const dataPoints = 22;
    const numExchanges = validExchanges.length;
    
    // Generate final percentages for each exchange that add up to 100%
    const finalPercentages: number[] = [];
    let remaining = 100;
    
    for (let i = 0; i < numExchanges - 1; i++) {
      const maxAllocation = remaining - (numExchanges - i - 1) * 10; // Ensure at least 10% for remaining
      const minAllocation = Math.max(10, remaining - (numExchanges - i - 1) * 40); // At least 10%, but allow variance
      const allocation = minAllocation + Math.random() * (maxAllocation - minAllocation);
      finalPercentages.push(allocation);
      remaining -= allocation;
    }
    finalPercentages.push(remaining); // Last exchange gets the remainder
    
    // Generate data points for each exchange
    const exchangeDataSets: number[][] = [];
    
    for (let exchangeIdx = 0; exchangeIdx < numExchanges; exchangeIdx++) {
      const finalPercent = finalPercentages[exchangeIdx];
      const exchangePoints: number[] = [];
      
      for (let i = 0; i < dataPoints; i++) {
        const progress = i / (dataPoints - 1);
        
        // Add some randomness to the curve
        const noise = (Math.random() - 0.5) * 5;
        
        // Calculate cumulative percentages with easing
        const eased = progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        const percent = Math.min(100, Math.max(0, eased * finalPercent + noise));
        exchangePoints.push(percent);
      }
      
      exchangeDataSets.push(exchangePoints);
    }
    
    // Calculate total (sum of all exchanges)
    const totalPoints: number[] = [];
    for (let i = 0; i < dataPoints; i++) {
      let sum = 0;
      for (let exchangeIdx = 0; exchangeIdx < numExchanges; exchangeIdx++) {
        sum += exchangeDataSets[exchangeIdx][i];
      }
      totalPoints.push(Math.min(100, sum));
    }
    
    // Convert percentages to Y coordinates (0% = 200, 100% = 10)
    const toY = (percent: number) => 200 - (percent / 100) * 190;
    
    return {
      exchangeDataSets: exchangeDataSets.map(points => points.map(toY)),
      totalData: totalPoints.map(toY),
    };
  }, [validExchanges]); // Regenerate when exchanges change

  const xPositions = [40,80,120,160,200,240,280,320,360,400,440,480,520,560,600,640,680,720,760,800,840,880];

  return (
    <svg width="100%" height="100%" viewBox="0 0 900 220" preserveAspectRatio="none">
      {/* Y-axis */}
      <line x1="40" y1="10" x2="40" y2="200" stroke="currentColor" strokeWidth="1" className={colors.text.tertiary} opacity="0.3" />
      <line x1="40" y1="200" x2="880" y2="200" stroke="currentColor" strokeWidth="1" className={colors.text.tertiary} opacity="0.3" />
      
      {/* Grid lines */}
      <line x1="40" y1="57" x2="880" y2="57" stroke="currentColor" strokeWidth="0.5" className={colors.text.tertiary} opacity="0.1" strokeDasharray="2,2" />
      <line x1="40" y1="104" x2="880" y2="104" stroke="currentColor" strokeWidth="0.5" className={colors.text.tertiary} opacity="0.1" strokeDasharray="2,2" />
      <line x1="40" y1="151" x2="880" y2="151" stroke="currentColor" strokeWidth="0.5" className={colors.text.tertiary} opacity="0.1" strokeDasharray="2,2" />
      
      {/* Y-axis labels */}
      <text x="8" y="15" fill="currentColor" fontSize="9" className={colors.text.tertiary}>100%</text>
      <text x="14" y="62" fill="currentColor" fontSize="9" className={colors.text.tertiary}>75%</text>
      <text x="14" y="109" fill="currentColor" fontSize="9" className={colors.text.tertiary}>50%</text>
      <text x="14" y="156" fill="currentColor" fontSize="9" className={colors.text.tertiary}>25%</text>
      <text x="18" y="205" fill="currentColor" fontSize="9" className={colors.text.tertiary}>0%</text>
      
      {/* X-axis labels */}
      <text x="150" y="215" fill="currentColor" fontSize="9" className={colors.text.tertiary}>08:46</text>
      <text x="450" y="215" fill="currentColor" fontSize="9" className={colors.text.tertiary}>08:47</text>
      <text x="740" y="215" fill="currentColor" fontSize="9" className={colors.text.tertiary}>08:48</text>
      
      {/* Exchange lines */}
      {exchangeDataSets.map((dataSet, idx) => (
        <path
          key={`exchange-${idx}`}
          d={`M ${xPositions[0]} ${dataSet[0]} ${xPositions.map((x, i) => `L ${x} ${dataSet[i]}`).join(' ')}`}
          fill="none"
          stroke={EXCHANGE_COLORS[idx % EXCHANGE_COLORS.length]}
          strokeWidth="2"
        />
      ))}
      
      {/* Total line (blue) - thicker */}
      <path
        d={`M ${xPositions[0]} ${totalData[0]} ${xPositions.map((x, i) => `L ${x} ${totalData[i]}`).join(' ')}`}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2.5"
      />
      
      {/* Dot markers */}
      {xPositions.map((x, i) => (
        <g key={i}>
          {/* Exchange dots */}
          {exchangeDataSets.map((dataSet, idx) => (
            <circle 
              key={`dot-${idx}`}
              cx={x} 
              cy={dataSet[i]} 
              r="2.5" 
              fill={EXCHANGE_COLORS[idx % EXCHANGE_COLORS.length]} 
            />
          ))}
          {/* Total dot */}
          <circle cx={x} cy={totalData[i]} r="3" fill="#3b82f6" />
        </g>
      ))}
    </svg>
  );
}