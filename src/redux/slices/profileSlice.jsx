import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import instance from '../../services/api';

// Async thunks for profile actions
export const updatePersonalInfo = createAsyncThunk(
  'profile/updatePersonalInfo',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await instance.put('/profile', userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update profile');
    }
  }
);

export const updatePassword = createAsyncThunk(
  'profile/updatePassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await instance.put('/profile/password', passwordData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update password');
    }
  }
);

export const updateDeliveryAreas = createAsyncThunk(
  'profile/updateDeliveryAreas',
  async (areas, { rejectWithValue }) => {
    try {
      const response = await instance.put('/profile/delivery-areas', { areas });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update delivery areas');
    }
  }
);

const initialState = {
  personalInfo: {
    loading: false,
    error: null,
  },
  settings: {
    pushNotifications: true,
    emailNotifications: true,
    darkMode: false,
    language: 'English',
    soundEnabled: true,
  },
  deliveryAreas: [],
  loading: false,
  error: null,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    togglePushNotifications: (state) => {
      state.settings.pushNotifications = !state.settings.pushNotifications;
    },
    toggleEmailNotifications: (state) => {
      state.settings.emailNotifications = !state.settings.emailNotifications;
    },
    toggleDarkMode: (state) => {
      state.settings.darkMode = !state.settings.darkMode;
    },
    toggleSound: (state) => {
      state.settings.soundEnabled = !state.settings.soundEnabled;
    },
    setLanguage: (state, action) => {
      state.settings.language = action.payload;
    },
    clearError: (state) => {
      state.error = null;
      state.personalInfo.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Update Personal Info
      .addCase(updatePersonalInfo.pending, (state) => {
        state.personalInfo.loading = true;
        state.personalInfo.error = null;
      })
      .addCase(updatePersonalInfo.fulfilled, (state) => {
        state.personalInfo.loading = false;
      })
      .addCase(updatePersonalInfo.rejected, (state, action) => {
        state.personalInfo.loading = false;
        state.personalInfo.error = action.payload;
      })
      // Update Password
      .addCase(updatePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Delivery Areas
      .addCase(updateDeliveryAreas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDeliveryAreas.fulfilled, (state, action) => {
        state.loading = false;
        state.deliveryAreas = action.payload;
      })
      .addCase(updateDeliveryAreas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  togglePushNotifications,
  toggleEmailNotifications,
  toggleDarkMode,
  toggleSound,
  setLanguage,
  clearError,
} = profileSlice.actions;

export default profileSlice.reducer; 