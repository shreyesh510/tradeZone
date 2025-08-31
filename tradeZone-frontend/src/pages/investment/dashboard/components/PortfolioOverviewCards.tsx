import { memo } from 'react';

interface PortfolioData {
  totalInvestment: number;
  currentValue: number;
  totalReturns: number;
  totalReturnsPercent: number;
  dayChange: number;
  dayChangePercent: number;
  activePositions: number;
}

interface PortfolioOverviewCardsProps {
  portfolioData: PortfolioData;
  isDarkMode: boolean;
}

const PortfolioOverviewCards = memo<PortfolioOverviewCardsProps>(({ portfolioData, isDarkMode }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Investment */}
      <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
        isDarkMode 
          ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
          : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
      } hover:scale-105 transition-all duration-300`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Total Investment
          </h3>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        </div>
        <p className="text-3xl font-bold text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text">
          ${portfolioData.totalInvestment.toLocaleString()}
        </p>
      </div>

      {/* Current Value */}
      <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
        isDarkMode 
          ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
          : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
      } hover:scale-105 transition-all duration-300`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Current Value
          </h3>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
        <p className="text-3xl font-bold text-transparent bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text">
          ${portfolioData.currentValue.toLocaleString()}
        </p>
      </div>

      {/* Total Returns */}
      <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
        isDarkMode 
          ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
          : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
      } hover:scale-105 transition-all duration-300`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Total Returns
          </h3>
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${
            portfolioData.totalReturns >= 0 ? 'from-green-500 to-emerald-500' : 'from-red-500 to-pink-500'
          } flex items-center justify-center`}>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d={portfolioData.totalReturns >= 0 ? "M7 11l5-5m0 0l5 5m-5-5v12" : "M17 13l-5 5m0 0l-5-5m5 5V6"} />
            </svg>
          </div>
        </div>
        <p className={`text-3xl font-bold ${
          portfolioData.totalReturns >= 0 ? 'text-green-400' : 'text-red-400'
        }`}>
          ${portfolioData.totalReturns.toLocaleString()} ({portfolioData.totalReturnsPercent.toFixed(2)}%)
        </p>
      </div>

      {/* Active Positions */}
      <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
        isDarkMode 
          ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
          : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
      } hover:scale-105 transition-all duration-300`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Active Positions
          </h3>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
        <p className="text-3xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">
          {portfolioData.activePositions}
        </p>
      </div>
    </div>
  );
});

PortfolioOverviewCards.displayName = 'PortfolioOverviewCards';

export default PortfolioOverviewCards;
