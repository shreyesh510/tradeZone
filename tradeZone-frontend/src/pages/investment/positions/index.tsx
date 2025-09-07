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
import { closeAllPositions } from '../../../redux/thunks/positions/positionsThunks';
import { createPositionsBulk } from '../../../redux/thunks/positions/positionsThunks';
import { clearError } from '../../../redux/slices/positionsSlice';
import type { Position, PositionLike, AggregatedPosition, CreatePositionData } from '../../../types/position';
import Input from '../../../components/input';
import Select from '../../../components/select';
import Radio from '../../../components/radio';
import ProgressBar from '../../../components/progressbar';
import { getLotSize } from '../../../utils/lotSize';

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
  // Close modal state
  const [showCloseModal, setShowCloseModal] = useState<boolean>(false);
  const [closePnL, setClosePnL] = useState<string>('');
  const [closingOne, setClosingOne] = useState<boolean>(false);
  const [selectedForClose, setSelectedForClose] = useState<Position | null>(null);

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

  // Currency conversion: 1 USD = 86 INR (UI display only)
  const INR_PER_USD = 86;
  const toUSD = (inr?: number) => (Number(inr || 0) / INR_PER_USD);

  // Show unique symbols only (keep the most recent position per symbol)
  const uniquePositions: PositionLike[] = (() => {
    const bySymbol = new Map<string, Position>();
    const toEpoch = (p: Position): number => {
      const t1 = p.createdAt ? new Date(p.createdAt).getTime() : NaN;
      const t2 = p.updatedAt ? new Date(p.updatedAt).getTime() : NaN;
      const t3 = p.timestamp ? Date.parse(p.timestamp) : NaN;
      // choose the max valid timestamp; fallback to 0 if all invalid
      return Math.max(
        Number.isFinite(t1) ? t1 : 0,
        Number.isFinite(t2) ? t2 : 0,
        Number.isFinite(t3) ? t3 : 0
      );
    };
    // If data is aggregated, it's already one per symbol; bypass dedupe
    const looksAggregated = positions.every((p: any) => !('id' in p) && 'pnl' in p && !('entryPrice' in p));
    if (looksAggregated) {
      return positions as AggregatedPosition[];
    }
    (positions as Position[]).forEach((p) => {
      const key = p.symbol.toUpperCase();
      const existing = bySymbol.get(key);
      if (!existing) {
        bySymbol.set(key, p);
        return;
      }
      if (toEpoch(p) >= toEpoch(existing)) {
        bySymbol.set(key, p);
      }
    });
    return Array.from(bySymbol.values());
  })();

  // No P&L logic required on this page

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

    const lotsNum = parseInt(String(positionForm.lots).replace(/[,\s]/g, ''));
    const entryNum = parseFloat(String(positionForm.entryPrice).replace(/[,\s]/g, ''));
    if (!Number.isFinite(lotsNum) || lotsNum <= 0) {
      toast.warning('Lots must be a positive number');
      return;
    }
    if (!Number.isFinite(entryNum) || entryNum <= 0) {
      toast.warning('Entry price must be a positive number');
      return;
    }

    const newPositionData: CreatePositionData = {
      symbol: positionForm.symbol.toUpperCase(),
      side: positionForm.side,
      entryPrice: entryNum,
      lots: parseInt(positionForm.lots),
      investedAmount: entryNum * lotsNum,
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
      
      // Ensure we have a string to parse (FileReader can return string or ArrayBuffer)
      const csvText = typeof event.target.result === 'string'
        ? event.target.result
        : new TextDecoder().decode(event.target.result as ArrayBuffer);

      // Parse the CSV content
  (Papa as any).parse(csvText, {
        header: true,
        skipEmptyLines: true,
  complete: (results: Papa.ParseResult<Record<string, string>>) => {
          const data = results.data as Record<string, string>[];
          const validPositions: CreatePositionData[] = [];
          let errorCount = 0;
          let skippedNonPositive = 0;
          
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
                const parseNum = (v: any) => parseFloat(String(v ?? '0').replace(/[,\s]/g, ''));
                const lots = parseNum(row.Qty || row.Quantity || '0');
                const entryPrice = parseNum(row['Exec.Price'] || row['Entry Price'] || row['Purchase Price'] || row['Avg. Cost'] || '0');
                const orderValue = parseNum(row['Order Value'] || '0');
                const leverageParsed = parseInt(String(row['Leverage'] || '20').replace(/[,\s]/g, ''));
                const leverage = Number.isFinite(leverageParsed) && leverageParsed > 0 ? leverageParsed : 20;
                
                if (!symbol || !Number.isFinite(lots) || !Number.isFinite(entryPrice)) {
                  console.error('Invalid row data:', row);
                  errorCount++;
                  continue;
                }
                if (lots <= 0 || entryPrice <= 0) {
                  skippedNonPositive++;
                  continue;
                }
                
                positionData = {
                  symbol,
                  side: side as 'buy' | 'sell',
                  entryPrice,
                  lots,
                  investedAmount: (orderValue && orderValue > 0) ? orderValue : entryPrice * lots,
                  platform: 'Delta Exchange', // Always use Delta Exchange
                  leverage,
                  status: 'open',
                  timestamp: row.Time || row['Date'] || row['Purchase Date'] || new Date().toLocaleString()
                };
                
                if (!Number.isFinite(positionData.investedAmount) || positionData.investedAmount <= 0) {
                  skippedNonPositive++;
                  continue;
                }
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
            if (skippedNonPositive > 0) {
              toast.warning(`${skippedNonPositive} rows had non-positive numbers and were skipped`);
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

  // Total invested across all unique (visible) positions (display in USD)
  const totalInvestedInr = uniquePositions.reduce(
    (sum, pos: PositionLike) => sum + (pos.investedAmount || 0),
    0
  );
  const totalInvestedUsd = toUSD(totalInvestedInr);

  // Handle error display
  const handleClearError = () => {
    dispatch(clearError());
  };

  // Handle import confirmation
  const handleConfirmImport = async () => {
    if (importedPositions.length === 0) return;
    
    setImportingPositions(true);
    try {
      const result = await dispatch(createPositionsBulk(importedPositions)).unwrap();
      const createdCount = result?.created?.length || 0;
      const skippedCount = result?.skipped?.length || 0;

      if (createdCount > 0) toast.success(`Imported ${createdCount} positions`);
      if (skippedCount > 0) toast.info(`${skippedCount} duplicate/invalid positions were skipped`);

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
      setShowCloseModal(true); // still allow modal for Close All action
    }
  };

  const submitCloseOne = async () => {
    if (!selectedForClose?.id) return;
    try {
      setClosingOne(true);
      const pnlValue = Number(closePnL);
      await dispatch(updatePosition({
        id: selectedForClose.id,
        data: { status: 'closed', pnl: Number.isFinite(pnlValue) ? pnlValue : 0, closedAt: new Date() as any },
      })).unwrap();
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
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Positions
          </h1>
          {/* Action Buttons */}
          <div className="flex space-x-3">
            {/* Close All Positions */}
            <button
              onClick={() => {
                setSelectedForClose(null);
                setClosePnL('');
                setShowCloseModal(true);
              }}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                isDarkMode ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              Close All Positions
            </button>
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

      {/* Total Investment Summary */}
      <div className={`p-6 rounded-2xl backdrop-blur-lg border mb-8 ${
        isDarkMode 
          ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
          : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Investment (USD)
            </h2>
            <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              ${totalInvestedUsd.toFixed(2)}
            </p>
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
      {uniquePositions.map((position) => {
  // P&L logic removed

          return (
            <div 
        key={(position as any).id ?? (position as any).symbol}
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
                    ('platform' in position && position.platform === 'Delta Exchange')
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                      : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                  }`}>
                    {position.symbol.substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{position.symbol}</h3>
                    {('platform' in position) && (
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{(position as Position).platform}</p>
                    )}
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

              {/* P&L section removed */}

              {/* Invested Amount (USD) */}
              <div className={`mt-3 px-4 py-3 rounded-xl border ${
                isDarkMode ? 'border-gray-700/50 bg-gray-800/30' : 'border-gray-200 bg-white/60'
              }`}>
                <div className="flex justify-between items-center">
                  <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Invested (USD)</span>
                  <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    ${toUSD(position.investedAmount).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Progress removed */}

              

              {/* Action Buttons */}
              <div className="mt-4 flex space-x-2">
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

      {/* Close Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} w-full max-w-md rounded-2xl shadow-xl overflow-hidden`}>
            <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className="text-lg font-semibold">Close Position{selectedForClose ? '' : 's'}</h3>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Enter realized PnL for record keeping. You can close the selected position or close all.
              </p>
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
                <button
                  onClick={submitCloseOne}
                  disabled={closingOne}
                  className={`w-full py-2.5 rounded-lg font-medium ${closingOne ? 'opacity-60' : ''} ${isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
                >
                  {closingOne ? 'Closing…' : `Close ${selectedForClose.symbol}`}
                </button>
              )}
        {!selectedForClose && (
                <button
                  onClick={async () => {
                    try {
          const pnlValue = Number(closePnL);
          const res: any = await dispatch(closeAllPositions(Number.isFinite(pnlValue) ? pnlValue : undefined)).unwrap();
                      toast.success(`Closed ${res?.updated ?? 0} positions`);
                      setShowCloseModal(false);
                      setClosePnL('');
                      await dispatch(fetchPositions(undefined));
                    } catch (err) {
                      toast.error('Failed to close all positions');
                    }
                  }}
                  className={`w-full py-2.5 rounded-lg font-medium ${isDarkMode ? 'bg-red-500 hover:bg-red-600' : 'bg-red-500 hover:bg-red-600'} text-white`}
                >
                  Close All Positions
                </button>
              )}
              <button
                onClick={() => { setShowCloseModal(false); setSelectedForClose(null); setClosePnL(''); }}
                className={`w-full py-2.5 rounded-lg font-medium ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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