import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";

//  Fetch vendor invoices with pagination
export const fetchVendorInvoices = createAsyncThunk(
  "vendorInvoice/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { page = 1, per_page = 10, search = "" } = params;

      const queryParams = new URLSearchParams();

      if (page) queryParams.append("page", page);
      if (per_page) queryParams.append("per_page", per_page);
      if (search) queryParams.append("search", search);

      const queryString = queryParams.toString();
      const url = queryString
        ? `admin/purchase-inward/get-data?${queryString}`
        : `admin/purchase-inward/get-data`;

      const res = await api.get(url);

      return {
        data: res.data?.data || [],
        total: res.data?.total || 0,
        page,
        per_page,
      };
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);


//  Fetch single invoice by ID
export const fetchVendorInvoiceById = createAsyncThunk(
  "vendorInvoice/fetchById",
  async (id, { rejectWithValue }) => {
    console.log(id)
    try {
      const res = await api.post(`admin/purchase-inward/edit/${id}`);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

//  Update vendor invoice
export const updateVendorInvoice = createAsyncThunk(
  "vendorInvoice/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/purchase-inward/update/${id}`, data);
      successMessage(res.data.message || "Invoice updated successfully");
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

//  Delete vendor invoice
export const deleteVendorInvoice = createAsyncThunk(
  "vendorInvoice/delete",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/purchase-inward/delete/${id}`);
      successMessage(res.data.message || "Invoice deleted successfully");
      return id;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

//  Status update
export const updateInvoiceStatus = createAsyncThunk(
  "vendorInvoice/statusUpdate",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/purchase-inward/status-update", { id, status });
      successMessage(res.data.message || "Status updated successfully");
      return { id, status };
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

//  Record payment
export const recordPayment = createAsyncThunk(
  "vendorInvoice/recordPayment",
  async (paymentData, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/purchase-inward/store-payment-record", paymentData);
      successMessage(res.data.message || "Payment recorded successfully");
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const fetchPaymentRecord = createAsyncThunk(
  "vendorInvoice/fetchPaymentRecord",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/purchase-inward/get-paymentData", id);
      successMessage(res.data.message || "Payment recorded successfully");
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

//  Vendor Invoice Slice
const vendorInvoiceSlice = createSlice({
  name: "vendorInvoice",
  initialState: {
    data: [],
    payments: [],
    selected: null,
    total: 0,
    currentPage: 1,
    perPage: 10,
    loading: false,
    error: null,
  },
  reducers: {
    clearSelected: (state) => {
      state.selected = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearPayments: (state) => {
      state.payments = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all with pagination
      .addCase(fetchVendorInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVendorInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
        state.total = action.payload.total;
        state.currentPage = action.payload.page;
        state.perPage = action.payload.per_page;
      })
      .addCase(fetchVendorInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // Fetch by ID
      .addCase(fetchVendorInvoiceById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVendorInvoiceById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addCase(fetchVendorInvoiceById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // Update
      .addCase(updateVendorInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateVendorInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
        const index = state.data.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
      })
      .addCase(updateVendorInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // Delete
      .addCase(deleteVendorInvoice.fulfilled, (state, action) => {
        state.data = state.data.filter((item) => item.id !== action.payload);
        state.total = Math.max(0, state.total - 1);
      })

      // Status update
      .addCase(updateInvoiceStatus.fulfilled, (state, action) => {
        const index = state.data.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.data[index].status = action.payload.status;
        }
      })

      

      // Record payment
      .addCase(recordPayment.fulfilled, (state, action) => {
        // Optionally update the invoice status or payment info
        if (action.payload?.invoice_id) {
          const index = state.data.findIndex((item) => item.id === action.payload.invoice_id);
          if (index !== -1) {
            // Update payment status or related fields
            state.data[index] = { ...state.data[index], ...action.payload };
          }
        }
      })

      // 🔹 Payments
      .addCase(fetchPaymentRecord.pending, (state) => {
        state.loadingPayments = true;
      })
      .addCase(fetchPaymentRecord.fulfilled, (state, action) => {
        state.loadingPayments = false;
        state.payments = action.payload || []; // ensure array
      })
      .addCase(fetchPaymentRecord.rejected, (state, action) => {
        state.loadingPayments = false;
        state.error = action.payload;
      });
  },
});

export const { clearSelected, clearError, clearPayments } = vendorInvoiceSlice.actions;
export default vendorInvoiceSlice.reducer;