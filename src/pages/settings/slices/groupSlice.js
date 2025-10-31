import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../api';
import { successMessage, errorMessage, getErrorMessage } from '../../../toast';

//  Thunks
export const fetchGroups = createAsyncThunk('group/fetchAll', async () => {
  const res = await api.get("admin/group/get-data");
  // console.log(res.data.data)
  return res.data.data;
});

export const fetchActiveGroup = createAsyncThunk('group/fetchAll', async () => {
  const res = await api.get("admin/group/get-data?status=1");
  // console.log(res.data.data)
  return res.data.data;
});

export const addGroup = createAsyncThunk(
  'group/add',
  async (newData, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/group/store", newData);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const updateGroup = createAsyncThunk(
  'group/update',
  async (updated, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/group/update/${updated.id}`, updated);
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
  'group/update',
  async (updated) => {
    try{
      const res = await api.post("admin/group/status-update", {
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


export const deleteGroup = createAsyncThunk(
  "group/delete",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/group/delete/${id}`);

      successMessage(res.data.message || "Group deleted successfully!");
      console.log(res)
      return id;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);


//  Slice
const groupSlice = createSlice({
  name: "group",
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchGroups.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Add
      .addCase(addGroup.fulfilled, (state, action) => {
        state.data.unshift(action.payload);
      })

      // Update
      .addCase(updateGroup.fulfilled, (state, action) => {
        const index = state.data.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
      })

      // Delete
      .addCase(deleteGroup.fulfilled, (state, action) => {
        const deletedId = action.meta.arg; 
        state.data = state.data.filter((item) => item.id !== deletedId);
      });
  },
});

export default groupSlice.reducer;
