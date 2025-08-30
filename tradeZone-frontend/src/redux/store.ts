import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import priceReducer from './slices/priceSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    price: priceReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


