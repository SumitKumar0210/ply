import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";

// Async Thunks
export const getProductionLog = createAsyncThunk(
  "log/getProductionLog",
  async (values, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/logs/get-production-log`, values);
      successMessage(res.data.message);
      return {
        data: res.data.data || [],
        totalRecords: res.data.total || 0,
      };
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const getVendorPaymentLog = createAsyncThunk(
  "log/getVendorPaymentLog",
  async (values, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/logs/get-vendor-payment-log`, values);
      successMessage(res.data.message);
      return {
        data: res.data.data || [],
        totalRecords: res.data.total || 0,
      };
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const getCustomerPaymentLog = createAsyncThunk(
  "log/getCustomerPaymentLog",
  async (values, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/logs/get-customer-payment-log`, values);
      successMessage(res.data.message);
      return {
        data: res.data.data || [],
        totalRecords: res.data.total || 0,
      };
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Slice
const logSlice = createSlice({
  name: "log",
  initialState: {
    data: [],
    loading: false,
    error: null,
    totalRecords: 0,
  },
  reducers: {
    clearLogData: (state) => {
      state.data = [];
      state.totalRecords = 0;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Production Log
    builder
      .addCase(getProductionLog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProductionLog.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
        state.totalRecords = action.payload.totalRecords;
      })
      .addCase(getProductionLog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Vendor Payment Log
    builder
      .addCase(getVendorPaymentLog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getVendorPaymentLog.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
        state.totalRecords = action.payload.totalRecords;
      })
      .addCase(getVendorPaymentLog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Customer Payment Log
    builder
      .addCase(getCustomerPaymentLog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCustomerPaymentLog.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
        state.totalRecords = action.payload.totalRecords;
      })
      .addCase(getCustomerPaymentLog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearLogData } = logSlice.actions;
export default logSlice.reducer;