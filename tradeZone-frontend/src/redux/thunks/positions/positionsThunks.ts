import { createAsyncThunk } from '@reduxjs/toolkit';
import { positionsApi } from '../../../services/positionsApi';
import type { Position, PositionLike, CreatePositionData, UpdatePositionData, PositionFilters } from '../../../types/position';

// Fetch all positions with optional filters
export const fetchPositions = createAsyncThunk(
  'positions/fetchPositions',
  async (filters: PositionFilters | undefined, { rejectWithValue }) => {
    try {
  const positions = await positionsApi.getPositions(filters);
      return positions;
    } catch (error: any) {
      console.error('❌ Redux: fetchPositions thunk error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch positions');
    }
  }
);

// Fetch a single position by ID
export const fetchPosition = createAsyncThunk(
  'positions/fetchPosition',
  async (id: string, { rejectWithValue }) => {
    try {
      const position = await positionsApi.getPosition(id);
      return position;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch position');
    }
  }
);

// Create a new position
export const createPosition = createAsyncThunk(
  'positions/createPosition',
  async (data: CreatePositionData, { rejectWithValue }) => {
    try {
      const position = await positionsApi.createPosition(data);
      return position;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create position');
    }
  }
);

// Update an existing position
export const updatePosition = createAsyncThunk(
  'positions/updatePosition',
  async (params: { id: string; data: UpdatePositionData }, { rejectWithValue }) => {
    try {
      const { id, data } = params;
      const position = await positionsApi.updatePosition(id, data);
      return position;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update position');
    }
  }
);

// Delete a position
export const deletePosition = createAsyncThunk(
  'positions/deletePosition',
  async (id: string, { rejectWithValue }) => {
    try {
      await positionsApi.deletePosition(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete position');
    }
  }
);

// Fetch open positions only
export const fetchOpenPositions = createAsyncThunk(
  'positions/fetchOpenPositions',
  async (_, { rejectWithValue }) => {
    try {
      const positions = await positionsApi.getOpenPositions();
      return positions;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch open positions');
    }
  }
);

// Fetch closed positions only
export const fetchClosedPositions = createAsyncThunk(
  'positions/fetchClosedPositions',
  async (_, { rejectWithValue }) => {
    try {
      const positions = await positionsApi.getClosedPositions();
      return positions;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch closed positions');
    }
  }
);


// Bulk import removed

// Close all open positions for current user
export const closeAllPositions = createAsyncThunk(
  'positions/closeAllPositions',
  async (pnl: number | undefined, { rejectWithValue }) => {
    try {
      const result = await positionsApi.closeAllPositions(pnl);
      return result; // { updated: number }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to close all positions');
    }
  }
);
