import { createAsyncThunk } from '@reduxjs/toolkit';

// Define PriceData interface locally
export interface PriceData {
  price: number;
  change24h: number;
}

// Async thunk for fetching Dogecoin price
export const fetchDogecoinPrice = createAsyncThunk(
  'tradingview/fetchDogecoinPrice',
  async () => {
    // External price fetching disabled
    return { price: 0, change24h: 0 } as PriceData;
  }
);

// Async thunk for fetching multiple cryptocurrency prices
export const fetchMultiplePrices = createAsyncThunk(
  'tradingview/fetchMultiplePrices',
  async (coinIds: string[]) => {
    // External price fetching disabled
    const result: Record<string, PriceData> = {};
    for (const coinId of coinIds) {
      result[coinId] = { price: 0, change24h: 0 };
    }
    return result;
  }
);

// Async thunk for fetching Bitcoin price (for future use)
export const fetchBitcoinPrice = createAsyncThunk(
  'tradingview/fetchBitcoinPrice',
  async () => {
    // External price fetching disabled
    return { price: 0, change24h: 0 } as PriceData;
  }
);

// Async thunk for fetching Ethereum price (for future use)
export const fetchEthereumPrice = createAsyncThunk(
  'tradingview/fetchEthereumPrice',
  async () => {
    // External price fetching disabled
    return { price: 0, change24h: 0 } as PriceData;
  }
);
