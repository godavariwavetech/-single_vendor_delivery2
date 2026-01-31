import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_ENDPOINTS, instance } from '../../services/api';
import { saveUserData, clearUserData, getUserData } from '../../services/storage';

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ phone, password }, { rejectWithValue }) => {
    try {
      const response = await instance.post(API_ENDPOINTS.LOGIN, { phone, password });
      console.log("response-loginUser", response.data);

      // Check if login was successful
      if (response.data.message === "Login success") {
        const userData = response.data.data;
        // Save user data to AsyncStorage
        await saveUserData(userData);
        return userData; // Return the delivery boy data
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

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ name, phone, password }, { rejectWithValue }) => {
    try {
      const response = await instance.post(API_ENDPOINTS.REGISTER, { name, phone, password });
      console.log("response-registerUser", response.data);

      // Check if registration was successful (status 201)
      if (response.status === 201 && response.data.message === "Registered successfully") {
        return {
          message: response.data.message,
          id: response.data.id, // new user ID from backend
        };
      } else {
        return rejectWithValue(response.data.message || "Registration failed");
      }
    } catch (error) {
      console.log("Registration error:", error);
      if (error.response) {
        // Specific server errors
        if (error.response.status === 400) {
          return rejectWithValue(error.response.data.message || "Phone already registered");
        }
        if (error.response.status === 500) {
          return rejectWithValue(error.response.data.message || "Server error occurred");
        }
        return rejectWithValue(error.response.data.message || "Registration failed");
      }
      // Network/server not reachable
      return rejectWithValue("Unable to connect to server. Please check your internet connection.");
    }
  }
);



// UPDATE PROFILE (Unified: Name, Address, Password)

export const resetPassword = createAsyncThunk(
  'auth/updateProfile',
  async ({ name, address, phone, newPassword, id }, { rejectWithValue, getState }) => {
    try {
      const response = await instance.post(API_ENDPOINTS.RESET_PASSWORD, {
        name,
        address,
        phone,
        newPassword,
        id
      });

      // ✅ Check response structure
      if (response.status === 200) {
        // Update the user data in the state with the new information
        const updatedUserData = {
          ...getState().auth.user,
          delivery_boy_name: name,
          delivery_boy_address: address,
          delivery_boy_mobile_number: phone,
        };

        // Save updated user data to AsyncStorage
        await saveUserData(updatedUserData);

        return {
          message: "Profile updated successfully",
          userData: updatedUserData
        };
      } else {
        return rejectWithValue(
          response.data?.message || "Profile update failed"
        );
      }
    } catch (error) {
      if (error.response) {
        return rejectWithValue(error.response.data.message || "Profile update failed");
      }
      return rejectWithValue("Unable to connect to server. Please check your internet connection.");
    }
  }
);



// New thunk for initializing auth state
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const userData = await getUserData();
      return userData;
    } catch (error) {
      return rejectWithValue('Failed to load user data');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: false,
    error: null,
    isInitialized: false, // New flag to track initialization
    registrationSuccess: false, // New flag to track successful registration
    successMessage: null, // Success message for registration
    newUserId: null, // New user ID after registration
    profileUpdateSuccess: false, // New flag to track successful profile update
    profileUpdateMessage: null, // Success message for profile update
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.error = null;
      // Clear stored data
      clearUserData();
    },
    clearError(state) {
      state.error = null;
    },
    clearRegistrationSuccess(state) {
      state.registrationSuccess = false;
      state.successMessage = null;
      state.newUserId = null;
    },
    clearProfileUpdateSuccess(state) {
      state.profileUpdateSuccess = false;
      state.profileUpdateMessage = null;
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
        state.user = action.payload;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.user = null;
      })
      // Add cases for register user
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.registrationSuccess = true;
        state.successMessage = action.payload.message;
        state.newUserId = action.payload.id; // store new user id
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add cases for initialize auth
      .addCase(initializeAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isInitialized = true;
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.isInitialized = true;
      })
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.profileUpdateSuccess = true;
        state.profileUpdateMessage = action.payload.message;
        // Update user data with the new information
        if (action.payload.userData) {
          state.user = action.payload.userData;
        }
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

  },
});

export const { logout, clearError, clearRegistrationSuccess, clearProfileUpdateSuccess } = authSlice.actions;
export default authSlice.reducer;
