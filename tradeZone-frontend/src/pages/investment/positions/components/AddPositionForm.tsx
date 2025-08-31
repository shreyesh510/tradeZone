import { memo } from 'react';

interface PositionForm {
  symbol: string;
  lots: string;
  entryPrice: string;
  side: 'buy' | 'sell';
  platform: 'Delta Exchange' | 'Groww';
}

interface AddPositionFormProps {
  showForm: boolean;
  positionForm: PositionForm;
  onFormChange: (field: keyof PositionForm, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isDarkMode: boolean;
}

const AddPositionForm = memo<AddPositionFormProps>(({ 
  showForm, 
  positionForm, 
  onFormChange, 
  onSubmit, 
  onCancel, 
  isDarkMode 
}) => {
  if (!showForm) return null;

  // Symbol options for the form
  const symbolOptions = {
    'Delta Exchange': ['BTCUSD', 'ETHUSD', 'DOGEUSD', 'ADAUSD', 'SOLUSD'],
    'Groww': ['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN', 'NVDA']
  };

  const availableSymbols = symbolOptions[positionForm.platform];

  return (
    <div className={`p-8 rounded-2xl backdrop-blur-lg border mb-8 ${
      isDarkMode 
        ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
        : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
    }`}>
      <h2 className="text-2xl font-bold mb-6">Add New Position</h2>
      
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Platform Selection */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Platform
          </label>
          <select
            value={positionForm.platform}
            onChange={(e) => onFormChange('platform', e.target.value)}
            className={`w-full p-3 rounded-xl border backdrop-blur-sm ${
              isDarkMode 
                ? 'bg-gray-700/50 border-gray-600/50 text-white' 
                : 'bg-white/70 border-gray-300/50 text-gray-900'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
          >
            <option value="Delta Exchange">Delta Exchange</option>
            <option value="Groww">Groww</option>
          </select>
        </div>

        {/* Symbol Selection */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Symbol
          </label>
          <select
            value={positionForm.symbol}
            onChange={(e) => onFormChange('symbol', e.target.value)}
            className={`w-full p-3 rounded-xl border backdrop-blur-sm ${
              isDarkMode 
                ? 'bg-gray-700/50 border-gray-600/50 text-white' 
                : 'bg-white/70 border-gray-300/50 text-gray-900'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
            required
          >
            <option value="">Select Symbol</option>
            {availableSymbols.map(symbol => (
              <option key={symbol} value={symbol}>{symbol}</option>
            ))}
          </select>
        </div>

        {/* Lots */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Lots
          </label>
          <input
            type="number"
            value={positionForm.lots}
            onChange={(e) => onFormChange('lots', e.target.value)}
            placeholder="Enter lots"
            min="1"
            className={`w-full p-3 rounded-xl border backdrop-blur-sm ${
              isDarkMode 
                ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400' 
                : 'bg-white/70 border-gray-300/50 text-gray-900 placeholder-gray-500'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
            required
          />
        </div>

        {/* Entry Price */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Entry Price
          </label>
          <input
            type="number"
            step="any"
            value={positionForm.entryPrice}
            onChange={(e) => onFormChange('entryPrice', e.target.value)}
            placeholder="Entry price"
            className={`w-full p-3 rounded-xl border backdrop-blur-sm ${
              isDarkMode 
                ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400' 
                : 'bg-white/70 border-gray-300/50 text-gray-900 placeholder-gray-500'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
            required
          />
        </div>

        {/* Buy/Sell Toggle */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Side
          </label>
          <div className="flex rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => onFormChange('side', 'buy')}
              className={`flex-1 py-3 px-4 font-medium transition-all ${
                positionForm.side === 'buy'
                  ? 'bg-green-500 text-white'
                  : isDarkMode
                  ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                  : 'bg-gray-200/50 text-gray-700 hover:bg-gray-300/50'
              }`}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => onFormChange('side', 'sell')}
              className={`flex-1 py-3 px-4 font-medium transition-all ${
                positionForm.side === 'sell'
                  ? 'bg-red-500 text-white'
                  : isDarkMode
                  ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                  : 'bg-gray-200/50 text-gray-700 hover:bg-gray-300/50'
              }`}
            >
              Sell
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="md:col-span-2 lg:col-span-5 flex gap-4">
          <button
            type="submit"
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 hover:scale-105"
          >
            Add Position
          </button>
          <button
            type="button"
            onClick={onCancel}
            className={`px-8 py-3 font-medium rounded-xl transition-all duration-300 ${
              isDarkMode
                ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                : 'bg-gray-200/50 text-gray-700 hover:bg-gray-300/50'
            }`}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
});

AddPositionForm.displayName = 'AddPositionForm';

export default AddPositionForm;
