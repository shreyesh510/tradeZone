import { memo, useEffect, useState } from 'react';
import Header from '../../layouts/Header';
import Sidebar from '../../components/Sidebar';
import { useSettings } from '../../contexts/SettingsContext';
import { usePermissions } from '../../hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../redux/store';
import { fetchWallets, createWallet, updateWallet, deleteWallet, fetchWalletHistory } from '../../redux/thunks/wallets/walletsThunks';
import ConfirmModal from '../../components/ConfirmModal';
import EditDepositModal from '../../components/EditDepositModal';
import AddWalletModal from '../../components/AddWalletModal';

const WalletsPage = memo(function WalletsPage() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { canAccessInvestment } = usePermissions();
  const dispatch = useDispatch<AppDispatch>();
  const { items: wallets, loading, creating, error, history, historyLoading } = useSelector((s: RootState) => s.wallets);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('');
  const [currency, setCurrency] = useState('USD');
  // Removed address and notes from inline add form per request
  const [balance, setBalance] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    if (!canAccessInvestment()) navigate('/zone');
  }, [canAccessInvestment, navigate]);

  useEffect(() => {
  dispatch(fetchWallets());
  dispatch(fetchWalletHistory());
  }, [dispatch]);

  useEffect(() => {
  const onFocus = () => { dispatch(fetchWallets()); dispatch(fetchWalletHistory()); };
  const onVisible = () => { if (document.visibilityState === 'visible') { dispatch(fetchWallets()); dispatch(fetchWalletHistory()); } };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [dispatch]);

  const isDark = settings.theme === 'dark';

  const totalsByCurrency = wallets.reduce<Record<string, number>>((acc, w) => {
    const cur = (w.currency || 'USD').toUpperCase();
    const val = typeof w.balance === 'number' ? w.balance : 0;
    acc[cur] = (acc[cur] || 0) + val;
    return acc;
  }, {});

  // Additional grouped totals: Demat accounts and Bank accounts
  const isBank = (platform?: string | null) => /bank/i.test(platform || '');
  // Per request: if platform is not Bank, consider it a Demat account
  const isDemat = (platform?: string | null) => !isBank(platform);

  const dematTotalsByCurrency = wallets.reduce<Record<string, number>>((acc, w) => {
    if (!isDemat(w.platform)) return acc;
    const cur = (w.currency || 'USD').toUpperCase();
    const val = typeof w.balance === 'number' ? w.balance : 0;
    acc[cur] = (acc[cur] || 0) + val;
    return acc;
  }, {});

  // Derived: simple USD view for Demat by converting INR totals using divisor 86
  const dematInrTotal = dematTotalsByCurrency['INR'] || 0;
  const dematUsdFromInr = dematInrTotal > 0 ? dematInrTotal / 86 : 0;

  const bankTotalsByCurrency = wallets.reduce<Record<string, number>>((acc, w) => {
    if (!isBank(w.platform)) return acc;
    const cur = (w.currency || 'USD').toUpperCase();
    const val = typeof w.balance === 'number' ? w.balance : 0;
    acc[cur] = (acc[cur] || 0) + val;
    return acc;
  }, {});

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const bal = balance ? parseFloat(balance) : undefined;
  await dispatch(createWallet({ name: name.trim(), platform: platform || undefined, currency: currency || undefined, balance: isNaN(bal as any) ? undefined : bal })).unwrap();
  setName(''); setPlatform(''); setCurrency('USD'); setBalance('');
  };

  return (
    <div className={`h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'} flex flex-col`}>
      <Header onlineUsers={[]} sidebarOpen={sidebarOpen} onSidebarToggle={() => setSidebarOpen(v => !v)} />
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(v => !v)} />
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold">Wallets</h1>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white"
            >Add Wallet</button>
            <button
              type="button"
              onClick={() => { dispatch(fetchWallets()); dispatch(fetchWalletHistory()); }}
              disabled={loading}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${loading ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >{loading ? 'Loading…' : 'Refresh'}</button>
          </div>
        </div>

        {/* Main content area with right-side recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="col-span-1 lg:col-span-3">
        <div className={`p-4 rounded-2xl border mb-6 ${isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'}`}>
          <h2 className="text-lg font-semibold mb-2">Total Balance</h2>
          {Object.keys(totalsByCurrency).length === 0 ? (
            <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>0</div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {Object.entries(totalsByCurrency).map(([cur, amt]) => (
                <div key={cur} className={`px-3 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-gray-700/40 text-white' : 'bg-gray-100 text-gray-900'}`}>
                  {cur}: {amt.toLocaleString()}
                </div>
              ))}
            </div>
          )}

          {/* Demat and Bank balances */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium mb-2">Demat Account Balance</div>
              {Object.keys(dematTotalsByCurrency).length === 0 ? (
                <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>0</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(dematTotalsByCurrency).map(([cur, amt]) => (
                    <div key={cur} className={`px-2.5 py-1.5 rounded-md text-xs font-medium ${isDark ? 'bg-gray-700/40 text-white' : 'bg-gray-100 text-gray-900'}`}>
                      {cur}: {amt.toLocaleString()}
                    </div>
                  ))}
                  {/* Also show simple USD view from INR total */}
                  {dematInrTotal > 0 && (
                    <div className={`px-2.5 py-1.5 rounded-md text-xs font-medium ${isDark ? 'bg-gray-700/40 text-white' : 'bg-gray-100 text-gray-900'}`}>
                      USD: {dematUsdFromInr.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Bank Account Balance</div>
              {Object.keys(bankTotalsByCurrency).length === 0 ? (
                <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>0</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(bankTotalsByCurrency).map(([cur, amt]) => (
                    <div key={cur} className={`px-2.5 py-1.5 rounded-md text-xs font-medium ${isDark ? 'bg-gray-700/40 text-white' : 'bg-gray-100 text-gray-900'}`}>
                      {cur}: {amt.toLocaleString()}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

  <div className={`p-6 rounded-2xl border mb-8 ${isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'}`}>
          <h2 className="text-lg font-semibold mb-4">Add Wallet</h2>
          <form onSubmit={submitCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className={`px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} placeholder="Name (e.g., Delta Main)" value={name} onChange={e => setName(e.target.value)} required />
            <select
              className={`px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              <option value="">Select platform (optional)</option>
              <option value="Groww">Groww</option>
              <option value="Delta Exchange">Delta Exchange</option>
              <option value="Bank">Bank</option>  
            </select>
            <select
              className={`px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="USD">USD</option>
              <option value="INR">INR</option>
            </select>
            <input type="number" step="any" className={`px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} placeholder="Balance (optional)" value={balance} onChange={e => setBalance(e.target.value)} />
            <div className="md:col-span-2">
              <button type="submit" disabled={!name.trim() || creating} className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium">
                {creating ? 'Saving…' : 'Add Wallet'}
              </button>
              {error && <span className={`ml-3 text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</span>}
            </div>
          </form>
        </div>

        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'}`}>
          <h2 className="text-lg font-semibold mb-4">Your Wallets</h2>
          {wallets.length === 0 ? (
            <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No wallets yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wallets.map(w => (
                <div key={w.id} className={`p-4 rounded-xl border ${isDark ? 'bg-gray-700/30 border-gray-600/50' : 'bg-white/70 border-gray-200/50'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-base font-semibold">{w.name}</div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{w.platform || '—'} · {w.currency || '—'}</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-2 py-1 text-xs rounded-md bg-blue-600 text-white" onClick={() => setEditId(w.id)}>Edit</button>
                      <button className="px-2 py-1 text-xs rounded-md bg-red-600 text-white" onClick={() => setConfirmDeleteId(w.id)}>Delete</button>
                    </div>
                  </div>
                  <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Amount: {typeof w.balance === 'number' ? w.balance.toLocaleString() : 0} {w.currency || ''}</div>
                </div>
              ))}
            </div>
          )}
        </div>
          </div>

          {/* Right side: Recent Activities */}
          <aside className="col-span-1">
            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'} sticky top-6`}>
              <h2 className="text-lg font-semibold mb-3">Recent Activities</h2>
              {historyLoading && <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Loading…</div>}
              {!historyLoading && history.length === 0 && (
                <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>No history yet.</div>
              )}
              {!historyLoading && history.length > 0 && (
                <div className="max-h-[70vh] overflow-y-auto pr-2">
                  <div className="flex flex-col gap-3">
                    {history.map((h) => {
                      const w = wallets.find(x => x.id === h.walletId);
                      return (
                        <div key={h.id} className={`p-3 rounded-lg border ${isDark ? 'bg-gray-700/30 border-gray-600/40' : 'bg-white/70 border-gray-200/70'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium capitalize">{h.action}</span>
                            <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-[10px]`}>{new Date(h.createdAt).toLocaleString()}</span>
                          </div>
                          <div className="text-sm font-semibold">{w?.name || h.walletId}</div>
                          <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>{w?.platform || '—'} · {w?.currency || '—'}</div>
                          <div className={`mt-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Amount: {typeof w?.balance === 'number' ? w!.balance!.toLocaleString() : 0} {w?.currency || ''}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Delete confirm modal */}
      <ConfirmModal
        open={!!confirmDeleteId}
        title="Delete wallet?"
        message="This action cannot be undone."
        isDarkMode={isDark}
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) {
            dispatch(deleteWallet({ id: confirmDeleteId }));
          }
          setConfirmDeleteId(null);
        }}
      />

      {/* Reuse edit modal for simple edits */}
      <EditDepositModal
        open={!!editId}
        isDarkMode={isDark}
        initial={{
          amount: editId ? (wallets.find(w => w.id === editId)?.balance ?? 0) : 0,
          method: editId ? (wallets.find(w => w.id === editId)?.platform) : undefined,
          description: editId ? (wallets.find(w => w.id === editId)?.notes) : undefined,
        }}
        onCancel={() => setEditId(null)}
        onSave={(patch) => {
          if (editId) {
            const walletPatch: any = {
              ...(patch.amount !== undefined ? { balance: patch.amount } : {}),
              ...(patch.method !== undefined ? { platform: patch.method } : {}),
              ...(patch.description !== undefined ? { notes: patch.description } : {}),
            };
            dispatch(updateWallet({ id: editId, patch: walletPatch }));
          }
          setEditId(null);
        }}
      />

      {/* Add wallet modal */}
      <AddWalletModal
        open={addOpen}
        isDarkMode={isDark}
        onCancel={() => setAddOpen(false)}
        onSave={(payload) => {
          const { name, amount, description } = payload;
          dispatch(createWallet({ name, balance: amount, notes: description })).then(() => dispatch(fetchWalletHistory()));
          setAddOpen(false);
        }}
      />
    </div>
  );
});

export default WalletsPage;
