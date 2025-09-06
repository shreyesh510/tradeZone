import React, { useState } from 'react';
import type { CreatePositionData } from '../types/position';

interface ImportConfirmModalProps {
  positions: CreatePositionData[];
  isOpen: boolean;
  onConfirm: (positions: CreatePositionData[]) => void;
  onCancel: () => void;
  isDarkMode: boolean;
}

const ImportConfirmModal: React.FC<ImportConfirmModalProps> = ({
  positions,
  isOpen,
  onConfirm,
  onCancel,
  isDarkMode,
}) => {
  // Use useEffect to update selectedPositions when positions prop changes
  const [selectedPositions, setSelectedPositions] = useState<CreatePositionData[]>([]);
  
  // Update selected positions when the positions prop changes or modal opens
  React.useEffect(() => {
    if (isOpen && positions.length > 0) {
      setSelectedPositions([...positions]);
      console.log('Positions set in modal:', positions.length);
    }
  }, [positions, isOpen]);

  if (!isOpen) return null;

  const handleTogglePosition = (index: number) => {
    setSelectedPositions((prev) => {
      const newPositions = [...prev];
      newPositions.splice(index, 1);
      return newPositions;
    });
  };

  const handleConfirm = () => {
    onConfirm(selectedPositions);
  };

  // Force dark mode for the modal - using darker colors
  const bgClass = 'bg-gray-950 text-white';
  const overlayClass = 'bg-black/30'; // Reduced opacity for less dimming

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      {/* Overlay for dimming background */}
      <div className={`absolute inset-0 ${overlayClass}`} aria-hidden="true"></div>
      {/* Modal panel */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`${bgClass} relative z-10 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-700`}
        style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}
      >
          <div className="p-5 border-b border-gray-700">
            <h2 className="text-2xl font-semibold text-white">Confirm Import</h2>
            <p className="mt-2 text-sm text-gray-300">
              Review the positions to be imported. You can remove unwanted positions before confirming.
            </p>
            <p className="mt-1 text-sm text-blue-400 font-medium">
              {selectedPositions.length} positions selected
            </p>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="overflow-y-auto" style={{ maxHeight: "400px" }}>
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b-2 border-gray-600 bg-[#1a1a2e] text-white">
                    <th className="py-3 px-3 text-left font-semibold">Symbol</th>
                    <th className="py-3 px-3 text-left font-semibold">Side</th>
                    <th className="py-3 px-3 text-right font-semibold">Lots</th>
                    <th className="py-3 px-3 text-right font-semibold">Entry Price</th>
                    <th className="py-3 px-3 text-right font-semibold">Fee</th>
                    <th className="py-3 px-3 text-right font-semibold">Leverage</th>
                    <th className="py-3 px-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
              <tbody>
                {selectedPositions.length === 0 ? (
                  <tr className="bg-[#1e1e30] text-white">
                    <td colSpan={7} className="py-6 text-center font-medium">
                      No positions found to import
                    </td>
                  </tr>
                ) : (
                  selectedPositions.map((position, index) => (
                    <tr 
                      key={`${position.symbol}-${index}`}
                      className="border-b border-gray-700 bg-[#1e1e30] text-white"
                    >
                      <td className="py-3 px-3 font-medium text-white">{position.symbol}</td>
                      <td className="py-3 px-3">
                        <span 
                          className={`px-3 py-1 text-xs rounded-full font-bold ${
                            position.side === 'buy' 
                              ? 'bg-green-700 text-green-100' 
                              : 'bg-red-700 text-red-100'
                          }`}
                        >
                          {position.side === 'buy' ? 'LONG' : 'SHORT'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-white">{position.lots}</td>
                      <td className="py-3 px-3 text-right text-white">${position.entryPrice.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right text-white">${(position.tradingFee ?? 0).toFixed(2)}</td>
                      <td className="py-3 px-3 text-right text-white">{position.leverage}x</td>
                      <td className="py-3 px-3 text-right">
                        <button 
                          onClick={() => handleTogglePosition(index)}
                          className="px-3 py-1.5 text-white bg-red-500 hover:bg-red-600 rounded text-xs font-medium transition-colors"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>

          <div className="p-5 border-t border-gray-700 flex justify-end space-x-4 bg-[#1a1a2e]">
            <button
              onClick={onCancel}
              className="px-6 py-2.5 rounded-lg font-medium shadow-md transition-colors bg-gray-600 hover:bg-gray-500 text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedPositions.length === 0}
              className={`px-6 py-2.5 rounded-lg font-medium shadow-md transition-colors ${
                selectedPositions.length === 0 
                  ? 'bg-blue-700 cursor-not-allowed text-white opacity-70'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              Import {selectedPositions.length} Positions
            </button>
          </div>
      </div>
    </div>
  );
};

export default ImportConfirmModal;
