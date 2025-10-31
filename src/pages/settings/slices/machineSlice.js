import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";
//  Fetch all branches
export const fetchMachines = createAsyncThunk("machine/fetchAll", async () => {
  const res = await api.get("admin/machine/get-data");
  return res.data.data;
});

//  Add branch
export const addMachine = createAsyncThunk(
  "machine/add",
  async (newData, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/machine/store", newData);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

//  Update branch
export const updateMachine = createAsyncThunk(
  "machine/update",
  async (updated, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/machine/update/${updated.id}`, updated);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

//  Delete branch
export const deleteMachine = createAsyncThunk("machine/delete", async (id) => {
  try{
    const res = await api.post(`admin/machine/delete/${id}`);
    successMessage(res.data.message);
    return id;
  } catch (error) {
    const errMsg = getErrorMessage(error);
    errorMessage(errMsg);
    return rejectWithValue(errMsg);
  }
});

//  Status update
export const statusUpdate = createAsyncThunk(
  "machine/statusUpdate",
  async (updated) => {
    try{
      const res = await api.post("admin/machine/status-update", {
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
