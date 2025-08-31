import { memo } from 'react';

interface ChartDataPoint {
  date: string;
  value?: number;
  amount?: number;
  returns?: number;
}

interface LineChartProps {
  data: ChartDataPoint[];
  height?: number;
  isDarkMode: boolean;
  color?: 'green' | 'red' | 'blue';
  gradientId?: string;
}

const LineChart = memo<LineChartProps>(({ 
  data, 
  height = 200, 
  isDarkMode, 
  color = 'green',
  gradientId = 'defaultGradient'
}) => {
  if (data.length === 0) return null;

  // Use value or amount, whichever is available
  const values = data.map(d => d.value || d.amount || 0);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const valueRange = maxValue - minValue || 1;
  const width = 100; // SVG width percentage

  const pathData = data.map((point, index) => {
    const value = point.value || point.amount || 0;
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - minValue) / valueRange) * height;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const isPositive = values[values.length - 1] > values[0];

  // Color mapping
  const colorMap = {
    green: '#22C55E',
    red: '#EF4444',
    blue: '#3B82F6'
  };

  const strokeColor = color === 'green' || color === 'red' 
    ? (isPositive ? colorMap.green : colorMap.red)
    : colorMap[color];

  return (
    <div className="relative" style={{ height }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0"
      >
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(y => (
          <line
            key={y}
            x1="0"
            y1={y * height / 100}
            x2={width}
            y2={y * height / 100}
            stroke={isDarkMode ? '#374151' : '#E5E7EB'}
            strokeWidth="0.5"
          />
        ))}
        
        {/* Area under curve */}
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        <path
          d={`${pathData} L ${width} ${height} L 0 ${height} Z`}
          fill={`url(#${gradientId})`}
        />
        
        {/* Main line */}
        <path
          d={pathData}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {data.map((point, index) => {
          const value = point.value || point.amount || 0;
          const x = (index / (data.length - 1)) * width;
          const y = height - ((value - minValue) / valueRange) * height;
          
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill={strokeColor}
              className="opacity-60 hover:opacity-100"
            />
          );
        })}
      </svg>
    </div>
  );
});

LineChart.displayName = 'LineChart';

export default LineChart;
