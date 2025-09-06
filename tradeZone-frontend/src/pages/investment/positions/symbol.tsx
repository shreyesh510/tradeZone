import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Header from '../../../layouts/Header';
import Sidebar from '../../../components/Sidebar';
import FloatingNav, { type MobileTab } from '../../../layouts/FloatingNav';
import { useSettings } from '../../../contexts/SettingsContext';
import { usePermissions } from '../../../hooks/usePermissions';
import type { RootState, AppDispatch } from '../../../redux/store';
import type { Position } from '../../../types/position';
import { fetchPositions } from '../../../redux/thunks/positions/positionsThunks';

interface OnlineUser {
  userId: string;
  userName: string;
  socketId: string;
}

export default function InvestmentPositionsBySymbol() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { settings } = useSettings();
  const { canAccessInvestment } = usePermissions();

  const [onlineUsers] = useState<OnlineUser[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<MobileTab>('chart');

  const { positions, loading } = useSelector((state: RootState) => state.positions);

  // Guard: redirect if no access
  useEffect(() => {
    if (!canAccessInvestment()) {
      navigate('/zone');
    }
  }, [canAccessInvestment, navigate]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Deep-link support: fetch if empty
  useEffect(() => {
    if (!positions || positions.length === 0) {
      dispatch(fetchPositions());
    }
  }, [dispatch]);

  const toggleSidebar = () => setSidebarOpen((s) => !s);
  const handleTabChange = (tab: MobileTab) => setActiveTab(tab);
  const isDarkMode = settings.theme === 'dark';

  const list = useMemo(() => {
    const sym = (symbol || '').toUpperCase();
    return positions.filter((p) => p.symbol.toUpperCase() === sym);
  }, [positions, symbol]);

  const sorted = useMemo(() => {
    // Sort by timestamp desc if available
    const toTime = (t: string | undefined) => {
      const d = t ? new Date(t) : new Date(0);
      return d.getTime() || 0;
    };
    return [...list].sort((a, b) => toTime(b.timestamp) - toTime(a.timestamp));
  }, [list]);

  const calcPnL = (p: Position) => {
    const priceDiff = p.side === 'buy' ? p.currentPrice - p.entryPrice : p.entryPrice - p.currentPrice;
    const pnl = priceDiff * p.lots;
    const pnlPercent = p.investedAmount ? (pnl / p.investedAmount) * 100 : 0;
    return { pnl, pnlPercent };
  };

  const content = (
    <div
      className={`flex-1 p-6 overflow-y-auto ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
      }`}
    >
      <div className="flex items-center mb-4">
        <button
          onClick={() => navigate(-1)}
          className={`px-3 py-1 rounded mr-3 ${
            isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'
          }`}
        >
          Back
        </button>
        <h1 className="text-xl font-semibold">{symbol?.toUpperCase()} Positions</h1>
      </div>

      {loading && <p className="text-gray-400">Loading…</p>}
      {!loading && list.length === 0 && (
        <p className="text-gray-400">No positions found for {symbol?.toUpperCase()}.</p>
      )}

      {/* Table of entries */}
      <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'border-gray-700 bg-gray-800/20' : 'border-gray-200 bg-white'}`}>
        <div className="max-h-[70vh] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className={`${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-700'} sticky top-0 z-10`}>
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Time</th>
                <th className="px-4 py-3 text-left font-semibold">Side</th>
                <th className="px-4 py-3 text-right font-semibold">Lots</th>
                <th className="px-4 py-3 text-right font-semibold">Entry</th>
                <th className="px-4 py-3 text-right font-semibold">Current</th>
                <th className="px-4 py-3 text-right font-semibold">Invested</th>
                <th className="px-4 py-3 text-right font-semibold">Fee</th>
                <th className="px-4 py-3 text-right font-semibold">P&L</th>
                <th className="px-4 py-3 text-right font-semibold">P&L %</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Platform</th>
              </tr>
            </thead>
            <tbody className={isDarkMode ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}>
              {sorted.map((p: Position) => {
                const { pnl, pnlPercent } = calcPnL(p);
                const pnlColor = pnl >= 0 ? 'text-green-400' : 'text-red-400';
                return (
                  <tr key={p.id} className={isDarkMode ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-3 whitespace-nowrap">{p.timestamp}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${p.side === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {p.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">{p.lots}</td>
                    <td className="px-4 py-3 text-right">${p.entryPrice.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">${p.currentPrice.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">${p.investedAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">{typeof p.tradingFee === 'number' ? `$${p.tradingFee.toFixed(4)}` : '-'}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${pnlColor}`}>${pnl.toFixed(2)}</td>
                    <td className={`px-4 py-3 text-right ${pnlColor}`}>({pnlPercent.toFixed(2)}%)</td>
                    <td className="px-4 py-3">{p.status}</td>
                    <td className="px-4 py-3">{p.platform}</td>
                  </tr>
                );
              })}
              {!loading && sorted.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-400" colSpan={11}>No positions found.</td>
                </tr>
              )}
            </tbody>
          </table>
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
          margin: '0px',
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
      <Header onlineUsers={onlineUsers} sidebarOpen={sidebarOpen} onSidebarToggle={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <div className="flex-1 flex min-h-0 overflow-hidden">{content}</div>
    </div>
  );
}
