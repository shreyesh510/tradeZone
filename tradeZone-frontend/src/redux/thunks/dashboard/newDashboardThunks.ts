import { createAsyncThunk } from '@reduxjs/toolkit';
import { newDashboardApi } from '../../../services/dashboardApiNew';

// Fetch all dashboard data in parallel
export const fetchAllDashboardData = createAsyncThunk(
  'newDashboard/fetchAllDashboardData',
  async (timeframe: string = '1M', { rejectWithValue }) => {
    try {
      const data = await newDashboardApi.getAllDashboardData(timeframe);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard data');
    }
  }
);

// Fetch positions data
export const fetchDashboardPositions = createAsyncThunk(
  'newDashboard/fetchDashboardPositions',
  async (timeframe: string = '1M', { rejectWithValue }) => {
    try {
      const data = await newDashboardApi.getPositions(timeframe);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch positions data');
    }
  }
);

// Fetch wallets data
export const fetchDashboardWallets = createAsyncThunk(
  'newDashboard/fetchDashboardWallets',
  async (timeframe: string = '1M', { rejectWithValue }) => {
    try {
      const data = await newDashboardApi.getWallets(timeframe);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch wallets data');
    }
  }
);

// Fetch trade P&L data
export const fetchDashboardTradePnL = createAsyncThunk(
  'newDashboard/fetchDashboardTradePnL',
  async (timeframe: string = '1M', { rejectWithValue }) => {
    try {
      const data = await newDashboardApi.getTradePnL(timeframe);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch trade P&L data');
    }
  }
);

// Fetch transactions data
export const fetchDashboardTransactions = createAsyncThunk(
  'newDashboard/fetchDashboardTransactions',
  async (timeframe: string = '1M', { rejectWithValue }) => {
    try {
      const data = await newDashboardApi.getTransactions(timeframe);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch transactions data');
    }
  }
);