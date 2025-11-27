import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { successMessage, errorMessage, getErrorMessage } from "../../toast";

const BASE_URL = import.meta.env.VITE_BASE_URL;

// Create axios instance with interceptor
export const apiClient = axios.create({
  baseURL: BASE_URL,
});

// Setup interceptor for automatic token attachment
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Setup response interceptor for 401 handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("401 Unauthorized - triggering logout");
      localStorage.removeItem("token");
      sessionStorage.removeItem("redirectAfterLogin");
      window.dispatchEvent(new Event('auth-logout'));
    }
    return Promise.reject(error);
  }
);

// Login Thunk
export const authLogin = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${BASE_URL}login`, credentials);

      // Save token in localStorage
      if (res.data?.access_token) {
        localStorage.setItem("token", res.data.access_token);
        
        // Dispatch custom event for AuthContext to listen
        window.dispatchEvent(new CustomEvent('auth-login', { 
          detail: { token: res.data.access_token } 
        }));
      }
      
      successMessage(res.data.message);
      return res.data; 
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Logout Thunk
export const authLogout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.post(
        `${BASE_URL}auth/logout`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      localStorage.removeItem("token");
      sessionStorage.removeItem("redirectAfterLogin");
      
      // Dispatch custom event for AuthContext to listen
      window.dispatchEvent(new Event('auth-logout'));
      
      successMessage(res.data.message);
      return res.data;
    } catch (error) {
      // Even if API fails, still logout locally
      localStorage.removeItem("token");
      sessionStorage.removeItem("redirectAfterLogin");
      window.dispatchEvent(new Event('auth-logout'));
      
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Forgot Password Thunk
export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${BASE_URL}forgot-password`, payload);
      successMessage(res.data.message);
      return res.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Reset Password Thunk
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${BASE_URL}reset-password`, payload);
      successMessage(res.data.message);
      return res.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Auth Slice
const authSlice = createSlice({
  name: "auth",
  initialState: {
    isAuthenticated: !!localStorage.getItem("token"), 
    user: null,
    token: localStorage.getItem("token") || null,
    loading: false,
    error: null,
    message: null, 
  },
  reducers: {
    // Manual logout (used by AuthContext)
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem("token");
      sessionStorage.removeItem("redirectAfterLogin");
    },
    
    // Clear error/message
    clearAuthMessages: (state) => {
      state.error = null;
      state.message = null;
    },
    
    // Set user from AuthContext
    setUser: (state, action) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(authLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(authLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user ?? null;
        state.token = action.payload.access_token ?? action.payload.token ?? null;
        state.error = null;

        if (state.token) {
          state.isAuthenticated = true; 
        }
      })
      .addCase(authLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })

      // Logout
      .addCase(authLogout.pending, (state) => {
        state.loading = true;
      })
      .addCase(authLogout.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = null;
      })
      .addCase(authLogout.rejected, (state) => {
        state.loading = false;
        // Still logout even if API fails
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })

      // Forgot Password
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message ?? "Reset link sent!";
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message ?? "Password reset successful!";
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Export
export const { logout, clearAuthMessages, setUser } = authSlice.actions;
export default authSlice.reducer;