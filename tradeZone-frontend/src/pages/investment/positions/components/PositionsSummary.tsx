import { memo } from 'react';

interface PositionsSummaryProps {
  totalPnL: number;
  isDarkMode: boolean;
}

const PositionsSummary = memo<PositionsSummaryProps>(({ totalPnL, isDarkMode }) => {
  return (
    <div className={`p-6 rounded-2xl backdrop-blur-lg border mb-8 ${
      isDarkMode 
        ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
        : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Total P&L
          </h2>
          <p className={`text-4xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${totalPnL.toFixed(2)}
          </p>
        </div>
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
          totalPnL >= 0 
            ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
            : 'bg-gradient-to-br from-red-500 to-pink-500'
        }`}>
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d={totalPnL >= 0 ? "M7 11l5-5m0 0l5 5m-5-5v12" : "M17 13l-5 5m0 0l-5-5m5 5V6"} />
          </svg>
        </div>
      </div>
    </div>
  );
});

PositionsSummary.displayName = 'PositionsSummary';

export default PositionsSummary;
