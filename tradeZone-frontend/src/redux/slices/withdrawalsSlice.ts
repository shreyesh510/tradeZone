import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { fetchWithdrawals, createWithdrawal } from '../thunks/withdrawals/withdrawalsThunks';
import type { WithdrawalDto } from '../../services/withdrawalsApi';

interface WithdrawalsState {
  items: WithdrawalDto[];
  loading: boolean;
  creating: boolean;
  error: string | null;
}

const initialState: WithdrawalsState = {
  items: [],
  loading: false,
  creating: false,
  error: null,
};

const withdrawalsSlice = createSlice({
  name: 'withdrawals',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWithdrawals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWithdrawals.fulfilled, (state, action: PayloadAction<WithdrawalDto[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchWithdrawals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string ?? 'Failed to fetch withdrawals';
      })
      .addCase(createWithdrawal.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createWithdrawal.fulfilled, (state, action: PayloadAction<WithdrawalDto>) => {
        state.creating = false;
        state.items = [action.payload, ...state.items];
      })
      .addCase(createWithdrawal.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload as string ?? 'Failed to create withdrawal';
      });
  },
});

export default withdrawalsSlice.reducer;
