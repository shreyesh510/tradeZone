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

interface DepositRecord {
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

const Deposit = memo(function Deposit() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { canAccessInvestment } = usePermissions();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<MobileTab>('chart');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<TimeFilter>('1M');
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);

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

  // Initialize mock deposits
  useEffect(() => {
    const mockDeposits: DepositRecord[] = [
      // Recent deposits (January 2024)
      {
        id: '1',
        amount: 15000,
        timestamp: '2024-01-22 10:30',
        description: 'Quarterly investment bonus'
      },
      {
        id: '2',
        amount: 8500,
        timestamp: '2024-01-20 14:15',
        description: 'Crypto trading profits'
      },
      {
        id: '3',
        amount: 12000,
        timestamp: '2024-01-18 09:45',
        description: 'Stock dividend reinvestment'
      },
      {
        id: '4',
        amount: 6200,
        timestamp: '2024-01-15 16:30',
        description: 'Monthly salary allocation'
      },
      {
        id: '5',
        amount: 4800,
        timestamp: '2024-01-12 11:20',
        description: 'Side business income'
      },
      {
        id: '6',
        amount: 9500,
        timestamp: '2024-01-10 13:45',
        description: 'Tax refund investment'
      },
      {
        id: '7',
        amount: 7200,
        timestamp: '2024-01-08 15:15',
        description: 'Freelance project payment'
      },
      {
        id: '8',
        amount: 5500,
        timestamp: '2024-01-05 10:30',
        description: 'Investment portfolio rebalancing'
      },
      {
        id: '9',
        amount: 11000,
        timestamp: '2024-01-02 14:45',
        description: 'New year investment goal'
      },
      
      // December 2023 deposits
      {
        id: '10',
        amount: 13500,
        timestamp: '2023-12-30 09:15',
        description: 'Year-end bonus deposit'
      },
      {
        id: '11',
        amount: 6800,
        timestamp: '2023-12-28 16:20',
        description: 'Christmas gift money'
      },
      {
        id: '12',
        amount: 8200,
        timestamp: '2023-12-25 11:45',
        description: 'Holiday savings transfer'
      },
      {
        id: '13',
        amount: 4500,
        timestamp: '2023-12-22 14:30',
        description: 'Consulting income'
      },
      {
        id: '14',
        amount: 9800,
        timestamp: '2023-12-20 10:15',
        description: 'Rental property income'
      },
      {
        id: '15',
        amount: 5700,
        timestamp: '2023-12-18 15:45',
        description: 'Online course sales'
      },
      {
        id: '16',
        amount: 7500,
        timestamp: '2023-12-15 12:30',
        description: 'Insurance payout investment'
      },
      {
        id: '17',
        amount: 3400,
        timestamp: '2023-12-12 09:20',
        description: 'Cashback rewards'
      },
      {
        id: '18',
        amount: 12500,
        timestamp: '2023-12-10 16:15',
        description: 'Investment grade bonds maturity'
      },
      
      // November 2023 deposits
      {
        id: '19',
        amount: 6600,
        timestamp: '2023-11-28 13:45',
        description: 'Black Friday trading gains'
      },
      {
        id: '20',
        amount: 8900,
        timestamp: '2023-11-25 10:30',
        description: 'Thanksgiving investment tradition'
      },
      {
        id: '21',
        amount: 4200,
        timestamp: '2023-11-22 14:20',
        description: 'Affiliate marketing income'
      },
      {
        id: '22',
        amount: 11200,
        timestamp: '2023-11-20 11:15',
        description: 'Stock options exercise'
      },
      {
        id: '23',
        amount: 5800,
        timestamp: '2023-11-18 15:30',
        description: 'Peer-to-peer lending returns'
      },
      {
        id: '24',
        amount: 7900,
        timestamp: '2023-11-15 09:45',
        description: 'E-commerce business profits'
      },
      {
        id: '25',
        amount: 3600,
        timestamp: '2023-11-12 16:45',
        description: 'Investment challenge winnings'
      },
      {
        id: '26',
        amount: 9300,
        timestamp: '2023-11-10 12:20',
        description: 'Real estate flip proceeds'
      },
      {
        id: '27',
        amount: 6100,
        timestamp: '2023-11-08 14:15',
        description: 'Cryptocurrency mining rewards'
      },
      {
        id: '28',
        amount: 8400,
        timestamp: '2023-11-05 10:45',
        description: 'Monthly investment automation'
      },
      
      // October 2023 deposits
      {
        id: '29',
        amount: 7700,
        timestamp: '2023-10-30 13:30',
        description: 'Halloween trading bonuses'
      },
      {
        id: '30',
        amount: 5200,
        timestamp: '2023-10-28 11:20',
        description: 'Quarterly performance bonus'
      },
      {
        id: '31',
        amount: 10500,
        timestamp: '2023-10-25 15:45',
        description: 'Investment fund distribution'
      },
      {
        id: '32',
        amount: 4900,
        timestamp: '2023-10-22 09:15',
        description: 'Patent royalty payment'
      },
      {
        id: '33',
        amount: 8600,
        timestamp: '2023-10-20 14:30',
        description: 'Mutual fund redemption'
      },
      {
        id: '34',
        amount: 6300,
        timestamp: '2023-10-18 16:20',
        description: 'Dividend reinvestment program'
      },
      {
        id: '35',
        amount: 9100,
        timestamp: '2023-10-15 12:45',
        description: 'Business partnership profits'
      },
      
      // September 2023 deposits
      {
        id: '36',
        amount: 7800,
        timestamp: '2023-09-30 10:30',
        description: 'Quarter-end investment surge'
      },
      {
        id: '37',
        amount: 5500,
        timestamp: '2023-09-28 14:15',
        description: 'Back-to-school savings transfer'
      },
      {
        id: '38',
        amount: 11800,
        timestamp: '2023-09-25 11:45',
        description: 'Annual performance incentive'
      },
      {
        id: '39',
        amount: 4700,
        timestamp: '2023-09-22 15:30',
        description: 'Investment education completion bonus'
      },
      {
        id: '40',
        amount: 8800,
        timestamp: '2023-09-20 09:20',
        description: 'Commodities trading profits'
      }
    ];
    setDeposits(mockDeposits);
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

    // Generate deposit data for the selected period
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Calculate total deposits up to this date
      const dateStr = date.toISOString().split('T')[0];
      const depositsUpToDate = deposits.filter(d => 
        new Date(d.timestamp) <= date
      );
      const totalAmount = depositsUpToDate.reduce((sum, d) => sum + d.amount, 0);
      
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
            <linearGradient id="depositGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22C55E" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#22C55E" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          
          <path
            d={`${pathData} L ${width} ${height} L 0 ${height} Z`}
            fill="url(#depositGradient)"
          />
          
          {/* Main line */}
          <path
            d={pathData}
            fill="none"
            stroke="#22C55E"
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
                fill="#22C55E"
                className="opacity-60 hover:opacity-100"
              />
            );
          })}
        </svg>
      </div>
    );
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      alert('Please enter a valid deposit amount');
      return;
    }

    const newDeposit: DepositRecord = {
      id: Date.now().toString(),
      amount: parseFloat(depositAmount),
      timestamp: new Date().toLocaleString(),
      description: 'Bank deposit'
    };

    setDeposits(prev => [newDeposit, ...prev]);
    setDepositAmount('');
    alert('Deposit recorded successfully!');
  };



  // Filter deposits based on timeframe
  const filteredDeposits = deposits.filter(deposit => {
    const depositDate = new Date(deposit.timestamp);
    const now = new Date();
    let cutoffDate = new Date();

    switch (selectedTimeFilter) {
      case '1W': cutoffDate.setDate(now.getDate() - 7); break;
      case '1M': cutoffDate.setMonth(now.getMonth() - 1); break;
      case '6M': cutoffDate.setMonth(now.getMonth() - 6); break;
      case '1Y': cutoffDate.setFullYear(now.getFullYear() - 1); break;
      case '5Y': cutoffDate.setFullYear(now.getFullYear() - 5); break;
    }

    return depositDate >= cutoffDate;
  });

  const totalDeposits = filteredDeposits
    .reduce((sum, d) => sum + d.amount, 0);

  const content = (
    <div className={`flex-1 p-6 overflow-y-auto ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
    }`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Deposit Funds
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

      {/* Total Deposits Summary */}
      <div className={`p-6 rounded-2xl backdrop-blur-lg border mb-8 ${
        isDarkMode 
          ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
          : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Deposits ({selectedTimeFilter})
            </h2>
            <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              ${totalDeposits.toLocaleString()}
            </p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </div>

      {/* Deposit Chart */}
      <div className={`p-8 rounded-2xl backdrop-blur-lg border mb-8 ${
        isDarkMode 
          ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
          : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Deposit History</h2>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-lg ${
              isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
            }`}>
              <span className="text-sm font-medium">
                {filteredDeposits.length} Deposits
              </span>
            </div>
          </div>
        </div>
        <div className="h-80">
          <LineChart data={chartData} height={320} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Deposit Form */}
        <div className={`p-8 rounded-2xl backdrop-blur-lg border ${
          isDarkMode 
            ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
            : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
        }`}>
          <h2 className="text-lg font-semibold mb-4">New Deposit</h2>
          
          <form onSubmit={handleDepositSubmit} className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Deposit Amount
              </label>
              <div className="relative">
                <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  $
                </span>
                <input
                  type="number"
                  step="any"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.00"
                  className={`w-full pl-8 pr-4 py-4 rounded-xl border backdrop-blur-sm ${
                    isDarkMode 
                      ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400' 
                      : 'bg-white/70 border-gray-300/50 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-xl font-medium`}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!depositAmount || parseFloat(depositAmount) <= 0}
              className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-300 hover:scale-105 text-lg"
            >
              Submit Deposit Request
            </button>
          </form>
        </div>

        {/* Recent Deposits */}
        <div className={`p-8 rounded-2xl backdrop-blur-lg border ${
          isDarkMode 
            ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
            : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
        }`}>
          <h2 className="text-lg font-semibold mb-4">Recent Deposits</h2>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredDeposits.length === 0 ? (
              <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <p>No deposits in selected timeframe</p>
              </div>
            ) : (
              filteredDeposits.map(deposit => (
                <div key={deposit.id} className={`p-4 rounded-xl border transition-all duration-300 hover:scale-105 ${
                  isDarkMode 
                    ? 'bg-gray-700/30 border-gray-600/50 hover:bg-gray-700/50' 
                    : 'bg-white/70 border-gray-200/50 hover:bg-white/90'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-xl font-bold">${deposit.amount.toLocaleString()}</p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {deposit.timestamp}
                      </p>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  
                  {deposit.description && (
                    <div className="mb-3">
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {deposit.description}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Bank Transfer
                    </span>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                    }`}>
                      DEPOSITED
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
        <div className="flex-1 overflow-hidden" style={{ height: '100vh' }}>
          {content}
        </div>
        <FloatingNav activeTab={activeTab} onTabChange={handleTabChange} />
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

export default Deposit;