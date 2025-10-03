// src/store/slices/customerSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api"; // adjust the path to your API file

// ✅ Fetch all customers
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

// ✅ Add customer
export const addCustomer = createAsyncThunk(
  "customer/add",
  async (newCustomer, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/customer/store", newCustomer);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Add failed");
    }
  }
);

// ✅ Update customer
export const updateCustomer = createAsyncThunk(
  "customer/update",
  async ({ updated }, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/customer/update/${updated.id}`, updated);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Update failed");
    }
  }
);

// ✅ Status update
export const statusUpdate = createAsyncThunk(
  "customer/statusUpdate",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      await api.post("admin/customer/status-update", { id, status });
      return { id, status };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Status update failed");
    }
  }
);

// ✅ Delete customer
export const deleteCustomer = createAsyncThunk(
  "customer/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.post(`admin/customer/delete/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Delete failed");
    }
  }
);

// ✅ Customer slice
const customerSlice = createSlice({
  name: "customer",
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchCustomers.pending, (state) => { state.loading = true; })
      .addCase(fetchCustomers.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
      .addCase(fetchCustomers.rejected, (state, action) => { state.loading = false; state.error = action.payload || action.error.message; })

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
