import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";

// 🔹 Fetch Customer Ledger
export const getCustomerLedger = createAsyncThunk(
  "payments/getCustomerLedger",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/billing/get-ledger-data", { id });

      // Optional success toast (use meaningful message)
      if (res.data.message) {
        successMessage(res.data.message);
      }
      console.log(res.data.data);

      return res.data.data;
    } catch (error) {
      const msg = getErrorMessage(error);
      errorMessage(msg);
      return rejectWithValue(msg);
    }
  }
);

const customerLedgerSlice = createSlice({
  name: "customerLedger",

  initialState: {
    payments: [],
    loading: false,
    error: null,
  },

  reducers: {
    clearPayments: (state) => {
      state.payments = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // 🔹 Pending
      .addCase(getCustomerLedger.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      // 🔹 Success
      .addCase(getCustomerLedger.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload;
      })

      // 🔹 Error
      .addCase(getCustomerLedger.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load ledger data";
      });
  },
});

export const { clearPayments, clearError } = customerLedgerSlice.actions;
export default customerLedgerSlice.reducer;
