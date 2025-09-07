import React, { memo, useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { useSettings } from '../../../contexts/SettingsContext';
import { useNavigate } from 'react-router-dom';
import Header from '../../../layouts/Header';
import Sidebar from '../../../components/Sidebar';
import FloatingNav, { type MobileTab } from '../../../layouts/FloatingNav';
import { usePermissions } from '../../../hooks/usePermissions';
import type { RootState, AppDispatch } from '../../../redux/store';
import { fetchPositions, createPosition, updatePosition } from '../../../redux/thunks/positions/positionsThunks';
import { clearError } from '../../../redux/slices/positionsSlice';
import type { Position, PositionLike, AggregatedPosition, CreatePositionData } from '../../../types/position';
import Input from '../../../components/input';
import Select from '../../../components/select';
import Radio from '../../../components/radio';
// Removed ProgressBar in favor of a dropdown for leverage selection
import { 
  PositionCard, 
  AddPositionForm, 
  PositionsSummary, 
  PositionsGrid,
  ModifyPositionModal,
  ClosePositionModal
} from './components';
import { positionsApi } from '../../../services/positionsApi';

interface OnlineUser {
  userId: string;
  userName: string;
  socketId: string;
}

interface PositionForm {
  symbol: string;
  lots: string;
  marginAmount: string; // replaces entryPrice; used as investedAmount
  side: 'buy' | 'sell';
  platform: 'Delta Exchange' | 'Groww';
  account: 'longterm' | 'main';
}

const Positions = memo(function Positions() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { settings } = useSettings();
  const { canAccessInvestment } = usePermissions();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<MobileTab>('chart');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  // Close modal state
  const [showCloseModal, setShowCloseModal] = useState<boolean>(false);
  const [closePnL, setClosePnL] = useState<string>('');
  const [closingOne, setClosingOne] = useState<boolean>(false);
  const [selectedForClose, setSelectedForClose] = useState<Position | null>(null);

  // Modify modal state
  const [showModifyModal, setShowModifyModal] = useState<boolean>(false);
  const [selectedForModify, setSelectedForModify] = useState<Position | null>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState<boolean>(false);

  // Filter state
  const [filters, setFilters] = useState({
    timeframe: '1D',
    side: 'all' as 'all' | 'buy' | 'sell',
    account: 'longterm' as 'all' | 'main' | 'longterm',
    platform: 'Delta Exchange' as 'all' | 'Delta Exchange' | 'Groww',
  });

  // Redux state
  const { positions, loading, createLoading, updateLoading, error } = useSelector((state: RootState) => state.positions);

  // Redirect if no permission
  useEffect(() => {
    if (!canAccessInvestment()) {
      navigate('/zone');
    }
  }, [canAccessInvestment, navigate]);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch positions from API based on filters (server-side filtering)
  useEffect(() => {
    const f: any = {};
    f.status = 'open';
    if (filters.side !== 'all') f.side = filters.side;
    if (filters.platform !== 'all') f.platform = filters.platform;
    if (filters.account !== 'all') f.account = filters.account;
    f.timeframe = filters.timeframe;
    dispatch(fetchPositions(f));
  }, [dispatch, filters]);

  // Fetch recent activity
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setActivityLoading(true);
        const items = await positionsApi.getHistory(20);
        if (mounted) setActivity(items || []);
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setActivityLoading(false);
      }
    };
    load();
    const id = setInterval(load, 30000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const toggleSidebar = () => setSidebarOpen((v) => !v);
  const handleTabChange = (tab: MobileTab) => setActiveTab(tab);
  const isDarkMode = settings.theme === 'dark';

  // Amounts are already USD; display as-is

  // Show unique symbols only (keep the most recent position per symbol)
  const uniquePositions: PositionLike[] = (() => {
    const bySymbol = new Map<string, Position>();
    const toEpoch = (p: Position): number => {
      const t1 = p.createdAt ? new Date(p.createdAt).getTime() : NaN;
      const t2 = p.updatedAt ? new Date(p.updatedAt).getTime() : NaN;
      const t3 = p.timestamp ? Date.parse(p.timestamp) : NaN;
      return Math.max(Number.isFinite(t1) ? t1 : 0, Number.isFinite(t2) ? t2 : 0, Number.isFinite(t3) ? t3 : 0);
    };
    const looksAggregated = positions.every((p: any) => !('id' in p) && 'pnl' in p && !('entryPrice' in p));
    if (looksAggregated) return positions as AggregatedPosition[];
    (positions as Position[]).forEach((p) => {
      const key = p.symbol.toUpperCase();
      const existing = bySymbol.get(key);
      if (!existing) {
        bySymbol.set(key, p);
        return;
      }
      if (toEpoch(p) >= toEpoch(existing)) bySymbol.set(key, p);
    });
    return Array.from(bySymbol.values());
  })();

  // Form state
  const [positionForm, setPositionForm] = useState<PositionForm>({
    symbol: '',
    lots: '',
  marginAmount: '',
    side: 'buy',
    platform: 'Delta Exchange',
    account: 'longterm',
  });
  // NOTE: Symbol is now a free-text field (Investment Name)

  // Handle form input changes
  const handleFormChange = (field: keyof PositionForm, value: string) => {
    setPositionForm((prev) => ({ ...prev, [field]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!positionForm.symbol || !positionForm.lots || !positionForm.marginAmount) {
      toast.warning('Please fill all required fields');
      return;
    }
    const lotsNum = parseInt(String(positionForm.lots).replace(/[\,\s]/g, ''));
    const marginNum = parseFloat(String(positionForm.marginAmount).replace(/[\,\s]/g, ''));
    if (!Number.isFinite(lotsNum) || lotsNum <= 0) {
      toast.warning('Lots must be a positive number');
      return;
    }
    if (!Number.isFinite(marginNum) || marginNum <= 0) {
      toast.warning('Margin amount must be a positive number');
      return;
    }
    // Derive entryPrice from margin to satisfy backend DTO (entryPrice required)
    const derivedEntry = marginNum / lotsNum;
    const newPositionData: CreatePositionData = {
      symbol: positionForm.symbol.toUpperCase(),
      side: positionForm.side,
      entryPrice: Number.isFinite(derivedEntry) && derivedEntry > 0 ? derivedEntry : 1,
      lots: parseInt(positionForm.lots),
      investedAmount: marginNum,
      platform: positionForm.platform,
  leverage: undefined, // backend ignores it now
  account: positionForm.account,
      timestamp: new Date().toLocaleString(),
    };
    try {
      await dispatch(createPosition(newPositionData)).unwrap();
      setPositionForm({ symbol: '', lots: '', marginAmount: '', side: 'buy', platform: 'Delta Exchange', account: 'main' });
      setShowAddForm(false);
      toast.success('Position added successfully!');
    } catch (error) {
      console.error('Failed to create position:', error);
      toast.error('Failed to add position. Please try again.');
    }
  };

  // Error clear
  const handleClearError = () => dispatch(clearError());

  // Open close modal for a given position (only if it has an ID)
  const openCloseModal = (position: PositionLike) => {
    if ('id' in position) {
      setSelectedForClose(position as Position);
      setClosePnL('');
      setShowCloseModal(true);
    } else {
      toast.info('Open the symbol detail to close specific legs, or use Close All.');
      setSelectedForClose(null);
      setClosePnL('');
      setShowCloseModal(true);
    }
  };

  const submitCloseOne = async () => {
    if (!selectedForClose?.id) return;
    try {
      setClosingOne(true);
      const pnlValue = Number(closePnL);
      await dispatch(
        updatePosition({
          id: selectedForClose.id,
          data: { status: 'closed', pnl: Number.isFinite(pnlValue) ? pnlValue : 0, closedAt: new Date() as any },
        })
      ).unwrap();
      toast.success('Position closed');
      setShowCloseModal(false);
      setSelectedForClose(null);
      setClosePnL('');
      await dispatch(fetchPositions(undefined));
    } catch (err) {
      toast.error('Failed to close position');
    } finally {
      setClosingOne(false);
    }
  };

  const handleModifyPosition = (position: Position) => {
    setSelectedForModify(position);
    setShowModifyModal(true);
  };

  const handleSaveModification = async (id: string, data: any) => {
    try {
      await dispatch(updatePosition({ id, data })).unwrap();
      toast.success('Position updated successfully');
      setShowModifyModal(false);
      setSelectedForModify(null);
      await dispatch(fetchPositions(undefined));
    } catch (error) {
      console.error('Error updating position:', error);
      toast.error('Failed to update position');
    }
  };

  // Filter functions
  const handleFilterChange = (filterType: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Server now applies filters; keep unique reduction only
  const filteredPositions = uniquePositions;

  const content = (
    <div className={`flex-1 p-6 overflow-y-auto ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <div className="flex justify-between items-center">
            <p>Error: {error}</p>
            <button onClick={handleClearError} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">Clear</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Positions</h1>
          <div className="flex space-x-3">
            {/* Add Position Button */}
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                showAddForm ? (isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700') : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>{showAddForm ? 'Cancel' : 'Add Position'}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        className={`p-4 rounded-2xl backdrop-blur-lg border mb-6 ${
          isDarkMode ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
        }`}
      >
        <div className="flex flex-wrap gap-4 items-center">
          <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Filters:
          </h3>
          
          {/* Timeframe Filter */}
          <div className="flex items-center space-x-2">
            <label className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Timeframe:
            </label>
            <select
              value={filters.timeframe}
              onChange={(e) => handleFilterChange('timeframe', e.target.value)}
              className={`px-3 py-1 rounded-lg text-sm border ${
                isDarkMode 
                  ? 'bg-gray-700/50 border-gray-600/50 text-white' 
                  : 'bg-white/70 border-gray-300/50 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
            >
              <option value="1D">1 Day</option>
              <option value="7D">7 Days</option>
              <option value="30D">30 Days</option>
              <option value="90D">90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          {/* Side Filter */}
          <div className="flex items-center space-x-2">
            <label className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Side:
            </label>
            <select
              value={filters.side}
              onChange={(e) => handleFilterChange('side', e.target.value)}
              className={`px-3 py-1 rounded-lg text-sm border ${
                isDarkMode 
                  ? 'bg-gray-700/50 border-gray-600/50 text-white' 
                  : 'bg-white/70 border-gray-300/50 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
            >
              <option value="all">All</option>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </div>

          {/* Platform Filter */}
          <div className="flex items-center space-x-2">
            <label className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Platform:
            </label>
            <select
              value={filters.platform}
              onChange={(e) => handleFilterChange('platform', e.target.value)}
              className={`px-3 py-1 rounded-lg text-sm border ${
                isDarkMode 
                  ? 'bg-gray-700/50 border-gray-600/50 text-white' 
                  : 'bg-white/70 border-gray-300/50 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
            >
              <option value="Delta Exchange">Delta Exchange</option>
              <option value="Groww">Groww</option>
              <option value="all">All</option>
            </select>
          </div>

          {/* Account Filter */}
          <div className="flex items-center space-x-2">
            <label className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Account:
            </label>
            <select
              value={filters.account}
              onChange={(e) => handleFilterChange('account', e.target.value)}
              className={`px-3 py-1 rounded-lg text-sm border ${
                isDarkMode 
                  ? 'bg-gray-700/50 border-gray-600/50 text-white' 
                  : 'bg-white/70 border-gray-300/50 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
            >
              <option value="all">All</option>
              <option value="main">Main</option>
              <option value="longterm">Longterm</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <button
            onClick={() => setFilters({ timeframe: '1D', side: 'all', account: 'longterm', platform: 'Delta Exchange' })}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              isDarkMode 
                ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50' 
                : 'bg-gray-200/50 text-gray-700 hover:bg-gray-300/50'
            }`}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - 75% - Current Functionality */}
        <div className="flex-1 lg:w-3/4">

      {/* Total Investment Summary */}
      <div
        className={`p-6 rounded-2xl backdrop-blur-lg border mb-8 ${
          isDarkMode ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Investment (USD)</h2>
            <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>${filteredPositions.reduce((s: number, p: any) => s + (p.investedAmount || 0), 0).toFixed(2)}</p>
          </div>
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-500`}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-3.314 0-6 1.79-6 4s2.686 4 6 4 6-1.79 6-4-2.686-4-6-4zm0-4v4m0 8v4" />
            </svg>
          </div>
        </div>
      </div>

      {/* Add Position Form */}
      {showAddForm && (
        <div
          className={`p-8 rounded-2xl backdrop-blur-lg border mb-8 ${
            isDarkMode ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
          }`}
        >
          <h2 className="text-lg font-semibold mb-4">Add New Position</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            {/* Platform Selection */}
            <Select
              value={positionForm.platform}
              onChange={(value) => handleFormChange('platform', value)}
              options={[
                { value: 'Delta Exchange', label: 'Delta Exchange' },
                { value: 'Groww', label: 'Groww' },
              ]}
              label="Platform"
              isDarkMode={isDarkMode}
            />

            {/* Investment Name (replaces Symbol dropdown) */}
            <Input
              type="text"
              value={positionForm.symbol}
              onChange={(value) => handleFormChange('symbol', value)}
              placeholder="Enter investment name"
              label="Investment Name"
              required
              isDarkMode={isDarkMode}
            />

            {/* Lots */}
            <Input
              type="number"
              value={positionForm.lots}
              onChange={(value) => handleFormChange('lots', value)}
              placeholder="Enter lots"
              label="Lots"
              min={1}
              required
              isDarkMode={isDarkMode}
            />

            {/* Margin Amount */}
            <Input
              type="number"
              value={positionForm.marginAmount}
              onChange={(value) => handleFormChange('marginAmount', value)}
              placeholder="Enter margin amount"
              label="Margin Amount"
              step="any"
              required
              isDarkMode={isDarkMode}
            />

            {/* Side */}
            <Radio
              value={positionForm.side}
              onChange={(value) => handleFormChange('side', value)}
              options={[
                { value: 'buy', label: 'Buy' },
                { value: 'sell', label: 'Sell' },
              ]}
              label="Side"
              isDarkMode={isDarkMode}
            />

            {/* Account */}
            <Radio
              value={positionForm.account}
              onChange={(value) => handleFormChange('account', value)}
              options={[
                { value: 'main', label: 'Main' },
                { value: 'longterm', label: 'Longterm' },
              ]}
              label="Account"
              isDarkMode={isDarkMode}
            />

            {/* Submit */}
            <div className="md:col-span-2 lg:col-span-6 flex gap-4">
              <button
                type="submit"
                disabled={createLoading}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createLoading ? 'Adding...' : 'Add Position'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className={`px-8 py-3 font-medium rounded-xl transition-all duration-300 ${
                  isDarkMode ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50' : 'bg-gray-200/50 text-gray-700 hover:bg-gray-300/50'
                }`}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading positions...</p>
        </div>
      )}

      {/* Positions Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPositions.map((position: any) => {
            return (
              <div
                key={(position as any).id ?? (position as any).symbol}
                className={`p-6 rounded-2xl backdrop-blur-lg border transition-all duration-300 hover:scale-105 ${
                  isDarkMode
                    ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20 hover:bg-gray-800/40'
                    : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10 hover:bg-white/80'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white ${
                        'platform' in position && (position as any).platform === 'Delta Exchange'
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                          : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                      }`}
                    >
                      {position.symbol.substring(0, 2)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{position.symbol}</h3>
                      {'platform' in position && (
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{(position as Position).platform}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-1">
                    <div
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        position.side === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {position.side.toUpperCase()}
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-xs font-medium ${isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                      {position.lots} Lots
                    </div>
                  </div>
                </div>

                {/* Invested Amount (USD) */}
                <div className={`mt-3 px-4 py-3 rounded-xl border ${isDarkMode ? 'border-gray-700/50 bg-gray-800/30' : 'border-gray-200 bg-white/60'}`}>
                  <div className="flex justify-between items-center">
                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Invested (USD)</span>
                    <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>${Number(position.investedAmount || 0).toFixed(2)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if ('id' in position) {
                        handleModifyPosition(position as Position);
                      } else {
                        toast.info('Cannot modify aggregated positions. Please view individual positions.');
                      }
                    }}
                    className="flex-1 py-2 px-3 text-sm rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                  >
                    Modify
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openCloseModal(position);
                    }}
                    disabled={updateLoading}
                    className="flex-1 py-2 px-3 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {updateLoading ? 'Closing...' : 'Close'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </div>

        {/* Right Column - 25% - Recent Activity */}
        <div className="w-full lg:w-1/4">
          <div
            className={`p-6 rounded-2xl backdrop-blur-lg border ${
              isDarkMode ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
            }`}
          >
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Recent Activity
            </h3>
            
            {/* Activity List */}
            <div className="space-y-4">
              {activityLoading && (
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/50'}`}>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Loading activity…</p>
                </div>
              )}
              {!activityLoading && activity.length === 0 && (
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/50'}`}>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>No recent activity</p>
                </div>
              )}
              {!activityLoading && activity.map((item, idx) => {
                const created = item.createdAt ? new Date(item.createdAt) : null;
                const minutesAgo = created ? Math.floor((Date.now() - created.getTime()) / 60000) : null;
                const timeLabel = minutesAgo === null
                  ? ''
                  : minutesAgo < 1
                  ? 'just now'
                  : minutesAgo < 60
                  ? `${minutesAgo} min ago`
                  : `${Math.floor(minutesAgo / 60)} hour${Math.floor(minutesAgo / 60) > 1 ? 's' : ''} ago`;

                const action = item.action as string;
                const titleColor = action === 'create'
                  ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                  : action === 'update'
                  ? (isDarkMode ? 'text-blue-400' : 'text-blue-600')
                  : action === 'close' || action === 'close-all'
                  ? (isDarkMode ? 'text-red-400' : 'text-red-600')
                  : (isDarkMode ? 'text-purple-400' : 'text-purple-600');

                const title = action === 'create'
                  ? 'Position Opened'
                  : action === 'update'
                  ? 'Position Modified'
                  : action === 'close'
                  ? 'Position Closed'
                  : action === 'close-all'
                  ? 'All Positions Closed'
                  : action === 'delete'
                  ? 'Position Deleted'
                  : action === 'bulk-create'
                  ? 'Positions Imported'
                  : 'Activity';

                const desc = (() => {
                  const sym = item.symbol || item.details?.symbol || '';
                  if (action === 'create') {
                    const lots = item.details?.lots;
                    const side = (item.details?.side || '').toUpperCase();
                    return `${sym} - ${side} ${lots ?? ''} ${lots ? 'lots' : ''}`.trim();
                  }
                  if (action === 'update') {
                    const fields = ['lots', 'entryPrice', 'investedAmount', 'status', 'pnl'];
                    const parts = fields
                      .filter((f) => item.details && item.details[f] !== undefined)
                      .map((f) => `${f}: ${item.details[f]}`);
                    return `${sym} - ${parts.join(', ')}` || sym;
                  }
                  if (action === 'close') {
                    const pnl = item.details?.pnl;
                    return `${sym} - Closed${pnl !== undefined ? ` with ${pnl >= 0 ? '+' : ''}$${Number(pnl).toFixed(2)} P&L` : ''}`;
                  }
                  if (action === 'close-all') {
                    const count = item.details?.count;
                    return `Closed ${count ?? 0} positions`;
                  }
                  if (action === 'delete') {
                    return `${sym} - Position removed`;
                  }
                  if (action === 'bulk-create') {
                    const createdCount = item.details?.created ?? 0;
                    const skipped = item.details?.skipped ?? 0;
                    return `Created ${createdCount} positions, skipped ${skipped}`;
                  }
                  return sym || 'Activity';
                })();

                return (
                  <div key={item.id || idx} className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${titleColor}`}>
                        {title}
                      </span>
                      <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {timeLabel}
                      </span>
                    </div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {desc}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Optional: add controls here later (e.g., refresh) */}
          </div>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div
        className={`${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} flex flex-col fixed inset-0 overflow-hidden`}
        style={{ height: '100svh', minHeight: '100vh', maxHeight: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, paddingBottom: '0px', margin: '0px' }}
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
      <Header onlineUsers={onlineUsers} sidebarOpen={sidebarOpen} onSidebarToggle={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <div className="flex-1 flex min-h-0 overflow-hidden">{content}</div>

      {/* Close Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} w-full max-w-md rounded-2xl shadow-xl overflow-hidden`}>
            <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className="text-lg font-semibold">Close Position{selectedForClose ? '' : 's'}</h3>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Enter realized PnL for record keeping. You can close the selected position or close all.</p>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>PnL (USD)</label>
                <input
                  type="number"
                  value={closePnL}
                  onChange={(e) => setClosePnL(e.target.value)}
                  placeholder="e.g. 125.50 or -42.10"
                  className={`w-full px-3 py-2 rounded-lg border outline-none ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>
              {selectedForClose && (
                <button onClick={submitCloseOne} disabled={closingOne} className={`w-full py-2.5 rounded-lg font-medium ${closingOne ? 'opacity-60' : ''} ${isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-600 hover:bg-red-700'} text-white`}>
                  {closingOne ? 'Closing…' : `Close ${selectedForClose.symbol}`}
                </button>
              )}
              {/* Removed Close All action */}
              <button onClick={() => { setShowCloseModal(false); setSelectedForClose(null); setClosePnL(''); }} className={`w-full py-2.5 rounded-lg font-medium ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modify Modal */}
      <ModifyPositionModal
        position={selectedForModify}
        isOpen={showModifyModal}
        onClose={() => setShowModifyModal(false)}
        onSave={handleSaveModification}
        isDarkMode={isDarkMode}
      />
    </div>
  );
});

export default Positions;