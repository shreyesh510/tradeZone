import { useState, memo } from 'react';
import { AdvancedChart } from 'react-tradingview-embed';

const LiveChart = memo(function LiveChart() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`h-full flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Header */}
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-4 py-2 flex justify-between items-center`}>
        <div>
          <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Dogecoin / US Dollar</h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Real TradingView Chart</p>
        </div>
        
        {/* Settings Button */}
        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          
          {/* Settings Dropdown */}
          {showSettings && (
            <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg z-50 ${
              isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}>
              <div className="py-1">
                <button
                  onClick={toggleTheme}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 transition-colors ${
                    isDarkMode 
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isDarkMode ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    )}
                  </svg>
                  <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TradingView Chart */}
      <div className="flex-1">
        <AdvancedChart
          widgetProps={{
            symbol: "DOGEUSD",
            interval: "1",
            timezone: "Etc/UTC",
            theme: isDarkMode ? "dark" : "light",
            style: "1",
            locale: "en",
            toolbar_bg: isDarkMode ? "#1e222d" : "#f1f3f6",
            enable_publishing: false,
            allow_symbol_change: true,
            container_id: "tradingview_chart",
            autosize: true,
            width: "100%",
            height: "100%",
          }}
        />
      </div>
      
      {/* Click outside to close settings */}
      {showSettings && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowSettings(false)}
        />
      )}
    </div>
  );
});

export default LiveChart;
