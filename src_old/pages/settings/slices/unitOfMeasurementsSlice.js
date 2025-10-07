import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../api';

// ✅ Thunks
export const fetchUnitOfMeasurements = createAsyncThunk(
  'unitOfMeasurement/fetchAll',
  async () => {
    const res = await api.get("admin/unit/get-data");
    return res.data.data;
  }
);

export const addUnitOfMeasurement = createAsyncThunk(
  'unitOfMeasurement/add',
  async (newData, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/unit/store", newData);
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

export const updateUnitOfMeasurement = createAsyncThunk(
  'unitOfMeasurement/update',
  async (updated, { rejectWithValue }) => {
    try {
      await api.post(`admin/unit/update/${updated.id}`, updated);
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
  'unitOfMeasurement/update',
  async (updated) => {
    await api.post("admin/unit/status-update", {
      id: updated.id,
      status: updated.status,
    });
    return updated;
  }
);

export const deleteUnitOfMeasurement = createAsyncThunk(
  'unitOfMeasurement/delete',
  async (id) => {
    await api.post(`admin/unit/delete/${id}`, id);
    return id;
  }
);

// ✅ Slice
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
        state.data = state.data.filter((d) => d.id !== action.payload);
      });
  },
});

export default unitOfMeasurementsSlice.reducer;
