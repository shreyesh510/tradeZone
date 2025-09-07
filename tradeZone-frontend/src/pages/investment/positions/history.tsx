import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../layouts/Header';
import Sidebar from '../../../components/Sidebar';
import { useSettings } from '../../../contexts/SettingsContext';
import { positionsApi } from '../../../services/positionsApi';

interface ActivityItem {
  id: string;
  userId: string;
  action: 'create' | 'update' | 'close' | 'close-all' | 'delete' | 'bulk-create';
  positionId?: string;
  symbol?: string;
  details?: Record<string, any>;
  createdAt?: string;
}

export default function PositionsHistoryPage() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const isDarkMode = settings.theme === 'dark';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ action: 'all' | ActivityItem['action']; symbol: string }>({ action: 'all', symbol: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await positionsApi.getHistory(limit);
      setActivity(data as any);
    } catch (e: any) {
      setError(e?.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  const toggleSidebar = () => setSidebarOpen((v) => !v);

  const filtered = useMemo(() => {
    let list = [...activity];
    if (filters.action !== 'all') list = list.filter((a) => a.action === filters.action);
    if (filters.symbol.trim()) {
      const sym = filters.symbol.trim().toUpperCase();
      list = list.filter((a) => (a.symbol || a.details?.symbol || '').toUpperCase().includes(sym));
    }
    return list;
  }, [activity, filters]);

  const ActionBadge: React.FC<{ action: ActivityItem['action'] }> = ({ action }) => {
    const base = 'px-2 py-0.5 rounded text-xs font-medium';
    const map: Record<ActivityItem['action'], string> = {
      create: 'bg-green-500/20 text-green-600',
      update: 'bg-blue-500/20 text-blue-600',
      close: 'bg-red-500/20 text-red-600',
      'close-all': 'bg-red-500/20 text-red-600',
      delete: 'bg-purple-500/20 text-purple-600',
      'bulk-create': 'bg-amber-500/20 text-amber-700',
    };
    return <span className={`${base} ${map[action]}`}>{action}</span>;
  };

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const mins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <div className={`h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} flex flex-col`}>
      <Header onlineUsers={[]} sidebarOpen={sidebarOpen} onSidebarToggle={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Positions Activity</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/investment/positions')}
              className={`${isDarkMode ? 'bg-gray-700/60 text-gray-200 hover:bg-gray-600/60' : 'bg-gray-200/60 text-gray-800 hover:bg-gray-300/60'} px-4 py-2 rounded-lg`}
            >
              Back to Positions
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className={`p-4 rounded-2xl border mb-4 ${isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'}`}>
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className={`text-xs mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Action</label>
              <select
                className={`${isDarkMode ? 'bg-gray-700/50 text-white border-gray-600/50' : 'bg-white/70 text-gray-900 border-gray-300/50'} px-3 py-1 border rounded`}
                value={filters.action}
                onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value as any }))}
              >
                <option value="all">All</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="close">Close</option>
                <option value="close-all">Close All</option>
                <option value="delete">Delete</option>
                <option value="bulk-create">Bulk Create</option>
              </select>
            </div>
            <div>
              <label className={`text-xs mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Symbol</label>
              <input
                className={`${isDarkMode ? 'bg-gray-700/50 text-white border-gray-600/50' : 'bg-white/70 text-gray-900 border-gray-300/50'} px-3 py-1 border rounded`}
                placeholder="e.g. BTCUSD"
                value={filters.symbol}
                onChange={(e) => setFilters((f) => ({ ...f, symbol: e.target.value }))}
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <label className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Limit</label>
              <select
                className={`${isDarkMode ? 'bg-gray-700/50 text-white border-gray-600/50' : 'bg-white/70 text-gray-900 border-gray-300/50'} px-2 py-1 border rounded`}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
              <button
                onClick={fetchData}
                className={`${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} px-3 py-1 rounded`}
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className={`${isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'} p-3 rounded mb-4`}>
            {error}
          </div>
        )}

        {/* Activity list */}
        <div className={`rounded-2xl border ${isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'}`}>
          <div className="divide-y divide-gray-200/20">
            {loading && (
              <div className="p-4 text-sm">Loading…</div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="p-4 text-sm">No activity</div>
            )}
            {!loading && filtered.map((item) => {
              const sym = item.symbol || item.details?.symbol || '';
              const desc = (() => {
                const a = item.action;
                if (a === 'create') {
                  const lots = item.details?.lots;
                  const side = (item.details?.side || '').toUpperCase();
                  return `${sym} - ${side} ${lots ?? ''} ${lots ? 'lots' : ''}`.trim();
                }
                if (a === 'update') {
                  const fields = ['lots', 'entryPrice', 'investedAmount', 'status', 'pnl'];
                  const parts = fields.filter((f) => item.details && item.details[f] !== undefined).map((f) => `${f}: ${item.details![f]}`);
                  return `${sym} - ${parts.join(', ')}` || sym;
                }
                if (a === 'close') {
                  const pnl = item.details?.pnl;
                  return `${sym} - Closed${pnl !== undefined ? ` with ${pnl >= 0 ? '+' : ''}$${Number(pnl).toFixed(2)} P&L` : ''}`;
                }
                if (a === 'close-all') {
                  const count = item.details?.count;
                  return `Closed ${count ?? 0} positions`;
                }
                if (a === 'delete') return `${sym} - Position removed`;
                if (a === 'bulk-create') {
                  const createdCount = item.details?.created ?? 0;
                  const skipped = item.details?.skipped ?? 0;
                  return `Created ${createdCount} positions, skipped ${skipped}`;
                }
                return sym || 'Activity';
              })();

              return (
                <div key={item.id} className="p-4 flex items-start gap-4">
                  <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-200/50'}`}>
                    <span className="text-sm font-semibold">{(sym || 'NA').slice(0, 2)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <ActionBadge action={item.action} />
                      <span className="text-sm truncate">{desc}</span>
                    </div>
                    <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatTimeAgo(item.createdAt)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
