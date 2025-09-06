import api from './api';
import type { Position, CreatePositionData, UpdatePositionData, PositionFilters } from '../types/position';

export const positionsApi = {
  // Get all positions with optional filters
  getPositions: async (filters?: PositionFilters): Promise<Position[]> => {
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
    
    const response = await api.get(`/positions?${params.toString()}`);
    return response.data;
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
};
