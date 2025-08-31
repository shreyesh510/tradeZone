import { createAsyncThunk } from '@reduxjs/toolkit';

// Define PriceData interface locally
export interface PriceData {
  price: number;
  change24h: number;
}

// Async thunk for fetching Dogecoin price
export const fetchDogecoinPrice = createAsyncThunk(
  'tradingview/fetchDogecoinPrice',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=dogecoin&vs_currencies=usd&include_24hr_change=true'
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.dogecoin) {
        throw new Error('Dogecoin data not found in response');
      }

      return {
        price: data.dogecoin.usd,
        change24h: data.dogecoin.usd_24h_change,
      } as PriceData;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch Dogecoin price');
    }
  }
);

// Async thunk for fetching multiple cryptocurrency prices
export const fetchMultiplePrices = createAsyncThunk(
  'tradingview/fetchMultiplePrices',
  async (coinIds: string[], { rejectWithValue }) => {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_24hr_change=true`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const result: Record<string, PriceData> = {};

      for (const coinId of coinIds) {
        if (data[coinId]) {
          result[coinId] = {
            price: data[coinId].usd,
            change24h: data[coinId].usd_24h_change,
          };
        }
      }

      return result;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch multiple prices');
    }
  }
);

// Async thunk for fetching Bitcoin price (for future use)
export const fetchBitcoinPrice = createAsyncThunk(
  'tradingview/fetchBitcoinPrice',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true'
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.bitcoin) {
        throw new Error('Bitcoin data not found in response');
      }

      return {
        price: data.bitcoin.usd,
        change24h: data.bitcoin.usd_24h_change,
      } as PriceData;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch Bitcoin price');
    }
  }
);

// Async thunk for fetching Ethereum price (for future use)
export const fetchEthereumPrice = createAsyncThunk(
  'tradingview/fetchEthereumPrice',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true'
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.ethereum) {
        throw new Error('Ethereum data not found in response');
      }

      return {
        price: data.ethereum.usd,
        change24h: data.ethereum.usd_24h_change,
      } as PriceData;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch Ethereum price');
    }
  }
);
