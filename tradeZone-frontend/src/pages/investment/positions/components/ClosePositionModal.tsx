import React, { useState } from 'react';
import type { Position } from '../../../../types/position';

interface ClosePositionModalProps {
  position: Position | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string, pnl?: number) => void;
  isDarkMode: boolean;
}

const ClosePositionModal: React.FC<ClosePositionModalProps> = ({
  position,
  isOpen,
  onClose,
  onConfirm,
  isDarkMode,
}) => {
  const [pnl, setPnl] = useState<string>('');

  if (!isOpen || !position) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pnlValue = pnl ? parseFloat(pnl) : undefined;
    onConfirm(position.id, pnlValue);
    onClose();
    setPnl('');
  };

  const handleCancel = () => {
    onClose();
    setPnl('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleCancel}>
      {/* Overlay for dimming background */}
      <div className="absolute inset-0 bg-black/50" aria-hidden="true"></div>
      
      {/* Modal panel */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`relative z-10 rounded-2xl shadow-xl max-w-md w-full border ${
          isDarkMode 
            ? 'bg-gray-800/95 border-gray-700/50' 
            : 'bg-white/95 border-white/20'
        }`}
        style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}
      >
        {/* Header */}
        <div className={`p-6 border-b ${
          isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'
        }`}>
          <h2 className={`text-2xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Close Position
          </h2>
          <p className={`mt-2 text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Are you sure you want to close this position?
          </p>
        </div>

        {/* Position Details */}
        <div className="p-6">
          <div className={`p-4 rounded-xl ${
            isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/50'
          }`}>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Symbol:
              </span>
              <span className={`font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {position.symbol}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Side:
              </span>
              <span className={`font-bold ${
                position.side === 'buy' ? 'text-green-400' : 'text-red-400'
              }`}>
                {position.side.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Lots:
              </span>
              <span className={`font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {position.lots}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Invested Amount:
              </span>
              <span className={`font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                ${position.investedAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* P&L Input */}
          <div className="mt-6">
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Final P&L (Optional)
            </label>
            <input
              type="number"
              step="any"
              value={pnl}
              onChange={(e) => setPnl(e.target.value)}
              placeholder="Enter final P&L amount"
              className={`w-full p-3 rounded-xl border backdrop-blur-sm ${
                isDarkMode 
                  ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400' 
                  : 'bg-white/70 border-gray-300/50 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all`}
            />
            <p className={`mt-1 text-xs ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Leave empty to calculate automatically
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-6 border-t ${
          isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'
        } flex justify-end space-x-4`}>
          <button
            type="button"
            onClick={handleCancel}
            className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                : 'bg-gray-200/50 text-gray-700 hover:bg-gray-300/50'
            }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white font-medium rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300"
          >
            Close Position
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClosePositionModal;


