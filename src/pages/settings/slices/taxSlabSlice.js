import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../api';
import { successMessage, errorMessage, getErrorMessage } from '../../../toast';

//  Thunks
export const fetchTaxSlabs = createAsyncThunk('taxSlab/fetchAll', async () => {
  const res = await api.get("admin/tax-slab/get-data");
  return res.data.data;
});

export const fetchActiveTaxSlabs = createAsyncThunk('taxSlab/fetchAll', async () => {
  const res = await api.get("admin/tax-slab/get-data?status=1");
  return res.data.data;
});

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

export const statusUpdate = createAsyncThunk(
  'taxSlab/update',
  async (updated) => {
    try{
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


export const deleteTaxSlab = createAsyncThunk(
  'taxSlab/delete',
  async (id) => {
    try{
      const res = await api.post(`admin/tax-slab/delete/${id}`, id);
      successMessage(res.data.message || "Tax slab deleted successfully!");
      return id;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

//  Slice
const taxSlabSlice = createSlice({
  name: "taxSlab",
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchTaxSlabs.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTaxSlabs.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchTaxSlabs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Add
      .addCase(addTaxSlab.fulfilled, (state, action) => {
        state.data.unshift(action.payload);
      })

      // Update
      .addCase(statusUpdate.fulfilled, (state, action) => {
        const index = state.data.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
      })

      // Delete
      .addCase(deleteTaxSlab.fulfilled, (state, action) => {
        const deletedId = action.meta.arg; 
        state.data = state.data.filter((item) => item.id !== deletedId);
      });
  },
});

export default taxSlabSlice.reducer;
