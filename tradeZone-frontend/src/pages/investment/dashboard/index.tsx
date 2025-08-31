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

interface PlatformData {
  platform: 'Delta Exchange' | 'Groww';
  totalInvestment: number;
  currentValue: number;
  returns: number;
  returnsPercent: number;
  color: string;
}

interface PortfolioData {
  totalInvestment: number;
  currentValue: number;
  totalReturns: number;
  totalReturnsPercent: number;
  dayChange: number;
  dayChangePercent: number;
  activePositions: number;
  platforms: PlatformData[];
}

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

interface Transaction {
  id: string;
  symbol: string;
  amount: number;
  lots: number;
  type: 'buy' | 'sell';
  platform: 'Delta Exchange' | 'Groww';
  timestamp: string;
  price: number;
}

interface ChartDataPoint {
  date: string;
  value: number;
  returns: number;
}

type TimeFilter = '1M' | '1W' | '6M' | '1Y' | '5Y';

const InvestmentDashboard = memo(function InvestmentDashboard() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { canAccessInvestment } = usePermissions();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<MobileTab>('chart');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<TimeFilter>('1M');

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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleTabChange = (tab: MobileTab) => {
    setActiveTab(tab);
  };

  const isDarkMode = settings.theme === 'dark';

  // Mock Portfolio Data with Platform Breakdown
  const portfolioData: PortfolioData = {
    totalInvestment: 50000,
    currentValue: 65430.75,
    totalReturns: 15430.75,
    totalReturnsPercent: 30.86,
    dayChange: 1247.85,
    dayChangePercent: 1.95,
    activePositions: 8,
    platforms: [
      {
        platform: 'Delta Exchange',
        totalInvestment: 30000,
        currentValue: 42150.50,
        returns: 12150.50,
        returnsPercent: 40.50,
        color: '#22C55E'
      },
      {
        platform: 'Groww',
        totalInvestment: 20000,
        currentValue: 23280.25,
        returns: 3280.25,
        returnsPercent: 16.40,
        color: '#3B82F6'
      }
    ]
  };

  // Mock Asset Positions (Lot-wise)
  const assetPositions: AssetPosition[] = [
    {
      symbol: 'BTC',
      lots: 2,
      investedAmount: 15000,
      currentValue: 21500,
      returns: 6500,
      returnsPercent: 43.33,
      platform: 'Delta Exchange',
      color: '#F7931A'
    },
    {
      symbol: 'ETH',
      lots: 10,
      investedAmount: 12000,
      currentValue: 18200,
      returns: 6200,
      returnsPercent: 51.67,
      platform: 'Delta Exchange',
      color: '#627EEA'
    },
    {
      symbol: 'DOGE',
      lots: 5,
      investedAmount: 3000,
      currentValue: 2450.50,
      returns: -549.50,
      returnsPercent: -18.32,
      platform: 'Delta Exchange',
      color: '#C2A633'
    },
    {
      symbol: 'AAPL',
      lots: 15,
      investedAmount: 8000,
      currentValue: 9850.75,
      returns: 1850.75,
      returnsPercent: 23.13,
      platform: 'Groww',
      color: '#000000'
    },
    {
      symbol: 'TSLA',
      lots: 8,
      investedAmount: 7000,
      currentValue: 8120.25,
      returns: 1120.25,
      returnsPercent: 16.00,
      platform: 'Groww',
      color: '#E31E24'
    },
    {
      symbol: 'GOOGL',
      lots: 12,
      investedAmount: 5000,
      currentValue: 5309.25,
      returns: 309.25,
      returnsPercent: 6.19,
      platform: 'Groww',
      color: '#4285F4'
    }
  ];

  // Mock Recent Transactions
  const recentTransactions: Transaction[] = [
    {
      id: '1',
      symbol: 'BTC',
      amount: 7500,
      lots: 1,
      type: 'buy',
      platform: 'Delta Exchange',
      timestamp: '2024-01-15 14:30',
      price: 43500
    },
    {
      id: '2',
      symbol: 'ETH',
      amount: 6000,
      lots: 5,
      type: 'buy',
      platform: 'Delta Exchange',
      timestamp: '2024-01-15 12:15',
      price: 2450
    },
    {
      id: '3',
      symbol: 'AAPL',
      amount: 4000,
      lots: 8,
      type: 'buy',
      platform: 'Groww',
      timestamp: '2024-01-15 10:45',
      price: 185.50
    },
    {
      id: '4',
      symbol: 'TSLA',
      amount: 3500,
      lots: 4,
      type: 'buy',
      platform: 'Groww',
      timestamp: '2024-01-14 16:20',
      price: 240.75
    }
  ];

  // Mock Chart Data based on selected time filter
  const generateChartData = (timeFilter: TimeFilter): ChartDataPoint[] => {
    const now = new Date();
    const dataPoints: ChartDataPoint[] = [];
    let days = 30; // Default 1M
    
    switch (timeFilter) {
      case '1W': days = 7; break;
      case '1M': days = 30; break;
      case '6M': days = 180; break;
      case '1Y': days = 365; break;
      case '5Y': days = 1825; break;
    }

    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Generate realistic portfolio growth with some volatility
      const baseValue = 50000;
      const trend = (days - i) / days * 15430.75; // Growth trend
      const volatility = Math.sin(i * 0.1) * 1000 + Math.random() * 500 - 250; // Market volatility
      const value = baseValue + trend + volatility;
      const returns = value - baseValue;
      
      dataPoints.push({
        date: date.toISOString().split('T')[0],
        value: Math.max(value, baseValue * 0.8), // Prevent unrealistic drops
        returns: returns
      });
    }
    
    return dataPoints;
  };

  const chartData = generateChartData(selectedTimeFilter);

  // Simple Line Chart Component
  const LineChart: React.FC<{ data: ChartDataPoint[]; height?: number }> = ({ data, height = 200 }) => {
    if (data.length === 0) return null;

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const valueRange = maxValue - minValue;
    const width = 100; // SVG width percentage

    const pathData = data.map((point, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((point.value - minValue) / valueRange) * height;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    const isPositive = data[data.length - 1].value > data[0].value;

    return (
      <div className="relative" style={{ height }}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          className="absolute inset-0"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(y => (
            <line
              key={y}
              x1="0"
              y1={y * height / 100}
              x2={width}
              y2={y * height / 100}
              stroke={isDarkMode ? '#374151' : '#E5E7EB'}
              strokeWidth="0.5"
            />
          ))}
          
          {/* Area under curve */}
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isPositive ? '#22C55E' : '#EF4444'} stopOpacity="0.3" />
              <stop offset="100%" stopColor={isPositive ? '#22C55E' : '#EF4444'} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          
          <path
            d={`${pathData} L ${width} ${height} L 0 ${height} Z`}
            fill="url(#areaGradient)"
          />
          
          {/* Main line */}
          <path
            d={pathData}
            fill="none"
            stroke={isPositive ? '#22C55E' : '#EF4444'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {data.map((point, index) => {
            const x = (index / (data.length - 1)) * width;
            const y = height - ((point.value - minValue) / valueRange) * height;
            
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="2"
                fill={isPositive ? '#22C55E' : '#EF4444'}
                className="opacity-60 hover:opacity-100"
              />
            );
          })}
        </svg>
      </div>
    );
  };

  const content = (
    <div className={`flex-1 p-6 overflow-y-auto ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-gray-900'
    }`}>
      {/* Header with futuristic glow */}
      <div className="mb-8">
        <h1 className={`text-4xl font-bold bg-gradient-to-r ${
          isDarkMode 
            ? 'from-cyan-400 via-purple-400 to-pink-400' 
            : 'from-blue-600 via-purple-600 to-indigo-600'
        } bg-clip-text text-transparent mb-2`}>
          Investment Dashboard
        </h1>
        <div className={`h-1 w-32 bg-gradient-to-r ${
          isDarkMode 
            ? 'from-cyan-400 via-purple-400 to-pink-400' 
            : 'from-blue-600 via-purple-600 to-indigo-600'
        } rounded-full`}></div>
      </div>

      {/* Time Filter Buttons */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {(['1W', '1M', '6M', '1Y', '5Y'] as TimeFilter[]).map(filter => (
            <button
              key={filter}
              onClick={() => setSelectedTimeFilter(filter)}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                selectedTimeFilter === filter
                  ? isDarkMode
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/25'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                  : isDarkMode
                  ? 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/70 border border-gray-700/50'
                  : 'bg-white/70 text-gray-700 hover:bg-white/90 border border-gray-200/50'
              } backdrop-blur-sm`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Investment */}
        <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
          isDarkMode 
            ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
            : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
        } hover:scale-105 transition-all duration-300`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Investment
            </h3>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text">
            ${portfolioData.totalInvestment.toLocaleString()}
          </p>
        </div>

        {/* Current Value */}
        <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
          isDarkMode 
            ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
            : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
        } hover:scale-105 transition-all duration-300`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Current Value
            </h3>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-transparent bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text">
            ${portfolioData.currentValue.toLocaleString()}
          </p>
        </div>

        {/* Total Returns */}
        <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
          isDarkMode 
            ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
            : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
        } hover:scale-105 transition-all duration-300`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Returns
            </h3>
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${
              portfolioData.totalReturns >= 0 ? 'from-green-500 to-emerald-500' : 'from-red-500 to-pink-500'
            } flex items-center justify-center`}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d={portfolioData.totalReturns >= 0 ? "M7 11l5-5m0 0l5 5m-5-5v12" : "M17 13l-5 5m0 0l-5-5m5 5V6"} />
              </svg>
            </div>
          </div>
          <p className={`text-3xl font-bold ${
            portfolioData.totalReturns >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            ${portfolioData.totalReturns.toLocaleString()} ({portfolioData.totalReturnsPercent.toFixed(2)}%)
          </p>
        </div>

        {/* Active Positions */}
        <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
          isDarkMode 
            ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
            : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
        } hover:scale-105 transition-all duration-300`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Active Positions
            </h3>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">
            {portfolioData.activePositions}
          </p>
        </div>
      </div>

      {/* Portfolio Performance Chart */}
      <div className={`p-8 rounded-2xl backdrop-blur-lg border mb-8 ${
        isDarkMode 
          ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
          : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Portfolio Performance</h2>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-lg ${
              isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
            }`}>
              <span className="text-sm font-medium">
                +{((chartData[chartData.length - 1]?.value / chartData[0]?.value - 1) * 100).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
        <div className="h-80">
          <LineChart data={chartData} height={320} />
        </div>
      </div>

      {/* Platform Breakdown */}
      <div className={`p-8 rounded-2xl backdrop-blur-lg border mb-8 ${
        isDarkMode 
          ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
          : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
      }`}>
        <h2 className="text-2xl font-bold mb-6">Platform Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {portfolioData.platforms.map((platform) => (
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

      {/* Asset Positions (Lot-wise) */}
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

      {/* Recent Transactions */}
      <div className={`p-8 rounded-2xl backdrop-blur-lg border ${
        isDarkMode 
          ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
          : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
      }`}>
        <h2 className="text-2xl font-bold mb-6">Recent Transactions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recentTransactions.map((transaction) => (
            <div key={transaction.id} className={`p-6 rounded-xl border ${
              isDarkMode 
                ? 'bg-gray-700/30 border-gray-600/50 hover:bg-gray-700/50' 
                : 'bg-white/70 border-gray-200/50 hover:bg-white/90'
            } transition-all duration-300`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    transaction.type === 'buy' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d={transaction.type === 'buy' ? "M7 11l5-5m0 0l5 5m-5-5v12" : "M17 13l-5 5m0 0l-5-5m5 5V6"} />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold">{transaction.symbol}</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {transaction.platform}
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  transaction.type === 'buy'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {transaction.type.toUpperCase()}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Amount:</span>
                  <span className="font-medium">${transaction.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Lots:</span>
                  <span className="font-medium">{transaction.lots}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Price:</span>
                  <span className="font-medium">${transaction.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Date:</span>
                  <span className="font-medium text-sm">{transaction.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
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

export default InvestmentDashboard;
