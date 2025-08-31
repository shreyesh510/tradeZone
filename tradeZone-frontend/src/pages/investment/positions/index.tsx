import { memo, useState, useEffect } from 'react';
import Header from '../../../layouts/Header';
import Sidebar from '../../../components/Sidebar';
import FloatingNav, { type MobileTab } from '../../../layouts/FloatingNav';
import { useSettings } from '../../../contexts/SettingsContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { useNavigate } from 'react-router-dom';

interface OnlineUser {
  userId: string;
  userName: string;
  socketId: string;
}

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
}

interface PositionForm {
  symbol: string;
  lots: string;
  entryPrice: string;
  side: 'buy' | 'sell';
  platform: 'Delta Exchange' | 'Groww';
}

const Positions = memo(function Positions() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { canAccessInvestment } = usePermissions();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<MobileTab>('chart');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [positions, setPositions] = useState<Position[]>([]);

  // Form state
  const [positionForm, setPositionForm] = useState<PositionForm>({
    symbol: '',
    lots: '',
    entryPrice: '',
    side: 'buy',
    platform: 'Delta Exchange'
  });

  // Redirect if no permission
  useEffect(() => {
    if (!canAccessInvestment()) {
      navigate('/zone');
    }
  }, [canAccessInvestment, navigate]);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize mock positions
  useEffect(() => {
    const mockPositions: Position[] = [
      {
        id: '1',
        symbol: 'BTCUSD',
        side: 'buy',
        entryPrice: 42000,
        currentPrice: 43500,
        lots: 2,
        investedAmount: 15000,
        platform: 'Delta Exchange',
        timestamp: '2024-01-15 14:30'
      },
      {
        id: '2',
        symbol: 'ETHUSD',
        side: 'buy',
        entryPrice: 2500,
        currentPrice: 2750,
        lots: 10,
        investedAmount: 12000,
        platform: 'Delta Exchange',
        timestamp: '2024-01-15 12:15'
      },
      {
        id: '3',
        symbol: 'AAPL',
        side: 'sell',
        entryPrice: 185.50,
        currentPrice: 182.30,
        lots: 15,
        investedAmount: 8000,
        platform: 'Groww',
        timestamp: '2024-01-14 16:20'
      },
      {
        id: '4',
        symbol: 'TSLA',
        side: 'buy',
        entryPrice: 240.75,
        currentPrice: 265.20,
        lots: 8,
        investedAmount: 7000,
        platform: 'Groww',
        timestamp: '2024-01-14 09:45'
      },
      {
        id: '5',
        symbol: 'DOGE',
        side: 'sell',
        entryPrice: 0.08,
        currentPrice: 0.075,
        lots: 5,
        investedAmount: 3000,
        platform: 'Delta Exchange',
        timestamp: '2024-01-13 11:20'
      }
    ];
    setPositions(mockPositions);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleTabChange = (tab: MobileTab) => {
    setActiveTab(tab);
  };

  const isDarkMode = settings.theme === 'dark';

  // Calculate P&L for a position
  const calculatePnL = (position: Position) => {
    const priceDiff = position.side === 'buy' 
      ? position.currentPrice - position.entryPrice
      : position.entryPrice - position.currentPrice;
    
    const pnl = priceDiff * position.lots;
    const pnlPercent = (pnl / position.investedAmount) * 100;
    
    return { pnl, pnlPercent };
  };

  // Handle form input changes
  const handleFormChange = (field: keyof PositionForm, value: string) => {
    setPositionForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!positionForm.symbol || !positionForm.lots || !positionForm.entryPrice) {
      alert('Please fill all required fields');
      return;
    }

    const newPosition: Position = {
      id: Date.now().toString(),
      symbol: positionForm.symbol.toUpperCase(),
      side: positionForm.side,
      entryPrice: parseFloat(positionForm.entryPrice),
      currentPrice: parseFloat(positionForm.entryPrice), // Start with entry price
      lots: parseInt(positionForm.lots),
      investedAmount: parseFloat(positionForm.entryPrice) * parseInt(positionForm.lots),
      platform: positionForm.platform,
      timestamp: new Date().toLocaleString()
    };

    setPositions(prev => [newPosition, ...prev]);
    setPositionForm({
      symbol: '',
      lots: '',
      entryPrice: '',
      side: 'buy',
      platform: 'Delta Exchange'
    });
    setShowAddForm(false);
    
    alert('Position added successfully!');
  };

  // Symbol options for the form
  const symbolOptions = {
    'Delta Exchange': ['BTCUSD', 'ETHUSD', 'DOGEUSD', 'ADAUSD', 'SOLUSD'],
    'Groww': ['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN', 'NVDA']
  };

  const availableSymbols = symbolOptions[positionForm.platform];

  const totalPnL = positions.reduce((sum, pos) => {
    const { pnl } = calculatePnL(pos);
    return sum + pnl;
  }, 0);

  const content = (
    <div className={`flex-1 p-6 overflow-y-auto ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-gray-900'
    }`}>
      {/* Header with futuristic glow */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-4xl font-bold bg-gradient-to-r ${
              isDarkMode 
                ? 'from-cyan-400 via-purple-400 to-pink-400' 
                : 'from-blue-600 via-purple-600 to-indigo-600'
            } bg-clip-text text-transparent mb-2`}>
              Your Positions
            </h1>
            <div className={`h-1 w-32 bg-gradient-to-r ${
              isDarkMode 
                ? 'from-cyan-400 via-purple-400 to-pink-400' 
                : 'from-blue-600 via-purple-600 to-indigo-600'
            } rounded-full`}></div>
          </div>
          
          {/* Add Position Button */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              isDarkMode
                ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
                : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40'
            } hover:scale-105 backdrop-blur-sm`}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Position</span>
            </div>
          </button>
        </div>
      </div>

      {/* Total P&L Summary */}
      <div className={`p-6 rounded-2xl backdrop-blur-lg border mb-8 ${
        isDarkMode 
          ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
          : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Total P&L
            </h2>
            <p className={`text-4xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${totalPnL.toFixed(2)}
            </p>
          </div>
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
            totalPnL >= 0 
              ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
              : 'bg-gradient-to-br from-red-500 to-pink-500'
          }`}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d={totalPnL >= 0 ? "M7 11l5-5m0 0l5 5m-5-5v12" : "M17 13l-5 5m0 0l-5-5m5 5V6"} />
            </svg>
          </div>
        </div>
      </div>

      {/* Add Position Form */}
      {showAddForm && (
        <div className={`p-8 rounded-2xl backdrop-blur-lg border mb-8 ${
          isDarkMode 
            ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
            : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
        }`}>
          <h2 className="text-2xl font-bold mb-6">Add New Position</h2>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Platform Selection */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Platform
              </label>
              <select
                value={positionForm.platform}
                onChange={(e) => handleFormChange('platform', e.target.value)}
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
                onChange={(e) => handleFormChange('symbol', e.target.value)}
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
                onChange={(e) => handleFormChange('lots', e.target.value)}
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
                onChange={(e) => handleFormChange('entryPrice', e.target.value)}
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
                  onClick={() => handleFormChange('side', 'buy')}
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
                  onClick={() => handleFormChange('side', 'sell')}
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
                onClick={() => setShowAddForm(false)}
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
      )}

      {/* Positions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {positions.map((position) => {
          const { pnl, pnlPercent } = calculatePnL(position);
          const isProfitable = pnl >= 0;

          return (
            <div 
              key={position.id} 
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
                  Added: {position.timestamp}
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
        })}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div 
        className={`${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} flex flex-col fixed inset-0 overflow-hidden`}
        style={{ 
          height: '100svh',
          minHeight: '100vh',
          maxHeight: '100vh',
          width: '100vw',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          paddingBottom: '0px',
          margin: '0px'
        }}
      >
        <div className="flex-1 overflow-hidden" style={{ height: 'calc(100vh - 80px)' }}>
          {content}
        </div>
        <div className="flex-shrink-0" style={{ height: '80px' }}>
          <FloatingNav activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} flex flex-col`}>
      <Header 
        onlineUsers={onlineUsers} 
        sidebarOpen={sidebarOpen} 
        onSidebarToggle={toggleSidebar} 
      />
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {content}
      </div>
    </div>
  );
});

export default Positions;