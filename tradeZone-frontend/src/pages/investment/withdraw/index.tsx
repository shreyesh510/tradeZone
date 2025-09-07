import { memo, useState, useEffect } from 'react';
import Header from '../../../layouts/Header';
import Sidebar from '../../../components/Sidebar';
import FloatingNav, { type MobileTab } from '../../../layouts/FloatingNav';
import { useSettings } from '../../../contexts/SettingsContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../redux/store';
import { fetchWithdrawals, createWithdrawal } from '../../../redux/thunks/withdrawals/withdrawalsThunks';

interface OnlineUser {
  userId: string;
  userName: string;
  socketId: string;
}

// Deprecated local type kept for context; using API DTO via Redux now
interface WithdrawalRecord {
  id: string;
  amount: number;
  requestedAt: string;
  description?: string;
}

interface ChartDataPoint {
  date: string;
  amount: number;
}

type TimeFilter = '1M' | '1W' | '6M' | '1Y' | '5Y';

const Withdraw = memo(function Withdraw() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { canAccessInvestment } = usePermissions();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<MobileTab>('chart');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<TimeFilter>('1M');
  const dispatch = useDispatch<AppDispatch>();
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const { items: withdrawals, loading, creating, error } = useSelector((s: RootState) => s.withdrawals);

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

  // Load withdrawals from API
  useEffect(() => {
    dispatch(fetchWithdrawals());
  }, [dispatch]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleTabChange = (tab: MobileTab) => {
    setActiveTab(tab);
  };

  const isDarkMode = settings.theme === 'dark';

  // Generate chart data based on selected time filter
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

    // Generate withdrawal data for the selected period
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Calculate total withdrawals up to this date
      const dateStr = date.toISOString().split('T')[0];
      const withdrawalsUpToDate = withdrawals.filter(w => 
        new Date((w as any).requestedAt) <= date
      );
      const totalAmount = withdrawalsUpToDate.reduce((sum, w) => sum + w.amount, 0);
      
      dataPoints.push({
        date: dateStr,
        amount: totalAmount
      });
    }
    
    return dataPoints;
  };

  const chartData = generateChartData(selectedTimeFilter);

  // Simple Line Chart Component
  const LineChart: React.FC<{ data: ChartDataPoint[]; height?: number }> = ({ data, height = 200 }) => {
    if (data.length === 0) return null;

    const maxAmount = Math.max(...data.map(d => d.amount));
    const minAmount = Math.min(...data.map(d => d.amount));
    const amountRange = maxAmount - minAmount || 1;
    const width = 100; // SVG width percentage

    const pathData = data.map((point, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((point.amount - minAmount) / amountRange) * height;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

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
            <linearGradient id="withdrawalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          
          <path
            d={`${pathData} L ${width} ${height} L 0 ${height} Z`}
            fill="url(#withdrawalGradient)"
          />
          
          {/* Main line */}
          <path
            d={pathData}
            fill="none"
            stroke="#EF4444"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {data.map((point, index) => {
            const x = (index / (data.length - 1)) * width;
            const y = height - ((point.amount - minAmount) / amountRange) * height;
            
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="2"
                fill="#EF4444"
                className="opacity-60 hover:opacity-100"
              />
            );
          })}
        </svg>
      </div>
    );
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (!withdrawAmount || amount <= 0) {
      alert('Please enter a valid withdrawal amount');
      return;
    }
    await dispatch(createWithdrawal({ amount, description: description || undefined })).unwrap();
    setWithdrawAmount('');
    setDescription('');
  };



  // Filter withdrawals based on timeframe
  const filteredWithdrawals = withdrawals.filter(withdrawal => {
  const withdrawalDate = new Date((withdrawal as any).requestedAt);
    const now = new Date();
    let cutoffDate = new Date();

    switch (selectedTimeFilter) {
      case '1W': cutoffDate.setDate(now.getDate() - 7); break;
      case '1M': cutoffDate.setMonth(now.getMonth() - 1); break;
      case '6M': cutoffDate.setMonth(now.getMonth() - 6); break;
      case '1Y': cutoffDate.setFullYear(now.getFullYear() - 1); break;
      case '5Y': cutoffDate.setFullYear(now.getFullYear() - 5); break;
    }

    return withdrawalDate >= cutoffDate;
  });

  const totalWithdrawals = filteredWithdrawals
    .reduce((sum, w) => sum + w.amount, 0);

  const content = (
    <div className={`flex-1 p-6 overflow-y-auto ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
    }`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Withdraw Funds
        </h1>
      </div>

      {/* Time Filter Buttons */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {(['1W', '1M', '6M', '1Y', '5Y'] as TimeFilter[]).map(filter => (
            <button
              key={filter}
              onClick={() => setSelectedTimeFilter(filter)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTimeFilter === filter
                  ? 'bg-blue-600 text-white'
                  : isDarkMode
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
  </div>
  {/* Total Withdrawals Summary */}
      <div className={`p-6 rounded-2xl backdrop-blur-lg border mb-8 ${
        isDarkMode 
          ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
          : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Withdrawals ({selectedTimeFilter})
            </h2>
            <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              ${totalWithdrawals.toLocaleString()}
            </p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
          </div>
        </div>
      </div>

      {/* Withdrawal Chart */}
      <div className={`p-8 rounded-2xl backdrop-blur-lg border mb-8 ${
        isDarkMode 
          ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
          : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Withdrawal History</h2>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-lg ${
              isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
            }`}>
              <span className="text-sm font-medium">
                {filteredWithdrawals.length} Withdrawals
              </span>
            </div>
          </div>
        </div>
        <div className="h-80">
          <LineChart data={chartData} height={320} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Withdrawal Form */}
        <div className={`p-8 rounded-2xl backdrop-blur-lg border ${
          isDarkMode 
            ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
            : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
        }`}>
          <h2 className="text-lg font-semibold mb-4">New Withdrawal</h2>
          
          <form onSubmit={handleWithdrawSubmit} className="space-y-6">
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
                  onChange={(e) => setWithdrawAmount(e.target.value)}
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
                Description (optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Reason for withdrawal"
                className={`w-full px-4 py-3 rounded-xl border backdrop-blur-sm ${
                  isDarkMode 
                    ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400' 
                    : 'bg-white/70 border-gray-300/50 text-gray-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all`}
              />
            </div>

            <button
              type="submit"
              disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
              className="w-full py-4 px-6 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-300 hover:scale-105 text-lg"
            >
              Submit Withdrawal Request
            </button>
            {error && (
              <p className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
            )}
          </form>
        </div>

        {/* Recent Withdrawals */}
        <div className={`p-8 rounded-2xl backdrop-blur-lg border ${
          isDarkMode 
            ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
            : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
        }`}>
          <h2 className="text-lg font-semibold mb-4">Recent Withdrawals</h2>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredWithdrawals.length === 0 ? (
              <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <p>No withdrawals in selected timeframe</p>
              </div>
            ) : (
              filteredWithdrawals.map(withdrawal => (
                <div key={withdrawal.id} className={`p-4 rounded-xl border transition-all duration-300 hover:scale-105 ${
                  isDarkMode 
                    ? 'bg-gray-700/30 border-gray-600/50 hover:bg-gray-700/50' 
                    : 'bg-white/70 border-gray-200/50 hover:bg-white/90'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-xl font-bold">${withdrawal.amount.toLocaleString()}</p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {(withdrawal as any).requestedAt}
                      </p>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  </div>
                  
                  {withdrawal.description && (
                    <div className="mb-3">
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {withdrawal.description}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Bank Transfer
                    </span>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
                    }`}>
                      WITHDRAWN
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Mobile wrapper simplified to use the same layout as desktop

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

export default Withdraw;