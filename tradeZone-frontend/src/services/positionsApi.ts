import api from './api';
import type { Position, AggregatedPosition, PositionLike, CreatePositionData, UpdatePositionData, PositionFilters } from '../types/position';

export const positionsApi = {
  // Get all positions with optional filters
  getPositions: async (filters?: PositionFilters): Promise<PositionLike[]> => {
  // removed debug log

    // If no filters, use the new backend endpoint that includes P&L
    if (!filters || Object.keys(filters).length === 0) {
      const url = '/positions/getAllPositionsWithPnl';
  // removed debug log
      const response = await api.get(url);
  // removed debug logs
      return response.data as AggregatedPosition[];
    }

    // Otherwise fall back to the generic /positions with query params
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }
    if (filters?.side) {
      params.append('side', filters.side);
    }
    if (filters?.platform) {
      params.append('platform', filters.platform);
    }
    if (filters?.symbol) {
      params.append('symbol', filters.symbol);
    }
    const url = `/positions?${params.toString()}`;
  // removed debug log
    const response = await api.get(url);
  // removed debug logs
  return response.data as Position[];
  },

  // Get a specific position by ID
  getPosition: async (id: string): Promise<Position> => {
    const response = await api.get(`/positions/${id}`);
    return response.data;
  },

  // Create a new position
  createPosition: async (data: CreatePositionData): Promise<Position> => {
    const response = await api.post('/positions', data);
    return response.data;
  },

  // Update an existing position
  updatePosition: async (id: string, data: UpdatePositionData): Promise<Position> => {
    const response = await api.patch(`/positions/${id}`, data);
    return response.data;
  },

  // Delete a position
  deletePosition: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/positions/${id}`);
    return response.data;
  },

  // Get only open positions
  getOpenPositions: async (): Promise<Position[]> => {
    const response = await api.get('/positions/open/list');
    return response.data;
  },

  // Get only closed positions
  getClosedPositions: async (): Promise<Position[]> => {
    const response = await api.get('/positions/closed/list');
    return response.data;
  },

  // Get positions for a specific symbol
  getPositionsBySymbol: async (symbol: string): Promise<Position[]> => {
    const response = await api.get(`/positions/symbol/${encodeURIComponent(symbol)}`);
    return response.data;
  },

  // Bulk create positions with backend-side dedupe
  createPositionsBulk: async (positions: CreatePositionData[]): Promise<{ created: Position[]; skipped: CreatePositionData[] }> => {
    const response = await api.post('/positions/multiple', { positions });
    return response.data;
  },
};
