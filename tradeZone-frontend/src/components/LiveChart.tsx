import { useState, memo } from 'react';
import { AdvancedChart } from 'react-tradingview-embed';

const LiveChart = memo(function LiveChart() {
  const [isDarkMode] = useState(true);

  return (
    <div className={`h-full ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <AdvancedChart
          widgetProps={{
            symbol: "DOGEUSD",
            interval: "5",
            timezone: "Etc/UTC",
            theme: isDarkMode ? "dark" : "light",
            style: "1",
            locale: "en",
            toolbar_bg: isDarkMode ? "#1e222d" : "#f1f3f6",
            enable_publishing: false,
            allow_symbol_change: true,
            container_id: `tradingview_chart_${Date.now()}`,
            autosize: true,
            width: "100%",
            height: "100%",
            save_image: false,
            studies_overrides: {},
            overrides: {
              "mainSeriesProperties.style": 1,
            },
            // Force 5m timeframe
            time_frames: [
              { text: "5m", resolution: "5", description: "5 Minutes", title: "5m" },
              { text: "15m", resolution: "15", description: "15 Minutes", title: "15m" },
              { text: "30m", resolution: "30", description: "30 Minutes", title: "30m" },
              { text: "1h", resolution: "60", description: "1 Hour", title: "1h" },
              { text: "4h", resolution: "240", description: "4 Hours", title: "4h" },
              { text: "1D", resolution: "1D", description: "1 Day", title: "1D" }
            ],
            // Clear any stored preferences
            load_last_chart: false,
          }}
        />
    </div>
  );
});

export default LiveChart;
