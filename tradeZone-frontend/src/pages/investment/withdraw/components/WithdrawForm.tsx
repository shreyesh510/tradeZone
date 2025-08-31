import { memo } from 'react';

interface WithdrawFormProps {
  withdrawAmount: string;
  withdrawDescription: string;
  onAmountChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isDarkMode: boolean;
}

const WithdrawForm = memo<WithdrawFormProps>(({ 
  withdrawAmount, 
  withdrawDescription, 
  onAmountChange, 
  onDescriptionChange, 
  onSubmit, 
  isDarkMode 
}) => {
  return (
    <div className={`p-8 rounded-2xl backdrop-blur-lg border ${
      isDarkMode 
        ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
        : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
    }`}>
      <h2 className="text-2xl font-bold mb-6">New Withdrawal</h2>
      
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Withdrawal Amount
          </label>
          <div className="relative">
            <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              $
            </span>
            <input
              type="number"
              step="any"
              value={withdrawAmount}
              onChange={(e) => onAmountChange(e.target.value)}
              placeholder="0.00"
              className={`w-full pl-8 pr-4 py-4 rounded-xl border backdrop-blur-sm ${
                isDarkMode 
                  ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400' 
                  : 'bg-white/70 border-gray-300/50 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-xl font-medium`}
              required
            />
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Description (Optional)
          </label>
          <input
            type="text"
            value={withdrawDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="e.g., Monthly expenses, Emergency withdrawal"
            className={`w-full px-4 py-3 rounded-xl border backdrop-blur-sm ${
              isDarkMode 
                ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400' 
                : 'bg-white/70 border-gray-300/50 text-gray-900 placeholder-gray-500'
            } focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all`}
          />
        </div>

        <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/70'}`}>
          <h3 className="font-medium mb-2">Withdrawal Information:</h3>
          <ul className={`text-sm space-y-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <li>• Processing time: 1-3 business days</li>
            <li>• No withdrawal fees</li>
            <li>• Minimum amount: $10</li>
            <li>• Funds will be transferred to your linked bank account</li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
          className="w-full py-4 px-6 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-300 hover:scale-105 text-lg"
        >
          Submit Withdrawal Request
        </button>
      </form>
    </div>
  );
});

WithdrawForm.displayName = 'WithdrawForm';

export default WithdrawForm;
