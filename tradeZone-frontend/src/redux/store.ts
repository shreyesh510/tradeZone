import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import priceReducer from './slices/priceSlice';
import openaiReducer from './slices/openaiSlice';
import positionsReducer from './slices/positionsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    price: priceReducer,
    openai: openaiReducer,
    positions: positionsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


