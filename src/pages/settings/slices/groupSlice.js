import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../api';

// ✅ Thunks
export const fetchGroups = createAsyncThunk('group/fetchAll', async () => {
  const res = await api.get("admin/group/get-data");
  return res.data.data;
});

export const addGroup = createAsyncThunk(
  'group/add',
  async (newData, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/group/store", newData);
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

export const updateGroup = createAsyncThunk(
  'group/update',
  async (updated, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/group/update/${updated.id}`, updated);
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
  'group/update',
  async (updated) => {
    const res = await api.post("admin/group/status-update", {
      id: updated.id,
      status: updated.status,
    });
    return updated;
  }
);


export const deleteGroup = createAsyncThunk(
  'group/delete',
  async (id) => {
    await api.post(`admin/group/delete/${id}`, id);
    return id;
  }
);

// ✅ Slice
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
        state.data = state.data.filter((d) => d.id !== action.payload);
      });
  },
});

export default groupSlice.reducer;
