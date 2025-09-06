import { memo } from 'react';

interface Position {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  entryPrice: number;
  currentPrice: number;
  lots: number;
  investedAmount: number;
  platform: 'Delta Exchange' | 'Groww';
  timestamp: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

interface PositionCardProps {
  position: Position;
  isDarkMode: boolean;
}

const PositionCard = memo<PositionCardProps>(({ position, isDarkMode }) => {
  // Calculate P&L for a position
  const calculatePnL = (position: Position) => {
    const priceDiff = position.side === 'buy' 
      ? position.currentPrice - position.entryPrice
      : position.entryPrice - position.currentPrice;
    
    const pnl = priceDiff * position.lots;
    const pnlPercent = (pnl / position.investedAmount) * 100;
    
    return { pnl, pnlPercent };
  };

  // Format date for display
  const formatDate = (dateStr: string | Date | undefined) => {
    if (!dateStr) return 'N/A';
    
    try {
      // Handle Firebase timestamp objects that might be serialized as objects with seconds and nanoseconds
      if (typeof dateStr === 'object' && dateStr !== null && 'seconds' in dateStr) {
        // @ts-ignore - Firebase Timestamp format
        return new Date(dateStr.seconds * 1000).toLocaleString();
      }
      
      // Handle standard date strings or Date objects
      const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
      if (isNaN(date.getTime())) {
        // If not a valid date object, use the string as is
        return typeof dateStr === 'string' ? dateStr : 'Invalid Date';
      }
      
      // Format the date as a nice readable string
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return typeof dateStr === 'string' ? dateStr : 'Error';
    }
  };

  const { pnl, pnlPercent } = calculatePnL(position);
  const isProfitable = pnl >= 0;

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

      {/* Price Information */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between">
          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Entry Price:</span>
          <span className="font-medium">${position.entryPrice.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Current Price:</span>
          <span className="font-medium">${position.currentPrice.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Invested Amount:</span>
          <span className="font-medium">${position.investedAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* P&L Display */}
      <div className={`p-4 rounded-xl ${
        isProfitable 
          ? isDarkMode ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'
          : isDarkMode ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex justify-between items-center">
          <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            P&L:
          </span>
          <div className="text-right">
            <p className={`text-xl font-bold ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
              ${pnl.toFixed(2)}
            </p>
            <p className={`text-sm ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
              ({pnlPercent.toFixed(2)}%)
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              isProfitable ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
              : 'bg-gradient-to-r from-red-400 to-pink-500'
            }`}
            style={{ 
              width: `${Math.min(Math.abs(pnlPercent), 100)}%` 
            }}
          ></div>
        </div>
      </div>

      {/* Timestamp */}
      <div className="mt-4 text-center">
        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Added: {formatDate(position.createdAt || position.timestamp)}
        </p>
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
