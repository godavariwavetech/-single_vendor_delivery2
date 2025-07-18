import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import instance, { API_ENDPOINTS } from '../../services/api';

// Async thunk for fetching orders
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (_, { rejectWithValue, getState }) => {
    try {
      // Get delivery boy ID from auth state
      const deliveryBoyId = getState().auth.user?.id;
      
      if (!deliveryBoyId) {
        return rejectWithValue('User not logged in');
      }

      const response = await instance.get(API_ENDPOINTS.GET_ORDERS(deliveryBoyId));
      
      // Check if response has orders property as per backend
      if (response.data && response.data.orders) {
        console.log("response.data.orders", response.data.orders);
        return response.data.orders;
      }
      
      return rejectWithValue('Invalid response format');
    } catch (error) {
      if (error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to fetch orders');
      }
      return rejectWithValue('Network error. Please check your connection.');
    }
  }
);

// New thunk for fetching delivered orders
export const fetchDeliveredOrders = createAsyncThunk(
  'orders/fetchDeliveredOrders',
  async (_, { rejectWithValue, getState }) => {
    try {
      const deliveryBoyId = getState().auth.user?.id;
      
      if (!deliveryBoyId) {
        return rejectWithValue('User not logged in');
      }

      const response = await instance.get(API_ENDPOINTS.GET_DELIVERED_ORDERS(deliveryBoyId));
      
      if (response.data && response.data.orders) {
        return response.data.orders;
      }
      
      return rejectWithValue('Invalid response format');
    } catch (error) {
      if (error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to fetch delivered orders');
      }
      return rejectWithValue('Network error. Please check your connection.');
    }
  }
);

const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    orders: [],
    deliveredOrders: [], // New state for delivered orders
    loading: false,
    error: null,
  },
  reducers: {
    clearOrders: (state) => {
      state.orders = [];
      state.deliveredOrders = []; // Clear delivered orders too
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
        state.error = null;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Handle fetchDeliveredOrders states
      .addCase(fetchDeliveredOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeliveredOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.deliveredOrders = action.payload;
        state.error = null;
      })
      .addCase(fetchDeliveredOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearOrders } = orderSlice.actions;
export default orderSlice.reducer; 