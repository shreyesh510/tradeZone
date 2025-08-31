import { memo } from 'react';

interface AssetPosition {
  symbol: string;
  lots: number;
  investedAmount: number;
  currentValue: number;
  returns: number;
  returnsPercent: number;
  platform: 'Delta Exchange' | 'Groww';
  color: string;
}

interface ActivePositionsCardProps {
  assetPositions: AssetPosition[];
  isDarkMode: boolean;
}

const ActivePositionsCard = memo<ActivePositionsCardProps>(({ assetPositions, isDarkMode }) => {
  return (
    <div className={`p-8 rounded-2xl backdrop-blur-lg border mb-8 ${
      isDarkMode 
        ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
        : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
    }`}>
      <h2 className="text-2xl font-bold mb-6">Active Positions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assetPositions.map((position) => (
          <div key={`${position.symbol}-${position.platform}`} className={`p-6 rounded-xl border ${
            isDarkMode 
              ? 'bg-gray-700/30 border-gray-600/50 hover:bg-gray-700/50' 
              : 'bg-white/70 border-gray-200/50 hover:bg-white/90'
          } transition-all duration-300 hover:scale-105`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: position.color }}
                >
                  {position.symbol.substring(0, 2)}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{position.symbol}</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {position.platform}
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
              }`}>
                {position.lots} Lots
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Invested:</span>
                <span className="font-medium">${position.investedAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Current:</span>
                <span className="font-medium">${position.currentValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Returns:</span>
                <span className={`font-bold ${position.returns >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${position.returns.toLocaleString()} ({position.returnsPercent.toFixed(2)}%)
                </span>
              </div>
            </div>
            
            {/* Mini progress bar for returns */}
            <div className="mt-4">
              <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    position.returns >= 0 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-pink-500'
                  }`}
                  style={{ 
                    width: `${Math.min(Math.abs(position.returnsPercent), 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

ActivePositionsCard.displayName = 'ActivePositionsCard';

export default ActivePositionsCard;
