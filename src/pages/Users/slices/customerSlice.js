// src/store/slices/customerSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api"; // adjust the path to your API file
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";
//  Fetch all customers
export const fetchCustomers = createAsyncThunk(
  "customer/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("admin/customer/get-data"); // update API endpoint
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Fetch failed");
    }
  }
);

export const fetchActiveCustomers = createAsyncThunk(
  "customer/fetchActiveCustomers",
  async (params = {}, { rejectWithValue }) => {
    try {
      const {
        page = params.pageIndex ?? 1,
        limit = params.pageLimit ?? 10,
        search = params.search ?? ""
      } = params;

      const res = await api.get("admin/customer/get-data", {
        params: { status: 1, page, limit, search }
      });

      return {
        data: res.data.data || [],
        total: res.data.total || 0,
        currentPage: res.data.current_page || page,
        perPage: res.data.per_page || limit,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Fetch failed");
    }
  }
);

//  Add customer
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

//  Update customer
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

//  Status update
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

//  Delete customer
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

//  Customer slice
const customerSlice = createSlice({
  name: "customer",
  initialState: {
    data: [],
    totalCount: 0,
    currentPage: 1,
    pageSize: 10,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
        state.totalCount = action.payload.totalCount;
        state.currentPage = action.payload.currentPage;
        state.pageSize = action.payload.pageSize;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchActiveCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload || [];
        state.totalCount = action.payload.total;
  state.currentPage = action.payload.currentPage;
  state.pageSize = action.payload.perPage;
      })
      .addCase(fetchActiveCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add
      .addCase(addCustomer.fulfilled, (state, action) => { state.data.unshift(action.payload); })

      // Update
      .addCase(updateCustomer.fulfilled, (state, action) => {
        const index = state.data.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) state.data[index] = action.payload;
      })

      // Status update
      .addCase(statusUpdate.fulfilled, (state, action) => {
        const index = state.data.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) state.data[index].status = action.payload.status;
      })

      // Delete
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.data = state.data.filter((d) => d.id !== action.payload);
      });
  },
});

export default customerSlice.reducer;
