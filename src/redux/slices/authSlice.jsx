import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import instance, { API_ENDPOINTS } from '../../services/api';

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ phone, password }, { rejectWithValue }) => {
    try {
      const response = await instance.post(API_ENDPOINTS.LOGIN, { phone, password });
      
      // Check if login was successful
      if (response.data.message === "Login success") {
        return response.data.data; // Return the delivery boy data
      } else {
        return rejectWithValue(response.data.message);
      }
    } catch (error) {
      // Handle different error scenarios
      if (error.response) {
        // Server responded with error status
        if (error.response.status === 401) {
          return rejectWithValue("Invalid phone number or password");
        }
        return rejectWithValue(error.response.data.message || "Login failed");
      }
      // Network error or server not responding
      return rejectWithValue("Unable to connect to server. Please check your internet connection.");
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: false,
    error: null,
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    }
  },
  extraReducers: builder => {
    builder
      .addCase(loginUser.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload; // This will be the delivery boy data
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.user = null;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
