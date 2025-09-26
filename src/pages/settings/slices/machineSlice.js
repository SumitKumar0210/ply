import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";

// ✅ Fetch all branches
export const fetchMachines = createAsyncThunk("machine/fetchAll", async () => {
  const res = await api.get("admin/machine/get-data");
  return res.data.data;
});

// ✅ Add branch
export const addMachine = createAsyncThunk(
  "machine/add",
  async (newData, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/machine/store", newData);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to add branch"
      );
    }
  }
);

// ✅ Update branch
export const updateMachine = createAsyncThunk(
  "machine/update",
  async (updated, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/machine/update/${updated.id}`, updated);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to update branch"
      );
    }
  }
);

// ✅ Delete branch
export const deleteMachine = createAsyncThunk("machine/delete", async (id) => {
  await api.post(`admin/machine/delete/${id}`);
  return id;
});

// ✅ Status update
export const statusUpdate = createAsyncThunk(
  "machine/statusUpdate",
  async (updated) => {
    const res = await api.post("admin/machine/status-update", {
      id: updated.id,
      status: updated.status,
    });
    return updated;
  }
);

const machineSlice = createSlice({
  name: "machine",
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchMachines.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMachines.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchMachines.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Add
      .addCase(addMachine.fulfilled, (state, action) => {
        state.data.unshift(action.payload);
      })

      // Update
      .addCase(updateMachine.fulfilled, (state, action) => {
        const index = state.data.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) state.data[index] = action.payload;
      })

      // Delete
      .addCase(deleteMachine.fulfilled, (state, action) => {
        state.data = state.data.filter((d) => d.id !== action.payload);
      })

      // Status
      .addCase(statusUpdate.fulfilled, (state, action) => {
        const index = state.data.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) state.data[index] = action.payload;
      });
  },
});

export default machineSlice.reducer;
