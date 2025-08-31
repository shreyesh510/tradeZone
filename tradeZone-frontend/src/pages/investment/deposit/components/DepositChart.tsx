import { memo } from 'react';
import LineChart from '../../components/shared/LineChart';

interface ChartDataPoint {
  date: string;
  amount: number;
}

interface DepositChartProps {
  chartData: ChartDataPoint[];
  filteredDeposits: any[];
  isDarkMode: boolean;
}

const DepositChart = memo<DepositChartProps>(({ chartData, filteredDeposits, isDarkMode }) => {
  return (
    <div className={`p-8 rounded-2xl backdrop-blur-lg border mb-8 ${
      isDarkMode 
        ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
        : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Deposit History</h2>
        <div className="flex items-center space-x-4">
          <div className={`px-3 py-1 rounded-lg ${
            isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
          }`}>
            <span className="text-sm font-medium">
              {filteredDeposits.length} Deposits
            </span>
          </div>
        </div>
      </div>
      <div className="h-80">
        <LineChart 
          data={chartData} 
          height={320} 
          isDarkMode={isDarkMode} 
          color="green"
          gradientId="depositGradient"
        />
      </div>
    </div>
  );
});

DepositChart.displayName = 'DepositChart';

export default DepositChart;
