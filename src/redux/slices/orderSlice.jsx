import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_ENDPOINTS,instance } from '../../services/api';

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

// New thunk for fetching delivered orders with pagination
export const fetchDeliveredOrders = createAsyncThunk(
  'orders/fetchDeliveredOrders',
  async (params = {}, { rejectWithValue, getState }) => {
    try {
      const deliveryBoyId = getState().auth.user?.id;
      
      if (!deliveryBoyId) {
        return rejectWithValue('User not logged in');
      }

      // Extract pagination parameters
      const { page = 1, limit = 20, reset = false } = params;
      
      const response = await instance.get(API_ENDPOINTS.GET_DELIVERED_ORDERS(deliveryBoyId, { page, limit }));
      
      // Handle different response formats
      if (response.data) {
        // If response has orders array directly (legacy format)
        if (Array.isArray(response.data)) {
          return {
            orders: response.data,
            page,
            limit,
            hasMore: response.data.length === limit, // If we got full page, there might be more
            total: response.data.length,
            reset
          };
        }
        
        // If response has orders property (new paginated format)
        if (response.data.orders) {
          const pagination = response.data.pagination || {};
          return {
            orders: response.data.orders,
            page: pagination.currentPage || page,
            limit: pagination.itemsPerPage || limit,
            hasMore: pagination.hasMore || response.data.orders.length === limit,
            total: pagination.totalItems || response.data.orders.length,
            reset
          };
        }
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
    deliveredOrdersMeta: { // Pagination metadata
      currentPage: 1,
      hasMore: true,
      total: 0,
      loading: false,
    },
    loading: false,
    error: null,
  },
  reducers: {
    clearOrders: (state) => {
      state.orders = [];
      state.deliveredOrders = []; // Clear delivered orders too
      state.deliveredOrdersMeta = {
        currentPage: 1,
        hasMore: true,
        total: 0,
        loading: false,
      };
      state.error = null;
    },
    resetDeliveredOrdersPagination: (state) => {
      state.deliveredOrders = [];
      state.deliveredOrdersMeta = {
        currentPage: 1,
        hasMore: true,
        total: 0,
        loading: false,
      };
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
        state.deliveredOrdersMeta.loading = true;
        state.error = null;
      })
      .addCase(fetchDeliveredOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.deliveredOrdersMeta.loading = false;
        state.error = null;
        
        const { orders, page, hasMore, total, reset } = action.payload;
        
        if (reset || page === 1) {
          // Reset orders for first page or reset
          state.deliveredOrders = orders;
        } else {
          // Append orders for subsequent pages
          state.deliveredOrders = [...state.deliveredOrders, ...orders];
        }
        
        // Update pagination metadata
        state.deliveredOrdersMeta = {
          currentPage: page,
          hasMore,
          total,
          loading: false,
        };
      })
      .addCase(fetchDeliveredOrders.rejected, (state, action) => {
        state.loading = false;
        state.deliveredOrdersMeta.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearOrders, resetDeliveredOrdersPagination } = orderSlice.actions;
export default orderSlice.reducer; 