import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../api';

// ✅ Thunks
export const fetchCategories = createAsyncThunk('group/fetchAll', async () => {
  const res = await api.get("admin/category/get-data");
  return res.data.data;
});

export const addCategory = createAsyncThunk(
  'category/add',
  async (newData, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/category/store", newData);
      return res.data.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(
          error.response.data[0] ?? error.response.data.error ?? "Request failed"
        );
      }
      return rejectWithValue("Something went wrong");
    }
  }
);

export const updateCategory = createAsyncThunk(
  'category/update',
  async (updated, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/category/update/${updated.id}`, updated);
      return updated;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(
          error.response.data[0] ?? error.response.data.error ?? "Request failed"
        );
      }
      return rejectWithValue("Something went wrong");
    }
  }
);

export const statusUpdate = createAsyncThunk(
  'category/update',
  async (updated) => {
    const res = await api.post("admin/category/status-update", {
      id: updated.id,
      status: updated.status,
    });
    return updated;
  }
);


export const deleteCategory = createAsyncThunk(
  'category/delete',
  async (id) => {
    await api.post(`admin/category/delete/${id}`, id);
    return id;
  }
);

// ✅ Slice
const categorySlice = createSlice({
  name: "category",
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Add
      .addCase(addCategory.fulfilled, (state, action) => {
        state.data.unshift(action.payload);
      })

      // Update
      .addCase(updateCategory.fulfilled, (state, action) => {
        const index = state.data.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
      })

      // Delete
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.data = state.data.filter((d) => d.id !== action.payload);
      });
  },
});

export default categorySlice.reducer;
