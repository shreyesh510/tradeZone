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

interface WithdrawalRecord {
  id: string;
  amount: number;
  timestamp: string;
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
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);

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

  // Initialize mock withdrawals
  useEffect(() => {
    const mockWithdrawals: WithdrawalRecord[] = [
      // Recent withdrawals (January 2024)
      {
        id: '1',
        amount: 8500,
        timestamp: '2024-01-20 14:30',
        description: 'Investment profits withdrawal'
      },
      {
        id: '2',
        amount: 3200,
        timestamp: '2024-01-18 09:15',
        description: 'Monthly salary supplement'
      },
      {
        id: '3',
        amount: 5000,
        timestamp: '2024-01-15 16:45',
        description: 'Emergency medical expenses'
      },
      {
        id: '4',
        amount: 2750,
        timestamp: '2024-01-12 11:20',
        description: 'Car repair payment'
      },
      {
        id: '5',
        amount: 1800,
        timestamp: '2024-01-08 13:45',
        description: 'Credit card payment'
      },
      {
        id: '6',
        amount: 4200,
        timestamp: '2024-01-05 10:30',
        description: 'Home improvement'
      },
      {
        id: '7',
        amount: 6500,
        timestamp: '2024-01-02 16:20',
        description: 'New year expenses'
      },
      
      // December 2023 withdrawals
      {
        id: '8',
        amount: 7200,
        timestamp: '2023-12-28 10:15',
        description: 'Year-end bonus withdrawal'
      },
      {
        id: '9',
        amount: 3800,
        timestamp: '2023-12-25 15:45',
        description: 'Christmas celebrations'
      },
      {
        id: '10',
        amount: 2200,
        timestamp: '2023-12-20 09:30',
        description: 'Holiday shopping'
      },
      {
        id: '11',
        amount: 5500,
        timestamp: '2023-12-15 14:20',
        description: 'Insurance payment'
      },
      {
        id: '12',
        amount: 2900,
        timestamp: '2023-12-10 11:45',
        description: 'Property tax payment'
      },
      {
        id: '13',
        amount: 1500,
        timestamp: '2023-12-05 16:30',
        description: 'Utility bills'
      },
      
      // November 2023 withdrawals
      {
        id: '14',
        amount: 4800,
        timestamp: '2023-11-28 12:15',
        description: 'Black Friday purchases'
      },
      {
        id: '15',
        amount: 3300,
        timestamp: '2023-11-22 09:45',
        description: 'Thanksgiving expenses'
      },
      {
        id: '16',
        amount: 2100,
        timestamp: '2023-11-18 14:30',
        description: 'Healthcare costs'
      },
      {
        id: '17',
        amount: 6200,
        timestamp: '2023-11-12 10:20',
        description: 'Business investment'
      },
      {
        id: '18',
        amount: 1750,
        timestamp: '2023-11-08 15:15',
        description: 'Education expenses'
      },
      {
        id: '19',
        amount: 4100,
        timestamp: '2023-11-03 13:45',
        description: 'Travel booking'
      },
      
      // October 2023 withdrawals
      {
        id: '20',
        amount: 5800,
        timestamp: '2023-10-30 11:30',
        description: 'Halloween party expenses'
      },
      {
        id: '21',
        amount: 2400,
        timestamp: '2023-10-25 16:20',
        description: 'Monthly groceries'
      },
      {
        id: '22',
        amount: 7500,
        timestamp: '2023-10-20 09:15',
        description: 'Investment rebalancing'
      },
      {
        id: '23',
        amount: 3600,
        timestamp: '2023-10-15 14:45',
        description: 'Home maintenance'
      },
      {
        id: '24',
        amount: 2800,
        timestamp: '2023-10-10 12:30',
        description: 'Electronics purchase'
      },
      {
        id: '25',
        amount: 4400,
        timestamp: '2023-10-05 10:45',
        description: 'Quarterly expenses'
      },
      
      // September 2023 withdrawals
      {
        id: '26',
        amount: 6800,
        timestamp: '2023-09-28 15:30',
        description: 'Back to school expenses'
      },
      {
        id: '27',
        amount: 3200,
        timestamp: '2023-09-22 11:15',
        description: 'Professional development'
      },
      {
        id: '28',
        amount: 5100,
        timestamp: '2023-09-18 09:45',
        description: 'Family vacation'
      },
      {
        id: '29',
        amount: 2700,
        timestamp: '2023-09-12 14:20',
        description: 'Gym membership'
      },
      {
        id: '30',
        amount: 4900,
        timestamp: '2023-09-08 16:45',
        description: 'Wedding gift'
      }
    ];
    setWithdrawals(mockWithdrawals);
  }, []);

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
        new Date(w.timestamp) <= date
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

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert('Please enter a valid withdrawal amount');
      return;
    }

    const newWithdrawal: WithdrawalRecord = {
      id: Date.now().toString(),
      amount: parseFloat(withdrawAmount),
      timestamp: new Date().toLocaleString(),
      description: 'Bank withdrawal'
    };

    setWithdrawals(prev => [newWithdrawal, ...prev]);
    setWithdrawAmount('');
    alert('Withdrawal recorded successfully!');
  };



  // Filter withdrawals based on timeframe
  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const withdrawalDate = new Date(withdrawal.timestamp);
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
          Withdraw Funds
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
            <p className="text-4xl font-bold text-transparent bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text">
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
          <h2 className="text-2xl font-bold">Withdrawal History</h2>
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
          <h2 className="text-2xl font-bold mb-6">New Withdrawal</h2>
          
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

            <button
              type="submit"
              disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
              className="w-full py-4 px-6 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-300 hover:scale-105 text-lg"
            >
              Submit Withdrawal Request
            </button>
          </form>
        </div>

        {/* Recent Withdrawals */}
        <div className={`p-8 rounded-2xl backdrop-blur-lg border ${
          isDarkMode 
            ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
            : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
        }`}>
          <h2 className="text-2xl font-bold mb-6">Recent Withdrawals</h2>
          
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
                        {withdrawal.timestamp}
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

export default Withdraw;