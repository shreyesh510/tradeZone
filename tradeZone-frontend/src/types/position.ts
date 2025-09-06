export interface Position {
  id: string;
  userId?: string;
  symbol: string;
  side: 'buy' | 'sell';
  entryPrice: number;
  currentPrice?: number; // may be omitted; UI should use live price
  lots: number;
  investedAmount: number;
  platform: 'Delta Exchange' | 'Groww';
  leverage: number;
  timestamp?: string;
  status?: 'open' | 'closed';
  pnl?: number;
  pnlPercentage?: number;
  stopLoss?: number;
  takeProfit?: number;
  createdAt?: Date;
  updatedAt?: Date;
  closedAt?: Date;
  notes?: string;
}

export interface CreatePositionData {
  symbol: string;
  side: 'buy' | 'sell';
  lots: number;
  entryPrice: number;
  currentPrice?: number; // optional; live price will be fetched client-side
  investedAmount: number;
  platform: 'Delta Exchange' | 'Groww';
  leverage: number;
  timestamp?: string;
  status?: 'open' | 'closed';
  stopLoss?: number;
  takeProfit?: number;
  notes?: string;
}

export interface UpdatePositionData {
  symbol?: string;
  side?: 'buy' | 'sell';
  lots?: number;
  entryPrice?: number;
  currentPrice?: number;
  investedAmount?: number;
  platform?: 'Delta Exchange' | 'Groww';
  leverage?: number;
  timestamp?: string;
  status?: 'open' | 'closed';
  pnl?: number;
  pnlPercentage?: number;
  stopLoss?: number;
  takeProfit?: number;
  closedAt?: Date;
  notes?: string;
}

export interface PositionFilters {
  status?: 'open' | 'closed' | 'all';
  symbol?: string;
  side?: 'buy' | 'sell';
  platform?: 'Delta Exchange' | 'Groww';
}

export interface PositionStats {
  totalPositions: number;
  openPositions: number;
  closedPositions: number;
  totalPnL: number;
  totalPnLPercentage: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
}
