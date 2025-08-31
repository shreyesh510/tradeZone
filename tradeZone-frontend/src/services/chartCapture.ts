/**
 * Chart Capture Service
 * Captures screenshots of TradingView charts for AI analysis
 */
import html2canvas from 'html2canvas';
import { tradingViewService } from './tradingViewService';

export interface ChartCaptureResult {
  imageData: string; // Base64 encoded image
  timestamp: number;
  symbol?: string;
  timeframe?: string;
  metadata?: {
    width: number;
    height: number;
    format: string;
  };
}

class ChartCaptureService {
  /**
   * Captures a screenshot of the TradingView chart
   */
  async captureChart(): Promise<ChartCaptureResult> {
    try {
      // Find the TradingView iframe
      const tradingViewFrame = this.findTradingViewFrame();
      if (!tradingViewFrame) {
        throw new Error('TradingView chart not found');
      }

      // Get the chart container
      const chartContainer = tradingViewFrame.parentElement;
      if (!chartContainer) {
        throw new Error('Chart container not found');
      }

      // Use html2canvas to capture the chart
      const canvas = await this.captureElement(chartContainer);
      const imageData = canvas.toDataURL('image/png');

      return {
        imageData,
        timestamp: Date.now(),
        metadata: {
          width: canvas.width,
          height: canvas.height,
          format: 'png'
        }
      };
    } catch (error) {
      console.error('❌ Error capturing chart:', error);
      throw error;
    }
  }

  /**
   * Captures chart with additional context (symbol, timeframe)
   */
  async captureChartWithContext(symbol?: string, timeframe?: string): Promise<ChartCaptureResult> {
    const result = await this.captureChart();
    
    // If no symbol/timeframe provided, try to detect from current chart
    if (!symbol || !timeframe) {
      const chartContext = this.getCurrentChartContext();
      symbol = symbol || chartContext.symbol;
      timeframe = timeframe || chartContext.timeframe;
    }
    
    return {
      ...result,
      symbol,
      timeframe
    };
  }

  /**
   * Gets current chart context from settings or DOM
   */
  getCurrentChartContext(): { symbol: string; timeframe: string } {
    return tradingViewService.getCurrentChartContext();
  }

  /**
   * Finds the TradingView iframe in the DOM
   */
  private findTradingViewFrame(): HTMLIFrameElement | null {
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
   * Captures an element using html2canvas
   */
  private async captureElement(element: Element): Promise<HTMLCanvasElement> {
    // Use html2canvas for reliable chart capture
    return html2canvas(element, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      scale: 1,
      logging: false,
      onclone: (clonedDoc) => {
        // Ensure styles are preserved in cloned document
        const clonedElement = clonedDoc.querySelector('[id*="tradingview"]');
        if (clonedElement) {
          (clonedElement as HTMLElement).style.visibility = 'visible';
        }
      }
    });
  }

  /**
   * Captures using screen share API (requires user permission)
   */
  private async captureWithScreenShare(element: Element): Promise<HTMLCanvasElement> {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { mediaSource: 'screen' as any }
    });

    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();

    return new Promise((resolve, reject) => {
      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        const rect = element.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        ctx.drawImage(video, 0, 0, rect.width, rect.height);
        
        // Stop the stream
        stream.getTracks().forEach(track => track.stop());
        
        resolve(canvas);
      };
    });
  }

  /**
   * Creates a fallback canvas when other methods fail
   */
  private createFallbackCanvas(element: Element): HTMLCanvasElement {
    const rect = element.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not create canvas context');
    }

    canvas.width = rect.width || 800;
    canvas.height = rect.height || 600;

    // Create a simple placeholder
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Chart Capture Not Available', canvas.width / 2, canvas.height / 2);
    ctx.fillText('Please install html2canvas for chart capture', canvas.width / 2, canvas.height / 2 + 25);

    return canvas;
  }

  /**
   * Converts image data to a format suitable for OpenAI Vision API
   */
  formatForOpenAI(imageData: string): string {
    // Remove data URL prefix if present
    if (imageData.startsWith('data:image/')) {
      return imageData.split(',')[1];
    }
    return imageData;
  }

  /**
   * Validates if chart capture is supported
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && typeof html2canvas !== 'undefined';
  }
}

export const chartCaptureService = new ChartCaptureService();
export default chartCaptureService;
