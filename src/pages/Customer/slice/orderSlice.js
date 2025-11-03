import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";

// Fetch orders with pagination
export const fetchOrder = createAsyncThunk(
  "order/fetchOrder",
  async ({ pageIndex, pageLimit }, { rejectWithValue }) => {
    try {
      const res = await api.get(`admin/quotation-product/get-data`, {
        params: {
          page: pageIndex + 1,
          limit: pageLimit
        }
      });
      return {
        data: res.data.data,
        totalRecords: res.data.total || res.data.data.length
      };
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Add order
export const addOrder = createAsyncThunk(
  "order/addOrder",
  async (values, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/quotation-product/store`, values);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Edit order
export const editOrder = createAsyncThunk(
  "order/editOrder",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/quotation-product/edit/${id}`);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Update order
export const updateOrder = createAsyncThunk(
  "order/updateOrder",
  async (values, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/quotation-product/update/${values.id}`, values);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Delete order
export const deleteOrder = createAsyncThunk(
  "order/deleteOrder",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/quotation-product/delete/${id}`);
      successMessage(res.data.message);
      return { id };
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

const orderSlice = createSlice({
  name: "order",
  initialState: {
    data: [],
    selected: {},
    totalRecords: 0,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch orders
      .addCase(fetchOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data || [];
        state.totalRecords = action.payload.totalRecords || 0;
      })
      .addCase(fetchOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add order
      .addCase(addOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.data.unshift(action.payload);
        state.totalRecords += 1;
      })
      .addCase(addOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Edit order
      .addCase(editOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      
      // Delete order
      .addCase(deleteOrder.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.data = state.data.filter(item => item.id !== action.payload.id);
        state.totalRecords = Math.max(0, state.totalRecords - 1);
      })
      .addCase(deleteOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default orderSlice.reducer;