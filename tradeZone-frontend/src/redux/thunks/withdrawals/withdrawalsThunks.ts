import { createAsyncThunk } from '@reduxjs/toolkit';
import { withdrawalsApi, type WithdrawalDto } from '../../../services/withdrawalsApi';

export const fetchWithdrawals = createAsyncThunk<WithdrawalDto[], void, { rejectValue: string }>(
  'withdrawals/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await withdrawalsApi.list();
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to fetch withdrawals');
    }
  },
);

export const createWithdrawal = createAsyncThunk<WithdrawalDto, { amount: number; method?: string; description?: string }, { rejectValue: string }>(
  'withdrawals/create',
  async (payload, { rejectWithValue }) => {
    try {
      return await withdrawalsApi.create(payload);
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to create withdrawal');
    }
  },
);
