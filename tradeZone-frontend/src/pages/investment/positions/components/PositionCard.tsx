import { memo } from 'react';

interface Position {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  entryPrice: number;
  currentPrice?: number;
  lots: number;
  investedAmount: number;
  platform: 'Delta Exchange' | 'Groww';
  leverage: number;
  timestamp: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

interface PositionCardProps {
  position: Position;
  isDarkMode: boolean;
}

const PositionCard = memo<PositionCardProps>(({ position, isDarkMode }) => {
  return (
    <div 
      className={`p-6 rounded-2xl backdrop-blur-lg border transition-all duration-300 hover:scale-105 ${
        isDarkMode 
          ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20 hover:bg-gray-800/40' 
          : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10 hover:bg-white/80'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white ${
            position.platform === 'Delta Exchange' ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
            : 'bg-gradient-to-br from-blue-500 to-cyan-500'
          }`}>
            {position.symbol.substring(0, 2)}
          </div>
          <div>
            <h3 className="text-xl font-bold">{position.symbol}</h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {position.platform}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-1">
          <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
            position.side === 'buy'
              ? 'bg-green-500/20 text-green-400'
              : 'bg-red-500/20 text-red-400'
          }`}>
            {position.side.toUpperCase()}
          </div>
          <div className={`px-3 py-1 rounded-lg text-xs font-medium ${
            isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
          }`}>
            {position.lots} Lots
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex space-x-2">
        <button className="flex-1 py-2 px-3 text-sm rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors">
          Modify
        </button>
        <button className="flex-1 py-2 px-3 text-sm rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
          Close
        </button>
      </div>
    </div>
  );
});

PositionCard.displayName = 'PositionCard';

export default PositionCard;
