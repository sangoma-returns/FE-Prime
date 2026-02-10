import { useThemeStore } from '../stores/themeStore';

interface DataPoint {
  [key: string]: any;
}

interface SimpleLineChartProps {
  data: DataPoint[];
  lines: Array<{
    dataKey: string;
    stroke: string;
    strokeWidth?: number;
    name: string;
    gradient?: boolean;
  }>;
  height?: number;
  showGrid?: boolean;
  formatValue?: (value: number) => string;
}

export default function SimpleLineChart({ 
  data, 
  lines, 
  height = 240, 
  showGrid = true,
  formatValue = (val) => val.toFixed(0)
}: SimpleLineChartProps) {
  const { colors, theme } = useThemeStore();
  const isDark = theme === 'dark';

  if (!data || data.length === 0) return null;

  const padding = { top: 20, right: 20, bottom: 30, left: 60 };
  const chartWidth = 800;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate min/max for all lines
  let globalMin = Infinity;
  let globalMax = -Infinity;

  lines.forEach(line => {
    data.forEach(point => {
      const value = point[line.dataKey];
      if (typeof value === 'number' && !isNaN(value)) {
        globalMin = Math.min(globalMin, value);
        globalMax = Math.max(globalMax, value);
      }
    });
  });

  // Add padding to min/max
  const range = globalMax - globalMin;
  const yMin = globalMin - range * 0.15;
  const yMax = globalMax + range * 0.15;

  // Create points for each line
  const createPath = (dataKey: string) => {
    const points = data.map((point, i) => {
      const x = (i / (data.length - 1)) * chartWidth;
      const value = point[dataKey];
      const y = chartHeight - ((value - yMin) / (yMax - yMin)) * chartHeight;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  // Create gradient path
  const createGradientPath = (dataKey: string) => {
    const topPoints = data.map((point, i) => {
      const x = (i / (data.length - 1)) * chartWidth;
      const value = point[dataKey];
      const y = chartHeight - ((value - yMin) / (yMax - yMin)) * chartHeight;
      return `${x},${y}`;
    });
    return `M ${topPoints.join(' L ')} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`;
  };

  // Generate Y-axis labels (5 labels)
  const yLabels = [];
  for (let i = 0; i <= 4; i++) {
    const value = yMin + (yMax - yMin) * (i / 4);
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
    <div style={{ width: '100%', height: `${height}px`, minHeight: `${height}px`, position: 'relative' }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth + padding.left + padding.right} ${height}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          {lines.filter(l => l.gradient).map((line, i) => (
            <linearGradient key={i} id={`gradient-${i}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={line.stroke} stopOpacity="0.2" />
              <stop offset="100%" stopColor={line.stroke} stopOpacity="0.02" />
            </linearGradient>
          ))}
        </defs>
        
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Grid */}
          {showGrid && (
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
          )}

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

          {/* Reference line at 0 if 0 is in range */}
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

          {/* Gradient fills */}
          {lines.filter(l => l.gradient).map((line, i) => (
            <path
              key={`grad-${i}`}
              d={createGradientPath(line.dataKey)}
              fill={`url(#gradient-${i})`}
            />
          ))}

          {/* Lines */}
          {lines.map((line, i) => (
            <path
              key={i}
              d={createPath(line.dataKey)}
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