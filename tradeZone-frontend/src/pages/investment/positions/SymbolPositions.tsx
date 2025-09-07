import { memo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Header from "../../../layouts/Header";
import Sidebar from "../../../components/Sidebar";
import FloatingNav, { type MobileTab } from "../../../layouts/FloatingNav";
import { useSettings } from "../../../contexts/SettingsContext";
import { usePermissions } from "../../../hooks/usePermissions";
import type { RootState, AppDispatch } from "../../../redux/store";
import { fetchPositionsBySymbol, deletePosition } from "../../../redux/thunks/positions/positionsThunks";
import { clearError } from "../../../redux/slices/positionsSlice";
import type { Position } from "../../../types/position";
import Button from "../../../components/button";
import { getLotSize } from "../../../utils/lotSize";
import { toast } from "react-toastify";

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
  // Fixed FX: 1 USD = 86 INR
  const [usdInrRate] = useState<number | null>(86);
  const [fxUpdatedAt] = useState<number | null>(null);

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

  // Live price removed; no external coin API usage

  // No FX fetching; using fixed rate above

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleTabChange = (tab: MobileTab) => {
    setActiveTab(tab);
  };

  const isDarkMode = settings.theme === "dark";

  // P&L removed from detail page

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

  // Derived totals for summary
  const totalInvestment = rows.reduce((sum, pos)=>{
    return sum + (pos.investedAmount / 86);
  }, 0);


  const totalLots = rows.reduce((sum, pos) => sum + (pos.lots || 0), 0);

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
      {/* Summary (investment only) */}
          <div>
            <h3
              className={`text-sm font-medium ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
        {symbol?.toUpperCase()} Summary
            </h3>
            <div className="mt-2 text-sm">
              <p className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Total Investment: $ {totalInvestment.toLocaleString()}
              </p>
              <p className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Total Lots: {totalLots.toLocaleString()}
              </p>
              {/* FX note removed per requirement */}
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
                $ {totalInvestment.toLocaleString()}
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

            {/* Third tile placeholder removed (no total loss) */}
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
                    Invested
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
                  <th
                    className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isDarkMode ? "divide-gray-700" : "divide-gray-200"
                }`}
              >
                {rows.map((position) => {
                  // Display invested amount only
                  const investedUsd = getInvestedUsd(position);
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
                      {/* Lots */}
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-900"
                        }`}
                      >
                        {position.lots}
                      </td>
                      {/* Entry Price */}
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-900"
                        }`}
                      >
                        {Number(position.entryPrice ?? 0).toLocaleString()}
                      </td>
                      {/* Current Price cell removed */}
                      {/* Invested */}
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-900"
                        }`}
                      >
                       $ {Number(position?.investedAmount / 86).toLocaleString()}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const ok = window.confirm(`Delete entry ${position.symbol} @ ${position.entryPrice}?`);
                            if (!ok) return;
                            try {
                              await dispatch(deletePosition(position.id)).unwrap();
                              toast.success('Entry deleted');
                            } catch (err) {
                              toast.error('Failed to delete entry');
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
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
