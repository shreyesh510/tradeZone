import { memo } from 'react';

interface Transaction {
  id: string;
  symbol: string;
  amount: number;
  lots: number;
  type: 'buy' | 'sell';
  platform: 'Delta Exchange' | 'Groww';
  timestamp: string;
  price: number;
}

interface RecentTransactionsCardProps {
  transactions: Transaction[];
  isDarkMode: boolean;
}

const RecentTransactionsCard = memo<RecentTransactionsCardProps>(({ transactions, isDarkMode }) => {
  return (
    <div className={`p-8 rounded-2xl backdrop-blur-lg border ${
      isDarkMode 
        ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
        : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
    }`}>
      <h2 className="text-2xl font-bold mb-6">Recent Transactions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {transactions.map((transaction) => (
          <div key={transaction.id} className={`p-6 rounded-xl border ${
            isDarkMode 
              ? 'bg-gray-700/30 border-gray-600/50 hover:bg-gray-700/50' 
              : 'bg-white/70 border-gray-200/50 hover:bg-white/90'
          } transition-all duration-300`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  transaction.type === 'buy' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d={transaction.type === 'buy' ? "M7 11l5-5m0 0l5 5m-5-5v12" : "M17 13l-5 5m0 0l-5-5m5 5V6"} />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold">{transaction.symbol}</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {transaction.platform}
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                transaction.type === 'buy'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {transaction.type.toUpperCase()}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Amount:</span>
                <span className="font-medium">${transaction.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Lots:</span>
                <span className="font-medium">{transaction.lots}</span>
              </div>
              <div className="flex justify-between">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Price:</span>
                <span className="font-medium">${transaction.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Date:</span>
                <span className="font-medium text-sm">{transaction.timestamp}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

RecentTransactionsCard.displayName = 'RecentTransactionsCard';

export default RecentTransactionsCard;
