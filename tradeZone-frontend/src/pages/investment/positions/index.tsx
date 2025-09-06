import { memo, useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Header from '../../../layouts/Header';
import Sidebar from '../../../components/Sidebar';
import FloatingNav, { type MobileTab } from '../../../layouts/FloatingNav';
import { useSettings } from '../../../contexts/SettingsContext';
import { toast } from 'react-toastify';
import { usePermissions } from '../../../hooks/usePermissions';
import type { RootState, AppDispatch } from '../../../redux/store';
import Papa from 'papaparse';
import type { ParseError } from 'papaparse';
import {
  fetchPositions,
  createPosition,
  updatePosition,
  deletePosition,
} from '../../../redux/thunks/positions/positionsThunks';
import { clearError } from '../../../redux/slices/positionsSlice';
import type { Position, CreatePositionData } from '../../../types/position';
import Input from '../../../components/input';
import Select from '../../../components/select';
import Radio from '../../../components/radio';
import ProgressBar from '../../../components/progressbar';

interface OnlineUser {
  userId: string;
  userName: string;
  socketId: string;
}

// Position interface is now imported from types

interface PositionForm {
  symbol: string;
  lots: string;
  entryPrice: string;
  side: 'buy' | 'sell';
  platform: 'Delta Exchange' | 'Groww';
  leverage: string;
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
  const [importLoading, setImportLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importedPositions, setImportedPositions] = useState<CreatePositionData[]>([]);
  const [importingPositions, setImportingPositions] = useState<boolean>(false);

  // Redux state
  const {
    positions,
    loading,
    createLoading,
    updateLoading,
    deleteLoading,
    error,
  } = useSelector((state: RootState) => state.positions);

  // Form state
  const [positionForm, setPositionForm] = useState<PositionForm>({
    symbol: '',
    lots: '',
    entryPrice: '',
    side: 'buy',
    platform: 'Delta Exchange',
    leverage: '20'
  });

  // Leverage options
  const leverageOptions = [20, 50, 100, 150, 200];

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

  // Fetch positions from API
  useEffect(() => {
    dispatch(fetchPositions());
  }, [dispatch]);

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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!positionForm.symbol || !positionForm.lots || !positionForm.entryPrice) {
      toast.warning('Please fill all required fields');
      return;
    }

    const newPositionData: CreatePositionData = {
      symbol: positionForm.symbol.toUpperCase(),
      side: positionForm.side,
      entryPrice: parseFloat(positionForm.entryPrice),
      currentPrice: parseFloat(positionForm.entryPrice), // Start with entry price
      lots: parseInt(positionForm.lots),
      investedAmount: parseFloat(positionForm.entryPrice) * parseInt(positionForm.lots),
      platform: positionForm.platform,
      leverage: parseInt(positionForm.leverage),
      timestamp: new Date().toLocaleString()
    };

    try {
      await dispatch(createPosition(newPositionData)).unwrap();
      setPositionForm({
        symbol: '',
        lots: '',
        entryPrice: '',
        side: 'buy',
        platform: 'Delta Exchange',
        leverage: '20'
      });
      setShowAddForm(false);
      toast.success('Position added successfully!');
    } catch (error) {
      console.error('Failed to create position:', error);
      toast.error('Failed to add position. Please try again.');
    }
  };

  // Symbol options for the form
  const symbolOptions = {
    'Delta Exchange': ['BTCUSD', 'ETHUSD', 'DOGEUSD', 'ADAUSD', 'SOLUSD'],
    'Groww': ['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN', 'NVDA']
  };

  const availableSymbols = symbolOptions[positionForm.platform];

  // Function to handle file import
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setImportLoading(true);
    
    // Always use Delta Exchange as the platform for imports
    const platform: 'Delta Exchange' | 'Groww' = 'Delta Exchange';
    
    // Using FileReader to read the file first
    const reader = new FileReader();
    
    reader.onload = (event: ProgressEvent<FileReader>) => {
      if (!event.target?.result) {
        setImportLoading(false);
        toast.error('Failed to read file');
        return;
      }
      
      // Parse the CSV content
      Papa.parse(event.target.result.toString(), {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data as Record<string, string>[];
          const validPositions: CreatePositionData[] = [];
          let errorCount = 0;
          
          try {
            // Process each row from the CSV
            for (const row of data) {
              try {
                // Always process as Delta Exchange format for all imports
                let positionData: CreatePositionData;
                
                // Extract data using various possible field names for flexibility
                const symbol = row.Contract || row.Symbol || row['Stock Symbol'] || row['Company'] || '';
                const sideValue = (row.Side || 'buy').toLowerCase();
                const side = ['buy', 'sell'].includes(sideValue) ? sideValue : 'buy';
                const lots = parseFloat(row.Qty || row.Quantity || '0');
                const entryPrice = parseFloat(row['Exec.Price'] || row['Entry Price'] || row['Purchase Price'] || row['Avg. Cost'] || '0');
                const orderValue = parseFloat(row['Order Value'] || '0');
                const leverage = parseInt(row['Leverage'] || '20');
                
                if (!symbol || isNaN(lots) || isNaN(entryPrice)) {
                  console.error('Invalid row data:', row);
                  errorCount++;
                  continue;
                }
                
                positionData = {
                  symbol,
                  side: side as 'buy' | 'sell',
                  entryPrice,
                  currentPrice: entryPrice,
                  lots,
                  investedAmount: orderValue || entryPrice * lots,
                  platform: 'Delta Exchange', // Always use Delta Exchange
                  leverage,
                  status: 'open',
                  timestamp: row.Time || row['Date'] || row['Purchase Date'] || new Date().toLocaleString()
                };
                
                validPositions.push(positionData);
              } catch (err) {
                console.error('Failed to parse position:', err);
                errorCount++;
              }
            }
            
            // Show positions in modal for confirmation
            if (validPositions.length > 0) {
              setImportedPositions(validPositions);
              setShowImportModal(true);
              toast.info(`Found ${validPositions.length} valid positions. Please review and confirm.`);
            } else {
              toast.error('No valid positions found in the CSV file');
            }
            
            if (errorCount > 0) {
              toast.warning(`${errorCount} rows had invalid data and were skipped`);
            }
          } catch (error) {
            console.error('Error processing CSV data:', error);
            toast.error('Failed to process CSV data');
          } finally {
            setImportLoading(false);
            // Reset file input
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }
        },
        error: (error: ParseError) => {
          console.error('CSV parsing error:', error);
          toast.error('Failed to parse CSV file');
          setImportLoading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      });
    };
    
    reader.onerror = () => {
      console.error('Failed to read file');
      toast.error('Failed to read file');
      setImportLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    reader.readAsText(file);
  };

  const totalPnL = positions.reduce((sum, pos) => {
    const { pnl } = calculatePnL(pos);
    return sum + pnl;
  }, 0);

  // Handle error display
  const handleClearError = () => {
    dispatch(clearError());
  };

  // Handle import confirmation
  const handleConfirmImport = async () => {
    if (importedPositions.length === 0) return;
    
    setImportingPositions(true);
    let successCount = 0;
    let errorCount = 0;
    
    try {
      for (const positionData of importedPositions) {
        try {
          await dispatch(createPosition(positionData)).unwrap();
          successCount++;
        } catch (err) {
          console.error('Failed to import position:', err);
          errorCount++;
        }
      }
      
      // Show results
      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} positions`);
      }
      if (errorCount > 0) {
        toast.warning(`${errorCount} positions failed to import`);
      }
      
      // Close modal and reset
      setShowImportModal(false);
      setImportedPositions([]);
      
    } catch (error) {
      console.error('Error importing positions:', error);
      toast.error('Failed to import positions');
    } finally {
      setImportingPositions(false);
    }
  };

  // Handle import cancellation
  const handleCancelImport = () => {
    setShowImportModal(false);
    setImportedPositions([]);
  };

  // Handle removing a position from import list
  const handleRemoveFromImport = (index: number) => {
    const updatedPositions = importedPositions.filter((_, i) => i !== index);
    setImportedPositions(updatedPositions);
    
    if (updatedPositions.length === 0) {
      setShowImportModal(false);
    }
  };

  const content = (
    <div className={`flex-1 p-6 overflow-y-auto ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
    }`}>
      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <div className="flex justify-between items-center">
            <p>Error: {error}</p>
            <button
              onClick={handleClearError}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Header with futuristic glow */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Your Positions
            </h1>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-3">
            {/* Import Button */}
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileImport}
              className="hidden"
              ref={fileInputRef}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importLoading}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                importLoading
                  ? isDarkMode
                    ? 'bg-gray-700 text-gray-300'
                    : 'bg-gray-200 text-gray-700'
                  : isDarkMode
                    ? 'bg-indigo-700 text-white hover:bg-indigo-600'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                {importLoading ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3-3m0 0l3 3m-3-3v12" />
                  </svg>
                )}
                <span>{importLoading ? 'Importing...' : 'Import to Delta'}</span>
              </div>
            </button>

            {/* Add Position Button */}
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                showAddForm
                  ? isDarkMode
                    ? 'bg-gray-700 text-gray-300'
                    : 'bg-gray-200 text-gray-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
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
            <p className={`text-lg font-semibold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
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
          <h2 className="text-lg font-semibold mb-4">Add New Position</h2>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            {/* Platform Selection */}
            <Select
              value={positionForm.platform}
              onChange={(value) => handleFormChange('platform', value)}
              options={[
                { value: 'Delta Exchange', label: 'Delta Exchange' },
                { value: 'Groww', label: 'Groww' }
              ]}
              label="Platform"
              isDarkMode={isDarkMode}
            />

            {/* Symbol Selection */}
            <Select
              value={positionForm.symbol}
              onChange={(value) => handleFormChange('symbol', value)}
              options={availableSymbols.map(symbol => ({ value: symbol, label: symbol }))}
              placeholder="Select Symbol"
              label="Symbol"
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

            {/* Entry Price */}
            <Input
              type="number"
              value={positionForm.entryPrice}
              onChange={(value) => handleFormChange('entryPrice', value)}
              placeholder="Entry price"
              label="Entry Price"
              step="any"
              required
              isDarkMode={isDarkMode}
            />

            {/* Leverage Progress Bar */}
            <ProgressBar
              value={parseInt(positionForm.leverage)}
              onChange={(value) => handleFormChange('leverage', value.toString())}
              options={leverageOptions}
              label="Leverage"
              required
              isDarkMode={isDarkMode}
            />

            {/* Buy/Sell Toggle */}
            <Radio
              value={positionForm.side}
              onChange={(value) => handleFormChange('side', value)}
              options={[
                { value: 'buy', label: 'Buy' },
                { value: 'sell', label: 'Sell' }
              ]}
              label="Side"
              isDarkMode={isDarkMode}
            />

            {/* Submit Button */}
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
          {positions.map((position) => {
          const { pnl, pnlPercent } = calculatePnL(position);
          const isProfitable = pnl >= 0;

          return (
            <div 
              key={position.id} 
              onClick={() => navigate(`/investment/positions/${position.symbol.toLowerCase()}`)}
              className={`p-6 rounded-2xl backdrop-blur-lg border transition-all duration-300 hover:scale-105 cursor-pointer ${
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
                  <div className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    isDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {position.leverage}X
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
                <button 
                  disabled={updateLoading}
                  className="flex-1 py-2 px-3 text-sm rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                >
                  {updateLoading ? 'Updating...' : 'Modify'}
                </button>
                <button 
                  onClick={() => dispatch(deletePosition(position.id))}
                  disabled={deleteLoading}
                  className="flex-1 py-2 px-3 text-sm rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                >
                  {deleteLoading ? 'Deleting...' : 'Close'}
                </button>
              </div>
            </div>
          );
        })}
        </div>
      )}
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

      {/* Import Confirmation Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-4xl max-h-[80vh] rounded-2xl backdrop-blur-lg border overflow-hidden ${
            isDarkMode 
              ? 'bg-gray-800/90 border-gray-700/50 shadow-xl shadow-gray-900/20' 
              : 'bg-white/90 border-white/20 shadow-xl shadow-gray-900/10'
          }`}>
            {/* Modal Header */}
            <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Confirm Import ({importedPositions.length} positions)
                </h2>
                <button
                  onClick={handleCancelImport}
                  className={`p-2 rounded-lg hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Review the positions below and confirm to import them into your portfolio. 
                Click the × button to remove any position from the import list.
              </p>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-96">
              <div className="space-y-4">
                {importedPositions.map((position, index) => (
                  <div key={index} className={`p-4 rounded-xl border relative ${
                    isDarkMode 
                      ? 'bg-gray-700/50 border-gray-600' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    {/* Delete Button */}
                    <button
                      onClick={() => handleRemoveFromImport(index)}
                      className={`absolute top-2 right-2 p-1 rounded-lg transition-colors ${
                        isDarkMode 
                          ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/20' 
                          : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                      }`}
                      title="Remove from import list"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm pr-8">
                      <div>
                        <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Symbol:</span>
                        <p className="font-bold">{position.symbol}</p>
                      </div>
                      <div>
                        <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Side:</span>
                        <p className={`font-bold ${position.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                          {position.side.toUpperCase()}
                        </p>
                      </div>
                      <div>
                        <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Lots:</span>
                        <p className="font-bold">{position.lots}</p>
                      </div>
                      <div>
                        <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Entry Price:</span>
                        <p className="font-bold">${position.entryPrice.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Invested:</span>
                        <p className="font-bold">${position.investedAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Leverage:</span>
                        <p className="font-bold">{position.leverage}X</p>
                      </div>
                      <div>
                        <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Platform:</span>
                        <p className="font-bold">{position.platform}</p>
                      </div>
                      <div>
                        <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Date:</span>
                        <p className="font-bold">{position.timestamp}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={handleCancelImport}
                  disabled={importingPositions}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } disabled:opacity-50`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={importingPositions}
                  className="px-6 py-2 rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {importingPositions ? 'Importing...' : `Import ${importedPositions.length} Positions`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default Positions;