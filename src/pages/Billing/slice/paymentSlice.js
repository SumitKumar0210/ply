import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";

export const fetchPaymentRecord = createAsyncThunk(
  "payments/fetchPaymentRecord",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/billing/get-payment-data", id);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const storePayment = createAsyncThunk(
  "payments/storePayment",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/billing/store-customer-payment", payload);
      successMessage(res.data.message || "Payment recorded successfully");
      return res.data.data;
    } catch (error) {
      const msg = getErrorMessage(error);
      errorMessage(msg);
      return rejectWithValue(msg);
    }
  }
);

const paymentSlice = createSlice({
  name: "payments",
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

      .addCase(fetchPaymentRecord.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaymentRecord.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload || [];
      })
      .addCase(fetchPaymentRecord.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(storePayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(storePayment.fulfilled, (state, action) => {
        state.loading = false;
        state.payments.push(action.payload);
      })
      .addCase(storePayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearPayments, clearError } = paymentSlice.actions;
export default paymentSlice.reducer;
