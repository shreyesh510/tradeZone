import { memo } from 'react';

interface PlatformData {
  platform: 'Delta Exchange' | 'Groww';
  totalInvestment: number;
  currentValue: number;
  returns: number;
  returnsPercent: number;
  color: string;
}

interface PlatformBreakdownCardProps {
  platforms: PlatformData[];
  isDarkMode: boolean;
}

const PlatformBreakdownCard = memo<PlatformBreakdownCardProps>(({ platforms, isDarkMode }) => {
  return (
    <div className={`p-8 rounded-2xl backdrop-blur-lg border mb-8 ${
      isDarkMode 
        ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
        : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
    }`}>
      <h2 className="text-2xl font-bold mb-6">Platform Breakdown</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {platforms.map((platform) => (
          <div key={platform.platform} className={`p-6 rounded-xl border ${
            isDarkMode 
              ? 'bg-gray-700/30 border-gray-600/50' 
              : 'bg-white/70 border-gray-200/50'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{platform.platform}</h3>
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: platform.color }}
              ></div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Investment:</span>
                <span className="font-medium">${platform.totalInvestment.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Current Value:</span>
                <span className="font-medium">${platform.currentValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Returns:</span>
                <span className={`font-medium ${platform.returns >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${platform.returns.toLocaleString()} ({platform.returnsPercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

PlatformBreakdownCard.displayName = 'PlatformBreakdownCard';

export default PlatformBreakdownCard;
