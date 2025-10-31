// src/store/slices/customerSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api"; // adjust the path to your API file
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";
//  Fetch all customers
export const fetchPOs = createAsyncThunk(
  "purchaseOrder/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("admin/purchase-order/get-data");
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Fetch failed");
    }
  }
);

//  Add customer
export const addPO = createAsyncThunk(
  "purchaseOrder/add",
  async (newCustomer, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/purchase-order/store", newCustomer);
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
export const updatePO = createAsyncThunk(
  "purchaseOrder/update",
  async ({ updated }, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/purchase-order/update/${updated.id}`, updated);
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
  "purchaseOrder/statusUpdate",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/purchase-order/status-update", { id, status });
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
export const deletePO = createAsyncThunk(
  "purchaseOrder/delete",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/purchase-order/delete/${id}`);
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
const purchaseOrderSlice = createSlice({
  name: "purchaseOrder",
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchPOs.pending, (state) => { state.loading = true; })
      .addCase(fetchPOs.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
      .addCase(fetchPOs.rejected, (state, action) => { state.loading = false; state.error = action.payload || action.error.message; })

      // Add
      .addCase(addPO.fulfilled, (state, action) => { state.data.unshift(action.payload); })

      // Update
      .addCase(updatePO.fulfilled, (state, action) => {
        const index = state.data.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) state.data[index] = action.payload;
      })

      // Status update
      .addCase(statusUpdate.fulfilled, (state, action) => {
        const index = state.data.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) state.data[index].status = action.payload.status;
      })

      // Delete
      .addCase(deletePO.fulfilled, (state, action) => {
        state.data = state.data.filter((d) => d.id !== action.payload);
      });
  },
});

export default purchaseOrderSlice.reducer;
