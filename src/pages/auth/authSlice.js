import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

// ✅ Login Thunk
export const authLogin = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${BASE_URL}login`, credentials);

      // Save token in localStorage
      if (res.data?.access_token) {
        localStorage.setItem("token", res.data.access_token);
      }
      console.log(res.data.access_token)
      return res.data; // return API response (user + token)
    } catch (error) {
        // console.log(error)
      if (error.response?.data) {
        return rejectWithValue(
          error.response.data[0] ??
            error.response.data.error ??
            "Login failed"
        );
      }
      return rejectWithValue("Something went wrong");
    }
  }
);

// ✅ Forgot Password Thunk
export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${BASE_URL}forget`, payload);
      return res.data; // usually { message: "reset link sent" }
    } catch (error) {
      if (error.response?.data) {
        return rejectWithValue(
          error.response.data.error ??
            error.response.data.message ??
            "Request failed"
        );
      }
      return rejectWithValue("Something went wrong");
    }
  }
);

// ✅ Auth Slice
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: localStorage.getItem("token") || null,
    loading: false,
    error: null,
    message: null, // for forgot password success
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("token");
    },
  },
  extraReducers: (builder) => {
    builder
      // 🔹 Login
      .addCase(authLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(authLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user ?? null;
        state.token = action.payload.token ?? null;
      })
      .addCase(authLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // 🔹 Forgot Password
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
      });
  },
});

// ✅ Export
export const { logout } = authSlice.actions;
export default authSlice.reducer;
