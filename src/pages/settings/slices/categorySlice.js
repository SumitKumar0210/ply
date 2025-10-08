import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../api';
import { successMessage, errorMessage, getErrorMessage } from '../../../toast';
// ✅ Thunks
export const fetchCategories = createAsyncThunk('category/fetchAll', async () => {
  const res = await api.get("admin/category/get-data");
  // console.log(res.data.data)
  return res.data.data;
});


export const fetchActiveCategories = createAsyncThunk('category/fetchAll', async () => {
  const res = await api.get("admin/category/get-data?status=1");
  return res.data.data;
});

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
  'category/update',
  async (updated) => {
    try{
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


export const deleteCategory = createAsyncThunk(
  'category/delete',
  async (id) => {
    try{
      const res = await api.post(`admin/category/delete/${id}`, id);
      successMessage(res.data.message)
      return id;
    }catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
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
        const deletedId = action.meta.arg; 
        state.data = state.data.filter((item) => item.id !== deletedId);
      });
  },
});

export default categorySlice.reducer;
