import { useThemeStore } from '../stores/themeStore';

interface DataPoint {
  [key: string]: any;
}

interface SimpleAreaChartProps {
  data: DataPoint[];
  areas: Array<{
    dataKey: string;
    fill: string;
    stroke: string;
    name: string;
  }>;
  height?: number;
  formatValue?: (value: number) => string;
}

export default function SimpleAreaChart({ 
  data, 
  areas, 
  height = 200,
  formatValue = (val) => val.toFixed(0)
}: SimpleAreaChartProps) {
  const { colors, theme } = useThemeStore();
  const isDark = theme === 'dark';

  if (!data || data.length === 0) return null;

  const padding = { top: 20, right: 20, bottom: 30, left: 60 };
  const chartWidth = 800;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate min/max
  let globalMin = 0;
  let globalMax = -Infinity;

  areas.forEach(area => {
    data.forEach(point => {
      const value = point[area.dataKey];
      if (typeof value === 'number' && !isNaN(value)) {
        globalMax = Math.max(globalMax, value);
      }
    });
  });

  const yMax = globalMax * 1.15;

  // Create path for area
  const createAreaPath = (dataKey: string) => {
    const topPoints = data.map((point, i) => {
      const x = (i / (data.length - 1)) * chartWidth;
      const value = point[dataKey];
      const y = chartHeight - ((value) / yMax) * chartHeight;
      return `${x},${y}`;
    });
    
    const bottomLine = `L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`;
    return `M ${topPoints.join(' L ')} ${bottomLine}`;
  };

  const createLinePath = (dataKey: string) => {
    const points = data.map((point, i) => {
      const x = (i / (data.length - 1)) * chartWidth;
      const value = point[dataKey];
      const y = chartHeight - ((value) / yMax) * chartHeight;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  // Generate Y-axis labels
  const yLabels = [];
  for (let i = 0; i <= 4; i++) {
    const value = (yMax) * (i / 4);
    const y = chartHeight - (i / 4) * chartHeight;
    yLabels.push({ y, value });
  }

  // Generate X-axis labels
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
            <linearGradient key={i} id={`area-gradient-${i}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={area.fill} stopOpacity="0.3" />
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

          {/* Y-axis */}
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

          {/* X-axis */}
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

          {/* Areas */}
          {areas.map((area, i) => (
            <g key={i}>
              <path
                d={createAreaPath(area.dataKey)}
                fill={`url(#area-gradient-${i})`}
              />
              <path
                d={createLinePath(area.dataKey)}
                fill="none"
                stroke={area.stroke}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}