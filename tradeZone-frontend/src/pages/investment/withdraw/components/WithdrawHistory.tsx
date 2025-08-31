import { memo } from 'react';

interface WithdrawalRecord {
  id: string;
  amount: number;
  timestamp: string;
  description?: string;
}

interface WithdrawHistoryProps {
  withdrawals: WithdrawalRecord[];
  isDarkMode: boolean;
}

const WithdrawHistory = memo<WithdrawHistoryProps>(({ withdrawals, isDarkMode }) => {
  return (
    <div className={`p-8 rounded-2xl backdrop-blur-lg border ${
      isDarkMode 
        ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
        : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
    }`}>
      <h2 className="text-2xl font-bold mb-6">Recent Withdrawals</h2>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {withdrawals.length === 0 ? (
          <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <p>No withdrawals in selected timeframe</p>
          </div>
        ) : (
          withdrawals.map(withdrawal => (
            <div key={withdrawal.id} className={`p-4 rounded-xl border transition-all duration-300 hover:scale-105 ${
              isDarkMode 
                ? 'bg-gray-700/30 border-gray-600/50 hover:bg-gray-700/50' 
                : 'bg-white/70 border-gray-200/50 hover:bg-white/90'
            }`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xl font-bold">${withdrawal.amount.toLocaleString()}</p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {withdrawal.timestamp}
                  </p>
                </div>
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
              </div>
              
              {withdrawal.description && (
                <div className="mb-3">
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {withdrawal.description}
                  </p>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Bank Transfer
                </span>
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                  isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
                }`}>
                  WITHDRAWN
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

WithdrawHistory.displayName = 'WithdrawHistory';

export default WithdrawHistory;
