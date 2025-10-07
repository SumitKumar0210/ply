import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../api';

// ✅ Thunks
export const fetchDepartments = createAsyncThunk('department/fetchAll', async () => {
  const res = await api.get("admin/department/get-data");
  return res.data.data;
});

export const fetchActiveDepartments = createAsyncThunk('department/fetchAll', async () => {
  const res = await api.get("admin/department/get-data?status=1");
  return res.data.data;
});

export const addDepartment = createAsyncThunk(
  'department/add',
  async (newData, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/department/store", newData);
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

export const updateDepartment = createAsyncThunk(
  'department/update',
  async (updated, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/department/update/${updated.id}`, updated);
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
  'department/update',
  async (updated) => {
    const res = await api.post("admin/department/status-update", {
      id: updated.id,
      status: updated.status,
    });
    return updated;
  }
);


export const deleteDepartment = createAsyncThunk(
  'department/delete',
  async (id) => {
    await api.post(`admin/department/delete/${id}`, id);
    return id;
  }
);

// ✅ Slice
const departmentSlice = createSlice({
  name: "department",
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchDepartments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Add
      .addCase(addDepartment.fulfilled, (state, action) => {
        state.data.unshift(action.payload);
      })

      // Update
      .addCase(updateDepartment.fulfilled, (state, action) => {
        const index = state.data.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
      })

      // Delete
      .addCase(deleteDepartment.fulfilled, (state, action) => {
        state.data = state.data.filter((d) => d.id !== action.payload);
      });
  },
});

export default departmentSlice.reducer;
