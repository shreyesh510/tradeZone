import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '../../services/authApi';
import type { LoginData, RegisterData, AuthResponse } from '../../services/authApi';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  testToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  testToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginData, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials);
      
      // Store tokens in localStorage
      localStorage.setItem('testToken', response.testToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterData, { rejectWithValue }) => {
    try {
      const response = await authApi.register(userData);
      
      // Store tokens in localStorage
      localStorage.setItem('testToken', response.testToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async () => {
    authApi.logout();
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    initializeAuth: (state) => {
      const testToken = localStorage.getItem('testToken');
      const user = localStorage.getItem('user');
      
      console.log('🔄 Initializing auth from localStorage:', { testToken: !!testToken, user: !!user });
      
      if (testToken && user) {
        try {
          state.testToken = testToken;
          state.user = JSON.parse(user);
          state.isAuthenticated = true;
          console.log('✅ Auth initialized successfully:', state.user);
        } catch (error) {
          console.error('❌ Error parsing user data:', error);
          // Clear invalid data
          localStorage.removeItem('testToken');
          localStorage.removeItem('user');
        }
      } else {
        console.log('❌ No valid credentials found in localStorage');
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.testToken = action.payload.testToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.testToken = action.payload.testToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.testToken = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { clearError, initializeAuth } = authSlice.actions;
export default authSlice.reducer;
