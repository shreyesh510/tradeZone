import { memo } from 'react';

interface ChartDataPoint {
  date: string;
  value: number;
  returns: number;
}

interface LineChartProps {
  data: ChartDataPoint[];
  height?: number;
  isDarkMode: boolean;
}

const LineChart = memo<LineChartProps>(({ data, height = 200, isDarkMode }) => {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const valueRange = maxValue - minValue;
  const width = 100; // SVG width percentage

  const pathData = data.map((point, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((point.value - minValue) / valueRange) * height;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const isPositive = data[data.length - 1]?.value > data[0]?.value;

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
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isPositive ? '#22C55E' : '#EF4444'} stopOpacity="0.3" />
            <stop offset="100%" stopColor={isPositive ? '#22C55E' : '#EF4444'} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        <path
          d={`${pathData} L ${width} ${height} L 0 ${height} Z`}
          fill="url(#areaGradient)"
        />
        
        {/* Main line */}
        <path
          d={pathData}
          fill="none"
          stroke={isPositive ? '#22C55E' : '#EF4444'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {data.map((point, index) => {
          const x = (index / (data.length - 1)) * width;
          const y = height - ((point.value - minValue) / valueRange) * height;
          
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill={isPositive ? '#22C55E' : '#EF4444'}
              className="opacity-60 hover:opacity-100"
            />
          );
        })}
      </svg>
    </div>
  );
});

LineChart.displayName = 'LineChart';

interface PortfolioPerformanceChartProps {
  chartData: ChartDataPoint[];
  isDarkMode: boolean;
}

const PortfolioPerformanceChart = memo<PortfolioPerformanceChartProps>(({ chartData, isDarkMode }) => {
  return (
    <div className={`p-8 rounded-2xl backdrop-blur-lg border mb-8 ${
      isDarkMode 
        ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
        : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Portfolio Performance</h2>
        <div className="flex items-center space-x-4">
          <div className={`px-3 py-1 rounded-lg ${
            isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
          }`}>
            <span className="text-sm font-medium">
              +{((chartData[chartData.length - 1]?.value / chartData[0]?.value - 1) * 100).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
      <div className="h-80">
        <LineChart data={chartData} height={320} isDarkMode={isDarkMode} />
      </div>
    </div>
  );
});

PortfolioPerformanceChart.displayName = 'PortfolioPerformanceChart';

export default PortfolioPerformanceChart;
