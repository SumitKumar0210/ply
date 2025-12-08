// src/store/slices/customerSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";

// Fetch all customers
export const fetchCustomers = createAsyncThunk(
  "customer/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("admin/customer/get-data");
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Fetch active customers (optimized)
export const fetchActiveCustomers = createAsyncThunk(
  "customer/fetchActiveCustomers",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("admin/customer/get-data?status=1");
      
      // Ensure we always return an array
      const data = res.data.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Fetch active customers with search and pagination
export const fetchAllCustomersWithSearch = createAsyncThunk(
  "customer/fetchAllCustomersWithSearch",
  async ({ pageIndex = 1, pageLimit = 10, search = "", active="" }, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/customer/search", {
        page: pageIndex,
        limit: pageLimit,
        search: search,
        active:active,
      });

      const response = res.data.data || {};

      return {
        data: Array.isArray(response.data) ? response.data : [],
        total: response.total || 0,
        currentPage: response.current_page || pageIndex,
        perPage: response.per_page || pageLimit,
      };

    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);


// Add customer
export const addCustomer = createAsyncThunk(
  "customer/add",
  async (newCustomer, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/customer/store", newCustomer);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Update customer
export const updateCustomer = createAsyncThunk(
  "customer/update",
  async ({ updated }, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/customer/update/${updated.id}`, updated);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Status update
export const statusUpdate = createAsyncThunk(
  "customer/statusUpdate",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/customer/status-update", { id, status });
      successMessage(res.data.message);
      return { id, status };
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Delete customer
export const deleteCustomer = createAsyncThunk(
  "customer/delete",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/customer/delete/${id}`);
      successMessage(res.data.message);
      return id;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Customer slice
const customerSlice = createSlice({
  name: "customer",
  initialState: {
    data: [], // ✅ Always initialized as empty array
    totalCount: 0,
    currentPage: 1,
    pageSize: 10,
    loading: false,
    error: null,
  },
  reducers: {
    // Optional: Add manual reset action if needed
    resetCustomers: (state) => {
      state.data = [];
      state.totalCount = 0;
      state.currentPage = 1;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ========== Fetch All Customers ==========
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        // Ensure data is always an array
        state.data = Array.isArray(action.payload?.data) 
          ? action.payload.data 
          : Array.isArray(action.payload) 
          ? action.payload 
          : [];
        state.totalCount = action.payload?.totalCount || 0;
        state.currentPage = action.payload?.currentPage || 1;
        state.pageSize = action.payload?.pageSize || 10;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.data = []; // Reset to empty array on error
      })

      // ========== Fetch Active Customers ==========
      .addCase(fetchActiveCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.totalCount = action.payload.length;
      })
      .addCase(fetchActiveCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.data = [];
      })

      // ========== Fetch Active Customers With Search ==========
      .addCase(fetchAllCustomersWithSearch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllCustomersWithSearch.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data; // Already validated as array in thunk
        state.totalCount = action.payload.total;
        state.currentPage = action.payload.currentPage;
        state.pageSize = action.payload.perPage;
      })
      .addCase(fetchAllCustomersWithSearch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.data = [];
      })

      // ========== Add Customer ==========
      .addCase(addCustomer.pending, (state) => {
        state.loading = true;
      })
      .addCase(addCustomer.fulfilled, (state, action) => {
        state.loading = false;
        // ✅ Add to beginning of array
        if (action.payload) {
          state.data.unshift(action.payload);
          state.totalCount += 1;
        }
      })
      .addCase(addCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ========== Update Customer ==========
      .addCase(updateCustomer.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          const index = state.data.findIndex((d) => d.id === action.payload.id);
          if (index !== -1) {
            state.data[index] = action.payload;
          }
        }
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ========== Status Update ==========
      .addCase(statusUpdate.pending, (state) => {
        state.loading = true;
      })
      .addCase(statusUpdate.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          const index = state.data.findIndex((d) => d.id === action.payload.id);
          if (index !== -1) {
            state.data[index].status = action.payload.status;
          }
        }
      })
      .addCase(statusUpdate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ========== Delete Customer ==========
      .addCase(deleteCustomer.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.data = state.data.filter((d) => d.id !== action.payload);
        state.totalCount = Math.max(0, state.totalCount - 1);
      })
      .addCase(deleteCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetCustomers } = customerSlice.actions;
export default customerSlice.reducer;