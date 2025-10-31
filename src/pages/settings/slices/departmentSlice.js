import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../api';
import { successMessage, errorMessage, getErrorMessage } from '../../../toast';

//  Thunks
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
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const updateDepartment = createAsyncThunk(
  'department/update',
  async (updated, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/department/update/${updated.id}`, updated);
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
  'department/update',
  async (updated) => {
    try{
      const res = await api.post("admin/department/status-update", {
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


export const deleteDepartment = createAsyncThunk(
  'department/delete',
  async (id) => {
    try{
      const res = await api.post(`admin/department/delete/${id}`, id);
      successMessage(res.data.message || "Department deleted successfully!");
      return id;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

//  Slice
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
        const deletedId = action.meta.arg; 
        state.data = state.data.filter((item) => item.id !== deletedId);
      });
  },
});

export default departmentSlice.reducer;
