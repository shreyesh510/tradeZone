import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import priceReducer from './slices/priceSlice';
import openaiReducer from './slices/openaiSlice';
import positionsReducer from './slices/positionsSlice';
import withdrawalsReducer from './slices/withdrawalsSlice';
import depositsReducer from './slices/depositsSlice';
import walletsReducer from './slices/walletsSlice';
import tradePnLReducer from './slices/tradePnLSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    price: priceReducer,
    openai: openaiReducer,
    positions: positionsReducer,
    withdrawals: withdrawalsReducer,
    deposits: depositsReducer,
    wallets: walletsReducer,
    tradePnL: tradePnLReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


