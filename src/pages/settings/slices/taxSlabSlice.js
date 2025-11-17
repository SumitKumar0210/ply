import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../api';
import { successMessage, errorMessage, getErrorMessage } from '../../../toast';

// Fetch paginated tax slabs
export const fetchTaxSlabs = createAsyncThunk(
  'taxSlab/fetchAll',
  async ({ page = 1, per_page = 10, query } = {}, { rejectWithValue }) => {
    try {
      const res = await api.get(`admin/tax-slab/get-data?page=${page}&per_page=${per_page}&search=${query}`);
      return {
        data: res.data.data || [],
        total: res.data.total || 0,
        currentPage: page,
        perPage: per_page
      };
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Fetch active tax slabs (no pagination)
export const fetchActiveTaxSlabs = createAsyncThunk(
  'taxSlab/fetchActive',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("admin/tax-slab/get-data?status=1");
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Add new tax slab
export const addTaxSlab = createAsyncThunk(
  'taxSlab/add',
  async (newData, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/tax-slab/store", newData);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Update tax slab
export const updateTaxSlab = createAsyncThunk(
  'taxSlab/update',
  async (updated, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/tax-slab/update/${updated.id}`, updated);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Update status
export const statusUpdate = createAsyncThunk(
  'taxSlab/statusUpdate',
  async (updated, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/tax-slab/status-update", {
        id: updated.id,
        status: updated.status,
      });
      successMessage(res.data.message);
      return updated;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Delete tax slab
export const deleteTaxSlab = createAsyncThunk(
  'taxSlab/delete',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/tax-slab/delete/${id}`);
      successMessage(res.data.message || "Tax slab deleted successfully!");
      return id;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Slice
const taxSlabSlice = createSlice({
  name: "taxSlab",
  initialState: {
    data: [],
    activeData: [],
    total: 0,
    currentPage: 1,
    perPage: 10,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch paginated
      .addCase(fetchTaxSlabs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTaxSlabs.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
        state.total = action.payload.total;
        state.currentPage = action.payload.currentPage;
        state.perPage = action.payload.perPage;
      })
      .addCase(fetchTaxSlabs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // Add these cases for fetchActiveTaxSlabs
      .addCase(fetchActiveTaxSlabs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveTaxSlabs.fulfilled, (state, action) => {
        state.loading = false;
        state.activeData = action.payload; // Store active tax slabs here
      })
      .addCase(fetchActiveTaxSlabs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // Add
      .addCase(addTaxSlab.pending, (state) => {
        state.loading = true;
      })
      .addCase(addTaxSlab.fulfilled, (state, action) => {
        state.loading = false;
        // Don't modify local data - will refetch from server
      })
      .addCase(addTaxSlab.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // Update
      .addCase(updateTaxSlab.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateTaxSlab.fulfilled, (state, action) => {
        state.loading = false;
        // Update in current data
        const index = state.data.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
      })
      .addCase(updateTaxSlab.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // Status Update
      .addCase(statusUpdate.fulfilled, (state, action) => {
        const index = state.data.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
      })

      // Delete
      .addCase(deleteTaxSlab.fulfilled, (state, action) => {
        // Remove from current data
        state.data = state.data.filter((item) => item.id !== action.payload);
        state.total = Math.max(0, state.total - 1);
      });
  },
});

export const { clearError } = taxSlabSlice.actions;
export default taxSlabSlice.reducer;