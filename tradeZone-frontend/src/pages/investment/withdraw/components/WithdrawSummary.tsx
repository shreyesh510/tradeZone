import { memo } from 'react';

type TimeFilter = '1M' | '1W' | '6M' | '1Y' | '5Y';

interface WithdrawSummaryProps {
  totalWithdrawals: number;
  selectedTimeFilter: TimeFilter;
  isDarkMode: boolean;
}

const WithdrawSummary = memo<WithdrawSummaryProps>(({ totalWithdrawals, selectedTimeFilter, isDarkMode }) => {
  return (
    <div className={`p-6 rounded-2xl backdrop-blur-lg border mb-8 ${
      isDarkMode 
        ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
        : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Total Withdrawals ({selectedTimeFilter})
          </h2>
          <p className="text-4xl font-bold text-transparent bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text">
            ${totalWithdrawals.toLocaleString()}
          </p>
        </div>
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
        </div>
      </div>
    </div>
  );
});

WithdrawSummary.displayName = 'WithdrawSummary';

export default WithdrawSummary;
