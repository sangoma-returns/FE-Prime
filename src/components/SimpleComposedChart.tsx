import { useThemeStore } from '../stores/themeStore';

interface DataPoint {
  [key: string]: any;
}

interface SimpleComposedChartProps {
  data: DataPoint[];
  lines?: Array<{
    dataKey: string;
    stroke: string;
    strokeWidth?: number;
    name: string;
  }>;
  areas?: Array<{
    dataKey: string;
    fill: string;
    stroke: string;
    name: string;
  }>;
  bars?: Array<{
    dataKey: string;
    fill: string;
    name: string;
  }>;
  height?: number;
  formatValue?: (value: number) => string;
}

export default function SimpleComposedChart({ 
  data, 
  lines = [], 
  areas = [], 
  bars = [], 
  height = 240,
  formatValue = (val) => val.toFixed(0)
}: SimpleComposedChartProps) {
  const { colors, theme } = useThemeStore();
  const isDark = theme === 'dark';

  if (!data || data.length === 0) return null;

  const padding = { top: 20, right: 20, bottom: 30, left: 60 };
  const chartWidth = 800;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate min/max for all data
  let globalMin = Infinity;
  let globalMax = -Infinity;

  [...lines, ...areas, ...bars].forEach(item => {
    data.forEach(point => {
      const value = point[item.dataKey];
      if (typeof value === 'number' && !isNaN(value)) {
        globalMin = Math.min(globalMin, value);
        globalMax = Math.max(globalMax, value);
      }
    });
  });

  // Add padding
  const range = globalMax - globalMin;
  const yMin = globalMin - range * 0.15;
  const yMax = globalMax + range * 0.15;

  // Create line path
  const createLinePath = (dataKey: string) => {
    const points = data.map((point, i) => {
      const x = (i / (data.length - 1)) * chartWidth;
      const value = point[dataKey];
      const y = chartHeight - ((value - yMin) / (yMax - yMin)) * chartHeight;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  // Create area path
  const createAreaPath = (dataKey: string) => {
    const topPoints = data.map((point, i) => {
      const x = (i / (data.length - 1)) * chartWidth;
      const value = point[dataKey];
      const y = chartHeight - ((value - yMin) / (yMax - yMin)) * chartHeight;
      return `${x},${y}`;
    });
    const zeroY = chartHeight - ((-yMin) / (yMax - yMin)) * chartHeight;
    const bottomLine = `L ${chartWidth},${zeroY} L 0,${zeroY} Z`;
    return `M ${topPoints.join(' L ')} ${bottomLine}`;
  };

  // Y-axis labels
  const yLabels = [];
  for (let i = 0; i <= 4; i++) {
    const value = yMin + (yMax - yMin) * (i / 4);
    const y = chartHeight - (i / 4) * chartHeight;
    yLabels.push({ y, value });
  }

  // X-axis labels
  const xLabels = [];
  const labelCount = Math.min(8, data.length);
  for (let i = 0; i < labelCount; i++) {
    const index = Math.floor((i / (labelCount - 1)) * (data.length - 1));
    const x = (i / (labelCount - 1)) * chartWidth;
    xLabels.push({ x, label: data[index]?.time || '' });
  }

  return (
    <div style={{ width: '100%', height: `${height}px`, minHeight: `${height}px` }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth + padding.left + padding.right} ${height}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          {areas.map((area, i) => (
            <linearGradient key={i} id={`composed-gradient-${i}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={area.fill} stopOpacity="0.25" />
              <stop offset="100%" stopColor={area.fill} stopOpacity="0.02" />
            </linearGradient>
          ))}
        </defs>
        
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Grid */}
          <g opacity={0.1}>
            {yLabels.map((label, i) => (
              <line
                key={i}
                x1={0}
                y1={label.y}
                x2={chartWidth}
                y2={label.y}
                stroke={isDark ? '#666' : '#cbd5e1'}
                strokeWidth={0.5}
                strokeDasharray="2 4"
              />
            ))}
          </g>

          {/* Axes */}
          <line x1={0} y1={0} x2={0} y2={chartHeight} stroke={isDark ? '#333' : '#e2e8f0'} strokeWidth={1} />
          {yLabels.map((label, i) => (
            <text
              key={i}
              x={-10}
              y={label.y}
              textAnchor="end"
              dominantBaseline="middle"
              fill={isDark ? '#6b7280' : '#94a3b8'}
              fontSize="9"
              fontFamily="Inter, sans-serif"
              fontWeight="400"
            >
              {formatValue(label.value)}
            </text>
          ))}

          <line x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke={isDark ? '#333' : '#e2e8f0'} strokeWidth={1} />
          {xLabels.map((label, i) => (
            <text
              key={i}
              x={label.x}
              y={chartHeight + 16}
              textAnchor="middle"
              fill={isDark ? '#6b7280' : '#94a3b8'}
              fontSize="9"
              fontFamily="Inter, sans-serif"
              fontWeight="400"
            >
              {label.label}
            </text>
          ))}

          {/* Reference line at 0 */}
          {yMin <= 0 && yMax >= 0 && (
            <line
              x1={0}
              y1={chartHeight - ((-yMin) / (yMax - yMin)) * chartHeight}
              x2={chartWidth}
              y2={chartHeight - ((-yMin) / (yMax - yMin)) * chartHeight}
              stroke={isDark ? '#4b5563' : '#cbd5e1'}
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.5}
            />
          )}

          {/* Bars */}
          {bars.map((bar, barIdx) => {
            const barWidth = chartWidth / data.length * 0.8;
            return data.map((point, i) => {
              const value = point[bar.dataKey];
              const x = (i / (data.length - 1)) * chartWidth - barWidth / 2;
              const valueY = chartHeight - ((value - yMin) / (yMax - yMin)) * chartHeight;
              const zeroY = chartHeight - ((-yMin) / (yMax - yMin)) * chartHeight;
              const barHeight = Math.abs(valueY - zeroY);
              const barY = Math.min(valueY, zeroY);
              
              return (
                <rect
                  key={`${barIdx}-${i}`}
                  x={x}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  fill={bar.fill}
                  opacity={0.6}
                />
              );
            });
          })}

          {/* Areas */}
          {areas.map((area, i) => (
            <g key={`area-${i}`}>
              <path
                d={createAreaPath(area.dataKey)}
                fill={`url(#composed-gradient-${i})`}
              />
              <path
                d={createLinePath(area.dataKey)}
                fill="none"
                stroke={area.stroke}
                strokeWidth={1.25}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.7}
              />
            </g>
          ))}

          {/* Lines */}
          {lines.map((line, i) => (
            <path
              key={`line-${i}`}
              d={createLinePath(line.dataKey)}
              fill="none"
              stroke={line.stroke}
              strokeWidth={line.strokeWidth || 1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </g>
      </svg>
    </div>
  );
}