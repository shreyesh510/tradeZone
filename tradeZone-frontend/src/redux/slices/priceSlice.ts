import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { 
  fetchDogecoinPrice, 
  fetchMultiplePrices, 
  fetchBitcoinPrice, 
  fetchEthereumPrice,
  type PriceData
} from '../thunks/tradingview/priceThunks';

interface CoinState {
  price: number | null;
  change24h: number | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

interface PriceState {
  dogecoin: CoinState;
  bitcoin: CoinState;
  ethereum: CoinState;
  // For future use with multiple coins
  prices: Record<string, PriceData>;
  multipleLoading: boolean;
  multipleError: string | null;
}

const createInitialCoinState = (): CoinState => ({
  price: null,
  change24h: null,
  loading: false,
  error: null,
  lastUpdated: null,
});

const initialState: PriceState = {
  dogecoin: createInitialCoinState(),
  bitcoin: createInitialCoinState(),
  ethereum: createInitialCoinState(),
  prices: {},
  multipleLoading: false,
  multipleError: null,
};

const priceSlice = createSlice({
  name: 'price',
  initialState,
  reducers: {
    // Clear error manually if needed
    clearError: (state) => {
      state.dogecoin.error = null;
      state.bitcoin.error = null;
      state.ethereum.error = null;
      state.multipleError = null;
    },
    // Clear specific coin data
    clearDogecoinData: (state) => {
      state.dogecoin = createInitialCoinState();
    },
    clearBitcoinData: (state) => {
      state.bitcoin = createInitialCoinState();
    },
    clearEthereumData: (state) => {
      state.ethereum = createInitialCoinState();
    },
    // Clear all coin data
    clearAllPriceData: (state) => {
      state.dogecoin = createInitialCoinState();
      state.bitcoin = createInitialCoinState();
      state.ethereum = createInitialCoinState();
      state.prices = {};
    },
  },
  extraReducers: (builder) => {
    // Handle fetchDogecoinPrice
    builder
      .addCase(fetchDogecoinPrice.pending, (state) => {
        state.dogecoin.loading = true;
        state.dogecoin.error = null;
      })
      .addCase(fetchDogecoinPrice.fulfilled, (state, action: PayloadAction<PriceData>) => {
        state.dogecoin.loading = false;
        state.dogecoin.price = action.payload.price;
        state.dogecoin.change24h = action.payload.change24h;
        state.dogecoin.error = null;
        state.dogecoin.lastUpdated = Date.now();
      })
      .addCase(fetchDogecoinPrice.rejected, (state, action) => {
        state.dogecoin.loading = false;
        state.dogecoin.error = action.payload as string;
      })
      // Handle fetchBitcoinPrice
      .addCase(fetchBitcoinPrice.pending, (state) => {
        state.bitcoin.loading = true;
        state.bitcoin.error = null;
      })
      .addCase(fetchBitcoinPrice.fulfilled, (state, action: PayloadAction<PriceData>) => {
        state.bitcoin.loading = false;
        state.bitcoin.price = action.payload.price;
        state.bitcoin.change24h = action.payload.change24h;
        state.bitcoin.error = null;
        state.bitcoin.lastUpdated = Date.now();
      })
      .addCase(fetchBitcoinPrice.rejected, (state, action) => {
        state.bitcoin.loading = false;
        state.bitcoin.error = action.payload as string;
      })
      // Handle fetchEthereumPrice
      .addCase(fetchEthereumPrice.pending, (state) => {
        state.ethereum.loading = true;
        state.ethereum.error = null;
      })
      .addCase(fetchEthereumPrice.fulfilled, (state, action: PayloadAction<PriceData>) => {
        state.ethereum.loading = false;
        state.ethereum.price = action.payload.price;
        state.ethereum.change24h = action.payload.change24h;
        state.ethereum.error = null;
        state.ethereum.lastUpdated = Date.now();
      })
      .addCase(fetchEthereumPrice.rejected, (state, action) => {
        state.ethereum.loading = false;
        state.ethereum.error = action.payload as string;
      })
      // Handle fetchMultiplePrices
      .addCase(fetchMultiplePrices.pending, (state) => {
        state.multipleLoading = true;
        state.multipleError = null;
      })
      .addCase(fetchMultiplePrices.fulfilled, (state, action: PayloadAction<Record<string, PriceData>>) => {
        state.multipleLoading = false;
        state.prices = { ...state.prices, ...action.payload };
        state.multipleError = null;
      })
      .addCase(fetchMultiplePrices.rejected, (state, action) => {
        state.multipleLoading = false;
        state.multipleError = action.payload as string;
      });
  },
});

export const { 
  clearError, 
  clearDogecoinData, 
  clearBitcoinData, 
  clearEthereumData, 
  clearAllPriceData 
} = priceSlice.actions;
export default priceSlice.reducer;
