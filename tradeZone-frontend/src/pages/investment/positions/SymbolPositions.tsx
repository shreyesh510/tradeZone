import { memo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Header from "../../../layouts/Header";
import Sidebar from "../../../components/Sidebar";
import FloatingNav, { type MobileTab } from "../../../layouts/FloatingNav";
import { useSettings } from "../../../contexts/SettingsContext";
import { usePermissions } from "../../../hooks/usePermissions";
import type { RootState, AppDispatch } from "../../../redux/store";
import { fetchPositionsBySymbol } from "../../../redux/thunks/positions/positionsThunks";
import { clearError } from "../../../redux/slices/positionsSlice";
import type { Position } from "../../../types/position";
import Button from "../../../components/button";
import { tradingViewService } from "../../../services/tradingViewService";
import { getLotSize } from "../../../utils/lotSize";

interface OnlineUser {
  userId: string;
  userName: string;
  socketId: string;
}

const SymbolPositions = memo(function SymbolPositions() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { settings } = useSettings();
  const { canAccessInvestment } = usePermissions();

  // Debug: Log the symbol parameter
  // removed debug logs

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [onlineUsers] = useState<OnlineUser[]>([]);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<MobileTab>("chart");
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [priceUpdatedAt, setPriceUpdatedAt] = useState<number | null>(null);
  const [usdInrRate, setUsdInrRate] = useState<number | null>(null); // INR per 1 USD
  const [fxUpdatedAt, setFxUpdatedAt] = useState<number | null>(null);

  // Redux state
  const { positions, loading, error } = useSelector(
    (state: RootState) => state.positions
  );

  // Filter positions for the specific symbol
  const symbolPositions = positions.filter(
    (position) => position.symbol.toLowerCase() === symbol?.toLowerCase()
  );

  const rows: Position[] = symbolPositions as Position[];

  // Debug: Log data state
  // removed debug logs

  // If we navigated from aggregated list, the store may still hold aggregated rows briefly.
  // Wait until detailed positions (with entryPrice) are loaded.
  const hasDetailedData = rows.length > 0 && Object.prototype.hasOwnProperty.call(rows[0], 'entryPrice');

  // Redirect if no permission
  useEffect(() => {
  // removed debug log
    if (!canAccessInvestment()) {
  // removed debug log
      navigate("/zone");
    }
  }, [canAccessInvestment, navigate]);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch symbol-specific positions from API
  useEffect(() => {
    if (symbol) {
  // removed debug log
      dispatch(fetchPositionsBySymbol(symbol));
    } else {
  // removed debug log
    }
  }, [dispatch, symbol]);

  // Fetch live price from integrated market service (CoinGecko/Binance)
  useEffect(() => {
    let intervalId: number | undefined;
    const fetchPrice = async () => {
      if (!symbol) return;
      const info = await tradingViewService.getCryptoInfo(symbol);
      if (info && typeof info.current_price === "number") {
        setLivePrice(info.current_price);
        setPriceUpdatedAt(Date.now());
      }
    };

    fetchPrice();
    // Refresh every 30s
    intervalId = window.setInterval(fetchPrice, 30000);
    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [symbol]);

  // Fetch USD/INR FX rate (free endpoints with CORS)
  useEffect(() => {
    let timer: number | undefined;
    const fetchUsdInr = async () => {
      try {
        // Try exchangerate.host first
        const r1 = await fetch(
          "https://api.exchangerate.host/latest?base=USD&symbols=INR"
        );
        if (r1.ok) {
          const j = await r1.json();
          const rate = j?.rates?.INR;
          if (typeof rate === "number" && rate > 0) {
            setUsdInrRate(rate);
            setFxUpdatedAt(Date.now());
            return;
          }
        }
        // Fallback to Frankfurter
        const r2 = await fetch(
          "https://api.frankfurter.app/latest?from=USD&to=INR"
        );
        if (r2.ok) {
          const j2 = await r2.json();
          const rate2 = j2?.rates?.INR;
          if (typeof rate2 === "number" && rate2 > 0) {
            setUsdInrRate(rate2);
            setFxUpdatedAt(Date.now());
            return;
          }
        }
        // Final fallback
        const r3 = await fetch("https://open.er-api.com/v6/latest/USD");
        if (r3.ok) {
          const j3 = await r3.json();
          const rate3 = j3?.rates?.INR;
          if (typeof rate3 === "number" && rate3 > 0) {
            setUsdInrRate(rate3);
            setFxUpdatedAt(Date.now());
          }
        }
      } catch {
        // Ignore – will use last known or fallback
      }
    };

    fetchUsdInr();
    // Refresh every 60 minutes
    timer = window.setInterval(fetchUsdInr, 60 * 60 * 1000);
    return () => {
      if (typeof timer === "number") {
        window.clearInterval(timer);
      }
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleTabChange = (tab: MobileTab) => {
    setActiveTab(tab);
  };

  const isDarkMode = settings.theme === "dark";

  // Calculate P&L. Prefer lot-size-based qty if known; otherwise use notional/entry fallback.
  const calculatePnL = (position: Position) => {
    const current = (livePrice ?? position.currentPrice ?? position.entryPrice) as number;
    const priceDiff = position.side === "buy" ? current - position.entryPrice : position.entryPrice - current;

    // If we know platform lot size, compute qty directly from lots
    const lotSize = getLotSize(position.symbol);
    let qty: number;
    let investedUsd: number;
    if (lotSize > 0) {
      qty = (position.lots || 0) * lotSize;
      // For percentage calculation, use notional value (like Delta Exchange)
      const notionalAtEntry = position.entryPrice * qty; // USD notionally
      const lev = position.leverage || 1;
      investedUsd = lev > 0 ? notionalAtEntry / lev : notionalAtEntry;
    } else {
      // Fallback: treat investedAmount as USD (backend normalized); notional = invested * leverage and qty = notional / entry
      investedUsd = (position.investedAmount || 0);
      const notional = investedUsd * (position.leverage || 1);
      qty = position.entryPrice > 0 ? notional / position.entryPrice : 0;
    }

    const pnl = priceDiff * qty; // P&L in USD
    // Calculate percentage based on notional value (like Delta Exchange)
    const notionalValue = position.entryPrice * qty;
    const pnlPercent = notionalValue > 0 ? (pnl / notionalValue) * 100 : 0;

    return { pnl, pnlPercent };
  };

  // Derive invested USD consistently for rows and totals
  const getInvestedUsd = (position: Position) => {
    const lotSize = getLotSize(position.symbol);
    if (lotSize > 0) {
      const qty = (position.lots || 0) * lotSize;
      const notionalAtEntry = position.entryPrice * qty;
      const lev = position.leverage || 1;
      return lev > 0 ? notionalAtEntry / lev : notionalAtEntry;
    }
    return position.investedAmount || 0;
  };

  // Handle error display
  const handleClearError = () => {
    dispatch(clearError());
  };

  const totalPnL = symbolPositions.reduce((sum, pos) => {
    const { pnl } = calculatePnL(pos as Position);
    return sum + pnl;
  }, 0);

  // Derived totals for summary
  const totalInvestment = symbolPositions.reduce((sum, pos) => sum + getInvestedUsd(pos as Position), 0);
  const totalLots = symbolPositions.reduce(
    (sum, pos) => sum + (pos.lots || 0),
    0
  );
  const totalLoss = symbolPositions.reduce((sum, pos) => {
    const { pnl } = calculatePnL(pos as Position);
    return sum + Math.min(pnl, 0);
  }, 0);

  // Friendly date formatter for non-ISO timestamps (e.g., Delta CSV)
  const formatTimestamp = (ts?: string) => {
    if (!ts) return "-";
    const d = new Date(ts);
    if (!isNaN(d.getTime())) return d.toLocaleDateString();
    const match = ts.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
    return ts;
  };

  // Simple test to see if component renders
  if (!symbol) {
    return (
      <div className="p-6">
        <h1>No symbol provided</h1>
        <button onClick={() => navigate("/investment/positions")}>Back</button>
      </div>
    );
  }

  const content = (
    <div
      className={`flex-1 p-6 overflow-y-auto ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
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

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate("/investment/positions")}
              variant="secondary"
              size="sm"
            >
              ← Back to Positions
            </Button>
            <div>
              <h1
                className={`text-2xl font-bold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {symbol?.toUpperCase()} Positions
              </h1>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {symbolPositions.length} position
                {symbolPositions.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div
        className={`p-6 rounded-2xl backdrop-blur-lg border mb-8 ${
          isDarkMode
            ? "bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20"
            : "bg-white/60 border-white/20 shadow-xl shadow-gray-900/10"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Total P&L */}
          <div>
            <h3
              className={`text-sm font-medium ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Total P&L for {symbol?.toUpperCase()}
            </h3>
            <p
              className={`mt-1 text-3xl font-extrabold ${
                totalPnL >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              ${totalPnL.toFixed(2)}
            </p>
            <div className="mt-2 text-sm">
              <p className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Current Price: {livePrice ? `$${livePrice.toLocaleString()}` : "—"}
                {priceUpdatedAt && (
                  <span className={`ml-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    updated {new Date(priceUpdatedAt).toLocaleTimeString()}
                  </span>
                )}
              </p>
              <p className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Total Investment: ${totalInvestment.toLocaleString()}
              </p>
              <p className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Total Lots: {totalLots.toLocaleString()}
              </p>
              {usdInrRate && (
                <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                  FX: 1 USD = {usdInrRate.toFixed(2)} INR{fxUpdatedAt ? ` · ${new Date(fxUpdatedAt).toLocaleTimeString()}` : ""}
                </p>
              )}
            </div>
          </div>

          {/* Extra totals inside the same card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto">
            {/* Total Investment */}
            <div
              className={`p-4 rounded-xl border ${
                isDarkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <h3
                className={`text-xs font-medium ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Total Investment
              </h3>
              <p className={`mt-1 text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                ${totalInvestment.toLocaleString()}
              </p>
            </div>

            {/* Total Lots */}
            <div
              className={`p-4 rounded-xl border ${
                isDarkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <h3
                className={`text-xs font-medium ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Total Lots
              </h3>
              <p
                className={`mt-1 text-xl font-bold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {totalLots.toLocaleString()}
              </p>
            </div>

            {/* Total Loss */}
            <div
              className={`p-4 rounded-xl border ${
                isDarkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <h3
                className={`text-xs font-medium ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Total Loss
              </h3>
              <p className={`mt-1 text-xl font-bold ${totalLoss < 0 ? "text-red-400" : "text-green-400"}`}>
                ${Math.abs(totalLoss).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading positions for {symbol}...</p>
        </div>
      )}

  {/* Debug Info removed */}

  {/* Positions Table */}
  {!loading && rows.length > 0 && hasDetailedData && (
        <div
          className={`rounded-2xl backdrop-blur-lg border overflow-hidden ${
            isDarkMode
              ? "bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20"
              : "bg-white/60 border-white/20 shadow-xl shadow-gray-900/10"
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead
                className={`${isDarkMode ? "bg-gray-700/50" : "bg-gray-50"}`}
              >
                <tr>
                  <th
                    className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Side
                  </th>
                  <th
                    className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Lots
                  </th>
                  <th
                    className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Entry Price
                  </th>
                  <th
                    className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Current Price
                  </th>
                  <th
                    className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Leverage
                  </th>
                  <th
                    className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Invested
                  </th>
                  <th
                    className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    P&L
                  </th>
                  <th
                    className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Platform
                  </th>
                  <th
                    className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Date
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isDarkMode ? "divide-gray-700" : "divide-gray-200"
                }`}
              >
                {rows.map((position) => {
                  const { pnl, pnlPercent } = calculatePnL(position);
                  // Align invested display with calculation path (USD only)
                  const investedUsd = getInvestedUsd(position);
                  const displayPercent = investedUsd > 0 ? (pnl / investedUsd) * 100 : pnlPercent;
                  const isProfitable = pnl >= 0;

                  return (
                    <tr
                      key={position.id}
                      className={`hover:${
                        isDarkMode ? "bg-gray-700/30" : "bg-gray-50"
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            position.side === "buy"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {position.side.toUpperCase()}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-900"
                        }`}
                      >
                        {position.lots}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-900"
                        }`}
                      >
                        ${Number(position.entryPrice ?? 0).toLocaleString()}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-900"
                        }`}
                      >
                        ${Number(livePrice ?? position.currentPrice ?? position.entryPrice ?? 0).toLocaleString()}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-900"
                        }`}
                      >
                        {position.leverage}X
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-900"
                        }`}
                      >
                        ${Number(investedUsd ?? 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-right">
                          <p
                            className={`text-sm font-medium ${
                              isProfitable ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            ${pnl.toFixed(2)}
                          </p>
                          <p
                            className={`text-xs ${
                              isProfitable ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            ({displayPercent.toFixed(2)}%)
                          </p>
                        </div>
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-900"
                        }`}
                      >
                        {position.platform}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-900"
                        }`}
                      >
                        {formatTimestamp(position.timestamp)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Waiting for detailed rows (navigated from aggregated list) */}
      {!loading && rows.length > 0 && !hasDetailedData && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading symbol details...</p>
        </div>
      )}

      {/* No Positions */}
      {!loading && rows.length === 0 && (
        <div className="text-center py-12">
          <div
            className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isDarkMode ? "bg-gray-700" : "bg-gray-200"
            }`}
          >
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3
            className={`text-lg font-medium ${
              isDarkMode ? "text-gray-300" : "text-gray-900"
            } mb-2`}
          >
            No {symbol?.toUpperCase()} positions found
          </h3>
          <p
            className={`text-sm ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            You don't have any positions for this symbol yet.
          </p>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div
        className={`${
          isDarkMode ? "bg-gray-900" : "bg-gray-100"
        } flex flex-col fixed inset-0 overflow-hidden`}
        style={{
          height: "100svh",
          minHeight: "100vh",
          maxHeight: "100vh",
          width: "100vw",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          paddingBottom: "0px",
          margin: "0px",
        }}
      >
        <div className="flex-1 overflow-hidden" style={{ height: "100vh" }}>
          {content}
        </div>
        <FloatingNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    );
  }

  return (
    <div
      className={`h-screen ${
        isDarkMode ? "bg-gray-900" : "bg-gray-100"
      } flex flex-col`}
    >
      <Header
        onlineUsers={onlineUsers}
        sidebarOpen={sidebarOpen}
        onSidebarToggle={toggleSidebar}
      />
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <div className="flex-1 flex min-h-0 overflow-hidden">{content}</div>
    </div>
  );
});

export default SymbolPositions;
