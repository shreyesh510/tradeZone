import api from './api';

export interface TradePnLDto {
  id: string;
  date: string;
  profit: number;
  loss: number;
  netPnL: number;
  notes?: string;
  totalTrades?: number;
  winningTrades?: number;
  losingTrades?: number;
  createdAt: string;
  updatedAt: string;
}

export const tradePnLApi = {
  list: async (): Promise<TradePnLDto[]> => {
    const res = await api.get('/trade-pnl');
    return res.data;
  },
  
  create: async (data: { date: string; profit: number; loss: number; netPnL: number; notes?: string; totalTrades?: number; winningTrades?: number; losingTrades?: number }): Promise<TradePnLDto> => {
    const res = await api.post('/trade-pnl', data);
    return res.data;
  },
  
  async update(id: string, payload: Partial<{ profit: number; loss: number; netPnL: number; notes?: string; totalTrades?: number; winningTrades?: number; losingTrades?: number }>) {
    const res = await api.patch<{ success: boolean }>(`/trade-pnl/${id}`, payload);
    return res.data;
  },
  
  async remove(id: string) {
    const res = await api.delete<{ success: boolean }>(`/trade-pnl/${id}`);
    return res.data;
  },
  
  async getById(id: string): Promise<TradePnLDto> {
    const res = await api.get(`/trade-pnl/${id}`);
    return res.data;
  },
  
  async getByDate(date: string): Promise<TradePnLDto | null> {
    try {
      const res = await api.get(`/trade-pnl/by-date/${date}`);
      return res.data;
    } catch (error) {
      return null;
    }
  },
  
  async getStatistics(days?: number): Promise<any> {
    const url = `/trade-pnl/statistics${days ? `?days=${days}` : ''}`;
    const res = await api.get(url);
    return res.data;
  }
};