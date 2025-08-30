import { memo } from 'react';
import { AdvancedChart } from 'react-tradingview-embed';

interface TradingViewChartProps {
  isDarkMode: boolean;
}

const TradingViewChart = memo(function TradingViewChart({ isDarkMode }: TradingViewChartProps) {
  return (
    <div className="flex-1">
      <AdvancedChart
        widgetProps={{
          symbol: "DOGEUSD",
          interval: "1",
          timezone: "Etc/UTC",
          theme: isDarkMode ? "dark" : "light",
          style: "1",
          locale: "en",
          toolbar_bg: isDarkMode ? "#1e222d" : "#f1f3f6",
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: "tradingview_chart",
          autosize: true,
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
});

export default TradingViewChart;
