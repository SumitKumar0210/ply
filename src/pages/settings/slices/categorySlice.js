import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../api';
import { successMessage, errorMessage, getErrorMessage } from '../../../toast';

// Thunks
export const fetchCategories = createAsyncThunk(
  'category/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("admin/category/get-data");
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const fetchActiveCategories = createAsyncThunk(
  'category/fetchActive',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("admin/category/get-data?status=1");
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const addCategory = createAsyncThunk(
  'category/add',
  async (newData, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/category/store", newData);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const updateCategory = createAsyncThunk(
  'category/update',
  async (updated, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/category/update/${updated.id}`, updated);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const statusUpdate = createAsyncThunk(
  'category/statusUpdate',
  async (updated, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/category/status-update", {
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

export const sequenceUpdate = createAsyncThunk(
  'category/sequenceUpdate',
  async (updated, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/category/sequence-update", updated);
      successMessage(res.data.message);
      return updated;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const deleteCategory = createAsyncThunk(
  'category/delete',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/category/delete/${id}`);
      successMessage(res.data.message);
      return id;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Slice
const categorySlice = createSlice({
  name: "category",
  initialState: {
    data: [],
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
      // Fetch Categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // Fetch Active Categories
      .addCase(fetchActiveCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchActiveCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // Add Category
      .addCase(addCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.data.unshift(action.payload);
      })
      .addCase(addCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // Update Category
      .addCase(updateCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.data.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // Status Update
      .addCase(statusUpdate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(statusUpdate.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.data.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) {
          state.data[index].status = action.payload.status;
        }
      })
      .addCase(statusUpdate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // Sequence Update
      .addCase(sequenceUpdate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sequenceUpdate.fulfilled, (state, action) => {
        state.loading = false;
        // Update the sequence for affected items
        if (Array.isArray(action.payload)) {
          action.payload.forEach((updated) => {
            const index = state.data.findIndex((d) => d.id === updated.id);
            if (index !== -1) {
              state.data[index].sequence = updated.sequence;
            }
          });
        }
      })
      .addCase(sequenceUpdate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // Delete Category
      .addCase(deleteCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.data = state.data.filter((item) => item.id !== action.payload);
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { clearError } = categorySlice.actions;
export default categorySlice.reducer;