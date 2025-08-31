/**
 * Chart Context Service
 * Provides chart context detection for AI analysis
 */
import { tradingViewService } from './tradingViewService';

export interface ChartContext {
  symbol: string;
  timeframe: string;
  timestamp: number;
}

class ChartContextService {
  /**
   * Gets current chart context from settings and DOM
   */
  getCurrentChartContext(): ChartContext {
    const context = tradingViewService.getCurrentChartContext();
    return {
      ...context,
      timestamp: Date.now()
    };
  }

  /**
   * Gets chart context with additional symbol/timeframe override
   */
  getChartContextWithOverride(symbol?: string, timeframe?: string): ChartContext {
    const currentContext = this.getCurrentChartContext();
    
    return {
      symbol: symbol || currentContext.symbol,
      timeframe: timeframe || currentContext.timeframe,
      timestamp: Date.now()
    };
  }

  /**
   * Finds the TradingView iframe in the DOM (for future use)
   */
  findTradingViewFrame(): HTMLIFrameElement | null {
    // Look for TradingView iframe
    const iframes = document.querySelectorAll('iframe');
    for (const iframe of iframes) {
      if (iframe.src && iframe.src.includes('tradingview')) {
        return iframe;
      }
    }

    // Alternative: look for TradingView container by ID or class
    const tvContainer = document.querySelector('[id*="tradingview"]');
    if (tvContainer) {
      const iframe = tvContainer.querySelector('iframe');
      if (iframe) return iframe;
    }

    return null;
  }

  /**
   * Validates if chart detection is supported
   */
  isSupported(): boolean {
    return typeof window !== 'undefined';
  }
}

export const chartContextService = new ChartContextService();
export default chartContextService;