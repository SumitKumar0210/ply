import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../api';
import { successMessage, errorMessage, getErrorMessage } from '../../../toast';

//  Thunks
export const fetchUnitOfMeasurements = createAsyncThunk(
  'unitOfMeasurement/fetchAll',
  async () => {
    const res = await api.get("admin/unit/get-data");
    return res.data.data;
  }
);


export const fetchActiveUnitOfMeasurements = createAsyncThunk(
  'unitOfMeasurement/fetchAll',
  async () => {
    const res = await api.get("admin/unit/get-data?status=1");
    return res.data.data;
  }
);

export const addUnitOfMeasurement = createAsyncThunk(
  'unitOfMeasurement/add',
  async (newData, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/unit/store", newData);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const updateUnitOfMeasurement = createAsyncThunk(
  'unitOfMeasurement/update',
  async (updated, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/unit/update/${updated.id}`, updated);
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
  'unitOfMeasurement/update',
  async (updated) => {
    try{  
      const res = await api.post("admin/unit/status-update", {
        id: updated.id,
        status: updated.status,
      });
      successMessage(res.data.message);
      return updated;
    }catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const deleteUnitOfMeasurement = createAsyncThunk(
  'unitOfMeasurement/delete',
  async (id) => {
    try{
      const res = await api.post(`admin/unit/delete/${id}`, id);
      successMessage(res.data.message);
      return id;
    }catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

//  Slice
const unitOfMeasurementsSlice = createSlice({
  name: "unitOfMeasurement",
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchUnitOfMeasurements.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUnitOfMeasurements.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchUnitOfMeasurements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Add
      .addCase(addUnitOfMeasurement.fulfilled, (state, action) => {
        state.data.unshift(action.payload);
      })

      // Update
      .addCase(updateUnitOfMeasurement.fulfilled, (state, action) => {
        const index = state.data.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
      })

      // Delete
      .addCase(deleteUnitOfMeasurement.fulfilled, (state, action) => {
        const deletedId = action.meta.arg; 
        state.data = state.data.filter((item) => item.id !== deletedId);
      });
  },
});

export default unitOfMeasurementsSlice.reducer;
